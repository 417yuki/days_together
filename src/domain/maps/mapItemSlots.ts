import type { GameItem } from "../items/items";
import type { MapId } from "./mapTypes";

export type RelativePoint = { x: number; y: number };
export type MapItemSlot = { position: RelativePoint; itemId: string | null };
export type MapItemSlotLayout = Record<string, MapItemSlot>;
export type MapItemSlotPair = Record<MapId, MapItemSlotLayout>;

export const ITEM_SLOT_PRESETS = {
  starter_house_interior: [
    ["interior_slot_1", .18, .30], ["interior_slot_2", .50, .56], ["interior_slot_3", .82, .30]
  ],
  starter_garden: [
    ["garden_slot_1", .20, .58], ["garden_slot_2", .50, .70], ["garden_slot_3", .80, .58]
  ]
} as const;

export const createPresetItemSlots = (mapId: MapId): MapItemSlotLayout => Object.fromEntries(
  ITEM_SLOT_PRESETS[mapId].map(([id, x, y]) => [id, { position: { x, y }, itemId: null }])
);

const component = (value: unknown, fallback: number): number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? Math.round(value * 100) / 100 : fallback;
const validItemId = (value: unknown, ids: ReadonlySet<string>): string | null => typeof value === "string" && value.length > 0 && !/[\u0000-\u001f\u007f]/u.test(value) && ids.has(value) ? value : null;

export const restoreItemSlots = (mapId: MapId, value: unknown, itemIds: ReadonlySet<string>): MapItemSlotLayout => {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const preset = createPresetItemSlots(mapId);
  return Object.fromEntries(Object.entries(preset).map(([id, fallback]) => {
    const slot = raw[id] && typeof raw[id] === "object" && !Array.isArray(raw[id]) ? raw[id] as Record<string, unknown> : {};
    const point = slot.position && typeof slot.position === "object" ? slot.position as Record<string, unknown> : {};
    return [id, { position: { x: component(point.x, fallback.position.x), y: component(point.y, fallback.position.y) }, itemId: validItemId(slot.itemId, itemIds) }];
  }));
};

export const removeDuplicateItemSlots = (pair: MapItemSlotPair): MapItemSlotPair => {
  const seen = new Set<string>();
  const result = structuredClone(pair);
  (["starter_house_interior", "starter_garden"] as const).forEach((mapId) => Object.values(result[mapId]).forEach((slot) => {
    if (!slot.itemId) return;
    if (seen.has(slot.itemId)) slot.itemId = null; else seen.add(slot.itemId);
  }));
  return result;
};

export const resolvePlacedItems = (layout: MapItemSlotLayout, items: GameItem[]) => {
  const byId = new Map(items.map((item) => [item.itemId, item]));
  return Object.entries(layout).flatMap(([slotId, slot]) => { const item = slot.itemId ? byId.get(slot.itemId) : undefined; return item ? [{ slotId, position: slot.position, item }] : []; }).slice(0, 3);
};
