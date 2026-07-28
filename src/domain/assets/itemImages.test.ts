import { describe, expect, it } from "vitest";
import { MAX_ITEM_IMAGE_BYTES, parseAssetMetadata, validateItemImage, validateOriginalName } from "./itemImages";

const file = (bytes: number[], type: string, name = "image.bin") => new File([new Uint8Array(bytes)], name, { type });

describe("item image validation", () => {
  it.each([
    ["image/png", [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]],
    ["image/jpeg", [0xff,0xd8,0xff,0xe0]],
    ["image/webp", [0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]]
  ])("accepts %s with its signature", async (type, bytes) => expect(validateItemImage(file(bytes as number[], type))).resolves.toBe(type));
  it("rejects mismatched, unsupported, and empty files", async () => {
    await expect(validateItemImage(file([0xff,0xd8,0xff], "image/png"))).rejects.toThrow("一致");
    await expect(validateItemImage(file([0x47,0x49,0x46], "image/gif"))).rejects.toThrow("PNG");
    await expect(validateItemImage(file([], "image/png"))).rejects.toThrow("空");
  });
  it("rejects oversized files before reading their contents", async () => {
    const oversized = { name: "big.png", type: "image/png", size: MAX_ITEM_IMAGE_BYTES + 1, slice: () => { throw new Error("must not read"); } } as unknown as File;
    await expect(validateItemImage(oversized)).rejects.toThrow("10 MiB");
  });
  it("validates display names and metadata identifiers", () => {
    expect(() => validateOriginalName("bad\u0000.png")).toThrow("制御文字");
    expect(() => validateOriginalName(`${"a".repeat(121)}.png`)).toThrow("120");
    expect(parseAssetMetadata({ assetId: "asset-1", kind: "item_image", ownerId: "item-1", mimeType: "image/png", byteSize: 8, originalName: "safe.png", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" })?.assetId).toBe("asset-1");
    expect(parseAssetMetadata({ assetId: "bad\u0000", kind: "item_image" })).toBeNull();
  });
});
