import { describe, expect, it } from "vitest";
import { starterMaps } from "./starterMaps";
const map = (id: string) => starterMaps.find((item) => item.mapId === id)!;
describe("starter maps", () => {
  it("has five interior and three garden locations", () => { expect(map("starter_house_interior").locations).toHaveLength(5); expect(map("starter_garden").locations).toHaveLength(3); });
  it("keeps every coordinate between zero and one", () => { starterMaps.flatMap((item) => item.locations).forEach(({ position }) => { expect(position.x).toBeGreaterThanOrEqual(0); expect(position.x).toBeLessThanOrEqual(1); expect(position.y).toBeGreaterThanOrEqual(0); expect(position.y).toBeLessThanOrEqual(1); }); });
  it("connects the entrance and front of house in both directions", () => { expect(map("starter_house_interior").locations.find((l) => l.locationId === "entrance")?.gateway?.destinationMapId).toBe("starter_garden"); expect(map("starter_garden").locations.find((l) => l.locationId === "front_of_house")?.gateway?.destinationMapId).toBe("starter_house_interior"); });
  it("only references existing gateway maps and locations", () => { starterMaps.flatMap((item) => item.locations).forEach(({ gateway }) => { if (!gateway) return; const destination = map(gateway.destinationMapId); expect(destination).toBeDefined(); expect(destination.locations.some(({ locationId }) => locationId === gateway.destinationLocationId)).toBe(true); }); });
});
