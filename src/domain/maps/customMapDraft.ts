import type { MapDefinition } from "./mapTypes";
import type { LocationLayout } from "./locationLayout";

export const CUSTOM_MAP_TARGET_IDS = ["starter_house_interior", "starter_garden"] as const;
export type CustomMapTargetId = typeof CUSTOM_MAP_TARGET_IDS[number];
export const CUSTOM_LOCATION_TYPES = [
  { id: "general", label: "汎用", tag: null }, { id: "cooking", label: "料理", tag: "cooking" },
  { id: "dining", label: "食卓", tag: "living" }, { id: "rest", label: "休憩", tag: "rest" },
  { id: "work", label: "作業", tag: "work" }, { id: "nature", label: "自然", tag: "nature" },
  { id: "storage", label: "収納", tag: "storage" }
] as const;
export type CustomLocationTypeId = typeof CUSTOM_LOCATION_TYPES[number]["id"];
export type CustomMapLocation = { locationId: string; label: string; locationTypeId: CustomLocationTypeId; position: { x: number; y: number } };
export type CustomMapDraft = { saveSlotId: "main"; targetMapId: CustomMapTargetId; name: string; status: "draft"; locations: CustomMapLocation[]; createdAt: string; updatedAt: string };

export const defaultCustomMapName = (target: CustomMapTargetId): string => target === "starter_house_interior" ? "カスタム室内" : "カスタム庭";
export const isCustomMapTargetId = (value: unknown): value is CustomMapTargetId => CUSTOM_MAP_TARGET_IDS.some((id) => id === value);
const validDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const noControls = (value: string) => !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
const validName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && [...value.trim()].length <= 40 && noControls(value);
const validLocationId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/u.test(value);
export const normalizeCustomMapName = (value: unknown, target: CustomMapTargetId): string => validName(value) ? value.trim() : defaultCustomMapName(target);
export const normalizeLocationType = (value: unknown): CustomLocationTypeId => CUSTOM_LOCATION_TYPES.some(({ id }) => id === value) ? value as CustomLocationTypeId : "general";
export const customLocationTypeTag = (value: CustomLocationTypeId): string | null => CUSTOM_LOCATION_TYPES.find(({ id }) => id === value)?.tag ?? null;
export const locationTypeFromTags = (tags: readonly string[]): CustomLocationTypeId => (["cooking", "living", "rest", "work", "nature", "storage"] as const).find((tag) => tags.includes(tag)) === "living" ? "dining" : normalizeLocationType((["cooking", "rest", "work", "nature", "storage"] as const).find((tag) => tags.includes(tag)));
const safeCoordinate = (value: unknown, fallback: number): number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? Math.round(value * 100) / 100 : fallback;
export const normalizeCustomLocations = (value: unknown, fallbacks: readonly CustomMapLocation[] = []): CustomMapLocation[] => {
  if (!Array.isArray(value)) return [];
  const result: CustomMapLocation[] = [], ids = new Set<string>();
  for (const rawValue of value) {
    if (result.length === 8) break;
    if (!rawValue || typeof rawValue !== "object") continue;
    const raw = rawValue as Record<string, unknown>;
    if (!validLocationId(raw.locationId) || ids.has(raw.locationId)) continue;
    const fallback = fallbacks.find((item) => item.locationId === raw.locationId)?.position ?? { x: .5, y: .5 };
    const position = raw.position && typeof raw.position === "object" ? raw.position as Record<string, unknown> : {};
    const index = result.length + 1, trimmed = typeof raw.label === "string" ? raw.label.trim() : "";
    result.push({ locationId: raw.locationId, label: trimmed && [...trimmed].length <= 24 && noControls(trimmed) ? trimmed : `地点${index}`, locationTypeId: normalizeLocationType(raw.locationTypeId), position: { x: safeCoordinate(position.x, fallback.x), y: safeCoordinate(position.y, fallback.y) } });
    ids.add(raw.locationId);
  }
  return result;
};
export const initialCustomLocations = (map: MapDefinition, layout: LocationLayout): CustomMapLocation[] => map.locations.slice(0, 8).map((location) => ({ locationId: location.locationId, label: location.label, locationTypeId: locationTypeFromTags(location.locationTags), position: { ...layout[location.locationId] ?? location.position } }));
export const locationsForEditing = (draft: CustomMapDraft, map: MapDefinition, layout: LocationLayout): CustomMapLocation[] => normalizeCustomLocations(draft.locations, initialCustomLocations(map, layout)).length ? normalizeCustomLocations(draft.locations, initialCustomLocations(map, layout)) : initialCustomLocations(map, layout);
export const createCustomLocationId = (existing: readonly CustomMapLocation[], uuid: string | undefined = globalThis.crypto?.randomUUID?.()): string => {
  const used = new Set(existing.map(({ locationId }) => locationId)); let seed = (uuid ?? `${Date.now()}_${Math.random()}`).toLowerCase().replace(/[^a-z0-9_-]/gu, "_");
  let candidate = `custom_${seed}`.slice(0, 64), suffix = 1; while (used.has(candidate)) candidate = `custom_${seed.slice(0, 54)}_${suffix++}`; return candidate;
};
const NEW_POSITIONS = [{ x: .5, y: .5 }, { x: .25, y: .25 }, { x: .75, y: .25 }, { x: .25, y: .7 }, { x: .75, y: .7 }, { x: .5, y: .2 }, { x: .15, y: .5 }, { x: .85, y: .5 }];
export const createCustomLocation = (existing: readonly CustomMapLocation[], uuid?: string): CustomMapLocation => {
  let number = 1; while (existing.some(({ label }) => label === `新しい地点${number}`)) number++;
  const position = NEW_POSITIONS.find((point) => existing.every((item) => Math.hypot(item.position.x - point.x, item.position.y - point.y) >= .1)) ?? NEW_POSITIONS[existing.length % NEW_POSITIONS.length];
  return { locationId: createCustomLocationId(existing, uuid), label: `新しい地点${number}`, locationTypeId: "general", position: { ...position } };
};
export const parseCustomMapDraft = (value: unknown, expected?: CustomMapTargetId): CustomMapDraft | null => {
  if (!value || typeof value !== "object") return null; const raw = value as Record<string, unknown>;
  if (raw.saveSlotId !== "main" || !isCustomMapTargetId(raw.targetMapId) || (expected && raw.targetMapId !== expected)) return null;
  return { saveSlotId: "main", targetMapId: raw.targetMapId, name: normalizeCustomMapName(raw.name, raw.targetMapId), status: "draft", locations: normalizeCustomLocations(raw.locations), createdAt: validDate(raw.createdAt) ? raw.createdAt : "1970-01-01T00:00:00.000Z", updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : "1970-01-01T00:00:00.000Z" };
};
export const restoreCustomMapDrafts = (values: unknown[]): Partial<Record<CustomMapTargetId, CustomMapDraft>> => { const result: Partial<Record<CustomMapTargetId, CustomMapDraft>> = {}; CUSTOM_MAP_TARGET_IDS.forEach((target) => { const parsed = parseCustomMapDraft(values.find((value) => value && typeof value === "object" && (value as Record<string, unknown>).targetMapId === target), target); if (parsed) result[target] = parsed; }); return result; };
