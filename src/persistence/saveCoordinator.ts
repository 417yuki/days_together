import type { AppState } from "../app/Store";
import type { SaveRepository } from "./persistenceTypes";
import { createSaveSnapshot, restoreAppState } from "./saveSnapshot";

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
}
