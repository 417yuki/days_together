import { describe, expect, it } from "vitest";
import { createPresetItemSlots, removeDuplicateItemSlots, restoreItemSlots } from "./mapItemSlots";

describe("map item slots", () => {
  const ids = new Set(["a", "b"]);
  it("creates the fixed slots in stable order", () => {
    expect(Object.entries(createPresetItemSlots("starter_house_interior"))).toEqual([
      ["interior_slot_1", { position: { x: .18, y: .3 }, itemId: null }],
      ["interior_slot_2", { position: { x: .5, y: .56 }, itemId: null }],
      ["interior_slot_3", { position: { x: .82, y: .3 }, itemId: null }]
    ]);
  });
  it("repairs individual components, missing slots, unknown slots and item ids", () => {
    const restored = restoreItemSlots("starter_garden", { garden_slot_1: { position: { x: 0, y: "bad" }, itemId: "a" }, garden_slot_2: { position: { x: Infinity, y: 1 }, itemId: "missing" }, unknown: { itemId: "b" } }, ids);
    expect(restored.garden_slot_1).toEqual({ position: { x: 0, y: .58 }, itemId: "a" });
    expect(restored.garden_slot_2).toEqual({ position: { x: .5, y: 1 }, itemId: null });
    expect(restored.garden_slot_3).toEqual({ position: { x: .8, y: .58 }, itemId: null });
    expect(restored.unknown).toBeUndefined();
  });
  it("keeps only the first duplicate in global stable order", () => {
    const pair = removeDuplicateItemSlots({ starter_house_interior: restoreItemSlots("starter_house_interior", { interior_slot_2: { position: {}, itemId: "a" } }, ids), starter_garden: restoreItemSlots("starter_garden", { garden_slot_1: { position: {}, itemId: "a" } }, ids) });
    expect(pair.starter_house_interior.interior_slot_2.itemId).toBe("a");
    expect(pair.starter_garden.garden_slot_1.itemId).toBeNull();
  });
});
