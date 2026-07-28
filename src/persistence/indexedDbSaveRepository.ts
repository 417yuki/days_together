import { DB_NAME, DB_VERSION, MAIN_SAVE_SLOT_ID, STORE_NAMES, type CharacterRecord, type SaveRepository, type SaveSnapshot, type StoredSaveData } from "./persistenceTypes";

export class IndexedDbSaveRepository implements SaveRepository {
  private database: Promise<IDBDatabase> | undefined;

  async loadMainSave(): Promise<StoredSaveData | null> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.saveSlots, STORE_NAMES.worldStates, STORE_NAMES.characters], "readonly");
    const slot = await request(transaction.objectStore(STORE_NAMES.saveSlots).get(MAIN_SAVE_SLOT_ID));
    if (!slot) { await transactionDone(transaction); return null; }
    const [worldState, characters] = await Promise.all([
      request(transaction.objectStore(STORE_NAMES.worldStates).get(MAIN_SAVE_SLOT_ID)),
      request(transaction.objectStore(STORE_NAMES.characters).getAll(IDBKeyRange.bound([MAIN_SAVE_SLOT_ID, ""], [MAIN_SAVE_SLOT_ID, "\uffff"])))
    ]);
    await transactionDone(transaction);
    return { worldState, characters: Array.isArray(characters) ? characters : [] };
  }

  async saveMain(snapshot: SaveSnapshot): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([STORE_NAMES.appMeta, STORE_NAMES.saveSlots, STORE_NAMES.worldStates, STORE_NAMES.characters], "readwrite");
    const now = new Date().toISOString();
    const slots = transaction.objectStore(STORE_NAMES.saveSlots);
    const existing = await request<Record<string, unknown> | undefined>(slots.get(MAIN_SAVE_SLOT_ID));
    transaction.objectStore(STORE_NAMES.appMeta).put({ key: "schema", schemaVersion: 1, updatedAt: now });
    slots.put({ saveSlotId: MAIN_SAVE_SLOT_ID, createdAt: typeof existing?.createdAt === "string" ? existing.createdAt : now, updatedAt: now });
    transaction.objectStore(STORE_NAMES.worldStates).put({ saveSlotId: MAIN_SAVE_SLOT_ID, viewedMapId: snapshot.viewedMapId });
    const characters = transaction.objectStore(STORE_NAMES.characters);
    snapshot.characters.forEach((character) => characters.put({ saveSlotId: MAIN_SAVE_SLOT_ID, ...character } satisfies CharacterRecord));
    await transactionDone(transaction);
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
      };
      openRequest.onerror = () => reject(openRequest.error ?? new Error("IndexedDBを開けませんでした"));
      openRequest.onblocked = () => reject(new Error("IndexedDBの更新がブロックされました"));
      openRequest.onsuccess = () => { const db = openRequest.result; db.onversionchange = () => db.close(); resolve(db); };
    });
    this.database.catch(() => { this.database = undefined; });
    return this.database;
  }
}

const request = <T>(value: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  value.onsuccess = () => resolve(value.result);
  value.onerror = () => reject(value.error ?? new Error("IndexedDB request failed"));
});

const transactionDone = (transaction: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted"));
});
