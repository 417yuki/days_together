import type { Store } from "./Store";
import { ACTION_DEFINITIONS, chooseLine, chooseWeightedAction, createActionCandidates, scoreCandidates, type RandomSource } from "../domain/partner/partnerActions";
import type { LocationRef } from "../domain/maps/mapTypes";
import { starterMaps } from "../data/starterMaps";

export const PARTNER_DECISION_DELAY_MS = 1200;
type TimerApi = { setTimeout: (callback: () => void, delay: number) => number; clearTimeout: (id: number) => void };

export class PartnerActivityController {
  private decisionTimer?: number; private actionTimer?: number; private sequence = 0; private previousLineId: string | null = null;
  constructor(private store: Store, private move: (destination: LocationRef, done: (arrived: boolean) => void) => void, private random: RandomSource = Math.random, private timers: TimerApi = window) {}
  start(): void { document.addEventListener("visibilitychange", this.visibility); this.schedule(); }
  destroy(): void { document.removeEventListener("visibilitychange", this.visibility); this.clearTimers(); }
  pause(): void { this.clearTimers(); this.store.stopCharacterMovement("cody"); const current = this.store.getState().partnerActivity; this.store.setPartnerActivity({ ...current, enabled: false, phase: "idle", actionId: null, destination: null, lineId: null }, "コーディの自律行動を一時停止しました。"); }
  resume(): void { const current = this.store.getState().partnerActivity; this.store.setPartnerActivity({ ...current, enabled: true, phase: "idle", actionId: null, destination: null, lineId: null }, "コーディの自律行動を再開しました。"); this.schedule(); }
  reset(): void { this.clearTimers(); this.previousLineId = null; this.sequence = 0; this.schedule(); }
  decideNow(): void { this.clearDecision(); this.decide(); }
  private visibility = (): void => { if (!document.hidden && this.store.getState().partnerActivity.enabled && this.store.getState().partnerActivity.phase === "idle") this.schedule(); };
  private schedule(): void { const activity = this.store.getState().partnerActivity; if (this.decisionTimer !== undefined || !activity.enabled || activity.phase !== "idle" || document.hidden) return; this.decisionTimer = this.timers.setTimeout(() => { this.decisionTimer = undefined; this.decide(); }, PARTNER_DECISION_DELAY_MS); }
  private decide(): void {
    const state = this.store.getState(); if (!state.partnerActivity.enabled || state.partnerActivity.phase !== "idle" || document.hidden) return;
    const cody = state.characters.find(({ characterId }) => characterId === "cody"); const user = state.characters.find(({ characterId }) => characterId === "user"); if (!cody || !user) return;
    const scores = scoreCandidates(createActionCandidates(cody, user), state.partnerActivity.recentActionIds, this.random); const decision = chooseWeightedAction(scores, this.random, ++this.sequence);
    if (!decision) { this.store.setPartnerActivity({ ...state.partnerActivity, lastDecision: null }, "自律行動の行き先が見つかりませんでした。"); this.schedule(); return; }
    const next = { ...state.partnerActivity, phase: "moving" as const, actionId: decision.selectedActionId, destination: decision.selectedDestination, lineId: null, lastDecision: decision };
    this.store.setPartnerActivity(next, `コーディが${this.locationLabel(decision.selectedDestination)}へ移動を始めました。`);
    if (cody.mapId === decision.selectedDestination.mapId && cody.locationId === decision.selectedDestination.locationId) this.beginActing();
    else this.move(decision.selectedDestination, (arrived) => arrived ? this.beginActing() : this.abortMovement());
  }
  private beginActing(): void {
    const state = this.store.getState(); const activity = state.partnerActivity; if (!activity.enabled || !activity.actionId || !activity.destination) return;
    const lineId = chooseLine(activity.actionId, this.previousLineId, this.random); this.previousLineId = lineId;
    this.store.setPartnerActivity({ ...activity, phase: "acting", lineId }, `コーディが${this.locationLabel(activity.destination)}で${ACTION_DEFINITIONS[activity.actionId].startedText}。`);
    this.actionTimer = this.timers.setTimeout(() => { this.actionTimer = undefined; this.complete(); }, ACTION_DEFINITIONS[activity.actionId].durationMs);
  }
  private complete(): void { const activity = this.store.getState().partnerActivity; if (!activity.actionId) return; const recentActionIds = [activity.actionId, ...activity.recentActionIds].slice(0, 5); this.store.setPartnerActivity({ ...activity, phase: "idle", actionId: null, destination: null, lineId: null, recentActionIds }, "コーディが行動を終えました。"); this.schedule(); }
  private abortMovement(): void { const activity = this.store.getState().partnerActivity; this.store.setPartnerActivity({ ...activity, phase: "idle", actionId: null, destination: null, lineId: null }, "コーディは移動を安全に中止しました。"); this.schedule(); }
  private clearDecision(): void { if (this.decisionTimer !== undefined) this.timers.clearTimeout(this.decisionTimer); this.decisionTimer = undefined; }
  private clearTimers(): void { this.clearDecision(); if (this.actionTimer !== undefined) this.timers.clearTimeout(this.actionTimer); this.actionTimer = undefined; }
  private locationLabel(destination: LocationRef): string { return starterMaps.find(({ mapId }) => mapId === destination.mapId)?.locations.find(({ locationId }) => locationId === destination.locationId)?.label ?? destination.locationId; }
}