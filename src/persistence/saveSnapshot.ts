import type { AppState } from "../app/Store";
import { starterMaps } from "../data/starterMaps";
import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";
import type { MapId } from "../domain/maps/mapTypes";
import { MAIN_SAVE_SLOT_ID, type SaveSnapshot, type StoredSaveData } from "./persistenceTypes";
import { actionIds, type ActionId } from "../domain/partner/partnerActions";
import { codyPresetDialogues, codyPresetProfile, parseDialogue, parsePendingPartnerConsultation, parseProfile, type PartnerProfileSnapshot } from "../domain/partner/partnerProfile";
import { initialUnknownSprout, normalizeLocalDate, parseUnknownSprout } from "../domain/events/unknownSprout";
import { parseAppliedExtension, parsePendingConsultation } from "../domain/consultation/unknownSproutConsultation";

const characterIds: CharacterId[] = ["user", "cody"];
const mapIds = new Set<MapId>(starterMaps.map(({ mapId }) => mapId));

export const createSaveSnapshot = (state: AppState): SaveSnapshot => ({
  viewedMapId: state.viewedMapId,
  recentPartnerActionIds: state.partnerActivity.recentActionIds.slice(0, 5),
  worldStartedOn: state.worldStartedOn,
  unknownSprout: structuredClone(state.unknownSprout),
  unknownSproutExtension: structuredClone(state.unknownSproutExtension),
  characters: state.characters.map(({ characterId, name, marker, mapId, locationId }) => ({ characterId, name, marker, mapId, locationId })), partnerProfile: structuredClone(state.partnerProfile), partnerDialogues: structuredClone(state.partnerDialogues)
});

export const restoreAppState = (initial: AppState, saved: StoredSaveData, now = new Date()): AppState => {
  const world = record(saved.worldState);
  const viewedMapId = isMapId(world?.viewedMapId) ? world.viewedMapId : initial.viewedMapId;
  const recentActionIds = Array.isArray(world?.recentPartnerActionIds) ? world.recentPartnerActionIds.filter(isActionId).slice(0, 5) : [];
  const validCharacters = new Map<CharacterId, CharacterState>();
  const duplicates = new Set<CharacterId>();
  const eventCandidates = (saved.events ?? []).filter((value) => record(value)?.eventId === "unknown_sprout");
  const unknownSprout = eventCandidates.length === 1 && record(eventCandidates[0])?.saveSlotId === MAIN_SAVE_SLOT_ID ? parseUnknownSprout(eventCandidates[0]) ?? initialUnknownSprout() : initialUnknownSprout();
  const extension = eventCandidates.length === 1 ? parseAppliedExtension(record(eventCandidates[0])?.extension) : null;
  const pendingCandidates = (saved.consultations ?? []).map(parsePendingConsultation).filter((value): value is NonNullable<typeof value> => value !== null);
  const pendingConsultation = !extension && pendingCandidates.length === 1 && unknownSprout.status === "completed" && pendingCandidates[0].expectedPath === unknownSprout.path ? pendingCandidates[0] : null;
  const partnerProfile = (saved.partnerProfiles ?? []).map(parseProfile).find((value) => value?.profileId === "main_partner") ?? codyPresetProfile;
  const validDialogues = (saved.dialogues ?? []).map(parseDialogue).filter((value): value is NonNullable<typeof value> => value !== null);
  const partnerHistory = (saved.partnerProfileHistory ?? []).flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const raw = value as { profile?: unknown; dialogues?: unknown[] };
    const profile = parseProfile(raw.profile);
    const dialogues = (raw.dialogues ?? []).map(parseDialogue).filter((line): line is NonNullable<typeof line> => line !== null);
    return profile ? [{ profile, dialogues } satisfies PartnerProfileSnapshot] : [];
  }).sort((left, right) => left.profile.revision - right.profile.revision);
  const activeHistoryDialogues = partnerHistory.find(({ profile }) => profile.revision === partnerProfile.revision)?.dialogues;
  const dialogueSource = activeHistoryDialogues?.length ? activeHistoryDialogues : validDialogues;
  const partnerDialogues = actionIds.flatMap((id) => {
    const forAction = dialogueSource.filter((line) => line.actionId === id);
    return forAction.some((line) => line.enabled) ? forAction : codyPresetDialogues.filter((line) => line.actionId === id);
  });
  const pendingPartnerConsultation = (saved.consultations ?? []).map(parsePendingPartnerConsultation).find((value) => value !== null) ?? null;

  saved.characters.forEach((value) => {
    const candidate = parseCharacter(value);
    if (!candidate) return;
    if (validCharacters.has(candidate.characterId)) duplicates.add(candidate.characterId);
    else validCharacters.set(candidate.characterId, candidate);
  });
  duplicates.forEach((id) => validCharacters.delete(id));

  return {
    ...initial,
    viewedMapId,
    activeNavigation: "map",
    developerPanelOpen: false,
    movements: {},
    openEventId: null,
    worldStartedOn: normalizeLocalDate(world?.worldStartedOn, now),
    unknownSprout,
    unknownSproutExtension: extension,
    pendingConsultation,
    consultationView: "closed", consultationResponse: "", consultationPreview: null, consultationMessage: "",
    partnerActivity: { ...initial.partnerActivity, enabled: true, phase: "idle", actionId: null, destination: null, lineId: null, recentActionIds, lastDecision: null },
    partnerProfile, partnerDialogues, partnerHistory: partnerHistory.length ? partnerHistory : [{ profile: codyPresetProfile, dialogues: codyPresetDialogues }], pendingPartnerConsultation, partnerView: "profile", partnerResponse: "", partnerPreview: null, selectedPartnerRevision: null, partnerMessage: "",
    characters: initial.characters.map((fallback) => { const restored = validCharacters.get(fallback.characterId) ?? { ...fallback }; return restored.characterId === "cody" ? { ...restored, name: partnerProfile.displayName } : restored; })
  };
};

const parseCharacter = (value: unknown): CharacterState | null => {
  const candidate = record(value);
  if (!candidate || candidate.saveSlotId !== MAIN_SAVE_SLOT_ID || !isCharacterId(candidate.characterId) || typeof candidate.name !== "string" || typeof candidate.marker !== "string" || !isMapId(candidate.mapId) || typeof candidate.locationId !== "string") return null;
  const map = starterMaps.find(({ mapId }) => mapId === candidate.mapId);
  if (!map?.locations.some(({ locationId }) => locationId === candidate.locationId)) return null;
  return { characterId: candidate.characterId, name: candidate.name, marker: candidate.marker, mapId: candidate.mapId, locationId: candidate.locationId };
};

const record = (value: unknown): Record<string, unknown> | null => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const isMapId = (value: unknown): value is MapId => typeof value === "string" && mapIds.has(value as MapId);
const isCharacterId = (value: unknown): value is CharacterId => typeof value === "string" && characterIds.includes(value as CharacterId);
const isActionId = (value: unknown): value is ActionId => typeof value === "string" && actionIds.includes(value as ActionId);