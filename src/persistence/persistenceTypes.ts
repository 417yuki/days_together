import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";
import type { MapId } from "../domain/maps/mapTypes";

export const DB_NAME = "futari-biyori";
export const DB_VERSION = 1;
export const MAIN_SAVE_SLOT_ID = "main";
export const STORE_NAMES = {
  appMeta: "appMeta",
  saveSlots: "saveSlots",
  worldStates: "worldStates",
  characters: "characters"
} as const;

export type SaveSnapshot = {
  viewedMapId: MapId;
  characters: Array<Pick<CharacterState, "characterId" | "name" | "marker" | "mapId" | "locationId">>;
};

export type StoredSaveData = {
  worldState?: unknown;
  characters: unknown[];
};

export type CharacterRecord = {
  saveSlotId: typeof MAIN_SAVE_SLOT_ID;
  characterId: CharacterId;
  name: string;
  marker: string;
  mapId: MapId;
  locationId: string;
};

export interface SaveRepository {
  loadMainSave(): Promise<StoredSaveData | null>;
  saveMain(snapshot: SaveSnapshot): Promise<void>;
}
