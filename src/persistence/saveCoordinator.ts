import type { AppState } from "../app/Store";
import type { SaveRepository } from "./persistenceTypes";
import { createSaveSnapshot, restoreAppState } from "./saveSnapshot";
import type { AppliedUnknownSproutExtension, ConsultationCheckpoint, PendingConsultation } from "../domain/consultation/unknownSproutConsultation";
import type { PartnerProfileSnapshot, PendingPartnerConsultation } from "../domain/partner/partnerProfile";
import type { CharacterPinAsset } from "../domain/assets/characterPins";
import type { CharacterId } from "../domain/characters/characterTypes";
import type { CharacterPinVisual } from "../domain/characters/characterPinVisual";
import type { ItemImageAsset } from "../domain/assets/itemImages";
import type { MapBackgroundAsset, MapBackgroundId } from "../domain/assets/mapBackgrounds";

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
  saveItems(state: AppState): Promise<void> { return this.exclusive(() => this.repository.saveMain(createSaveSnapshot(state))); }
  getItemImage(assetId: string): Promise<ItemImageAsset | null> { if (!this.repository.getItemImage) return Promise.resolve(null); return this.repository.getItemImage(assetId); }
  putItemImage(itemId: string, asset: ItemImageAsset) { return this.exclusive(async () => { if (!this.repository.putItemImage) throw new Error("画像を保存できません"); return this.repository.putItemImage(itemId, asset); }); }
  deleteItemImage(itemId: string) { return this.exclusive(async () => { if (!this.repository.deleteItemImage) throw new Error("画像を削除できません"); return this.repository.deleteItemImage(itemId); }); }
  getCharacterPin(assetId: string, characterId: CharacterId) { return this.repository.getCharacterPin?.(assetId, characterId) ?? Promise.resolve(null); }
  putCharacterPin(characterId: CharacterId, asset: CharacterPinAsset) { return this.exclusive(async () => { if (!this.repository.putCharacterPin) throw new Error("人物画像を保存できません"); return this.repository.putCharacterPin(characterId, asset); }); }
  deleteCharacterPin(characterId: CharacterId) { return this.exclusive(async () => { if (!this.repository.deleteCharacterPin) throw new Error("人物画像を削除できません"); return this.repository.deleteCharacterPin(characterId); }); }
  putCharacterPinVisual(characterId: CharacterId, visual: CharacterPinVisual) { return this.exclusive(async () => { if (!this.repository.putCharacterPinVisual) throw new Error("表示設定を保存できません"); return this.repository.putCharacterPinVisual(characterId, visual); }); }
  getMapBackground(assetId: string, mapId: MapBackgroundId) { return this.repository.getMapBackground?.(assetId, mapId) ?? Promise.resolve(null); }
  putMapBackground(mapId: MapBackgroundId, asset: MapBackgroundAsset) { return this.exclusive(async () => { if (!this.repository.putMapBackground) throw new Error("背景を保存できません"); return this.repository.putMapBackground(mapId, asset); }); }
  deleteMapBackground(mapId: MapBackgroundId) { return this.exclusive(async () => { if (!this.repository.deleteMapBackground) throw new Error("背景を削除できません"); return this.repository.deleteMapBackground(mapId); }); }
  putLocationLayout(mapId: MapBackgroundId, layout: import("../domain/maps/locationLayout").LocationLayout) { return this.exclusive(async () => { if (!this.repository.putLocationLayout) throw new Error("地点配置を保存できません"); return this.repository.putLocationLayout(mapId, layout); }); }
  private exclusive<T>(task: () => Promise<T>): Promise<T> { const result = this.queue.then(task); this.queue = result.then(() => undefined).catch((error) => { console.error("排他データの保存に失敗しました", error); }); return result; }
}
