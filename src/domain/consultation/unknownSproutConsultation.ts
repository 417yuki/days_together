import type { UnknownSproutPath, UnknownSproutState } from "../events/unknownSprout";

export const MAX_RESPONSE_LENGTH = 20_000;
export type PendingConsultation = { requestId: string; requestType: "unknown_sprout_reflection"; eventId: "unknown_sprout"; expectedStage: "flower"; expectedPath: UnknownSproutPath; prompt: string; createdAt: string; status: "pending" };
export type UnknownSproutConsultationResult = { schemaVersion: 1; requestId: string; requestType: "unknown_sprout_reflection"; eventId: "unknown_sprout"; expectedStage: "flower"; expectedPath: UnknownSproutPath; flowerName: string | null; partnerLine: string; note: string };
export type AppliedUnknownSproutExtension = Pick<UnknownSproutConsultationResult, "requestId" | "flowerName" | "partnerLine" | "note"> & { appliedAt: string };
export type ConsultationCheckpoint = { checkpointId: string; requestId: string; eventId: "unknown_sprout"; createdAt: string; eventBefore: UnknownSproutState; extensionBefore: AppliedUnknownSproutExtension | null };

export const buildUnknownSproutPrompt = (request: Omit<PendingConsultation, "prompt" | "status">): string => {
  const color = request.expectedPath === "tended" ? "手入れして咲いた淡い黄色" : "そっと見守って咲いた白";
  return `『ふたり日和』のゲーム内イベント「知らない芽」について相談します。\n\neventId: unknown_sprout\nrequestId: ${request.requestId}\nstage: flower\npath: ${request.expectedPath}\nこの花は、${color}の小さな花です。花に名前を付けるかは任意です（付けない場合は flowerName を null）。あなた本人らしい短い一言と、花についての短い説明をください。\n\n現実の過去、未登録の人物、重大な危険を創作しないでください。新しいアイテム、場所、人物、次回イベントを作らないでください。短い自然文をJSONの前に添えても構いませんが、次の形式のJSONオブジェクトは一個だけ返してください。\n\n\`\`\`json\n{\n  "schemaVersion": 1,\n  "requestId": "${request.requestId}",\n  "requestType": "unknown_sprout_reflection",\n  "eventId": "unknown_sprout",\n  "expectedStage": "flower",\n  "expectedPath": "${request.expectedPath}",\n  "flowerName": null,\n  "partnerLine": "160文字以内の短い一言",\n  "note": "280文字以内の短い説明"\n}\n\`\`\``;
};

export const createPendingConsultation = (path: UnknownSproutPath, requestId: string, createdAt: string): PendingConsultation => {
  const base = { requestId, requestType: "unknown_sprout_reflection" as const, eventId: "unknown_sprout" as const, expectedStage: "flower" as const, expectedPath: path, createdAt };
  return { ...base, prompt: buildUnknownSproutPrompt(base), status: "pending" };
};

const balancedObjects = (text: string): string[] => {
  const found: string[] = []; let start = -1; let depth = 0; let quoted = false; let escaped = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index]; if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; continue; } if (char === '"') { quoted = true; continue; } if (char === "{") { if (depth === 0) start = index; depth += 1; } else if (char === "}" && depth > 0) { depth -= 1; if (depth === 0 && start >= 0) found.push(text.slice(start, index + 1)); } }
  return found;
};
const parseObjects = (texts: string[]): Record<string, unknown>[] => texts.flatMap(balancedObjects).flatMap((candidate) => { try { const value: unknown = JSON.parse(candidate); return value && typeof value === "object" && !Array.isArray(value) ? [value as Record<string, unknown>] : []; } catch { return []; } });
export const extractJsonObject = (input: string): Record<string, unknown> => {
  if (input.length > MAX_RESPONSE_LENGTH) throw new Error("返答は20,000文字以内にしてください。");
  const jsonBlocks = [...input.matchAll(/```json\s*([\s\S]*?)```/gi)].map((match) => match[1]);
  const normalBlocks = [...input.matchAll(/```(?!json\b)[^\n]*\n?([\s\S]*?)```/gi)].map((match) => match[1]);
  const candidates = parseObjects(jsonBlocks.length ? jsonBlocks : normalBlocks.length ? normalBlocks : [input]);
  if (candidates.length === 0) throw new Error("JSONオブジェクトを一つ見つけられませんでした。");
  if (candidates.length !== 1) throw new Error("JSONオブジェクトが複数あり、内容を特定できません。");
  return candidates[0];
};

const keys = ["schemaVersion", "requestId", "requestType", "eventId", "expectedStage", "expectedPath", "flowerName", "partnerLine", "note"].sort();
const clean = (value: unknown, label: string, max: number, nullable = false): string | null => { if (nullable && value === null) return null; if (typeof value !== "string") throw new Error(`${label}の型が正しくありません。`); const trimmed = value.trim(); if (!trimmed || trimmed.length > max || /[\u0000-\u001f\u007f]/.test(trimmed)) throw new Error(`${label}の長さまたは文字が正しくありません。`); return trimmed; };
export const validateUnknownSproutResult = (value: Record<string, unknown>, pending: PendingConsultation, event: UnknownSproutState, applied: AppliedUnknownSproutExtension | null): UnknownSproutConsultationResult => {
  if (Object.keys(value).sort().join("|") !== keys.join("|")) throw new Error("不足しているキー、または未知のキーがあります。");
  if (value.schemaVersion !== 1 || value.requestType !== "unknown_sprout_reflection" || value.eventId !== "unknown_sprout" || value.expectedStage !== "flower") throw new Error("返答形式または対象イベントが一致しません。");
  if (value.requestId !== pending.requestId) throw new Error("別の相談、または古い相談への返答です。");
  if (event.status !== "completed" || event.stage !== "flower" || value.expectedPath !== pending.expectedPath || value.expectedPath !== event.path || applied) throw new Error("現在の花の状態へ反映できない返答です。");
  const flowerName = clean(value.flowerName, "花の名前", 24, true); if (typeof flowerName === "string" && flowerName.includes("\n")) throw new Error("花の名前に改行は使えません。");
  return { schemaVersion: 1, requestId: pending.requestId, requestType: "unknown_sprout_reflection", eventId: "unknown_sprout", expectedStage: "flower", expectedPath: event.path, flowerName, partnerLine: clean(value.partnerLine, "パートナーの一言", 160)!, note: clean(value.note, "花の説明", 280)! };
};

export const parsePendingConsultation = (value: unknown): PendingConsultation | null => { if (!value || typeof value !== "object") return null; const v = value as Record<string, unknown>; return typeof v.requestId === "string" && v.requestType === "unknown_sprout_reflection" && v.eventId === "unknown_sprout" && v.expectedStage === "flower" && (v.expectedPath === "tended" || v.expectedPath === "watched") && typeof v.prompt === "string" && typeof v.createdAt === "string" && v.status === "pending" ? v as PendingConsultation : null; };
export const parseAppliedExtension = (value: unknown): AppliedUnknownSproutExtension | null => { if (!value || typeof value !== "object") return null; const v = value as Record<string, unknown>; try { return typeof v.requestId === "string" && typeof v.appliedAt === "string" ? { requestId: v.requestId, flowerName: clean(v.flowerName, "花の名前", 24, true), partnerLine: clean(v.partnerLine, "パートナーの一言", 160)!, note: clean(v.note, "花の説明", 280)!, appliedAt: v.appliedAt } : null; } catch { return null; } };
