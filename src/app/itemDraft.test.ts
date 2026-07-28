import { describe, expect, it } from "vitest";
import { Store } from "./Store";
import { createUserItem } from "../domain/items/items";

describe("item form draft", () => {
  it("keeps draft values through unrelated state updates without rerendering for each keystroke", () => {
    const store = new Store();
    let notifications = 0;
    store.subscribe(() => { notifications += 1; });

    store.setItemView("create");
    expect(notifications).toBe(1);

    store.cacheItemDraft({ name: "旅の切符", category: "memory", description: "机に置いておく" });
    expect(notifications).toBe(1);

    store.setViewedMap("starter_garden");
    expect(notifications).toBe(2);
    expect(store.getState().itemDraft).toEqual({ name: "旅の切符", category: "memory", description: "机に置いておく" });
  });

  it("clears the transient draft when leaving the form or completing registration", () => {
    const store = new Store();
    store.setItemView("create");
    store.cacheItemDraft({ name: "途中", category: "gift", description: "入力中" });
    store.setItemView("list");
    expect(store.getState().itemDraft).toEqual({ name: "", category: "food", description: "" });

    store.setItemView("create");
    store.cacheItemDraft({ name: "小箱", category: "storage", description: "保存する" });
    const item = createUserItem(store.getState().itemDraft, () => "item-box", () => "2026-07-28T00:00:00.000Z");
    store.addItem(item);
    expect(store.getState().itemDraft).toEqual({ name: "", category: "food", description: "" });
    expect(store.getState()).toMatchObject({ itemView: "detail", selectedItemId: "item-box" });
  });
});
