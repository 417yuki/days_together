import { describe, expect, it } from "vitest";
import { initialState } from "../../app/Store";
import { getMapById, selectCharactersOnMap, selectProxyCharacters } from "./mapSelectors";

describe("map character selectors", () => {
  it("places characters at the location stored in their state", () => {
    const placements = selectCharactersOnMap(initialState.characters, getMapById("starter_house_interior"));
    expect(placements.map(({ character, location }) => [character.characterId, location.locationId])).toEqual([
      ["user", "table"],
      ["cody", "workbench"]
    ]);
  });

  it("does not place a character whose location is unknown", () => {
    const characters = [{ ...initialState.characters[0], locationId: "missing" }];
    expect(selectCharactersOnMap(characters, getMapById("starter_house_interior"))).toEqual([]);
  });

  it("proxies characters on another map at the connected gateway", () => {
    const placements = selectProxyCharacters(initialState.characters, getMapById("starter_garden"));
    expect(placements.map(({ character, location }) => [character.characterId, location.locationId])).toEqual([
      ["user", "front_of_house"],
      ["cody", "front_of_house"]
    ]);
  });

  it("does not proxy characters already on the viewed map", () => {
    expect(selectProxyCharacters(initialState.characters, getMapById("starter_house_interior"))).toEqual([]);
  });
});
