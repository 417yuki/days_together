import { describe, expect, it } from "vitest";
import { createPendingConsultation, extractJsonObject, MAX_RESPONSE_LENGTH, validateUnknownSproutResult } from "./unknownSproutConsultation";
import type { UnknownSproutState } from "../events/unknownSprout";

const event: UnknownSproutState = { eventId: "unknown_sprout", status: "completed", stage: "flower", path: "tended", choiceHistory: ["observe", "tend", "finish"] };
const pending = createPendingConsultation("tended", "request-1", "2026-07-28T00:00:00.000Z");
const valid = { schemaVersion: 1, requestId: "request-1", requestType: "unknown_sprout_reflection", eventId: "unknown_sprout", expectedStage: "flower", expectedPath: "tended", flowerName: null, partnerLine: "この花、いいね。", note: "淡い黄色の小さな花。" };

describe("unknown sprout consultation", () => {
  it("builds a path-specific prompt with identifiers and constraints", () => { expect(pending.prompt).toContain("requestId: request-1"); expect(pending.prompt).toContain("eventId: unknown_sprout"); expect(pending.prompt).toContain("stage: flower"); expect(pending.prompt).toContain("path: tended"); expect(pending.prompt).toContain("淡い黄色"); expect(pending.prompt).not.toContain("そっと見守って咲いた白"); });
  it("extracts one object from code blocks and prose without breaking braces in strings", () => { expect(extractJsonObject(`返答です。\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``)).toEqual(valid); expect(extractJsonObject(`こちら ${JSON.stringify({ ...valid, partnerLine: "波括弧 {も} 平気" })} 以上`).partnerLine).toContain("{"); });
  it("rejects missing, multiple, array, and oversized candidates", () => { expect(() => extractJsonObject("ありません")).toThrow(); expect(() => extractJsonObject("{} と {}" )).toThrow("複数"); expect(() => extractJsonObject("[1,2]" )).toThrow(); expect(() => extractJsonObject("x".repeat(MAX_RESPONSE_LENGTH + 1))).toThrow("30,000"); });
  it("validates and trims an exact result", () => { expect(validateUnknownSproutResult({ ...valid, partnerLine: "  ひとこと  " }, pending, event, null).partnerLine).toBe("ひとこと"); });
  it("rejects stale ids, paths, keys, types, changed state, and applied flowers", () => { expect(() => validateUnknownSproutResult({ ...valid, requestId: "old" }, pending, event, null)).toThrow(); expect(() => validateUnknownSproutResult({ ...valid, expectedPath: "watched" }, pending, event, null)).toThrow(); expect(() => validateUnknownSproutResult({ ...valid, extra: true }, pending, event, null)).toThrow(); expect(() => validateUnknownSproutResult({ ...valid, partnerLine: 3 }, pending, event, null)).toThrow(); expect(() => validateUnknownSproutResult(valid, pending, { eventId: "unknown_sprout", status: "active", stage: "growing", path: "tended", choiceHistory: ["observe", "tend"] }, null)).toThrow(); expect(() => validateUnknownSproutResult(valid, pending, event, { requestId: "x", flowerName: null, partnerLine: "x", note: "x", appliedAt: "now" })).toThrow(); });
});
