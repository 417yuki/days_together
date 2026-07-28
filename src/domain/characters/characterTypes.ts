import type { MapId } from "../maps/mapTypes";

export type CharacterId = "user" | "cody";

export type CharacterState = {
  characterId: CharacterId;
  name: string;
  marker: string;
  mapId: MapId;
  locationId: string;
  imageAssetId: string | null;
};
