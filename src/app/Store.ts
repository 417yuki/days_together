import type { MapId } from "../domain/maps/mapTypes";
import type { CharacterState } from "../domain/characters/characterTypes";
import type { CharacterId } from "../domain/characters/characterTypes";
import type { LocationRef } from "../domain/maps/mapTypes";
import { advanceMovement, buildLocationGraph, startMovement, type MovementState } from "../domain/movement/movement";
import { starterMaps } from "../data/starterMaps";
import type { ActionDecisionDebug, ActionId } from "../domain/partner/partnerActions";
import { advanceUnknownSprout, initialUnknownSprout, localDate, makeUnknownSproutAvailable, releaseUnknownSprout, type EventId, type UnknownSproutChoiceId, type UnknownSproutState } from "../domain/events/unknownSprout";
import type { AppliedUnknownSproutExtension, PendingConsultation, UnknownSproutConsultationResult } from "../domain/consultation/unknownSproutConsultation";
import { codyPresetDialogues, codyPresetProfile, type PartnerDialogueLine, type PartnerGameProfile, type PartnerProfileSnapshot, type PartnerResult, type PendingPartnerConsultation } from "../domain/partner/partnerProfile";
import { starterItems, type GameItem, type ItemCategory } from "../domain/items/items";

export type NavigationId = "map" | "items" | "memories" | "partner" | "settings";
export type SaveStatus = "available" | "failed";
export type PartnerActivityState = { enabled: boolean; phase: "idle" | "moving" | "acting"; actionId: ActionId | null; destination: LocationRef | null; lineId: string | null; recentActionIds: ActionId[]; lastDecision: ActionDecisionDebug | null };
export type ConsultationView = "closed" | "compose" | "confirm";
export type PartnerView = "profile" | "consult" | "confirm" | "history" | "history_detail" | "restore_confirm";
export type ItemView = "list" | "detail" | "create";
export type ItemDraft = { name: string; category: ItemCategory; description: string };
export const createEmptyItemDraft = (): ItemDraft => ({ name: "", category: "food", description: "" });
export type AppState = { items: GameItem[]; itemView: ItemView; selectedItemId: string | null; itemMessage: string; itemDraft: ItemDraft; viewedMapId: MapId; activeNavigation: NavigationId; developerPanelOpen: boolean; characters: CharacterState[]; movements: Partial<Record<CharacterId, MovementState>>; partnerActivity: PartnerActivityState; partnerProfile: PartnerGameProfile; partnerDialogues: PartnerDialogueLine[]; partnerHistory: PartnerProfileSnapshot[]; pendingPartnerConsultation: PendingPartnerConsultation | null; partnerView: PartnerView; partnerResponse: string; partnerPreview: PartnerResult | null; selectedPartnerRevision: number | null; partnerMessage: string; unknownSprout: UnknownSproutState; unknownSproutExtension: AppliedUnknownSproutExtension | null; pendingConsultation: PendingConsultation | null; consultationView: ConsultationView; consultationResponse: string; consultationPreview: UnknownSproutConsultationResult | null; consultationMessage: string; worldStartedOn: string; openEventId: EventId | null; message: string; saveStatus: SaveStatus };
export const initialState: AppState = {
  items: structuredClone(starterItems), itemView: "list", selectedItemId: null, itemMessage: "", itemDraft: createEmptyItemDraft(),
  viewedMapId: "starter_house_interior",
  activeNavigation: "map",
  developerPanelOpen: false,
  partnerProfile: codyPresetProfile, partnerDialogues: codyPresetDialogues, partnerHistory: [{ profile: codyPresetProfile, dialogues: codyPresetDialogues }], pendingPartnerConsultation: null, partnerView: "profile", partnerResponse: "", partnerPreview: null, selectedPartnerRevision: null, partnerMessage: "",
  unknownSprout: initialUnknownSprout(), unknownSproutExtension: null, pendingConsultation: null, consultationView: "closed", consultationResponse: "", consultationPreview: null, consultationMessage: "", worldStartedOn: localDate(new Date()), openEventId: null,
  movements: {}, partnerActivity: { enabled: true, phase: "idle", actionId: null, destination: null, lineId: null, recentActionIds: [], lastDecision: null }, message: "場所を選んでみましょう", saveStatus: "available", characters: [
    { characterId: "user", name: "主人公", marker: "U", mapId: "starter_house_interior", locationId: "table" },
    { characterId: "cody", name: "コーディ", marker: "C", mapId: "starter_house_interior", locationId: "workbench" }
  ]
};
type Listener = (state: AppState) => void;

