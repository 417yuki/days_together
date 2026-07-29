import { describe, expect, it } from "vitest";
import { CUSTOM_LOCATION_TYPES, createCustomLocation, customLocationTypeTag, initialCustomLocations, locationTypeFromTags, normalizeCustomLocations, defaultCustomMapName, normalizeCustomMapName, parseCustomMapDraft, restoreCustomMapDrafts, restoreCustomMapFinishPair } from "./customMapDraft";
import { starterMaps } from "../../data/starterMaps";

const valid = (targetMapId: "starter_house_interior" | "starter_garden") => ({ saveSlotId: "main", targetMapId, name: targetMapId === "starter_garden" ? "庭園" : "部屋", status: "published", createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-02T00:00:00.000Z" });

describe("custom map drafts", () => {
  it("restores valid interior and garden drafts and normalizes status", () => {
    expect(parseCustomMapDraft(valid("starter_house_interior"))?.status).toBe("draft");
    expect(parseCustomMapDraft(valid("starter_garden"))?.name).toBe("庭園");
  });
  it("rejects unknown targets and key mismatches", () => {
    expect(parseCustomMapDraft({ ...valid("starter_garden"), targetMapId: "unknown" })).toBeNull();
    expect(parseCustomMapDraft(valid("starter_garden"), "starter_house_interior")).toBeNull();
  });
  it.each(["", "   ", 3, "制御\u0000文字", "あ".repeat(41)])("repairs an invalid name %#", (name) => {
    expect(normalizeCustomMapName(name, "starter_garden")).toBe(defaultCustomMapName("starter_garden"));
  });
  it("trims Unicode whitespace", () => expect(normalizeCustomMapName("　小さな庭\u00a0", "starter_garden")).toBe("小さな庭"));
  it("repairs only a broken date", () => {
    const parsed = parseCustomMapDraft({ ...valid("starter_house_interior"), createdAt: "broken" });
    expect(parsed).toEqual(expect.objectContaining({ name: "部屋", createdAt: "1970-01-01T00:00:00.000Z", updatedAt: "2026-07-02T00:00:00.000Z" }));
  });
  it("keeps one target when the other record is broken", () => {
    const restored = restoreCustomMapDrafts([valid("starter_house_interior"), { saveSlotId: "main", targetMapId: "starter_garden", name: "庭", createdAt: "ok" }]);
    expect(restored.starter_house_interior?.name).toBe("部屋"); expect(restored.starter_garden?.name).toBe("庭");
  });
});

describe("custom map locations", () => {
  it("fixes the seven types and their standard tags", () => expect(CUSTOM_LOCATION_TYPES.map(({ id, label, tag }) => [id, label, tag])).toEqual([["general", "汎用", null], ["cooking", "料理", "cooking"], ["dining", "食卓", "living"], ["rest", "休憩", "rest"], ["work", "作業", "work"], ["nature", "自然", "nature"], ["storage", "収納", "storage"]]));
  it("maps tags in fixed priority order", () => { expect(locationTypeFromTags(["gateway", "nature", "cooking"])).toBe("cooking"); expect(locationTypeFromTags(["gateway"])).toBe("general"); expect(customLocationTypeTag("dining")).toBe("living"); });
  it("drops broken and duplicate ids and keeps only the first eight", () => { const values = Array.from({ length: 10 }, (_, index) => ({ locationId: `place_${index}`, label: `場所${index}`, locationTypeId: "unknown", position: { x: .2, y: .3 } })); values.splice(1, 0, { ...values[0] }, { ...values[0], locationId: "BAD ID" }); const restored = normalizeCustomLocations(values); expect(restored).toHaveLength(8); expect(restored[0].locationId).toBe("place_0"); expect(restored[0].locationTypeId).toBe("general"); });
  it("repairs labels and coordinate components independently", () => { const [value] = normalizeCustomLocations([{ locationId: "safe", label: "\u0000", locationTypeId: "rest", position: { x: "bad", y: .72 } }], [{ locationId: "safe", label: "元", locationTypeId: "general", position: { x: .24, y: .18 } }]); expect(value).toEqual({ locationId: "safe", label: "地点1", locationTypeId: "rest", position: { x: .24, y: .72 } }); });
  it("initializes old DB8 drafts from current definitions and saved layouts", () => { const map = starterMaps[0], locations = initialCustomLocations(map, { kitchen: { x: .31, y: .32 } }); expect(locations[0]).toEqual(expect.objectContaining({ locationId: "kitchen", label: "台所", locationTypeId: "cooking", position: { x: .31, y: .32 } })); });
  it("creates unique safe ids, names, and positions", () => { const first = createCustomLocation([], "12345678-1234-1234-1234-123456789abc"), second = createCustomLocation([first], "22345678-1234-1234-1234-123456789abc"); expect(first.locationId).toMatch(/^[a-z0-9][a-z0-9_-]{0,63}$/); expect(second.label).toBe("新しい地点2"); expect(second.position).not.toEqual(first.position); });
});

describe("custom map finish", () => {
  const location = (locationId: string) => ({ locationId, label: locationId, locationTypeId: "general" as const, position: { x: .5, y: .5 } });
  const drafts = {
    starter_house_interior: parseCustomMapDraft({ ...valid("starter_house_interior"), locations: [location("inside_first"), location("inside_current")] })!,
    starter_garden: parseCustomMapDraft({ ...valid("starter_garden"), locations: [location("outside_first"), location("outside_current")] })!
  };
  const gateways = { starter_house_interior: { gatewayLocationId: "inside_current", proxyPosition: { x: .2, y: .3 }, entryAffordancePosition: null }, starter_garden: { gatewayLocationId: "outside_current", proxyPosition: { x: .8, y: .7 }, entryAffordancePosition: { x: .5, y: .4 } } };
  const slots = { starter_house_interior: { interior_slot_1: { position: { x: .2, y: .2 }, itemId: "tea" } }, starter_garden: { garden_slot_1: { position: { x: .8, y: .8 }, itemId: "tea" } } };
  it("restores a valid saved gateway pair and removes duplicate items in fixed order", () => { const saved = { starter_house_interior: { ...drafts.starter_house_interior, gatewayVisual: { ...gateways.starter_house_interior, gatewayLocationId: "inside_first" } }, starter_garden: { ...drafts.starter_garden, gatewayVisual: { ...gateways.starter_garden, gatewayLocationId: "outside_first" } } }; const result = restoreCustomMapFinishPair(saved, gateways, slots, ["tea"]); expect(result.starter_house_interior.gatewayVisual.gatewayLocationId).toBe("inside_first"); expect(result.starter_garden.gatewayVisual.gatewayLocationId).toBe("outside_first"); expect(result.starter_house_interior.itemSlots.interior_slot_1.itemId).toBe("tea"); expect(result.starter_garden.itemSlots.garden_slot_1.itemId).toBeNull(); });
  it("uses the current pair only when both saved gateway values are absent", () => { const result = restoreCustomMapFinishPair(drafts, gateways, slots, ["tea"]); expect([result.starter_house_interior.gatewayVisual.gatewayLocationId, result.starter_garden.gatewayVisual.gatewayLocationId]).toEqual(["inside_current", "outside_current"]); });
  it("repairs a partially invalid saved pair to both first custom locations", () => { const broken = { starter_house_interior: { ...drafts.starter_house_interior, gatewayVisual: { ...gateways.starter_house_interior, gatewayLocationId: "missing" } }, starter_garden: { ...drafts.starter_garden, gatewayVisual: { ...gateways.starter_garden, gatewayLocationId: "outside_current" } } }; const result = restoreCustomMapFinishPair(broken, gateways, slots, ["tea"]); expect([result.starter_house_interior.gatewayVisual.gatewayLocationId, result.starter_garden.gatewayVisual.gatewayLocationId]).toEqual(["inside_first", "outside_first"]); });
  it("repairs coordinate components independently and keeps the interior house value null", () => { const broken = { starter_house_interior: { ...drafts.starter_house_interior, gatewayVisual: { gatewayLocationId: "inside_first", proxyPosition: { x: Number.NaN, y: .44 }, entryAffordancePosition: { x: 1, y: 1 } } }, starter_garden: { ...drafts.starter_garden, gatewayVisual: { gatewayLocationId: "outside_first", proxyPosition: { x: .6, y: .7 }, entryAffordancePosition: { x: Number.NaN, y: .66 } } } }; const result = restoreCustomMapFinishPair(broken, gateways, slots, ["tea"]); expect(result.starter_house_interior.gatewayVisual.proxyPosition).toEqual({ x: .2, y: .44 }); expect(result.starter_garden.gatewayVisual.entryAffordancePosition).toEqual({ x: .5, y: .66 }); expect(result.starter_house_interior.gatewayVisual.entryAffordancePosition).toBeNull(); });
});
