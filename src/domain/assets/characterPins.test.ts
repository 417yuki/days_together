import { describe, expect, it } from "vitest";
import { parseCharacterPinMetadata } from "./characterPins";

const metadata = { assetId: "pin-1", kind: "character_pin", ownerId: "user", mimeType: "image/png", byteSize: 8, originalName: "user.png", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
describe("character pin metadata", () => {
  it("accepts a matching character_pin owner", () => expect(parseCharacterPinMetadata(metadata, "user")?.assetId).toBe("pin-1"));
  it("rejects item metadata and mismatched owners", () => { expect(parseCharacterPinMetadata({ ...metadata, kind: "item_image" }, "user")).toBeNull(); expect(parseCharacterPinMetadata(metadata, "cody")).toBeNull(); });
});
