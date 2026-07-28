import { describe, expect, it } from "vitest";
import { starterMaps } from "../../data/starterMaps";
import { createPresetLocationLayout, normalizeLocationPoint, resolveMapLayout, restoreLocationLayout } from "./locationLayout";

describe("location layout", () => {
  const interior = starterMaps[0];
  it("creates independent preset points without mutating the map", () => { const before = structuredClone(interior); const layout = createPresetLocationLayout(interior); layout.kitchen.x = .9; expect(interior).toEqual(before); expect(Object.keys(layout)).toHaveLength(5); });
  it("restores each invalid component and ignores unknown locations", () => { const layout = restoreLocationLayout(interior, { kitchen: { x: .4, y: "bad" }, table: { x: NaN, y: Infinity }, mystery: { x: .2, y: .2 } }); expect(layout.kitchen).toEqual({ x: .4, y: .18 }); expect(layout.table).toEqual({ x: .29, y: .43 }); expect(layout.mystery).toBeUndefined(); });
  it("accepts boundaries and rejects out of range values", () => { const layout = restoreLocationLayout(interior, { kitchen: { x: 0, y: 1 }, table: { x: -1, y: 2 } }); expect(layout.kitchen).toEqual({ x: 0, y: 1 }); expect(layout.table).toEqual({ x: .29, y: .43 }); });
  it("normalizes edited points to safe hundredths", () => expect(normalizeLocationPoint({ x: .004, y: .956 })).toEqual({ x: .05, y: .95 }));
  it("resolves a copy and preserves graph data", () => { const result = resolveMapLayout(interior, { kitchen: { x: .8, y: .8 } }); expect(result.locations[0].position).toEqual({ x: .8, y: .8 }); expect(result.locations[0].connectedLocationIds).toEqual(interior.locations[0].connectedLocationIds); expect(interior.locations[0].position).toEqual({ x: .24, y: .18 }); });
});
