import { DB_NAME, DB_VERSION, MAIN_SAVE_SLOT_ID, STORE_NAMES, type CharacterRecord, type SaveRepository, type SaveSnapshot, type StoredSaveData } from "./persistenceTypes";
import { codyPresetDialogues, codyPresetProfile, type PartnerDialogueLine } from "../domain/partner/partnerProfile";
import { parseAssetMetadata, validateItemImage, type ItemImageAsset } from "../domain/assets/itemImages";
import { parseItem, type GameItem } from "../domain/items/items";
import { parseCharacterPinMetadata, type CharacterPinAsset } from "../domain/assets/characterPins";
import type { CharacterId, CharacterState } from "../domain/characters/characterTypes";

export class IndexedDbSaveRepository implements SaveRepository {
  private database: Promise<IDBDatabase> | undefined;

  async loadMainSave(): Promise<StoredSaveData | null> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.saveSlots, STORE_NAMES.worldStates, STORE_NAMES.characters, STORE_NAMES.events, STORE_NAMES.consultations, STORE_NAMES.partnerProfiles, STORE_NAMES.partnerProfileHistory, STORE_NAMES.dialogues, STORE_NAMES.items], "readonly");
    const slot = await request(transaction.objectStore(STORE_NAMES.saveSlots).get(MAIN_SAVE_SLOT_ID));
    if (!slot) { await transactionDone(transaction); return null; }
    const [worldState, characters, events, consultations, partnerProfiles, partnerProfileHistory, dialogues, items] = await Promise.all([
      request(transaction.objectStore(STORE_NAMES.worldStates).get(MAIN_SAVE_SLOT_ID)),
      request(transaction.objectStore(STORE_NAMES.characters).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.events).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.consultations).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.partnerProfiles).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.partnerProfileHistory).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, "", 0], [MAIN_SAVE_SLOT_ID, "\uffff", Number.MAX_SAFE_INTEGER]))),
      request(transaction.objectStore(STORE_NAMES.dialogues).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, "", ""], [MAIN_SAVE_SLOT_ID, "\uffff", "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.items).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"])))
    ]);
    await transactionDone(transaction);
    return { worldState, characters: Array.isArray(characters) ? characters : [], events: Array.isArray(events) ? events : [], consultations: Array.isArray(consultations) ? consultations : [], partnerProfiles, partnerProfileHistory, dialogues, items };
  }

  async saveMain(snapshot: SaveSnapshot): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.appMeta, STORE_NAMES.saveSlots, STORE_NAMES.worldStates, STORE_NAMES.characters, STORE_NAMES.events, STORE_NAMES.partnerProfiles, STORE_NAMES.partnerProfileHistory, STORE_NAMES.dialogues, STORE_NAMES.items], "readwrite");
    const now = new Date().toISOString();
    const slots = transaction.objectStore(STORE_NAMES.saveSlots);
    const existing = await request<Record<string, unknown> | undefined>(slots.get(MAIN_SAVE_SLOT_ID));
    transaction.objectStore(STORE_NAMES.appMeta).put({ key: "schema", schemaVersion: 6, updatedAt: now });
    slots.put({ saveSlotId: MAIN_SAVE_SLOT_ID, createdAt: typeof existing?.createdAt === "string" ? existing.createdAt : now, updatedAt: now });
    transaction.objectStore(STORE_NAMES.worldStates).put({ saveSlotId: MAIN_SAVE_SLOT_ID, viewedMapId: snapshot.viewedMapId, recentPartnerActionIds: snapshot.recentPartnerActionIds, worldStartedOn: snapshot.worldStartedOn });
    const characters = transaction.objectStore(STORE_NAMES.characters);
    snapshot.characters.forEach((character) => characters.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...character } satisfies CharacterRecord));
    transaction.objectStore(STORE_NAMES.events).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...snapshot.unknownSprout, extension: snapshot.unknownSproutExtension });
    transaction.objectStore(STORE_NAMES.partnerProfiles).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...snapshot.partnerProfile });
    const history = transaction.objectStore(STORE_NAMES.partnerProfileHistory);
    const existingPreset = await request(history.get([MAIN_SAVE_SLOT_ID, "main_partner", 1]));
    if (!existingPreset) history.put({ saveSlotId: MAIN_SAVE_SLOT_ID, profileId: "main_partner", revision: 1, profile: snapshot.partnerProfile.revision === 1 ? snapshot.partnerProfile : codyPresetProfile, dialogues: snapshot.partnerProfile.revision === 1 ? snapshot.partnerDialogues : codyPresetDialogues });
    await replacePartnerDialogues(transaction.objectStore(STORE_NAMES.dialogues), snapshot.partnerDialogues);
    const items = transaction.objectStore(STORE_NAMES.items);
    const itemKeys = await request<IDBValidKey[]>(items.getAllKeys(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"])));
    itemKeys.forEach((key) => items.delete(key));
    snapshot.items.forEach((item) => items.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...item }));
    await transactionDone(transaction);
  }

  async savePendingConsultation(pending: import("../domain/consultation/unknownSproutConsultation").PendingConsultation): Promise<void> { const db = await this.open(); const transaction = db.transaction(STORE_NAMES.consultations, "readwrite"); const store = transaction.objectStore(STORE_NAMES.consultations); const keys = await request<IDBValidKey[]>(store.getAllKeys(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))); keys.forEach((key) => store.delete(key)); store.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...pending }); await transactionDone(transaction); }

  async savePendingPartner(pending: import("../domain/partner/partnerProfile").PendingPartnerConsultation): Promise<void> { const db = await this.open(); const transaction = db.transaction(STORE_NAMES.consultations, "readwrite"); const store = transaction.objectStore(STORE_NAMES.consultations); const existing = await request(store.getAllKeys(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))); if (existing.length) throw new Error("別の相談が保留中です"); store.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...pending }); await transactionDone(transaction); }
  async discardPartnerConsultation(pending: import("../domain/partner/partnerProfile").PendingPartnerConsultation): Promise<void> { const db = await this.open(); const transaction = db.transaction(STORE_NAMES.consultations, "readwrite"); transaction.objectStore(STORE_NAMES.consultations).delete([MAIN_SAVE_SLOT_ID, pending.requestId]); await transactionDone(transaction); }

  async applyPartner(snapshot: SaveSnapshot, pending: import("../domain/partner/partnerProfile").PendingPartnerConsultation | null, next: import("../domain/partner/partnerProfile").PartnerProfileSnapshot, checkpoint: { checkpointId: string; createdAt: string }): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.appMeta, STORE_NAMES.saveSlots, STORE_NAMES.partnerProfiles, STORE_NAMES.partnerProfileHistory, STORE_NAMES.dialogues, STORE_NAMES.characters, STORE_NAMES.consultations, STORE_NAMES.checkpoints], "readwrite");
    const now = new Date().toISOString();
    const slots = transaction.objectStore(STORE_NAMES.saveSlots);
    const existingSlot = await request<Record<string, unknown> | undefined>(slots.get(MAIN_SAVE_SLOT_ID));
    transaction.objectStore(STORE_NAMES.appMeta).put({ key: "schema", schemaVersion: 6, updatedAt: now });
    slots.put({ saveSlotId: MAIN_SAVE_SLOT_ID, createdAt: typeof existingSlot?.createdAt === "string" ? existingSlot.createdAt : now, updatedAt: now });
    transaction.objectStore(STORE_NAMES.partnerProfiles).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...next.profile });
    transaction.objectStore(STORE_NAMES.partnerProfileHistory).put({ saveSlotId: MAIN_SAVE_SLOT_ID, profileId: "main_partner", revision: next.profile.revision, ...next });
    await replacePartnerDialogues(transaction.objectStore(STORE_NAMES.dialogues), next.dialogues);
    snapshot.characters.forEach((character) => transaction.objectStore(STORE_NAMES.characters).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...character }));
    if (pending) transaction.objectStore(STORE_NAMES.consultations).delete([MAIN_SAVE_SLOT_ID, pending.requestId]);
    transaction.objectStore(STORE_NAMES.checkpoints).put({ saveSlotId: MAIN_SAVE_SLOT_ID, profileId: "main_partner", profileBefore: snapshot.partnerProfile, dialoguesBefore: snapshot.partnerDialogues, ...checkpoint });
    await transactionDone(transaction);
  }

  async applyConsultation(snapshot: import("./persistenceTypes").SaveSnapshot, pending: import("../domain/consultation/unknownSproutConsultation").PendingConsultation, extension: import("../domain/consultation/unknownSproutConsultation").AppliedUnknownSproutExtension, checkpoint: import("../domain/consultation/unknownSproutConsultation").ConsultationCheckpoint): Promise<void> { const db = await this.open(); const transaction = db.transaction([STORE_NAMES.events, STORE_NAMES.consultations, STORE_NAMES.checkpoints], "readwrite"); transaction.objectStore(STORE_NAMES.checkpoints).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...checkpoint }); transaction.objectStore(STORE_NAMES.events).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...snapshot.unknownSprout, extension }); transaction.objectStore(STORE_NAMES.consultations).delete([MAIN_SAVE_SLOT_ID, pending.requestId]); await transactionDone(transaction); }

  async getItemImage(assetId: string): Promise<ItemImageAsset | null> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.assets, STORE_NAMES.assetBlobs], "readonly");
    const [rawMetadata, rawBlob] = await Promise.all([request(transaction.objectStore(STORE_NAMES.assets).get([MAIN_SAVE_SLOT_ID, assetId])), request(transaction.objectStore(STORE_NAMES.assetBlobs).get([MAIN_SAVE_SLOT_ID, assetId]))]);
    await transactionDone(transaction);
    const metadata = parseAssetMetadata(rawMetadata, "item_image");
    const blob = rawBlob && typeof rawBlob === "object" ? (rawBlob as { blob?: unknown }).blob : null;
    if (!metadata || !(blob instanceof Blob) || blob.type !== metadata.mimeType || blob.size !== metadata.byteSize) return null;
    try { await validateItemImage(new File([blob], metadata.originalName, { type: metadata.mimeType })); } catch { return null; }
    return { metadata, blob };
  }

  async putItemImage(itemId: string, asset: ItemImageAsset): Promise<GameItem> {
    await validateItemImage(new File([asset.blob], asset.metadata.originalName, { type: asset.metadata.mimeType }));
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.items, STORE_NAMES.assets, STORE_NAMES.assetBlobs], "readwrite");
    const items = transaction.objectStore(STORE_NAMES.items);
    const raw = await request(items.get([MAIN_SAVE_SLOT_ID, itemId]));
    const item = parseItem(raw);
    if (!item || asset.metadata.ownerId !== itemId || !parseAssetMetadata(asset.metadata, "item_image") || asset.blob.type !== asset.metadata.mimeType || asset.blob.size !== asset.metadata.byteSize) { transaction.abort(); throw new Error("画像または対象アイテムを確認できません。"); }
    const previous = item.visual.imageAssetId;
    const updated = { ...item, visual: { ...item.visual, imageAssetId: asset.metadata.assetId }, updatedAt: asset.metadata.updatedAt };
    transaction.objectStore(STORE_NAMES.assets).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...asset.metadata });
    transaction.objectStore(STORE_NAMES.assetBlobs).put({ saveSlotId: MAIN_SAVE_SLOT_ID, assetId: asset.metadata.assetId, blob: asset.blob });
    items.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...updated });
    if (previous) { transaction.objectStore(STORE_NAMES.assets).delete([MAIN_SAVE_SLOT_ID, previous]); transaction.objectStore(STORE_NAMES.assetBlobs).delete([MAIN_SAVE_SLOT_ID, previous]); }
    await transactionDone(transaction); return updated;
  }

  async deleteItemImage(itemId: string): Promise<GameItem> {
    const db = await this.open(); const transaction = db.transaction([STORE_NAMES.items, STORE_NAMES.assets, STORE_NAMES.assetBlobs], "readwrite"); const items = transaction.objectStore(STORE_NAMES.items);
    const item = parseItem(await request(items.get([MAIN_SAVE_SLOT_ID, itemId]))); if (!item) { transaction.abort(); throw new Error("対象アイテムを確認できません。"); }
    const previous = item.visual.imageAssetId; const updated = { ...item, visual: { ...item.visual, imageAssetId: null }, updatedAt: new Date().toISOString() }; items.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...updated });
    if (previous) { transaction.objectStore(STORE_NAMES.assets).delete([MAIN_SAVE_SLOT_ID, previous]); transaction.objectStore(STORE_NAMES.assetBlobs).delete([MAIN_SAVE_SLOT_ID, previous]); }
    await transactionDone(transaction); return updated;
  }

  async getCharacterPin(assetId: string, characterId: CharacterId): Promise<CharacterPinAsset | null> {
    const db = await this.open(); const transaction = db.transaction([STORE_NAMES.assets, STORE_NAMES.assetBlobs], "readonly");
    const [rawMetadata, rawBlob] = await Promise.all([request(transaction.objectStore(STORE_NAMES.assets).get([MAIN_SAVE_SLOT_ID, assetId])), request(transaction.objectStore(STORE_NAMES.assetBlobs).get([MAIN_SAVE_SLOT_ID, assetId]))]); await transactionDone(transaction);
    const metadata = parseCharacterPinMetadata(rawMetadata, characterId); const blob = rawBlob && typeof rawBlob === "object" ? (rawBlob as { blob?: unknown }).blob : null;
    if (!metadata || !(blob instanceof Blob) || blob.type !== metadata.mimeType || blob.size !== metadata.byteSize) return null;
    try { await validateItemImage(new File([blob], metadata.originalName, { type: metadata.mimeType })); } catch { return null; } return { metadata, blob };
  }

  async putCharacterPin(characterId: CharacterId, asset: CharacterPinAsset): Promise<CharacterState> {
    await validateItemImage(new File([asset.blob], asset.metadata.originalName, { type: asset.metadata.mimeType })); const db = await this.open(); const transaction = db.transaction([STORE_NAMES.characters, STORE_NAMES.assets, STORE_NAMES.assetBlobs], "readwrite"); const characters = transaction.objectStore(STORE_NAMES.characters); const raw = await request<Record<string, unknown> | undefined>(characters.get([MAIN_SAVE_SLOT_ID, characterId]));
    if (!raw || !parseCharacterPinMetadata(asset.metadata, characterId) || asset.blob.type !== asset.metadata.mimeType || asset.blob.size !== asset.metadata.byteSize) { transaction.abort(); throw new Error("画像または対象人物を確認できません。"); }
    const previous = typeof raw.imageAssetId === "string" ? raw.imageAssetId : null; const updated: Record<string, unknown> = { ...raw, imageAssetId: asset.metadata.assetId }; transaction.objectStore(STORE_NAMES.assets).put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...asset.metadata }); transaction.objectStore(STORE_NAMES.assetBlobs).put({ saveSlotId: MAIN_SAVE_SLOT_ID, assetId: asset.metadata.assetId, blob: asset.blob }); characters.put(updated); if (previous) { transaction.objectStore(STORE_NAMES.assets).delete([MAIN_SAVE_SLOT_ID, previous]); transaction.objectStore(STORE_NAMES.assetBlobs).delete([MAIN_SAVE_SLOT_ID, previous]); } await transactionDone(transaction); const { saveSlotId: _, ...character } = updated; return character as CharacterState;
  }

  async deleteCharacterPin(characterId: CharacterId): Promise<CharacterState> {
    const db = await this.open(); const transaction = db.transaction([STORE_NAMES.characters, STORE_NAMES.assets, STORE_NAMES.assetBlobs], "readwrite"); const characters = transaction.objectStore(STORE_NAMES.characters); const raw = await request<Record<string, unknown> | undefined>(characters.get([MAIN_SAVE_SLOT_ID, characterId])); if (!raw) { transaction.abort(); throw new Error("対象人物を確認できません。"); }
    const previous = typeof raw.imageAssetId === "string" ? raw.imageAssetId : null; const updated: Record<string, unknown> = { ...raw, imageAssetId: null }; characters.put(updated); if (previous) { transaction.objectStore(STORE_NAMES.assets).delete([MAIN_SAVE_SLOT_ID, previous]); transaction.objectStore(STORE_NAMES.assetBlobs).delete([MAIN_SAVE_SLOT_ID, previous]); } await transactionDone(transaction); const { saveSlotId: _, ...character } = updated; return character as CharacterState;
  }

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains(STORE_NAMES.appMeta)) db.createObjectStore(STORE_NAMES.appMeta, { keyPath: "key" });
        if (!db.objectStoreNames.contains(STORE_NAMES.saveSlots)) db.createObjectStore(STORE_NAMES.saveSlots, { keyPath: "saveSlotId" });
        if (!db.objectStoreNames.contains(STORE_NAMES.worldStates)) db.createObjectStore(STORE_NAMES.worldStates, { keyPath: "saveSlotId" });
        if (!db.objectStoreNames.contains(STORE_NAMES.characters)) db.createObjectStore(STORE_NAMES.characters, { keyPath: ["saveSlotId", "characterId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.events)) db.createObjectStore(STORE_NAMES.events, { keyPath: ["saveSlotId", "eventId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.consultations)) db.createObjectStore(STORE_NAMES.consultations, { keyPath: ["saveSlotId", "requestId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.checkpoints)) db.createObjectStore(STORE_NAMES.checkpoints, { keyPath: ["saveSlotId", "checkpointId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.partnerProfiles)) db.createObjectStore(STORE_NAMES.partnerProfiles, { keyPath: ["saveSlotId", "profileId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.partnerProfileHistory)) db.createObjectStore(STORE_NAMES.partnerProfileHistory, { keyPath: ["saveSlotId", "profileId", "revision"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.dialogues)) db.createObjectStore(STORE_NAMES.dialogues, { keyPath: ["saveSlotId", "profileId", "dialogueId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.items)) db.createObjectStore(STORE_NAMES.items, { keyPath: ["saveSlotId", "itemId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.assets)) db.createObjectStore(STORE_NAMES.assets, { keyPath: ["saveSlotId", "assetId"] });
        if (!db.objectStoreNames.contains(STORE_NAMES.assetBlobs)) db.createObjectStore(STORE_NAMES.assetBlobs, { keyPath: ["saveSlotId", "assetId"] });
      };
      openRequest.onerror = () => reject(openRequest.error ?? new Error("IndexedDBを開けませんでした"));
      openRequest.onblocked = () => reject(new Error("IndexedDBの更新がブロックされました"));
      openRequest.onsuccess = () => { const db = openRequest.result; db.onversionchange = () => db.close(); resolve(db); };
    });
    this.database.catch(() => { this.database = undefined; });
    return this.database;
  }
}

const replacePartnerDialogues = async (store: IDBObjectStore, dialogues: PartnerDialogueLine[]): Promise<void> => {
  const keys = await request<IDBValidKey[]>(store.getAllKeys(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, "main_partner", ""], [MAIN_SAVE_SLOT_ID, "main_partner", "\uffff"])));
  keys.forEach((key) => store.delete(key));
  dialogues.forEach((line) => store.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...line }));
};

const request = <T>(value: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  value.onsuccess = () => resolve(value.result);
  value.onerror = () => reject(value.error ?? new Error("IndexedDB request failed"));
});

const transactionDone = (transaction: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted"));
});
