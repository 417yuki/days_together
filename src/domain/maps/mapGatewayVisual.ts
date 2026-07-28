import { starterMaps } from "../../data/starterMaps";
import type { MapDefinition, MapId } from "./mapTypes";
import type { LocationLayout, RelativePoint } from "./locationLayout";

export type MapGatewayVisual = { gatewayLocationId: string; proxyPosition: RelativePoint; entryAffordancePosition: RelativePoint | null };
export type GatewayVisualPair = Record<MapId, MapGatewayVisual>;
export const INTERIOR_ID: MapId = "starter_house_interior", GARDEN_ID: MapId = "starter_garden";
export const PRESET_GATEWAYS = { [INTERIOR_ID]: "entrance", [GARDEN_ID]: "front_of_house" } as const;
export const DEFAULT_HOUSE_POSITION: RelativePoint = { x: .5, y: .18 };
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const component = (value: unknown, fallback: number): number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
const point = (value: unknown, fallback: RelativePoint): RelativePoint => { const raw = record(value); return { x: component(raw.x, fallback.x), y: component(raw.y, fallback.y) }; };
export const normalizeGatewayPoint = (value: RelativePoint, min = .05, max = .95): RelativePoint => ({ x: Math.round(Math.min(max, Math.max(min, value.x)) * 100) / 100, y: Math.round(Math.min(max, Math.max(min, value.y)) * 100) / 100 });
export const restoreGatewayVisualPair = (values: Partial<Record<MapId, unknown>>, layouts: Record<MapId, LocationLayout>): GatewayVisualPair => {
  const a = record(values[INTERIOR_ID]), b = record(values[GARDEN_ID]);
  const valid = (mapId: MapId, value: unknown) => typeof value === "string" && starterMaps.find((map) => map.mapId === mapId)!.locations.some((location) => location.locationId === value);
  const pairValid = valid(INTERIOR_ID, a.gatewayLocationId) && valid(GARDEN_ID, b.gatewayLocationId);
  const interiorId = pairValid ? a.gatewayLocationId as string : PRESET_GATEWAYS[INTERIOR_ID], gardenId = pairValid ? b.gatewayLocationId as string : PRESET_GATEWAYS[GARDEN_ID];
  return {
    [INTERIOR_ID]: { gatewayLocationId: interiorId, proxyPosition: point(a.proxyPosition, layouts[INTERIOR_ID][interiorId]), entryAffordancePosition: null },
    [GARDEN_ID]: { gatewayLocationId: gardenId, proxyPosition: point(b.proxyPosition, layouts[GARDEN_ID][gardenId]), entryAffordancePosition: point(b.entryAffordancePosition, DEFAULT_HOUSE_POSITION) }
  };
};
export const applyGatewayPair = (maps: MapDefinition[], pair: GatewayVisualPair): MapDefinition[] => maps.map((map) => ({ ...map, locations: map.locations.map((location) => {
  const copy = { ...location, position: { ...location.position }, connectedLocationIds: [...location.connectedLocationIds] }; delete copy.gateway;
  if (location.locationId !== pair[map.mapId].gatewayLocationId) return copy;
  const other = map.mapId === INTERIOR_ID ? GARDEN_ID : INTERIOR_ID;
  return { ...copy, gateway: { destinationMapId: other, destinationLocationId: pair[other].gatewayLocationId } };
}) }));
