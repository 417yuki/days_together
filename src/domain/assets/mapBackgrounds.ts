import type { MapId } from "../maps/mapTypes";
import { isSafeAssetId, parseAssetMetadata, type AssetMetadata } from "./itemImages";

export const MAP_BACKGROUND_IDS = ["starter_house_interior", "starter_garden"] as const;
export type MapBackgroundId = typeof MAP_BACKGROUND_IDS[number];
export type MapVisualState = { saveSlotId: "main"; mapId: MapBackgroundId; backgroundAssetId: string | null; updatedAt: string };
export type MapBackgroundMetadata = AssetMetadata & { kind: "map_background"; ownerId: MapBackgroundId };
export type MapBackgroundAsset = { metadata: MapBackgroundMetadata; blob: Blob };
export const isMapBackgroundId = (value: unknown): value is MapBackgroundId => typeof value === "string" && MAP_BACKGROUND_IDS.includes(value as MapBackgroundId);
export const parseMapBackgroundMetadata = (value: unknown, ownerId?: MapBackgroundId): MapBackgroundMetadata | null => {
  const metadata = parseAssetMetadata(value, "map_background");
  if (!metadata || !isMapBackgroundId(metadata.ownerId) || (ownerId && metadata.ownerId !== ownerId)) return null;
  return metadata as MapBackgroundMetadata;
};
export const parseMapVisual = (value: unknown, mapId: MapBackgroundId): MapVisualState => {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { saveSlotId: "main", mapId, backgroundAssetId: raw.saveSlotId === "main" && raw.mapId === mapId && isSafeAssetId(raw.backgroundAssetId) ? raw.backgroundAssetId : null, updatedAt: typeof raw.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : new Date(0).toISOString() };
};
export const asMapBackgroundId = (mapId: MapId): MapBackgroundId | null => isMapBackgroundId(mapId) ? mapId : null;
