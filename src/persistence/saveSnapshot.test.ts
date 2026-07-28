import { describe, expect, it } from "vitest";
import { initialState } from "../app/Store";
import { createSaveSnapshot, restoreAppState } from "./saveSnapshot";
import { MAIN_SAVE_SLOT_ID, type StoredSaveData } from "./persistenceTypes";

const character = (characterId: string, mapId: string, locationId: string) => ({ saveSlotId: MAIN_SAVE_SLOT_ID, characterId, name: characterId === "user" ? "主人公" : "コーディ", marker: characterId === "user" ? "U" : "C", mapId, locationId });

describe("save snapshots", () => {
  it("extracts only the stable map and character fields", () => {
    const snapshot = createSaveSnapshot({ ...initialState, activeNavigation: "settings", developerPanelOpen: true, message: "temporary", movements: { user: { path: [], nextIndex: 1, destination: { mapId: "starter_garden", locationId: "garden" } } } });
    expect(snapshot).toEqual({ viewedMapId: "starter_house_interior", characters: initialState.characters });
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
});
