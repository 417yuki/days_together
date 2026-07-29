import { afterEach, describe, expect, it, vi } from "vitest";
import { createCustomLocation, type CustomMapDraft } from "../../domain/maps/customMapDraft";
import { customLocationEditor, type CustomMapDraftUi, type SettingsActions } from "./SettingsScreen";

type Listener = (event: Event) => void;

class TestElement {
  readonly children: TestElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Listener[]>();
  readonly style: Record<string, string> = {};
  parent: TestElement | null = null;
  className = "";
  disabled = false;
  textContent = "";
  type = "";
  value = "";
  maxLength = 0;
  min = "";
  max = "";
  step = "";
  selected = false;
  alt = "";
  src = "";

  constructor(readonly tagName: string) {}

  append(...nodes: TestElement[]): void {
    nodes.forEach((node) => {
      node.parent = this;
      this.children.push(node);
    });
  }

  addEventListener(type: string, listener: Listener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  setAttribute(): void {}

  remove(): void {
    if (!this.parent) return;
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }

  click(): void {
    if (this.disabled) return;
    this.listeners.get("click")?.forEach((listener) => listener(new Event("click")));
  }

  dispatch(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener(new Event(type)));
  }

  find(text: string): TestElement | null {
    if (this.textContent === text) return this;
    for (const child of this.children) {
      const found = child.find(text);
      if (found) return found;
    }
    return null;
  }

  findTag(tagName: string): TestElement | null {
    if (this.tagName === tagName) return this;
    for (const child of this.children) {
      const found = child.findTag(tagName);
      if (found) return found;
    }
    return null;
  }
}

const originalDocument = globalThis.document;

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
});

describe("custom location editor controls", () => {
  it("uses one native click to add a location and renders the increased draft", () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: (tag: string) => new TestElement(tag) }
    });

    const record: CustomMapDraft = {
      saveSlotId: "main",
      targetMapId: "starter_house_interior",
      name: "室内",
      status: "draft",
      locations: [],
      createdAt: "2026-07-29T00:00:00.000Z",
      updatedAt: "2026-07-29T00:00:00.000Z"
    };
    const first = createCustomLocation([]);
    const ui: CustomMapDraftUi = {
      record,
      mode: "locations_edit",
      input: record.name,
      locationDraft: [first],
      selectedLocationId: first.locationId,
      busy: false,
      message: ""
    };
    const add = vi.fn(() => {
      const location = createCustomLocation(ui.locationDraft);
      ui.locationDraft.push(location);
      ui.selectedLocationId = location.locationId;
      rendered = customLocationEditor("starter_house_interior", "室内", null, ui, actions);
    });
    const update = vi.fn((_id, locationId, value) => {
      Object.assign(ui.locationDraft.find((location) => location.locationId === locationId)!, value);
    });
    const actions = {
      selectCustomMapLocation: vi.fn(),
      addCustomMapLocation: add,
      updateCustomMapLocation: update,
      deleteCustomMapLocation: vi.fn(),
      saveCustomMapLocations: vi.fn(),
      cancelCustomMapLocations: vi.fn()
    } satisfies Pick<SettingsActions, "selectCustomMapLocation" | "addCustomMapLocation" | "updateCustomMapLocation" | "deleteCustomMapLocation" | "saveCustomMapLocations" | "cancelCustomMapLocations">;
    let rendered = customLocationEditor("starter_house_interior", "室内", null, ui, actions) as unknown as TestElement;
    const nameInput = rendered.findTag("input");
    nameInput!.value = "台所";
    nameInput!.dispatch("input");
    const renderedAfterExternalUpdate = customLocationEditor("starter_house_interior", "室内", null, ui, actions) as unknown as TestElement;

    expect(update).toHaveBeenCalledTimes(1);
    expect(rendered.dataset.customMapState).toBe(renderedAfterExternalUpdate.dataset.customMapState);

    const addButton = rendered.find("地点を追加");

    expect(addButton?.listeners.has("pointerdown")).toBe(false);
    expect(addButton?.listeners.has("click")).toBe(true);
    addButton?.click();

    expect(add).toHaveBeenCalledTimes(1);
    expect(ui.locationDraft).toHaveLength(2);
    expect(rendered.find("室内・室内・2/8件")).not.toBeNull();
    expect(rendered.find(ui.locationDraft[1].label)).not.toBeNull();
  });
});
