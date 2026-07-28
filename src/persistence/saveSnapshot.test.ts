import { describe, expect, it } from "vitest";
import { initialState } from "../app/Store";
import { codyPresetDialogues, codyPresetProfile } from "../domain/partner/partnerProfile";
import { createSaveSnapshot, restoreAppState } from "./saveSnapshot";
import { MAIN_SAVE_SLOT_ID, type StoredSaveData } from "./persistenceTypes";

const character = (characterId: string, mapId: string, locationId: string) => ({ saveSlotId: MAIN_SAVE_SLOT_ID, characterId, name: characterId === "user" ? "主人公" : "コーディ", marker: characterId === "user" ? "U" : "C", mapId, locationId });

describe("save snapshots", () => {
  it("extracts only the stable map and character fields", () => {
    const snapshot = createSaveSnapshot({ ...initialState, activeNavigation: "settings", developerPanelOpen: true, message: "temporary", movements: { user: { path: [], nextIndex: 1, destination: { mapId: "starter_garden", locationId: "garden" } } } });
    expect(snapshot).toEqual(expect.objectContaining({ viewedMapId: "starter_house_interior", recentPartnerActionIds: [], worldStartedOn: initialState.worldStartedOn, unknownSprout: initialState.unknownSprout, unknownSproutExtension: null, characters: initialState.characters, partnerProfile: initialState.partnerProfile, partnerDialogues: initialState.partnerDialogues }));
    expect(snapshot).not.toHaveProperty("movements"); expect(snapshot).not.toHaveProperty("message"); expect(snapshot).not.toHaveProperty("developerPanelOpen");
  });

  it("restores the viewed map and both valid character locations without transient state", () => {
    const saved: StoredSaveData = { worldState: { saveSlotId: "main", viewedMapId: "starter_garden" }, characters: [character("user", "starter_garden", "garden"), character("cody", "starter_garden", "shed")] };
    const state = restoreAppState({ ...initialState, developerPanelOpen: true, activeNavigation: "items", movements: { cody: { path: [], nextIndex: 0, destination: { mapId: "starter_garden", locationId: "shed" } } } }, saved);
    expect(state.viewedMapId).toBe("starter_garden"); expect(state.characters.map(({ locationId }) => locationId)).toEqual(["garden", "shed"]);
    expect(state.movements).toEqual({}); expect(state.developerPanelOpen).toBe(false); expect(state.activeNavigation).toBe("map");
  });

  it("falls back independently for invalid maps, locations, missing, duplicate, and unknown characters", () => {
    const saved: StoredSaveData = { worldState: { viewedMapId: "moon" }, characters: [
      character("user", "starter_garden", "missing"),
      character("cody", "starter_garden", "shed"),
      character("cody", "starter_garden", "garden"),
      character("stranger", "starter_garden", "garden")
    ] };
    const state = restoreAppState(initialState, saved);
    expect(state.viewedMapId).toBe(initialState.viewedMapId);
    expect(state.characters).toEqual(initialState.characters);
  });

  it("uses one valid character when the other is missing", () => {
    const state = restoreAppState(initialState, { worldState: {}, characters: [character("cody", "starter_garden", "garden")] });
    expect(state.characters[0]).toEqual(initialState.characters[0]);
    expect(state.characters[1]).toEqual(expect.objectContaining({ mapId: "starter_garden", locationId: "garden" }));
  });

  it("restores only five known recent actions and starts idle", () => {
    const state = restoreAppState(initialState, { worldState: { recentPartnerActionIds: ["cook", "unknown", "garden", "rest", "craft", "join_user", "inspect_item"] }, characters: [] });
    expect(state.partnerActivity).toEqual(expect.objectContaining({ enabled: true, phase: "idle", actionId: null, recentActionIds: ["cook", "garden", "rest", "craft", "join_user"] }));
  });

  it("restores dialogues from the current history revision instead of stale active rows", () => {
    const profile = { ...codyPresetProfile, revision: 2, source: "manual_setup" as const, displayName: "相棒", updatedAt: "2026-07-28T08:00:00.000Z" };
    const historyDialogues = codyPresetDialogues.map((line) => ({ ...line }));
    const staleDialogue = { ...codyPresetDialogues[0], dialogueId: "future-rest-line", text: "後の版で追加された台詞", sourceRevision: 3 };
    const state = restoreAppState(initialState, {
      worldState: {},
      characters: [],
      partnerProfiles: [{ saveSlotId: MAIN_SAVE_SLOT_ID, ...profile }],
      partnerProfileHistory: [{ saveSlotId: MAIN_SAVE_SLOT_ID, profileId: "main_partner", revision: 2, profile, dialogues: historyDialogues }],
      dialogues: [...historyDialogues.map((line) => ({ saveSlotId: MAIN_SAVE_SLOT_ID, ...line })), { saveSlotId: MAIN_SAVE_SLOT_ID, ...staleDialogue }]
    });
    expect(state.partnerProfile.revision).toBe(2);
    expect(state.partnerDialogues).toHaveLength(historyDialogues.length);
    expect(state.partnerDialogues.some(({ dialogueId }) => dialogueId === staleDialogue.dialogueId)).toBe(false);
  });
});