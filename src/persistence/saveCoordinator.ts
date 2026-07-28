import type { AppState } from "../app/Store";
import type { SaveRepository } from "./persistenceTypes";
import { createSaveSnapshot, restoreAppState } from "./saveSnapshot";
import type { AppliedUnknownSproutExtension, ConsultationCheckpoint, PendingConsultation } from "../domain/consultation/unknownSproutConsultation";
import type { PartnerProfileSnapshot, PendingPartnerConsultation } from "../domain/partner/partnerProfile";

export type LoadResult = { state: AppState; available: boolean };

export const loadOrCreateMainSave = async (repository: SaveRepository, initial: AppState): Promise<LoadResult> => {
  try {
    const saved = await repository.loadMainSave();
    if (saved) return { state: restoreAppState(initial, saved), available: true };
    await repository.saveMain(createSaveSnapshot(initial));
    return { state: initial, available: true };
  } catch (error) {
    console.error("セーブの初期化に失敗しました", error);
    return { state: initial, available: false };
  }
};

export class SaveCoordinator {
  private queue = Promise.resolve();
  private lastQueued = "";
  constructor(private repository: SaveRepository, private onFailure: (error: unknown) => void) {}

  save(state: AppState, force = false): Promise<void> {
    const snapshot = createSaveSnapshot(state);
    const serialized = JSON.stringify(snapshot);
    if (!force && serialized === this.lastQueued) return this.queue;
    this.lastQueued = serialized;
    this.queue = this.queue.then(() => this.repository.saveMain(snapshot)).catch((error) => {
      console.error("セーブに失敗しました", error);
      this.onFailure(error);
    });
    return this.queue;
  }
  savePending(pending: PendingConsultation): Promise<void> { return this.exclusive(async () => { if (!this.repository.savePendingConsultation) throw new Error("相談を保存できません"); await this.repository.savePendingConsultation(pending); }); }
  apply(state: AppState, pending: PendingConsultation, extension: AppliedUnknownSproutExtension, checkpoint: ConsultationCheckpoint): Promise<void> { return this.exclusive(async () => { if (!this.repository.applyConsultation) throw new Error("相談を反映できません"); await this.repository.applyConsultation(createSaveSnapshot(state), pending, extension, checkpoint); }); }
  savePendingPartner(pending: PendingPartnerConsultation): Promise<void> { return this.exclusive(async () => { if (!this.repository.savePendingPartner) throw new Error("相談を保存できません"); await this.repository.savePendingPartner(pending); }); }
  discardPartner(pending: PendingPartnerConsultation): Promise<void> { return this.exclusive(async () => { if (!this.repository.discardPartnerConsultation) throw new Error("相談を破棄できません"); await this.repository.discardPartnerConsultation(pending); }); }
  applyPartner(state: AppState, pending: PendingPartnerConsultation | null, next: PartnerProfileSnapshot, checkpoint: { checkpointId: string; createdAt: string }): Promise<void> { return this.exclusive(async () => { if (!this.repository.applyPartner) throw new Error("パートナー設定を保存できません"); await this.repository.applyPartner(createSaveSnapshot(state), pending, next, checkpoint); }); }
  private exclusive(task: () => Promise<void>): Promise<void> { const result = this.queue.then(task); this.queue = result.catch((error) => { console.error("相談データの保存に失敗しました", error); }); return result; }
}
