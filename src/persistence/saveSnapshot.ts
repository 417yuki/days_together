import type { AppState } from "../app/Store";
import { starterMaps } from "../data/starterMaps";
import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";
import type { MapId } from "../domain/maps/mapTypes";
import { MAIN_SAVE_SLOT_ID, type SaveSnapshot, type StoredSaveData } from "./persistenceTypes";

const characterIds: CharacterId[] = ["user", "cody"];
const mapIds = new Set<MapId>(starterMaps.map(({ mapId }) => mapId));

export const createSaveSnapshot = (state: AppState): SaveSnapshot => ({
  viewedMapId: state.viewedMapId,
  characters: state.characters.map(({ characterId, name, marker, mapId, locationId }) => ({ characterId, name, marker, mapId, locationId }))
});

export const restoreAppState = (initial: AppState, saved: StoredSaveData): AppState => {
  const world = record(saved.worldState);
  const viewedMapId = isMapId(world?.viewedMapId) ? world.viewedMapId : initial.viewedMapId;
  const validCharacters = new Map<CharacterId, CharacterState>();
  const duplicates = new Set<CharacterId>();

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
