import type { MapId } from "../maps/mapTypes";
import type { CharacterPinVisual } from "./characterPinVisual";

export type CharacterId = "user" | "cody";

export type CharacterState = {
  characterId: CharacterId;
  name: string;
  marker: string;
  mapId: MapId;
  locationId: string;
  imageAssetId: string | null;
  pinVisual: CharacterPinVisual;
};
