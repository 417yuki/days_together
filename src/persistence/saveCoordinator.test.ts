import { describe, expect, it, vi } from "vitest";
import { initialState, Store } from "../app/Store";
import type { SaveRepository, SaveSnapshot, StoredSaveData } from "./persistenceTypes";
import { loadOrCreateMainSave, SaveCoordinator } from "./saveCoordinator";

class FakeRepository implements SaveRepository {
  saves: SaveSnapshot[] = [];
  constructor(private loaded: StoredSaveData | null = null, private failure?: "load" | "save") {}
  async loadMainSave(): Promise<StoredSaveData | null> { if (this.failure === "load") throw new Error("load"); return this.loaded; }
  async saveMain(snapshot: SaveSnapshot): Promise<void> { if (this.failure === "save") throw new Error("save"); this.saves.push(structuredClone(snapshot)); }
}

describe("save coordination", () => {
  it("creates the main save on first launch", async () => { const repository = new FakeRepository(); const result = await loadOrCreateMainSave(repository, initialState); expect(result.available).toBe(true); expect(repository.saves).toEqual([expect.objectContaining({ viewedMapId: initialState.viewedMapId })]); });
  it("keeps the in-memory state usable when loading or saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(loadOrCreateMainSave(new FakeRepository(null, "load"), initialState)).resolves.toEqual({ state: initialState, available: false });
    const failures: unknown[] = []; const coordinator = new SaveCoordinator(new FakeRepository(null, "save"), (error) => failures.push(error));
    await coordinator.save(initialState); expect(failures).toHaveLength(1);
  });
  it("saves viewed-map changes, every arrived location, and reset state", async () => {
    const repository = new FakeRepository(); const coordinator = new SaveCoordinator(repository, () => undefined); const store = new Store();
    store.subscribe((state) => { void coordinator.save(state); });
    store.setViewedMap("starter_garden"); store.beginMovement("user", { mapId: "starter_garden", locationId: "garden" });
    while (store.advanceCharacter("user")) { /* visit every path node */ }
    store.reset(); await coordinator.save(store.getState(), true);
    expect(repository.saves.some(({ viewedMapId }) => viewedMapId === "starter_garden")).toBe(true);
    expect(repository.saves.some(({ characters }) => characters.find(({ characterId }) => characterId === "user")?.locationId === "entrance")).toBe(true);
    expect(repository.saves.at(-1)).toEqual(expect.objectContaining({ viewedMapId: initialState.viewedMapId, characters: initialState.characters }));
  });
  it("serializes writes so an older save cannot finish after the latest save", async () => {
    const order: string[] = []; let releaseFirst = (): void => undefined;
    const firstPending = new Promise<void>((resolve) => { releaseFirst = resolve; });
    let calls = 0;
    const repository: SaveRepository = { loadMainSave: async () => null, saveMain: async (snapshot) => { calls += 1; if (calls === 1) await firstPending; order.push(snapshot.viewedMapId); } };
    const coordinator = new SaveCoordinator(repository, () => undefined);
    const first = coordinator.save(initialState); const second = coordinator.save({ ...initialState, viewedMapId: "starter_garden" });
    await Promise.resolve(); expect(calls).toBe(1); releaseFirst(); await Promise.all([first, second]);
    expect(order).toEqual(["starter_house_interior", "starter_garden"]);
  });
});
