import type { MapDefinition } from "./mapTypes";

export type RelativePoint = { x: number; y: number };
export type LocationLayout = Record<string, RelativePoint>;

export const createPresetLocationLayout = (map: MapDefinition): LocationLayout => Object.fromEntries(
  map.locations.map(({ locationId, position }) => [locationId, { ...position }])
);

const validComponent = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export const normalizeLocationPoint = (value: RelativePoint): RelativePoint => ({
  x: Math.round(Math.min(.95, Math.max(.05, value.x)) * 100) / 100,
  y: Math.round(Math.min(.95, Math.max(.05, value.y)) * 100) / 100
});

export const restoreLocationLayout = (map: MapDefinition, value: unknown): LocationLayout => {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(map.locations.map(({ locationId, position }) => {
    const point = raw[locationId] && typeof raw[locationId] === "object" && !Array.isArray(raw[locationId]) ? raw[locationId] as Record<string, unknown> : {};
    return [locationId, { x: validComponent(point.x) ? point.x : position.x, y: validComponent(point.y) ? point.y : position.y }];
  }));
};

export const resolveMapLayout = (map: MapDefinition, saved: unknown): MapDefinition => {
  const layout = restoreLocationLayout(map, saved);
  return { ...map, locations: map.locations.map((location) => ({ ...location, position: { ...layout[location.locationId] }, connectedLocationIds: [...location.connectedLocationIds] })) };
};
