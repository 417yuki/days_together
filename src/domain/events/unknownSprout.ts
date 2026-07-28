export type EventId = "unknown_sprout";
export type UnknownSproutPath = "tended" | "watched";
export type UnknownSproutChoiceId = "observe" | "tend" | "watch" | "finish";
export type UnknownSproutState =
  | { eventId: EventId; status: "locked"; stage: "hidden"; path: null; choiceHistory: [] }
  | { eventId: EventId; status: "available"; stage: "sprout"; path: null; choiceHistory: [] }
  | { eventId: EventId; status: "active"; stage: "observed"; path: null; choiceHistory: ["observe"] }
  | { eventId: EventId; status: "active"; stage: "growing"; path: UnknownSproutPath; choiceHistory: ["observe", "tend" | "watch"] }
  | { eventId: EventId; status: "completed"; stage: "flower"; path: UnknownSproutPath; choiceHistory: ["observe", "tend" | "watch", "finish"] };

export const unknownSproutDefinition = { eventId: "unknown_sprout" as const, title: "知らない芽", mapId: "starter_garden" as const, position: { x: .78, y: .64 } };
export const initialUnknownSprout = (): UnknownSproutState => ({ eventId: "unknown_sprout", status: "locked", stage: "hidden", path: null, choiceHistory: [] });
export const makeUnknownSproutAvailable = (): UnknownSproutState => ({ eventId: "unknown_sprout", status: "available", stage: "sprout", path: null, choiceHistory: [] });

export const localDate = (now: Date): string => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
export const normalizeLocalDate = (value: unknown, now: Date): string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && localDate(new Date(`${value}T12:00:00`)) === value ? value : localDate(now);
export const releaseUnknownSprout = (state: UnknownSproutState, worldStartedOn: string, now: Date): UnknownSproutState => state.status === "locked" && localDate(now) > normalizeLocalDate(worldStartedOn, now) ? makeUnknownSproutAvailable() : state;

export const advanceUnknownSprout = (current: UnknownSproutState, choice: UnknownSproutChoiceId): UnknownSproutState | null => {
  if (current.status === "available" && choice === "observe") return { eventId: "unknown_sprout", status: "active", stage: "observed", path: null, choiceHistory: ["observe"] };
  if (current.status === "active" && current.stage === "observed" && (choice === "tend" || choice === "watch")) return { eventId: "unknown_sprout", status: "active", stage: "growing", path: choice === "tend" ? "tended" : "watched", choiceHistory: ["observe", choice] };
  if (current.status === "active" && current.stage === "growing" && choice === "finish") return { eventId: "unknown_sprout", status: "completed", stage: "flower", path: current.path, choiceHistory: [...current.choiceHistory, "finish"] };
  return null;
};

export const parseUnknownSprout = (value: unknown): UnknownSproutState | null => {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>; if (v.eventId !== "unknown_sprout" || !Array.isArray(v.choiceHistory)) return null;
  const history = v.choiceHistory;
  if (v.status === "locked" && v.stage === "hidden" && v.path === null && history.length === 0) return initialUnknownSprout();
  if (v.status === "available" && v.stage === "sprout" && v.path === null && history.length === 0) return makeUnknownSproutAvailable();
  if (v.status === "active" && v.stage === "observed" && v.path === null && history.length === 1 && history[0] === "observe") return { eventId: "unknown_sprout", status: "active", stage: "observed", path: null, choiceHistory: ["observe"] };
  if (v.status === "active" && v.stage === "growing" && (v.path === "tended" || v.path === "watched") && history.length === 2 && history[0] === "observe" && history[1] === (v.path === "tended" ? "tend" : "watch")) return { eventId: "unknown_sprout", status: "active", stage: "growing", path: v.path, choiceHistory: ["observe", history[1]] };
  if (v.status === "completed" && v.stage === "flower" && (v.path === "tended" || v.path === "watched") && history.length === 3 && history[0] === "observe" && history[1] === (v.path === "tended" ? "tend" : "watch") && history[2] === "finish") return { eventId: "unknown_sprout", status: "completed", stage: "flower", path: v.path, choiceHistory: ["observe", history[1], "finish"] };
  return null;
};
