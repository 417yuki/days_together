import { describe, expect, it } from "vitest";
import { customMapFinishBlockedReason, type CustomMapFinishAvailability } from "./customMapEditorState";

const ready = (overrides: Partial<CustomMapFinishAvailability> = {}): CustomMapFinishAvailability => ({
  hasInteriorDraft: true,
  hasGardenDraft: true,
  hasInteriorLocations: true,
  hasGardenLocations: true,
  draftBusy: false,
  draftEditorActive: false,
  normalMapEditorActive: false,
  ...overrides
});

describe("custom map finish availability", () => {
  it("explains missing drafts before other blockers", () => {
    expect(customMapFinishBlockedReason(ready({ hasGardenDraft: false, normalMapEditorActive: true }))).toBe("室内と庭の下書きを両方作ってください。");
  });

  it("explains that both location sets must be saved", () => {
    expect(customMapFinishBlockedReason(ready({ hasInteriorLocations: false }))).toBe("室内と庭の両方で地点設定を保存してください。");
  });

  it("explains open editors instead of silently disabling the button", () => {
    expect(customMapFinishBlockedReason(ready({ draftEditorActive: true }))).toContain("下書き名または地点");
    expect(customMapFinishBlockedReason(ready({ normalMapEditorActive: true }))).toContain("背景・通常地点・出入口・アイテム配置");
  });

  it("returns null when the finish editor can open", () => {
    expect(customMapFinishBlockedReason(ready())).toBeNull();
  });
});
