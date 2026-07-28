import type { MapId } from "../maps/mapTypes";
import { isSafeAssetId, parseAssetMetadata, type AssetMetadata } from "./itemImages";
import { starterMaps } from "../../data/starterMaps";
import { createPresetLocationLayout, restoreLocationLayout, type LocationLayout } from "../maps/locationLayout";
import { DEFAULT_HOUSE_POSITION, PRESET_GATEWAYS, restoreGatewayVisualPair, type MapGatewayVisual } from "../maps/mapGatewayVisual";

export const MAP_BACKGROUND_IDS = ["starter_house_interior", "starter_garden"] as const;
export type MapBackgroundId = typeof MAP_BACKGROUND_IDS[number];
export type MapVisualState = { saveSlotId: "main"; mapId: MapBackgroundId; backgroundAssetId: string | null; locationLayout: LocationLayout; gatewayVisual: MapGatewayVisual; updatedAt: string };
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
  const map = starterMaps.find((candidate) => candidate.mapId === mapId)!;
  const locationLayout = restoreLocationLayout(map, raw.locationLayout);
  const gatewayRaw = raw.gatewayVisual && typeof raw.gatewayVisual === "object" ? raw.gatewayVisual as Record<string, unknown> : {};
  const fallback = locationLayout[PRESET_GATEWAYS[mapId]];
  const position = (value: unknown, defaultValue: typeof fallback) => { const point = value && typeof value === "object" ? value as Record<string, unknown> : {}; const valid = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1; return { x: valid(point.x) ? point.x : defaultValue.x, y: valid(point.y) ? point.y : defaultValue.y }; };
  return { saveSlotId: "main", mapId, backgroundAssetId: raw.saveSlotId === "main" && raw.mapId === mapId && isSafeAssetId(raw.backgroundAssetId) ? raw.backgroundAssetId : null, locationLayout, gatewayVisual: { gatewayLocationId: typeof gatewayRaw.gatewayLocationId === "string" ? gatewayRaw.gatewayLocationId : PRESET_GATEWAYS[mapId], proxyPosition: position(gatewayRaw.proxyPosition, fallback), entryAffordancePosition: mapId === "starter_garden" ? position(gatewayRaw.entryAffordancePosition, DEFAULT_HOUSE_POSITION) : null }, updatedAt: typeof raw.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : new Date(0).toISOString() };
};
export const createDefaultMapVisual = (mapId: MapBackgroundId): MapVisualState => { const layouts = Object.fromEntries(starterMaps.map((map) => [map.mapId, createPresetLocationLayout(map)])) as Record<MapId, LocationLayout>; const map = starterMaps.find((candidate) => candidate.mapId === mapId)!; return { saveSlotId: "main", mapId, backgroundAssetId: null, locationLayout: createPresetLocationLayout(map), gatewayVisual: restoreGatewayVisualPair({}, layouts)[mapId], updatedAt: new Date(0).toISOString() }; };
export const asMapBackgroundId = (mapId: MapId): MapBackgroundId | null => isMapBackgroundId(mapId) ? mapId : null;
