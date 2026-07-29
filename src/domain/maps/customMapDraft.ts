export const CUSTOM_MAP_TARGET_IDS = ["starter_house_interior", "starter_garden"] as const;
export type CustomMapTargetId = typeof CUSTOM_MAP_TARGET_IDS[number];
export type CustomMapDraft = { saveSlotId: "main"; targetMapId: CustomMapTargetId; name: string; status: "draft"; createdAt: string; updatedAt: string };

export const defaultCustomMapName = (target: CustomMapTargetId): string => target === "starter_house_interior" ? "カスタム室内" : "カスタム庭";
export const isCustomMapTargetId = (value: unknown): value is CustomMapTargetId => value === "starter_house_interior" || value === "starter_garden";
const validDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const validName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && [...value.trim()].length <= 40 && !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
export const normalizeCustomMapName = (value: unknown, target: CustomMapTargetId): string => validName(value) ? value.trim() : defaultCustomMapName(target);
export const parseCustomMapDraft = (value: unknown, expected?: CustomMapTargetId): CustomMapDraft | null => {
  if (!value || typeof value !== "object") return null; const raw = value as Record<string, unknown>;
  if (raw.saveSlotId !== "main" || !isCustomMapTargetId(raw.targetMapId) || (expected && raw.targetMapId !== expected)) return null;
  return { saveSlotId: "main", targetMapId: raw.targetMapId, name: normalizeCustomMapName(raw.name, raw.targetMapId), status: "draft", createdAt: validDate(raw.createdAt) ? raw.createdAt : "1970-01-01T00:00:00.000Z", updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : "1970-01-01T00:00:00.000Z" };
};
export const restoreCustomMapDrafts = (values: unknown[]): Partial<Record<CustomMapTargetId, CustomMapDraft>> => {
  const result: Partial<Record<CustomMapTargetId, CustomMapDraft>> = {};
  CUSTOM_MAP_TARGET_IDS.forEach((target) => { const parsed = parseCustomMapDraft(values.find((value) => value && typeof value === "object" && (value as Record<string, unknown>).targetMapId === target), target); if (parsed) result[target] = parsed; });
  return result;
};
