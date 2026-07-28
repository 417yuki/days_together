import { Store } from "./Store";
import { HomeScreen } from "../ui/screens/HomeScreen";
import type { CharacterId } from "../domain/characters/characterTypes";
import type { LocationRef } from "../domain/maps/mapTypes";
import type { SaveCoordinator } from "../persistence/saveCoordinator";
import { PartnerActivityController } from "./PartnerActivityController";
import { createPendingConsultation, extractJsonObject, validateUnknownSproutResult, type AppliedUnknownSproutExtension, type ConsultationCheckpoint } from "../domain/consultation/unknownSproutConsultation";

const MOVEMENT_STEP_MS = 380;

export class App {
  private movementTimers = new Map<CharacterId, number>();
  private partner: PartnerActivityController;
  constructor(private root: HTMLElement, private store = new Store(), private saves?: SaveCoordinator) { this.partner = new PartnerActivityController(store, (destination, done) => this.move("cody", destination, done)); }
  mount(): void {
    this.store.subscribe((state) => { this.render(); void this.saves?.save(state); });
    this.render();
    this.partner.start();
    this.store.checkEvents();
    document.addEventListener("visibilitychange", this.onVisibility);
  }
  private render(): void {
    const actions = {
      map: (id: Parameters<Store["setViewedMap"]>[0]) => this.store.setViewedMap(id),
      navigation: (id: Parameters<Store["setNavigation"]>[0]) => this.store.setNavigation(id),
      developer: (open?: boolean) => this.store.toggleDeveloperPanel(open),
      move: (characterId: CharacterId, destination: LocationRef) => this.move(characterId, destination),
      pausePartner: () => this.partner.pause(), resumePartner: () => this.partner.resume(), decidePartner: () => this.partner.decideNow(),
      openEvent: () => this.store.openEvent(), closeEvent: () => { this.store.closeEvent(); requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-focus-key="event-unknown_sprout"]')?.focus()); }, advanceEvent: (choice: Parameters<Store["advanceEvent"]>[0]) => { this.store.advanceEvent(choice); }, triggerEvent: () => this.store.triggerEvent(), resetEvent: () => this.store.resetEvent(),
      reset: () => { this.stopTimers(); this.store.reset(); this.partner.reset(); void this.saves?.save(this.store.getState(), true); },
      startConsultation: () => void this.startConsultation(), setConsultationResponse: (value: string) => this.store.setConsultation({ consultationResponse: value, consultationMessage: "" }), checkConsultation: () => this.checkConsultation(), editConsultation: () => this.store.setConsultation({ consultationView: "compose", consultationPreview: null, consultationMessage: "返答を修正できます。" }), cancelConsultation: () => this.store.setConsultation({ consultationView: "closed", consultationPreview: null, consultationMessage: "" }), applyConsultation: () => void this.applyConsultation()
    };
    this.root.replaceChildren(HomeScreen(this.store.getState(), actions));
  }
  private async startConsultation(): Promise<void> { const state = this.store.getState(); if (state.unknownSprout.status !== "completed" || state.unknownSproutExtension) return; if (state.pendingConsultation) { this.store.setConsultation({ consultationView: "compose" }); return; } const pending = createPendingConsultation(state.unknownSprout.path, makeId(), new Date().toISOString()); try { await this.saves?.savePending(pending); this.store.setConsultation({ pendingConsultation: pending, consultationView: "compose", consultationMessage: "送信用プロンプトを用意しました。" }); } catch { this.store.setConsultation({ consultationMessage: "相談を保存できませんでした。もう一度お試しください。" }); } }
  private checkConsultation(): void { const state = this.store.getState(); if (!state.pendingConsultation) return; try { const preview = validateUnknownSproutResult(extractJsonObject(state.consultationResponse), state.pendingConsultation, state.unknownSprout, state.unknownSproutExtension); this.store.setConsultation({ consultationPreview: preview, consultationView: "confirm", consultationMessage: "内容を検証しました。まだ反映されていません。" }); } catch (error) { this.store.setConsultation({ consultationMessage: error instanceof Error ? error.message : "返答を確認できませんでした。" }); } }
  private async applyConsultation(): Promise<void> { const state = this.store.getState(); const pending = state.pendingConsultation; const result = state.consultationPreview; if (!pending || !result || state.unknownSprout.status !== "completed" || state.unknownSprout.path !== result.expectedPath || state.unknownSproutExtension) { this.store.setConsultation({ consultationMessage: "花の状態が変わったため反映できません。" }); return; } const now = new Date().toISOString(); const extension: AppliedUnknownSproutExtension = { requestId: result.requestId, flowerName: result.flowerName, partnerLine: result.partnerLine, note: result.note, appliedAt: now }; const checkpoint: ConsultationCheckpoint = { checkpointId: makeId(), requestId: result.requestId, eventId: "unknown_sprout", createdAt: now, eventBefore: structuredClone(state.unknownSprout), extensionBefore: state.unknownSproutExtension }; try { await this.saves?.apply({ ...state, unknownSproutExtension: extension }, pending, extension, checkpoint); this.store.setConsultation({ unknownSproutExtension: extension, pendingConsultation: null, consultationPreview: null, consultationResponse: "", consultationView: "closed", consultationMessage: "" }); } catch { this.store.setConsultation({ consultationMessage: "保存できなかったため反映していません。もう一度お試しください。" }); } }
  private move(characterId: CharacterId, destination: LocationRef, done?: (arrived: boolean) => void): void {
    const result = this.store.beginMovement(characterId, destination); if (result !== "started") { done?.(result === "same"); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { while (this.store.advanceCharacter(characterId)) { /* apply the complete route */ } done?.(true); return; }
    const step = (): void => { if (this.store.advanceCharacter(characterId)) this.movementTimers.set(characterId, window.setTimeout(step, MOVEMENT_STEP_MS)); else { this.movementTimers.delete(characterId); done?.(true); } };
    this.movementTimers.set(characterId, window.setTimeout(step, MOVEMENT_STEP_MS));
  }
  private onVisibility = (): void => { if (document.visibilityState === "visible") this.store.checkEvents(); };
  private stopTimers(): void { this.movementTimers.forEach((timer) => clearTimeout(timer)); this.movementTimers.clear(); }
}
const makeId = (): string => { if (typeof crypto.randomUUID === "function") return crypto.randomUUID(); const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join(""); };
