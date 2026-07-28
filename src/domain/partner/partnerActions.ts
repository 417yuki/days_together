import { starterMaps } from "../../data/starterMaps";
import { buildLocationGraph, findShortestPath } from "../movement/movement";
import type { LocationRef } from "../maps/mapTypes";
import type { PartnerDialogueLine, PartnerGameProfile } from "./partnerProfile";

export type ActionId = "rest" | "cook" | "garden" | "craft" | "join_user" | "inspect_item";
export type ActionDefinition = { actionId: ActionId; label: string; ongoingText: string; startedText: string; baseScore: number; durationMs: number; lineIds: string[] };
export type ActionCandidate = { actionId: ActionId; destination: LocationRef };
export type ActionScoreBreakdown = ActionCandidate & { base: number; personality: number; preference: number; repetition: number; randomJitter: number; total: number; weight: number };
export type ActionDecisionDebug = { candidates: ActionScoreBreakdown[]; selectedActionId: ActionId; selectedDestination: LocationRef; sequence: number };
export type RandomSource = () => number;

export const ACTION_DEFINITIONS: Record<ActionId, ActionDefinition> = {
  rest: { actionId: "rest", label: "休憩する", ongoingText: "休憩しています", startedText: "休憩を始めました", baseScore: 32, durationMs: 12000, lineIds: ["rest-1", "rest-2"] },
  cook: { actionId: "cook", label: "料理する", ongoingText: "料理をしています", startedText: "料理を始めました", baseScore: 30, durationMs: 14000, lineIds: ["cook-1", "cook-2"] },
  garden: { actionId: "garden", label: "庭仕事をする", ongoingText: "庭仕事をしています", startedText: "庭仕事を始めました", baseScore: 30, durationMs: 16000, lineIds: ["garden-1", "garden-2"] },
  craft: { actionId: "craft", label: "工作する", ongoingText: "工作をしています", startedText: "工作を始めました", baseScore: 30, durationMs: 15000, lineIds: ["craft-1", "craft-2"] },
  join_user: { actionId: "join_user", label: "主人公のそばで過ごす", ongoingText: "主人公のそばで過ごしています", startedText: "主人公のそばで過ごし始めました", baseScore: 36, durationMs: 10000, lineIds: ["join-1", "join-2"] },
  inspect_item: { actionId: "inspect_item", label: "周囲を調べる", ongoingText: "周囲を調べています", startedText: "周囲を調べ始めました", baseScore: 28, durationMs: 9000, lineIds: ["inspect-1", "inspect-2"] }
};
export const ACTION_LINES: Record<string, string> = {
  "rest-1": "少しひと休みしようかな。", "rest-2": "ここで息を整えておくよ。",
  "cook-1": "何か簡単なものを作っておこう。", "cook-2": "台所を借りるね。いい匂いにできるかな。",
  "garden-1": "葉の様子を見てくるよ。", "garden-2": "昨日と少し違う気がするんだ。",
  "craft-1": "この辺り、少し手を入れられそうだ。", "craft-2": "道具の調子を見ておこう。",
  "join-1": "ちょっとそばにいてもいい？", "join-2": "同じところで過ごそうかな。",
  "inspect-1": "気になるものがあるんだ。少し見てみるよ。", "inspect-2": "この辺り、何か変わっていないかな。"
};
export const codyPersonality = { initiative: 72, curiosity: 82, sociability: 58, caretaking: 78, affection: 64, tidiness: 70, patience: 76, moodVolatility: 30, solitudePreference: 47, userPriority: 80, adventurousness: 56, caution: 62 } as const;
export const preferredActionIds: ActionId[] = ["cook", "garden", "craft", "inspect_item"];
export const dislikedActionIds: ActionId[] = [];
export const actionIds = Object.keys(ACTION_DEFINITIONS) as ActionId[];

