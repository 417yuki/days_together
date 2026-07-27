import { describe, expect, it } from "vitest";
import { Store } from "./Store";
describe("Store", () => {
  it("starts indoors", () => expect(new Store().getState().viewedMapId).toBe("starter_house_interior"));
  it("switches to the garden and back indoors", () => { const store = new Store(); store.setViewedMap("starter_garden"); expect(store.getState().viewedMapId).toBe("starter_garden"); store.setViewedMap("starter_house_interior"); expect(store.getState().viewedMapId).toBe("starter_house_interior"); });
  it("changes navigation", () => { const store = new Store(); store.setNavigation("items"); expect(store.getState().activeNavigation).toBe("items"); });
  it("resets all state", () => { const store = new Store(); store.setViewedMap("starter_garden"); store.setNavigation("settings"); store.toggleDeveloperPanel(true); store.reset(); expect(store.getState()).toEqual({ viewedMapId: "starter_house_interior", activeNavigation: "map", developerPanelOpen: false }); });
});