export class Store {
  private state: AppState;
  private listeners = new Set<Listener>();
  constructor(state: AppState = cloneInitialState()) { this.state = cloneState(state); }
  getState = (): AppState => cloneState(this.state);
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private update(next: Partial<AppState>): void { this.state = { ...this.state, ...next }; this.listeners.forEach((listener) => listener(this.getState())); }
  setViewedMap(mapId: MapId): void { this.update({ viewedMapId: mapId }); }
  setNavigation(activeNavigation: NavigationId): void { this.update({ activeNavigation, openEventId: null, itemView: "list", selectedItemId: null, itemMessage: "", itemDraft: createEmptyItemDraft() }); }
  setItemView(itemView: ItemView, selectedItemId: string | null = null, itemMessage = ""): void { this.update({ itemView, selectedItemId, itemMessage, itemDraft: createEmptyItemDraft() }); }
  setItemMessage(itemMessage: string): void { this.update({ itemMessage }); }
  cacheItemDraft(next: Partial<ItemDraft>): void { this.state = { ...this.state, itemDraft: { ...this.state.itemDraft, ...next } }; }
  addItem(item: GameItem): void { this.update({ items: [...this.state.items, structuredClone(item)], itemView: "detail", selectedItemId: item.itemId, itemMessage: "アイテムを登録しました。", itemDraft: createEmptyItemDraft() }); }
  toggleDeveloperPanel(force?: boolean): void { this.update({ developerPanelOpen: force ?? !this.state.developerPanelOpen }); }
  setSaveStatus(saveStatus: SaveStatus): void { if (this.state.saveStatus !== saveStatus) this.update({ saveStatus }); }
  setPartnerActivity(partnerActivity: PartnerActivityState, message?: string): void { this.update({ partnerActivity: { ...partnerActivity, destination: partnerActivity.destination && { ...partnerActivity.destination }, recentActionIds: partnerActivity.recentActionIds.slice(0, 5) }, ...(message ? { message } : {}) }); }
  openEvent(): void { if (this.state.unknownSprout.status !== "locked") this.update({ openEventId: "unknown_sprout" }); }
  closeEvent(): void { this.update({ openEventId: null }); }
  advanceEvent(choice: UnknownSproutChoiceId): boolean { const next = advanceUnknownSprout(this.state.unknownSprout, choice); if (!next) return false; this.update({ unknownSprout: next, message: next.status === "completed" ? "庭に小さな花が咲きました。" : "知らない芽の様子が変わりました。" }); return true; }
  checkEvents(now = new Date()): void { const next = releaseUnknownSprout(this.state.unknownSprout, this.state.worldStartedOn, now); if (next !== this.state.unknownSprout) this.update({ unknownSprout: next, message: "庭に知らない芽が現れました。" }); }
  triggerEvent(): void { if (this.state.unknownSprout.status === "locked") this.update({ unknownSprout: makeUnknownSproutAvailable(), message: "庭に知らない芽が現れました。" }); }
  resetEvent(now = new Date()): void { this.update({ unknownSprout: initialUnknownSprout(), unknownSproutExtension: null, pendingConsultation: null, consultationView: "closed", consultationResponse: "", consultationPreview: null, consultationMessage: "", worldStartedOn: localDate(now), openEventId: null, message: "知らない芽を初期状態へ戻しました。" }); }
  setConsultation(next: Partial<Pick<AppState, "pendingConsultation" | "consultationView" | "consultationResponse" | "consultationPreview" | "consultationMessage" | "unknownSproutExtension">>): void { this.update(next); }
  setPartner(next: Partial<Pick<AppState, "partnerProfile" | "partnerDialogues" | "partnerHistory" | "pendingPartnerConsultation" | "partnerView" | "partnerResponse" | "partnerPreview" | "selectedPartnerRevision" | "partnerMessage" | "characters">>): void { this.update(next); }
  stopCharacterMovement(characterId: CharacterId): void { const movements = { ...this.state.movements }; delete movements[characterId]; this.update({ movements }); }
  beginMovement(characterId: CharacterId, destination: LocationRef): "started" | "busy" | "invalid" | "same" {
    if (this.state.movements[characterId]) { this.update({ message: "移動中です" }); return "busy"; }
    const character = this.state.characters.find((candidate) => candidate.characterId === characterId); if (!character) return "invalid";
    if (character.mapId === destination.mapId && character.locationId === destination.locationId) return "same";
    const graph = buildLocationGraph(starterMaps, (message) => console.warn(message)); const movement = startMovement(character, destination, graph);
    if (!movement) { this.update({ message: "その場所への経路が見つかりません" }); return "invalid"; }
    const current = locationLabel(character); const destinationLabel = locationLabel(destination);
    this.update({ movements: { ...this.state.movements, [characterId]: movement }, message: `${character.name}は${current}にいて、${destinationLabel}へ移動中です。` }); return "started";
  }
  advanceCharacter(characterId: CharacterId): boolean {
    const movement = this.state.movements[characterId]; const index = this.state.characters.findIndex((character) => character.characterId === characterId); if (!movement || index < 0) return false;
    const result = advanceMovement(this.state.characters[index], movement); const characters = [...this.state.characters]; characters[index] = result.character; const movements = { ...this.state.movements }; if (result.movement) movements[characterId] = result.movement; else delete movements[characterId];
    const destinationLabel = locationLabel(movement.destination); const currentLabel = locationLabel(result.character);
    this.update({ characters, movements, message: result.movement ? `${result.character.name}は${currentLabel}にいて、${destinationLabel}へ移動中です。` : `${result.character.name}が${currentLabel}に着きました。` }); return Boolean(result.movement);
  }
  reset(now = new Date()): void { this.state = { ...cloneInitialState(), worldStartedOn: localDate(now) }; this.listeners.forEach((listener) => listener(this.getState())); }
}

const cloneActivity = (activity: PartnerActivityState): PartnerActivityState => ({ ...activity, destination: activity.destination && { ...activity.destination }, recentActionIds: [...activity.recentActionIds], lastDecision: activity.lastDecision && { ...activity.lastDecision, candidates: activity.lastDecision.candidates.map((candidate) => ({ ...candidate, destination: { ...candidate.destination } })), selectedDestination: { ...activity.lastDecision.selectedDestination } } });
const cloneInitialState = (): AppState => ({ ...initialState, items: structuredClone(initialState.items), itemDraft: { ...initialState.itemDraft }, characters: initialState.characters.map((character) => ({ ...character })), movements: {}, partnerActivity: cloneActivity(initialState.partnerActivity), unknownSprout: structuredClone(initialState.unknownSprout) });
const cloneState = (state: AppState): AppState => structuredClone({ ...state, characters: state.characters.map((character) => ({ ...character })), movements: { ...state.movements }, partnerActivity: cloneActivity(state.partnerActivity), unknownSprout: structuredClone(state.unknownSprout) });
const locationLabel = ({ mapId, locationId }: LocationRef): string => starterMaps.find((map) => map.mapId === mapId)?.locations.find((location) => location.locationId === locationId)?.label ?? "不明な場所";