const fixedDestinations: Partial<Record<ActionId, LocationRef>> = {
  rest: { mapId: "starter_house_interior", locationId: "sofa" }, cook: { mapId: "starter_house_interior", locationId: "kitchen" },
  garden: { mapId: "starter_garden", locationId: "garden" }, craft: { mapId: "starter_house_interior", locationId: "workbench" }
};
const inspectDestinations: LocationRef[] = [{ mapId: "starter_house_interior", locationId: "workbench" }, { mapId: "starter_garden", locationId: "shed" }, { mapId: "starter_house_interior", locationId: "table" }];
const same = (a: LocationRef, b: LocationRef): boolean => a.mapId === b.mapId && a.locationId === b.locationId;
export const createActionCandidates = (cody: LocationRef, user: LocationRef): ActionCandidate[] => {
  const graph = buildLocationGraph(starterMaps);
  const reachable = (destination: LocationRef) => same(cody, destination) || Boolean(findShortestPath(graph, cody, destination));
  const inspect = inspectDestinations.map((destination, order) => ({ destination, order, path: same(cody, destination) ? [cody] : findShortestPath(graph, cody, destination) })).filter(({ path }) => path).sort((a, b) => a.path!.length - b.path!.length || a.order - b.order)[0]?.destination;
  return actionIds.flatMap((actionId) => {
    const destination = actionId === "join_user" ? { ...user } : actionId === "inspect_item" ? inspect : fixedDestinations[actionId];
    return destination && reachable(destination) ? [{ actionId, destination }] : [];
  });
};
const traits: Record<ActionId, Array<keyof typeof codyPersonality>> = { rest: ["patience", "solitudePreference"], cook: ["caretaking", "tidiness"], garden: ["curiosity", "patience"], craft: ["initiative", "curiosity", "tidiness"], join_user: ["sociability", "affection", "userPriority"], inspect_item: ["curiosity", "caution"] };
const penalties = [-32, -18, -10, -5, -2];
export const scoreCandidates = (candidates: ActionCandidate[], recent: ActionId[], random: RandomSource, profile: PartnerGameProfile = { traits: codyPersonality, preferredActionIds, dislikedActionIds } as PartnerGameProfile): ActionScoreBreakdown[] => {
  const blocked = recent[0] === recent[1] && candidates.some(({ actionId }) => actionId !== recent[0]) ? recent[0] : undefined;
  return candidates.filter(({ actionId }) => actionId !== blocked).map((candidate) => {
    const definition = ACTION_DEFINITIONS[candidate.actionId]; const values = traits[candidate.actionId].map((key) => profile.traits[key]);
    let personality = Math.max(-10, Math.min(10, (values.reduce((sum, value) => sum + value, 0) / values.length - 50) / 5));
    if (candidate.actionId === "join_user") personality *= .75;
    personality = Math.round(personality * 10) / 10;
    const preference = profile.preferredActionIds.includes(candidate.actionId) ? 20 : profile.dislikedActionIds.includes(candidate.actionId) ? -20 : 0;
    const repetition = recent.slice(0, 5).reduce((sum, id, index) => sum + (id === candidate.actionId ? penalties[index] : 0), 0);
    const randomJitter = Math.round((random() * 4 - 2) * 10) / 10;
    const total = Math.round((definition.baseScore + personality + preference + repetition + randomJitter) * 10) / 10;
    return { ...candidate, base: definition.baseScore, personality, preference, repetition, randomJitter, total, weight: Math.max(1, Math.round(total)) };
  });
};
export const chooseWeightedAction = (scores: ActionScoreBreakdown[], random: RandomSource, sequence = 1): ActionDecisionDebug | null => {
  if (!scores.length) return null; const total = scores.reduce((sum, score) => sum + score.weight, 0); let cursor = random() * total;
  const selected = scores.find((score) => (cursor -= score.weight) < 0) ?? scores[scores.length - 1];
  return { candidates: scores, selectedActionId: selected.actionId, selectedDestination: { ...selected.destination }, sequence };
};
export const chooseLine = (actionId: ActionId, previousLineId: string | null, random: RandomSource): string => {
  const options = ACTION_DEFINITIONS[actionId].lineIds.filter((id) => id !== previousLineId); return options[Math.floor(random() * options.length)] ?? ACTION_DEFINITIONS[actionId].lineIds[0];
};
export const chooseDialogue = (actionId: ActionId, dialogues: PartnerDialogueLine[], fallback: PartnerDialogueLine[], previousLineId: string | null, random: RandomSource): PartnerDialogueLine => { const custom = dialogues.filter((line) => line.actionId === actionId && line.enabled); const pool = custom.length ? custom : fallback.filter((line) => line.actionId === actionId && line.enabled); const options = pool.filter((line) => line.dialogueId !== previousLineId); return options[Math.floor(random() * options.length)] ?? pool[0]; };
