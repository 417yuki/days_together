import { describe, expect, it } from "vitest";
import { genericVisualIds, genericVisualRegistry, getGenericVisualDefinition, resolveGenericVisualKey } from "./genericItemVisuals";

describe("generic item visuals", () => {
  it("provides the ten unique local definitions", () => {
    expect(genericVisualIds).toHaveLength(10);
    expect(new Set(genericVisualIds).size).toBe(10);
    genericVisualIds.forEach((id) => {
      const definition = getGenericVisualDefinition(id);
      expect(definition).toEqual(genericVisualRegistry[id]);
      expect(JSON.stringify(definition)).not.toMatch(/https?:|data:|blob:/i);
    });
    expect(getGenericVisualDefinition("unknown")).toBeNull();
  });

  it("resolves only the fourteen exact persisted aliases", () => {
    expect(Object.fromEntries(["food", "drink", "plant", "book", "tool", "craft", "photo", "memory", "gift", "furniture", "clothing", "toy", "storage", "misc"].map((key) => [key, resolveGenericVisualKey(key)]))).toEqual({ food: "food", drink: "drink", plant: "plant", book: "book", tool: "tool_craft", craft: "tool_craft", photo: "photo_memory", memory: "photo_memory", gift: "gift", furniture: "furniture", clothing: "clothing", toy: "small_goods", storage: "small_goods", misc: "small_goods" });
    expect(resolveGenericVisualKey(null)).toBeNull();
    expect(resolveGenericVisualKey("")).toBeNull();
    expect(resolveGenericVisualKey(" FOOD")).toBeNull();
    expect(resolveGenericVisualKey("unknown")).toBeNull();
  });
});
