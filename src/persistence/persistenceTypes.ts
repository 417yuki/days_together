import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";
import type { MapId } from "../domain/maps/mapTypes";
import type { ActionId } from "../domain/partner/partnerActions";
import type { UnknownSproutState } from "../domain/events/unknownSprout";

export const DB_NAME = "futari-biyori";
export const DB_VERSION = 2;
export const MAIN_SAVE_SLOT_ID = "main";
export const STORE_NAMES = {
  appMeta: "appMeta",
  saveSlots: "saveSlots",
  worldStates: "worldStates",
  characters: "characters", events: "events"
} as const;

export type SaveSnapshot = {
  viewedMapId: MapId;
  recentPartnerActionIds: ActionId[];
  worldStartedOn: string;
  unknownSprout: UnknownSproutState;
  characters: Array<Pick<CharacterState, "characterId" | "name" | "marker" | "mapId" | "locationId">>;
};

export type StoredSaveData = {
  worldState?: unknown;
  characters: unknown[];
  events?: unknown[];
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
