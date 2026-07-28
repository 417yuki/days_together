import type { AppState } from "../app/Store";
import { starterMaps } from "../data/starterMaps";
import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";
import type { MapId } from "../domain/maps/mapTypes";
import { MAIN_SAVE_SLOT_ID, type SaveSnapshot, type StoredSaveData } from "./persistenceTypes";
import { actionIds, type ActionId } from "../domain/partner/partnerActions";
import { initialUnknownSprout, normalizeLocalDate, parseUnknownSprout } from "../domain/events/unknownSprout";

const characterIds: CharacterId[] = ["user", "cody"];
const mapIds = new Set<MapId>(starterMaps.map(({ mapId }) => mapId));

export const createSaveSnapshot = (state: AppState): SaveSnapshot => ({
  viewedMapId: state.viewedMapId,
  recentPartnerActionIds: state.partnerActivity.recentActionIds.slice(0, 5),
  worldStartedOn: state.worldStartedOn,
  unknownSprout: structuredClone(state.unknownSprout),
  characters: state.characters.map(({ characterId, name, marker, mapId, locationId }) => ({ characterId, name, marker, mapId, locationId }))
});

export const restoreAppState = (initial: AppState, saved: StoredSaveData, now = new Date()): AppState => {
  const world = record(saved.worldState);
  const viewedMapId = isMapId(world?.viewedMapId) ? world.viewedMapId : initial.viewedMapId;
  const recentActionIds = Array.isArray(world?.recentPartnerActionIds) ? world.recentPartnerActionIds.filter(isActionId).slice(0, 5) : [];
  const validCharacters = new Map<CharacterId, CharacterState>();
  const duplicates = new Set<CharacterId>();
  const eventCandidates = (saved.events ?? []).filter((value) => record(value)?.eventId === "unknown_sprout");
  const unknownSprout = eventCandidates.length === 1 && record(eventCandidates[0])?.saveSlotId === MAIN_SAVE_SLOT_ID ? parseUnknownSprout(eventCandidates[0]) ?? initialUnknownSprout() : initialUnknownSprout();

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
    partnerActivity: { ...initial.partnerActivity, enabled: true, phase: "idle", actionId: null, destination: null, lineId: null, recentActionIds, lastDecision: null },
    characters: initial.characters.map((fallback) => validCharacters.get(fallback.characterId) ?? { ...fallback })
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
