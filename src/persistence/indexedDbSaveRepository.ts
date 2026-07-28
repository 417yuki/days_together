import { DB_NAME, DB_VERSION, MAIN_SAVE_SLOT_ID, STORE_NAMES, type CharacterRecord, type SaveRepository, type SaveSnapshot, type StoredSaveData } from "./persistenceTypes";
import { codyPresetDialogues, codyPresetProfile, type PartnerDialogueLine } from "../domain/partner/partnerProfile";

export class IndexedDbSaveRepository implements SaveRepository {
  private database: Promise<IDBDatabase> | undefined;

  async loadMainSave(): Promise<StoredSaveData | null> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.saveSlots, STORE_NAMES.worldStates, STORE_NAMES.characters, STORE_NAMES.events, STORE_NAMES.consultations, STORE_NAMES.partnerProfiles, STORE_NAMES.partnerProfileHistory, STORE_NAMES.dialogues], "readonly");
    const slot = await request(transaction.objectStore(STORE_NAMES.saveSlots).get(MAIN_SAVE_SLOT_ID));
    if (!slot) { await transactionDone(transaction); return null; }
    const [worldState, characters, events, consultations, partnerProfiles, partnerProfileHistory, dialogues] = await Promise.all([
      request(transaction.objectStore(STORE_NAMES.worldStates).get(MAIN_SAVE_SLOT_ID)),
      request(transaction.objectStore(STORE_NAMES.characters).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.events).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.consultations).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.partnerProfiles).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"]))),
      request(transaction.objectStore(STORE_NAMES.partnerProfileHistory).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, "", 0], [MAIN_SAVE_SLOT_ID, "\uffff", Number.MAX_SAFE_INTEGER]))),
      request(transaction.objectStore(STORE_NAMES.dialogues).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, "", ""], [MAIN_SAVE_SLOT_ID, "\uffff", "\uffff"])))
    ]);
    await transactionDone(transaction);
    return { worldState, characters: Array.isArray(characters) ? characters : [], events: Array.isArray(events) ? events : [], consultations: Array.isArray(consultations) ? consultations : [], partnerProfiles, partnerProfileHistory, dialogues };
  }

  async saveMain(snapshot: SaveSnapshot): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.appMeta, STORE_NAMES.saveSlots, STORE_NAMES.worldStates, STORE_NAMES.characters, STORE_NAMES.events, STORE_NAMES.partnerProfiles, STORE_NAMES.partnerProfileHistory, STORE_NAMES.dialogues], "readwrite");
    const now = new Date().toISOString();
    const slots = transaction.objectStore(STORE_NAMES.saveSlots);
    const existing = await request<Record<string, unknown> | undefined>(slots.get(MAIN_SAVE_SLOT_ID));
    transaction.objectStore(STORE_NAMES.appMeta).put({ key: "schema", schemaVersion: 4, updatedAt: now });
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
    transaction.objectStore(STORE_NAMES.appMeta).put({ key: "schema", schemaVersion: 4, updatedAt: now });
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