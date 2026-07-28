import type { CharacterId } from "../characters/characterTypes";
import { parseAssetMetadata, type AssetMetadata } from "./itemImages";

export type CharacterPinMetadata = AssetMetadata & { kind: "character_pin"; ownerId: CharacterId };
export type CharacterPinAsset = { metadata: CharacterPinMetadata; blob: Blob };
export const parseCharacterPinMetadata = (value: unknown, ownerId?: CharacterId): CharacterPinMetadata | null => {
  const metadata = parseAssetMetadata(value, "character_pin");
  if (!metadata || !["user", "cody"].includes(metadata.ownerId) || (ownerId && metadata.ownerId !== ownerId)) return null;
  return metadata as CharacterPinMetadata;
};
