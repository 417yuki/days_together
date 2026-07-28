import { describe, expect, it } from "vitest";
import { initialState, Store } from "./Store";
describe("Store", () => {
  it("starts indoors with both character locations in state", () => {
    const state = new Store().getState();
    expect(state.viewedMapId).toBe("starter_house_interior");
    expect(state.characters).toEqual([
      expect.objectContaining({ characterId: "user", mapId: "starter_house_interior", locationId: "table" }),
      expect.objectContaining({ characterId: "cody", mapId: "starter_house_interior", locationId: "workbench" })
    ]);
  });
  it("switches to the garden and back indoors", () => { const store = new Store(); store.setViewedMap("starter_garden"); expect(store.getState().viewedMapId).toBe("starter_garden"); store.setViewedMap("starter_house_interior"); expect(store.getState().viewedMapId).toBe("starter_house_interior"); });
  it("changes navigation", () => { const store = new Store(); store.setNavigation("items"); expect(store.getState().activeNavigation).toBe("items"); });
  it("resets all state", () => { const store = new Store(); store.setViewedMap("starter_garden"); store.setNavigation("settings"); store.toggleDeveloperPanel(true); store.reset(); expect(store.getState()).toEqual(initialState); });
  it("uses the same movement operations for the user and Cody", () => { const store = new Store(); expect(store.beginMovement("user", { mapId: "starter_garden", locationId: "garden" })).toBe("started"); expect(store.beginMovement("cody", { mapId: "starter_garden", locationId: "shed" })).toBe("started"); expect(store.getState().movements).toHaveProperty("user"); expect(store.getState().movements).toHaveProperty("cody"); });
  it("blocks invalid, same-location, and overlapping movement", () => { const store = new Store(); expect(store.beginMovement("user", { mapId: "starter_house_interior", locationId: "missing" })).toBe("invalid"); expect(store.beginMovement("user", { mapId: "starter_house_interior", locationId: "table" })).toBe("same"); expect(store.beginMovement("user", { mapId: "starter_garden", locationId: "garden" })).toBe("started"); expect(store.beginMovement("user", { mapId: "starter_house_interior", locationId: "kitchen" })).toBe("busy"); });
  it("updates proxy eligibility after crossing maps and resets movement", () => { const store = new Store(); store.beginMovement("user", { mapId: "starter_garden", locationId: "garden" }); store.advanceCharacter("user"); store.advanceCharacter("user"); expect(store.getState().characters[0].mapId).toBe("starter_garden"); store.reset(); expect(store.getState()).toEqual(initialState); });
});
