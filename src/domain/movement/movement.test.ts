import { describe, expect, it } from "vitest";
import { starterMaps } from "../../data/starterMaps";
import { advanceMovement, buildLocationGraph, findShortestPath, locationKey, startMovement } from "./movement";
import type { CharacterState } from "../characters/characterTypes";

const graph = buildLocationGraph(starterMaps);
const ref = (mapId: "starter_house_interior" | "starter_garden", locationId: string) => ({ mapId, locationId });
const user: CharacterState = { characterId: "user", name: "主人公", marker: "U", ...ref("starter_house_interior", "table") };

describe("movement", () => {
  it("finds the shortest path on one map", () => {
    expect(findShortestPath(graph, ref("starter_house_interior", "kitchen"), ref("starter_house_interior", "entrance"))?.map(locationKey)).toEqual([
      "starter_house_interior:kitchen", "starter_house_interior:table", "starter_house_interior:entrance"
    ]);
  });
  it("routes from the interior to the garden through both gateways", () => {
    expect(findShortestPath(graph, ref("starter_house_interior", "table"), ref("starter_garden", "garden"))?.map(locationKey)).toEqual([
      "starter_house_interior:table", "starter_house_interior:entrance", "starter_garden:front_of_house", "starter_garden:garden"
    ]);
  });
  it("routes from the garden back indoors", () => {
    expect(findShortestPath(graph, ref("starter_garden", "garden"), ref("starter_house_interior", "table"))?.map(locationKey)).toEqual([
      "starter_garden:garden", "starter_garden:front_of_house", "starter_house_interior:entrance", "starter_house_interior:table"
    ]);
  });
  it("only returns paths whose consecutive locations are graph edges", () => {
    const path = findShortestPath(graph, ref("starter_house_interior", "workbench"), ref("starter_garden", "shed"))!;
    path.slice(0, -1).forEach((location, index) => expect(graph.get(locationKey(location))?.map(locationKey)).toContain(locationKey(path[index + 1])));
  });
  it("does not start for missing or current locations", () => {
    expect(startMovement(user, ref("starter_house_interior", "missing"), graph)).toBeNull();
    expect(startMovement(user, ref("starter_house_interior", "table"), graph)).toBeNull();
  });
  it("updates location at every step and clears completed movement", () => {
    let character = user; let movement = startMovement(character, ref("starter_garden", "garden"), graph)!;
    const visited: string[] = [];
    while (movement) { const result = advanceMovement(character, movement); character = result.character; movement = result.movement!; visited.push(locationKey(character)); }
    expect(visited).toEqual(["starter_house_interior:entrance", "starter_garden:front_of_house", "starter_garden:garden"]);
  });
  it("reports and ignores invalid connections", () => {
    const messages: string[] = []; const maps = structuredClone(starterMaps); maps[0].locations[0].connectedLocationIds.push("missing");
    const safeGraph = buildLocationGraph(maps, (message) => messages.push(message));
    expect(messages).toHaveLength(2); expect(safeGraph.has("starter_house_interior:missing")).toBe(false);
  });
});
