import { describe, expect, it } from "vitest";
import { defaultCustomMapName, normalizeCustomMapName, parseCustomMapDraft, restoreCustomMapDrafts } from "./customMapDraft";

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
