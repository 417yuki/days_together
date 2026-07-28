import { describe, expect, it } from "vitest";
import { parseMapBackgroundMetadata, parseMapVisual } from "./mapBackgrounds";

const metadata = { assetId: "asset-1", kind: "map_background", ownerId: "starter_house_interior", mimeType: "image/png", byteSize: 8, originalName: "room.png", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };
describe("map backgrounds", () => {
  it("accepts map_background only for its matching preset map owner", () => {
    expect(parseMapBackgroundMetadata(metadata, "starter_house_interior")?.assetId).toBe("asset-1");
    expect(parseMapBackgroundMetadata(metadata, "starter_garden")).toBeNull();
  });
  it("rejects unknown owners and another asset kind", () => {
    expect(parseMapBackgroundMetadata({ ...metadata, ownerId: "custom" })).toBeNull();
    expect(parseMapBackgroundMetadata({ ...metadata, kind: "character_pin" }, "starter_house_interior")).toBeNull();
  });
  it("partially recovers an unsafe background reference as null", () => {
    const visual = parseMapVisual({ saveSlotId: "main", mapId: "starter_garden", backgroundAssetId: "bad\u0000id", updatedAt: "2026-07-28T00:00:00.000Z" }, "starter_garden");
    expect(visual.backgroundAssetId).toBeNull();
    expect(visual.mapId).toBe("starter_garden");
  });
});
