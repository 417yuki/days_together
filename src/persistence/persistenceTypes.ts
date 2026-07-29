import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";
import type { MapId } from "../domain/maps/mapTypes";
import type { ActionId } from "../domain/partner/partnerActions";
import type { UnknownSproutState } from "../domain/events/unknownSprout";
import type { AppliedUnknownSproutExtension, ConsultationCheckpoint, PendingConsultation } from "../domain/consultation/unknownSproutConsultation";
import type { PartnerDialogueLine, PartnerGameProfile, PartnerProfileSnapshot, PendingPartnerConsultation } from "../domain/partner/partnerProfile";
import type { GameItem } from "../domain/items/items";
import type { CharacterPinAsset } from "../domain/assets/characterPins";
import type { ItemImageAsset } from "../domain/assets/itemImages";
import type { MapBackgroundAsset, MapBackgroundId, MapVisualState } from "../domain/assets/mapBackgrounds";

export const DB_NAME = "futari-biyori";
export const DB_VERSION = 7;
export const MAIN_SAVE_SLOT_ID = "main";
export const STORE_NAMES = {
  appMeta: "appMeta", mapVisuals: "mapVisuals",
  saveSlots: "saveSlots",
  worldStates: "worldStates",
  characters: "characters", events: "events", consultations: "consultations", checkpoints: "checkpoints", partnerProfiles: "partnerProfiles", partnerProfileHistory: "partnerProfileHistory", dialogues: "dialogues", items: "items", assets: "assets", assetBlobs: "assetBlobs"
} as const;

export type SaveSnapshot = {
  viewedMapId: MapId;
  recentPartnerActionIds: ActionId[];
  worldStartedOn: string;
  unknownSprout: UnknownSproutState;
  unknownSproutExtension: AppliedUnknownSproutExtension | null;
  characters: Array<Pick<CharacterState, "characterId" | "name" | "marker" | "mapId" | "locationId" | "imageAssetId" | "pinVisual">>;
  partnerProfile: PartnerGameProfile; partnerDialogues: PartnerDialogueLine[]; items: GameItem[];
};

export type StoredSaveData = {
  worldState?: unknown;
  characters: unknown[];
  events?: unknown[];
  consultations?: unknown[];
  partnerProfiles?: unknown[]; partnerProfileHistory?: unknown[]; dialogues?: unknown[]; items?: unknown[]; mapVisuals?: unknown[];
};

export type CharacterRecord = {
  saveSlotId: typeof MAIN_SAVE_SLOT_ID;
  characterId: CharacterId;
  name: string;
  marker: string;
  mapId: MapId;
  locationId: string;
  imageAssetId: string | null;
  pinVisual: CharacterState["pinVisual"];
};

export interface SaveRepository {
  loadMainSave(): Promise<StoredSaveData | null>;
  saveMain(snapshot: SaveSnapshot): Promise<void>;
  savePendingConsultation?(pending: PendingConsultation): Promise<void>;
  applyConsultation?(snapshot: SaveSnapshot, pending: PendingConsultation, extension: AppliedUnknownSproutExtension, checkpoint: ConsultationCheckpoint): Promise<void>;
  savePendingPartner?(pending: PendingPartnerConsultation): Promise<void>;
  discardPartnerConsultation?(pending: PendingPartnerConsultation): Promise<void>;
  applyPartner?(snapshot: SaveSnapshot, pending: PendingPartnerConsultation | null, next: PartnerProfileSnapshot, checkpoint: unknown): Promise<void>;
  getItemImage?(assetId: string): Promise<ItemImageAsset | null>;
  putItemImage?(itemId: string, asset: ItemImageAsset): Promise<GameItem>;
  deleteItemImage?(itemId: string): Promise<GameItem>;
  getCharacterPin?(assetId: string, characterId: CharacterId): Promise<CharacterPinAsset | null>;
  putCharacterPin?(characterId: CharacterId, asset: CharacterPinAsset): Promise<CharacterState>;
  deleteCharacterPin?(characterId: CharacterId): Promise<CharacterState>;
  putCharacterPinVisual?(characterId: CharacterId, visual: CharacterState["pinVisual"]): Promise<CharacterState>;
  getMapBackground?(assetId: string, mapId: MapBackgroundId): Promise<MapBackgroundAsset | null>;
  putMapBackground?(mapId: MapBackgroundId, asset: MapBackgroundAsset): Promise<MapVisualState>;
  deleteMapBackground?(mapId: MapBackgroundId): Promise<MapVisualState>;
  putLocationLayout?(mapId: MapBackgroundId, layout: MapVisualState["locationLayout"]): Promise<MapVisualState>;
  putGatewayVisualPair?(pair: Record<MapBackgroundId, MapVisualState["gatewayVisual"]>): Promise<Record<MapBackgroundId, MapVisualState>>;
  putItemSlotPair?(pair: Record<MapBackgroundId, MapVisualState["itemSlots"]>, itemIds: string[]): Promise<Record<MapBackgroundId, MapVisualState>>;
}
