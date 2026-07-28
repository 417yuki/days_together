import { describe, expect, it } from "vitest";
import { ACTION_DEFINITIONS, chooseLine, chooseWeightedAction, createActionCandidates, scoreCandidates } from "./partnerActions";

const cody = { mapId: "starter_house_interior" as const, locationId: "workbench" };
const user = { mapId: "starter_house_interior" as const, locationId: "table" };

describe("partner actions", () => {
  it("defines exactly the six milestone actions with their fixed destinations", () => {
    expect(Object.keys(ACTION_DEFINITIONS)).toEqual(["rest", "cook", "garden", "craft", "join_user", "inspect_item"]);
    const candidates = createActionCandidates(cody, user); const destinations = Object.fromEntries(candidates.map(({ actionId, destination }) => [actionId, destination.locationId]));
    expect(destinations).toEqual({ rest: "sofa", cook: "kitchen", garden: "garden", craft: "workbench", join_user: "table", inspect_item: "workbench" });
  });

  it("takes a snapshot of the user's location and keeps one inspect candidate", () => {
    const candidates = createActionCandidates(cody, user); const laterUser = { ...user, locationId: "kitchen" }; expect(laterUser.locationId).toBe("kitchen");
    expect(candidates.find(({ actionId }) => actionId === "join_user")?.destination.locationId).toBe("table");
    expect(candidates.filter(({ actionId }) => actionId === "inspect_item")).toHaveLength(1);
  });

  it("reports base, personality, preference, repetition, jitter, total and weight", () => {
    const [score] = scoreCandidates([{ actionId: "cook", destination: user }], ["cook", "rest", "cook"], () => .5);
    expect(score).toEqual(expect.objectContaining({ base: 30, personality: 4.8, preference: 20, repetition: -42, randomJitter: 0, total: 12.8, weight: 13 }));
  });

  it("prevents a third consecutive action when another candidate exists", () => {
    const scores = scoreCandidates(createActionCandidates(cody, user), ["cook", "cook"], () => .5);
    expect(scores.some(({ actionId }) => actionId === "cook")).toBe(false);
  });

  it("uses injected randomness for a deterministic weighted choice instead of always choosing the maximum", () => {
    const scores = scoreCandidates(createActionCandidates(cody, user), [], () => .5);
    const first = chooseWeightedAction(scores, () => 0); const last = chooseWeightedAction(scores, () => .999);
    expect(first?.selectedActionId).toBe(scores[0].actionId); expect(last?.selectedActionId).toBe(scores.at(-1)?.actionId);
  });

  it("does not repeat the same registered line consecutively", () => {
    const first = chooseLine("rest", null, () => 0); expect(chooseLine("rest", first, () => 0)).not.toBe(first);
  });
});
