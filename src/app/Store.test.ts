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
});
