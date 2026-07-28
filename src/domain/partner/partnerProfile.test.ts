import { describe, expect, it } from "vitest";
import { applyPartnerResult, codyPresetDialogues, codyPresetProfile, createPartnerConsultation, restorePartnerSnapshot, validatePartnerResult } from "./partnerProfile";

const setup = () => ({ schemaVersion: 1 as const, requestId: "request", requestType: "partner_profile_setup" as const, profileId: "main_partner" as const, displayName: "相棒", traits: { ...codyPresetProfile.traits, curiosity: 50 }, preferredActionIds: ["rest"] as const, dislikedActionIds: ["cook"] as const, dialogues: ["rest", "cook", "garden", "craft", "join_user", "inspect_item"].map((actionId) => ({ actionId, text: `${actionId}の台詞` })) });

describe("partner profile", () => {
  it("provides the revision 1 Cody preset and fixed dialogues", () => {
    expect(codyPresetProfile.revision).toBe(1);
    expect(codyPresetProfile.traits.curiosity).toBe(82);
    expect(codyPresetDialogues).toHaveLength(12);
  });

  it("asks for one JSON code block and includes a complete setup shape", () => {
    const prompt = createPartnerConsultation(codyPresetProfile, codyPresetDialogues, "request", "now").prompt;
    expect(prompt.match(/```/g)).toHaveLength(2);
    expect(prompt).toContain("```json");
    expect(prompt).toContain("コードブロックの外には何も書かないでください");
    expect(prompt).toContain('"requestId": "request"');
    expect(prompt).toContain('"requestType": "partner_profile_setup"');
    expect(prompt).toContain('"initiative": 50');
    expect(prompt).toContain('"inspect_item"');
    expect(prompt.trim().endsWith("```")).toBe(true);
  });

  it("includes the current revision and complete update shape in the update prompt", () => {
    const profile = { ...codyPresetProfile, revision: 2, source: "manual_setup" as const };
    const prompt = createPartnerConsultation(profile, codyPresetDialogues, "update-request", "now").prompt;
    expect(prompt.match(/```/g)).toHaveLength(2);
    expect(prompt).toContain('"requestType": "partner_profile_update"');
    expect(prompt).toContain('"expectedRevision": 2');
    expect(prompt).toContain('"traitUpdates": {}');
    expect(prompt).toContain('"preferredActionIds": null');
    expect(prompt).toContain('"disableDialogueIds": []');
  });

  it("validates a complete setup and applies it as revision 2 without mutating the preset", () => {
    const pending = createPartnerConsultation(codyPresetProfile, codyPresetDialogues, "request", "now");
    const result = validatePartnerResult(setup() as never, pending, codyPresetProfile, codyPresetDialogues);
    const next = applyPartnerResult(codyPresetProfile, codyPresetDialogues, result, "later", () => `new-${Math.random()}`);
    expect(next.profile).toMatchObject({ revision: 2, displayName: "相棒", source: "manual_setup" });
    expect(next.dialogues.filter((line) => line.enabled)).toHaveLength(6);
    expect(codyPresetProfile.revision).toBe(1);
  });

  it("rejects missing traits, overlapping preferences, missing action lines and stale ids", () => {
    const pending = createPartnerConsultation(codyPresetProfile, codyPresetDialogues, "request", "now");
    const base = setup();
    expect(() => validatePartnerResult({ ...base, requestId: "old" } as never, pending, codyPresetProfile, codyPresetDialogues)).toThrow();
    expect(() => validatePartnerResult({ ...base, traits: { initiative: 1 } } as never, pending, codyPresetProfile, codyPresetDialogues)).toThrow();
    expect(() => validatePartnerResult({ ...base, dislikedActionIds: ["rest"] } as never, pending, codyPresetProfile, codyPresetDialogues)).toThrow();
    expect(() => validatePartnerResult({ ...base, dialogues: base.dialogues.slice(1) } as never, pending, codyPresetProfile, codyPresetDialogues)).toThrow();
  });

  it("restores history by creating a new revision", () => {
    const current = { ...codyPresetProfile, revision: 4 };
    const restored = restorePartnerSnapshot(current, { profile: codyPresetProfile, dialogues: codyPresetDialogues }, "now");
    expect(restored.profile).toMatchObject({ revision: 5, source: "history_restore" });
  });
});
