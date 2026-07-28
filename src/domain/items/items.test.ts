import { describe, expect, it } from "vitest";
import { createUserItem, getDefaultItemVisual, itemCategories, mergeStarterItems, parseItem, resolveItemVisual, starterItems } from "./items";
import { hasItemIcon, requiredItemIconKeys, safeItemIconKey } from "../../ui/icons/itemIcons";

describe("items", () => {
  it("defines visuals and local icons for every category", () => { expect(itemCategories).toHaveLength(14); itemCategories.forEach((category) => expect(getDefaultItemVisual(category)).toMatchObject({ imageAssetId: null, mapDisplayMode: "icon" })); expect(requiredItemIconKeys.every(hasItemIcon)).toBe(true); expect(safeItemIconKey("unknown")).toBe("category"); });
  it("provides six valid unique starter items", () => { expect(starterItems).toHaveLength(6); expect(new Set(starterItems.map(({ itemId }) => itemId)).size).toBe(6); expect(starterItems.every((item) => parseItem(item))).toBe(true); expect(starterItems[0].visual.iconKey).toBe("umbrella"); });
  it("creates a normalized user item with injected values", () => { const input = { name: "  手紙  ", category: "memory" as const }; const item = createUserItem(input, () => "secure-id", () => "2026-07-28T00:00:00.000Z"); expect(item).toMatchObject({ itemId: "secure-id", name: "手紙", description: "", tags: [], source: "user", visual: getDefaultItemVisual("memory") }); expect(input.name).toBe("  手紙  "); });
  it("rejects invalid fields independently", () => { const valid = starterItems[0]; expect(parseItem({ ...valid, name: "" })).toBeNull(); expect(parseItem({ ...valid, name: "a".repeat(41) })).toBeNull(); expect(parseItem({ ...valid, category: "other" })).toBeNull(); expect(parseItem({ ...valid, description: "a".repeat(281) })).toBeNull(); expect(parseItem({ ...valid, tags: ["same", "same"] })).toBeNull(); expect(parseItem({ ...valid, visual: { nope: true } })).toBeNull(); });
  it("ignores a broken record and supplies only missing starters", () => { const user = createUserItem({ name: "箱", category: "storage" }, () => "user-box", () => "2026-07-28T00:00:00.000Z"); const merged = mergeStarterItems([starterItems[0], user, { broken: true }]); expect(merged).toHaveLength(7); expect(merged.filter(({ itemId }) => itemId === "starter_umbrella")).toHaveLength(1); expect(merged).toContainEqual(user); });
  it("resolves individual, generic, and safe icon fallback priority", () => {
    const item = { ...starterItems[1], visual: { ...starterItems[1].visual, imageAssetId: "item-image-1" } };
    expect(resolveItemVisual(item, { assetId: "item-image-1", url: "blob:local" })).toEqual({ kind: "individual", assetId: "item-image-1", url: "blob:local" });
    expect(resolveItemVisual(item)).toEqual({ kind: "generic", genericVisualId: "drink" });
    expect(resolveItemVisual({ ...item, visual: { ...item.visual, genericVisualKey: "unknown" } })).toEqual({ kind: "icon", iconKey: item.visual.iconKey });
    expect(safeItemIconKey(resolveItemVisual({ ...item, visual: { ...item.visual, genericVisualKey: null, iconKey: "unknown" } }).kind === "icon" ? "unknown" : "nope")).toBe("category");
  });
});
