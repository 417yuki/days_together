import type { AppState } from "../../app/Store";
import type { CharacterId } from "../../domain/characters/characterTypes";
import { MAP_BACKGROUND_IDS, type MapBackgroundId } from "../../domain/assets/mapBackgrounds";
import { characterPinStyle, type CharacterPinVisual } from "../../domain/characters/characterPinVisual";
import { starterMaps } from "../../data/starterMaps";
import { resolveMapLayout, type LocationLayout } from "../../domain/maps/locationLayout";
import type { GatewayVisualPair } from "../../domain/maps/mapGatewayVisual";
import { type MapItemSlotPair } from "../../domain/maps/mapItemSlots";
import { categoryLabels } from "../../domain/items/items";
import { ItemIcon } from "../icons/itemIcons";
import { CUSTOM_LOCATION_TYPES, CUSTOM_MAP_TARGET_IDS, type CustomMapDraft, type CustomMapFinishPair, type CustomMapLocation, type CustomMapTargetId } from "../../domain/maps/customMapDraft";

export type CharacterImageUi = { phase: "marker" | "loading" | "image" | "preview" | "saving" | "delete_confirm" | "deleting" | "error"; url: string | null; fileName?: string; mimeType?: string; byteSize?: number; message?: string };
export type MapBackgroundUi = { phase: "fallback" | "loading" | "image" | "preview" | "saving" | "delete_confirm" | "deleting" | "error"; url: string | null; fileName?: string; mimeType?: string; byteSize?: number; message?: string };
export type CharacterVisualUi = { editing: boolean; saving: boolean; draft: CharacterPinVisual; message: string };
export type GatewayVisualUi = { editing: boolean; saving: boolean; draft: GatewayVisualPair; message: string };
export type LocationLayoutUi = { editing: boolean; saving: boolean; selectedLocationId: string | null; draft: LocationLayout; message: string };
export type CustomMapDraftUi = { record: CustomMapDraft | null; mode: "idle" | "create" | "edit" | "locations_edit" | "delete_confirm"; input: string; locationDraft: CustomMapLocation[]; selectedLocationId: string | null; busy: boolean; message: string };
export type CustomMapFinishUi = { editing: boolean; saving: boolean; selectedMapId: CustomMapTargetId; selectedSlotId: string; draft: CustomMapFinishPair | null; message: string };
export type ItemSlotsUi = { editing: boolean; saving: boolean; selectedMapId: MapBackgroundId; selectedSlotId: string; draft: MapItemSlotPair; message: string };
export type SettingsActions = {
  openCustomMapFinish: () => void;
  selectCustomFinishMap: (id: CustomMapTargetId) => void;
  updateCustomGateway: (id: CustomMapTargetId, locationId: string) => void;
  updateCustomFinishPoint: (id: CustomMapTargetId, kind: "proxyPosition" | "entryAffordancePosition" | "slot", x: number, y: number) => void;
  selectCustomFinishSlot: (id: string) => void;
  assignCustomFinishItem: (id: string | null) => void;
  saveCustomMapFinish: () => void;
  cancelCustomMapFinish: () => void;
  openCustomMapLocations: (id: CustomMapTargetId) => void;
  selectCustomMapLocation: (id: CustomMapTargetId, locationId: string) => void;
  addCustomMapLocation: (id: CustomMapTargetId) => void;
  updateCustomMapLocation: (id: CustomMapTargetId, locationId: string, value: Partial<Pick<CustomMapLocation, "label" | "locationTypeId" | "position">>) => void;
  deleteCustomMapLocation: (id: CustomMapTargetId) => void;
  saveCustomMapLocations: (id: CustomMapTargetId) => void;
  cancelCustomMapLocations: (id: CustomMapTargetId) => void;
  startCustomMapDraft: (id: CustomMapTargetId) => void;
  editCustomMapDraft: (id: CustomMapTargetId) => void;
  updateCustomMapDraftName: (id: CustomMapTargetId, name: string) => void;
  saveCustomMapDraft: (id: CustomMapTargetId) => void;
  cancelCustomMapDraft: (id: CustomMapTargetId) => void;
  confirmDeleteCustomMapDraft: (id: CustomMapTargetId) => void;
  deleteCustomMapDraft: (id: CustomMapTargetId) => void;
  openItemSlots: () => void;
  selectItemSlotMap: (id: MapBackgroundId) => void;
  selectItemSlot: (id: string) => void;
  assignItemSlot: (id: string | null) => void;
  updateItemSlotPosition: (x: number, y: number) => void;
  clearItemSlot: () => void;
  resetItemSlotPosition: () => void;
  resetAllItemSlotPositions: () => void;
  clearAllItemSlots: () => void;
  saveItemSlots: () => void;
  cancelItemSlots: () => void;
  openGatewayVisual: () => void;
  updateGatewayLocation: (id: MapBackgroundId, locationId: string) => void;
  updateGatewayPoint: (id: MapBackgroundId, kind: "proxyPosition" | "entryAffordancePosition", x: number, y: number) => void;
  resetGatewayLocations: () => void;
  resetProxyPositions: () => void;
  resetHousePosition: () => void;
  saveGatewayVisual: () => void;
  cancelGatewayVisual: () => void;
  openCharacterVisual: (id: CharacterId) => void;
  updateCharacterVisual: (id: CharacterId, value: CharacterPinVisual) => void;
  resetCharacterVisual: (id: CharacterId) => void;
  saveCharacterVisual: (id: CharacterId) => void;
  cancelCharacterVisual: (id: CharacterId) => void;
  openMapBackgroundPicker: (id: MapBackgroundId) => void;
  saveMapBackground: (id: MapBackgroundId) => void;
  cancelMapBackground: (id: MapBackgroundId) => void;
  confirmDeleteMapBackground: (id: MapBackgroundId) => void;
  deleteMapBackground: (id: MapBackgroundId) => void;
  openCharacterImagePicker: (id: CharacterId) => void;
  saveCharacterImage: (id: CharacterId) => void;
  cancelCharacterImage: (id: CharacterId) => void;
  confirmDeleteCharacterImage: (id: CharacterId) => void;
  deleteCharacterImage: (id: CharacterId) => void;
  openLocationLayout: (id: MapBackgroundId) => void;
  selectLocation: (id: MapBackgroundId, locationId: string) => void;
  updateLocation: (id: MapBackgroundId, locationId: string, x: number, y: number) => void;
  resetLocation: (id: MapBackgroundId, locationId: string) => void;
  resetAllLocations: (id: MapBackgroundId) => void;
  saveLocationLayout: (id: MapBackgroundId) => void;
  cancelLocationLayout: (id: MapBackgroundId) => void;
};

export const SettingsScreen = (
  state: AppState,
  actions: SettingsActions,
  images: Record<CharacterId, CharacterImageUi>,
  backgrounds: Record<MapBackgroundId, MapBackgroundUi>,
  visuals: Record<CharacterId, CharacterVisualUi>,
  layouts: Record<MapBackgroundId, LocationLayoutUi>,
  gateway: GatewayVisualUi,
  itemSlots: ItemSlotsUi,
  customDrafts: Record<CustomMapTargetId, CustomMapDraftUi>,
  customFinish: CustomMapFinishUi
): HTMLElement => {
  const section = document.createElement("section");
  const customFinishBusy = customFinish.editing || customFinish.saving;
  const anotherMapEditorActive = gateway.editing
    || itemSlots.editing
    || Object.values(layouts).some((value) => value.editing)
    || Object.values(backgrounds).some((value) => ["preview", "saving", "delete_confirm", "deleting"].includes(value.phase));

  section.className = "content-card settings-screen";
  section.append(text("h2", "ふたりの見た目"), text("p", "端末内の画像を人物ピンと代理表示に使えます。画像は外部へ送信しません。"));

  state.characters.forEach((character) => {
    const ui = images[character.characterId];
    const card = document.createElement("section");
    card.className = "character-image-card";
    card.append(text("h3", character.characterId === "user" ? "主人公" : character.name));
    const preview = document.createElement("div");
    preview.className = "character-image-preview";
    if (ui.url) {
      const img = document.createElement("img");
      img.src = ui.url;
      img.alt = "";
      preview.append(img);
    } else preview.append(text("strong", character.marker));
    card.append(preview);

    const controls = document.createElement("div");
    controls.className = "character-image-controls";
    const busy = ["saving", "deleting"].includes(ui.phase);
    if (ui.phase === "preview" || ui.phase === "saving") {
      controls.append(
        text("p", `${ui.fileName ?? ""}\n${ui.mimeType ?? ""}・${formatBytes(ui.byteSize ?? 0)}`),
        button("この画像を保存", () => actions.saveCharacterImage(character.characterId), ui.phase === "saving"),
        button("選び直す", () => actions.openCharacterImagePicker(character.characterId), ui.phase === "saving"),
        button("キャンセル", () => actions.cancelCharacterImage(character.characterId), ui.phase === "saving")
      );
    } else controls.append(button(character.imageAssetId ? "画像を変更" : "画像を追加", () => actions.openCharacterImagePicker(character.characterId), busy));
    if (character.imageAssetId && ui.phase !== "preview" && ui.phase !== "saving") controls.append(button(ui.phase === "delete_confirm" ? "削除する" : "画像を削除", () => ui.phase === "delete_confirm" ? actions.deleteCharacterImage(character.characterId) : actions.confirmDeleteCharacterImage(character.characterId), ui.phase === "deleting"));
    if (character.imageAssetId && ui.phase === "image") controls.append(button("表示を調整", () => actions.openCharacterVisual(character.characterId)));
    const visualUi = visuals[character.characterId];
    if (visualUi.editing) card.append(visualEditor(character.characterId, ui.url!, visualUi, actions));
    const live = text("p", visualUi.message || (ui.phase === "delete_confirm" ? "画像だけを削除します。よろしいですか？" : ui.message ?? ""), "character-image-live");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    controls.append(live);
    card.append(controls);
    section.append(card);
  });

  section.append(text("h2", "マップ背景"), text("p", "室内と庭へ別々の画像を登録できます。画像がない時は仮背景を使います。"));
  MAP_BACKGROUND_IDS.forEach((mapId) => {
    const ui = backgrounds[mapId];
    const visual = state.mapVisuals[mapId];
    const card = document.createElement("section");
    card.className = "map-background-card";
    card.append(text("h3", mapId === "starter_house_interior" ? "室内" : "庭"));
    const preview = document.createElement("div");
    preview.className = `map-background-preview map-canvas--${mapId === "starter_house_interior" ? "interior" : "outdoor"}`;
    if (ui.url) {
      const img = document.createElement("img");
      img.src = ui.url;
      img.alt = "";
      img.addEventListener("error", () => { img.remove(); preview.append(text("span", "仮背景を使用中")); });
      preview.append(img);
    } else preview.append(text("span", "仮背景を使用中"));
    card.append(preview);
    if (layouts[mapId].editing) card.append(locationLayoutEditor(mapId, backgrounds[mapId].url, layouts[mapId], actions));

    const controls = document.createElement("div");
    controls.className = "character-image-controls";
    const busy = ["saving", "deleting"].includes(ui.phase) || layouts[mapId].editing || customFinishBusy;
    if (["preview", "saving"].includes(ui.phase)) {
      controls.append(
        text("p", `${ui.fileName ?? ""}\n${ui.mimeType ?? ""}・${formatBytes(ui.byteSize ?? 0)}`),
        button("この背景を保存", () => actions.saveMapBackground(mapId), ui.phase === "saving" || customFinishBusy),
        button("選び直す", () => actions.openMapBackgroundPicker(mapId), ui.phase === "saving" || customFinishBusy),
        button("キャンセル", () => actions.cancelMapBackground(mapId), ui.phase === "saving" || customFinishBusy)
      );
    } else controls.append(button(visual.backgroundAssetId ? "画像を変更" : "画像を追加", () => actions.openMapBackgroundPicker(mapId), busy));
    if (visual.backgroundAssetId && !["preview", "saving"].includes(ui.phase)) controls.append(button(ui.phase === "delete_confirm" ? "背景画像だけを削除する" : "画像を削除", () => ui.phase === "delete_confirm" ? actions.deleteMapBackground(mapId) : actions.confirmDeleteMapBackground(mapId), ui.phase === "deleting" || customFinishBusy));
    if (!layouts[mapId].editing) controls.append(button("地点を配置", () => actions.openLocationLayout(mapId), busy || ["preview", "delete_confirm"].includes(ui.phase)));
    const message = ui.phase === "delete_confirm" ? "背景画像だけを削除します。マップ、地点、人物、アイテム、イベント、セーブデータは残り、仮背景へ戻ります。" : ui.message ?? "";
    const live = text("p", message, "character-image-live");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    controls.append(live);
    card.append(controls);
    section.append(card);
  });

  section.append(gateway.editing
    ? gatewayEditor(state, backgrounds, gateway, actions)
    : button("出入口と代理表示を調整", actions.openGatewayVisual, Object.values(layouts).some((value) => value.editing) || itemSlots.editing || customFinishBusy));
  section.append(itemSlots.editing
    ? itemSlotEditor(state, backgrounds, itemSlots, actions)
    : button("アイテムを配置", actions.openItemSlots, gateway.editing || Object.values(layouts).some((value) => value.editing) || customFinishBusy));
  section.append(customMapDraftSection(state, backgrounds, customDrafts, customFinish, anotherMapEditorActive, actions));
  return section;
};

const locationLayoutEditor = (mapId: MapBackgroundId, backgroundUrl: string | null, ui: LocationLayoutUi, actions: SettingsActions): HTMLElement => {
  const preset = starterMaps.find((map) => map.mapId === mapId)!;
  const map = resolveMapLayout(preset, ui.draft);
  const selected = map.locations.find((location) => location.locationId === ui.selectedLocationId) ?? map.locations[0];
  const editor = document.createElement("section");
  editor.className = "location-layout-editor";
  editor.append(text("h4", "地点配置"), text("p", "保存するまでは実際のマップへ反映されません。"));
  const preview = document.createElement("div");
  preview.className = `location-layout-preview map-canvas--${map.mapType}`;
  if (backgroundUrl) {
    const image = document.createElement("img");
    image.src = backgroundUrl;
    image.alt = "";
    preview.append(image);
  }
  map.locations.forEach((location) => {
    const marker = button(location.label, () => actions.selectLocation(mapId, location.locationId));
    marker.className = `layout-location${location.locationId === selected.locationId ? " is-selected" : ""}`;
    marker.style.left = `${location.position.x * 100}%`;
    marker.style.top = `${location.position.y * 100}%`;
    if (location.locationId === selected.locationId) marker.setAttribute("aria-current", "true");
    preview.append(marker);
  });
  editor.append(preview);
  const choices = document.createElement("div");
  choices.className = "layout-location-list";
  map.locations.forEach((location) => choices.append(button(location.label, () => actions.selectLocation(mapId, location.locationId))));
  editor.append(choices, text("strong", `選択中：${selected.label}`));
  const addRange = (axis: "x" | "y", labelText: string) => {
    const label = document.createElement("label");
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.min = ".05";
    input.max = ".95";
    input.step = ".01";
    input.value = String(selected.position[axis]);
    output.textContent = `${Math.round(selected.position[axis] * 100)}%`;
    label.append(text("span", labelText), output, input);
    input.addEventListener("input", () => {
      const value = Number(input.value);
      output.textContent = `${Math.round(value * 100)}%`;
      actions.updateLocation(mapId, selected.locationId, axis === "x" ? value : selected.position.x, axis === "y" ? value : selected.position.y);
    });
    editor.append(label);
  };
  addRange("x", "横位置");
  addRange("y", "縦位置");
  const controls = document.createElement("div");
  controls.className = "pin-visual-actions";
  controls.append(
    button("この地点を初期位置に戻す", () => actions.resetLocation(mapId, selected.locationId), ui.saving),
    button("全地点を初期配置に戻す", () => actions.resetAllLocations(mapId), ui.saving),
    button("この配置を保存", () => actions.saveLocationLayout(mapId), ui.saving),
    button("キャンセル", () => actions.cancelLocationLayout(mapId), ui.saving)
  );
  const live = text("p", ui.message, "character-image-live");
  live.setAttribute("aria-live", "polite");
  editor.append(controls, live);
  return editor;
};

const gatewayEditor = (state: AppState, backgrounds: Record<MapBackgroundId, MapBackgroundUi>, ui: GatewayVisualUi, actions: SettingsActions): HTMLElement => {
  const editor = document.createElement("section");
  editor.className = "location-layout-editor gateway-editor";
  editor.append(text("h3", "出入口と代理表示"), text("p", "室内と庭を一組で保存します。保存まではプレビューだけが変わります。"));
  MAP_BACKGROUND_IDS.forEach((id) => {
    const map = resolveMapLayout(starterMaps.find((value) => value.mapId === id)!, state.mapVisuals[id].locationLayout);
    const visual = ui.draft[id];
    editor.append(text("h4", id === "starter_house_interior" ? "室内" : "庭"));
    const preview = document.createElement("div");
    preview.className = `location-layout-preview map-canvas--${map.mapType}`;
    if (backgrounds[id].url) {
      const img = document.createElement("img");
      img.src = backgrounds[id].url!;
      img.alt = "";
      preview.append(img);
    }
    map.locations.forEach((location) => {
      const marker = text("span", location.label, `layout-location${location.locationId === visual.gatewayLocationId ? " is-selected" : ""}`);
      marker.style.left = `${location.position.x * 100}%`;
      marker.style.top = `${location.position.y * 100}%`;
      preview.append(marker);
    });
    const proxy = text("span", "代理", "gateway-dummy");
    proxy.style.left = `${visual.proxyPosition.x * 100}%`;
    proxy.style.top = `${visual.proxyPosition.y * 100}%`;
    preview.append(proxy);
    if (visual.entryAffordancePosition) {
      const house = text("span", "家の外観", "gateway-house-dummy");
      house.style.left = `${visual.entryAffordancePosition.x * 100}%`;
      house.style.top = `${visual.entryAffordancePosition.y * 100}%`;
      preview.append(house);
    }
    editor.append(preview);
    const label = document.createElement("label");
    const select = document.createElement("select");
    label.append(text("span", "出入口地点"), select);
    map.locations.forEach((location) => {
      const option = document.createElement("option");
      option.value = location.locationId;
      option.textContent = `${location.label} (${Math.round(location.position.x * 100)}%, ${Math.round(location.position.y * 100)}%)`;
      option.selected = location.locationId === visual.gatewayLocationId;
      select.append(option);
    });
    select.addEventListener("change", () => actions.updateGatewayLocation(id, select.value));
    editor.append(label);
    addPointRanges(editor, id, "proxyPosition", "代理位置", visual.proxyPosition, actions);
    if (visual.entryAffordancePosition) addPointRanges(editor, id, "entryAffordancePosition", "家の外観位置", visual.entryAffordancePosition, actions);
  });
  const controls = document.createElement("div");
  controls.className = "pin-visual-actions";
  controls.append(
    button("プリセットの玄関と家の前へ戻す", actions.resetGatewayLocations, ui.saving),
    button("代理位置を出入口地点へ戻す", actions.resetProxyPositions, ui.saving),
    button("家の外観位置を初期値へ戻す", actions.resetHousePosition, ui.saving),
    button("この接続と配置を保存", actions.saveGatewayVisual, ui.saving),
    button("キャンセル", actions.cancelGatewayVisual, ui.saving)
  );
  const live = text("p", ui.message, "character-image-live");
  live.setAttribute("aria-live", "polite");
  editor.append(controls, live);
  return editor;
};

const addPointRanges = (root: HTMLElement, id: MapBackgroundId, kind: "proxyPosition" | "entryAffordancePosition", title: string, value: { x: number; y: number }, actions: SettingsActions) => {
  (["x", "y"] as const).forEach((axis) => {
    const label = document.createElement("label");
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.min = kind === "proxyPosition" ? ".05" : ".15";
    input.max = kind === "proxyPosition" ? ".95" : ".85";
    input.step = ".01";
    input.value = String(value[axis]);
    output.textContent = `${Math.round(value[axis] * 100)}%`;
    label.append(text("span", `${title}・${axis === "x" ? "横" : "縦"}`), output, input);
    input.addEventListener("input", () => actions.updateGatewayPoint(id, kind, axis === "x" ? Number(input.value) : value.x, axis === "y" ? Number(input.value) : value.y));
    root.append(label);
  });
};

const visualEditor = (id: CharacterId, url: string, ui: CharacterVisualUi, actions: SettingsActions): HTMLElement => {
  const editor = document.createElement("section");
  editor.className = "pin-visual-editor";
  editor.append(text("h4", "人物ピンの表示調整"), text("p", "接地点は地点ガイドへ合わせる画像上の足元です。表示位置は切抜き枠内で見せる部分です。"));
  const preview = document.createElement("div");
  preview.className = "pin-visual-preview map-canvas--interior";
  const guide = text("span", "地点", "pin-location-guide");
  const pin = document.createElement("span");
  pin.className = "pin-visual-preview-image";
  const image = document.createElement("img");
  image.src = url;
  image.alt = "調整中の人物ピン";
  pin.append(image);
  preview.append(guide, pin);
  editor.append(preview);
  const apply = (draft: CharacterPinVisual) => {
    const style = characterPinStyle(draft);
    pin.style.width = style.width;
    pin.style.height = style.height;
    pin.style.transform = style.transform;
    image.style.objectPosition = style.objectPosition;
    actions.updateCharacterVisual(id, draft);
  };
  apply(ui.draft);
  const fields: Array<[keyof CharacterPinVisual, string, number, number, number]> = [
    ["anchorX", "接地点・左右", 0, 100, 1], ["anchorY", "接地点・上下", 0, 100, 1], ["scale", "表示倍率", .5, 2, .05], ["objectPositionX", "表示位置・左右", 0, 100, 1], ["objectPositionY", "表示位置・上下", 0, 100, 1]
  ];
  fields.forEach(([key, labelText, min, max, step]) => {
    const label = document.createElement("label");
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(ui.draft[key]);
    output.textContent = String(ui.draft[key]);
    label.append(text("span", labelText), output, input);
    input.addEventListener("input", () => {
      const draft = { ...ui.draft, [key]: Number(input.value) };
      output.textContent = input.value;
      apply(draft);
      ui.draft = draft;
    });
    editor.append(label);
  });
  const controls = document.createElement("div");
  controls.className = "pin-visual-actions";
  controls.append(
    button("初期値に戻す", () => actions.resetCharacterVisual(id), ui.saving),
    button("この表示設定を保存", () => actions.saveCharacterVisual(id), ui.saving),
    button("キャンセル", () => actions.cancelCharacterVisual(id), ui.saving)
  );
  editor.append(controls);
  return editor;
};

const text = <K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className = ""): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.textContent = value;
  element.className = className;
  return element;
};
const button = (label: string, action: () => void, disabled = false): HTMLButtonElement => {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.disabled = disabled;
  element.addEventListener("click", action);
  return element;
};
const formatBytes = (bytes: number): string => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KiB` : `${(bytes / 1024 / 1024).toFixed(1)} MiB`;

const customMapDraftSection = (
  state: AppState,
  backgrounds: Record<MapBackgroundId, MapBackgroundUi>,
  drafts: Record<CustomMapTargetId, CustomMapDraftUi>,
  finish: CustomMapFinishUi,
  anotherMapEditorActive: boolean,
  actions: SettingsActions
): HTMLElement => {
  const root = document.createElement("section");
  root.className = "custom-map-drafts";
  root.append(text("h2", "カスタムマップ下書き"), text("p", "地点設定は下書きプレビューだけを変更し、通常マップへはまだ反映されません。"));
  MAP_BACKGROUND_IDS.forEach((id) => {
    const ui = drafts[id];
    const mapLabel = id === "starter_house_interior" ? "室内" : "庭";
    const card = document.createElement("section");
    card.className = "custom-map-draft-card";
    const shownName = ["create", "edit"].includes(ui.mode) ? ui.input : ui.record?.name ?? "下書きなし";
    card.append(text("h3", `${mapLabel}の下書き`), text("p", `状態：${ui.record ? "保存済みの下書き" : ui.mode === "create" ? "作成中（未保存）" : "下書きなし"}`), text("strong", shownName));
    if (ui.mode === "locations_edit") card.append(customLocationEditor(id, mapLabel, backgrounds[id].url, ui, actions));
    else {
      const map = resolveMapLayout(starterMaps.find((value) => value.mapId === id)!, state.mapVisuals[id].locationLayout);
      const preview = document.createElement("div");
      preview.className = `custom-map-preview map-canvas--${map.mapType}`;
      if (backgrounds[id].url) {
        const image = document.createElement("img");
        image.src = backgrounds[id].url!;
        image.alt = "";
        image.addEventListener("error", () => image.remove());
        preview.append(image);
      }
      map.locations.forEach((location) => {
        const marker = text("span", location.label, "custom-map-location");
        marker.style.left = `${location.position.x * 100}%`;
        marker.style.top = `${location.position.y * 100}%`;
        preview.append(marker);
      });
      card.append(preview, text("p", `${mapLabel}・下書き・通常マップへ未反映`, "eyebrow"));
      if (ui.mode === "create" || ui.mode === "edit") {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 40;
        input.value = ui.input;
        label.append(text("span", "下書き名"), input);
        input.addEventListener("input", () => actions.updateCustomMapDraftName(id, input.value));
        const controls = document.createElement("div");
        controls.className = "pin-visual-actions";
        controls.append(
          button("下書きを保存", () => actions.saveCustomMapDraft(id), ui.busy || finish.editing),
          button("キャンセル", () => actions.cancelCustomMapDraft(id), ui.busy || finish.editing)
        );
        card.append(label, controls);
      } else if (!ui.record) card.append(text("p", "先に下書きを作成してください。"), button(`${mapLabel}の下書きを作る`, () => actions.startCustomMapDraft(id), ui.busy || finish.editing));
      else {
        const controls = document.createElement("div");
        controls.className = "pin-visual-actions";
        const blocked = ui.busy || finish.editing;
        controls.append(
          button("地点を編集", () => actions.openCustomMapLocations(id), blocked),
          button("名前を編集", () => actions.editCustomMapDraft(id), blocked),
          button(ui.mode === "delete_confirm" ? "下書きだけを削除する" : "下書きを削除", () => ui.mode === "delete_confirm" ? actions.deleteCustomMapDraft(id) : actions.confirmDeleteCustomMapDraft(id), blocked)
        );
        card.append(controls);
      }
    }
    const live = text("p", ui.mode === "delete_confirm" ? "この下書きだけを削除します。背景や通常マップは残ります。" : ui.message, "character-image-live");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    card.append(live);
    root.append(card);
  });
  const ready = MAP_BACKGROUND_IDS.every((id) => Boolean(drafts[id].record?.locations.length));
  root.append(finish.editing
    ? customFinishEditor(state, backgrounds, drafts, finish, actions)
    : button("出入口とアイテム枠を編集", actions.openCustomMapFinish, !ready || anotherMapEditorActive || Object.values(drafts).some((ui) => ui.busy || ui.mode !== "idle")));
  if (!ready) root.append(text("p", "室内と庭の下書きを作り、両方で地点設定を保存してください。"));
  return root;
};

const customFinishEditor = (state: AppState, backgrounds: Record<MapBackgroundId, MapBackgroundUi>, drafts: Record<CustomMapTargetId, CustomMapDraftUi>, ui: CustomMapFinishUi, actions: SettingsActions): HTMLElement => {
  const root = document.createElement("section");
  root.className = "custom-finish-editor";
  if (!ui.draft) return root;
  const id = ui.selectedMapId;
  const data = ui.draft[id];
  const record = drafts[id].record!;
  const mapLabel = id === "starter_house_interior" ? "室内" : "庭";
  root.append(text("h3", "出入口とアイテム枠"), text("p", "室内と庭をまとめて保存します。通常マップへは未反映です。"));
  const tabs = document.createElement("div");
  tabs.className = "map-tabs";
  CUSTOM_MAP_TARGET_IDS.forEach((mapId) => {
    const tab = button(mapId === "starter_house_interior" ? "室内" : "庭", () => actions.selectCustomFinishMap(mapId), ui.saving);
    if (mapId === id) tab.setAttribute("aria-current", "true");
    tabs.append(tab);
  });
  root.append(tabs, text("p", `${record.name}・${mapLabel}・下書き`));

  const preview = document.createElement("div");
  preview.className = `custom-map-preview map-canvas--${id === "starter_house_interior" ? "interior" : "outdoor"}`;
  const url = backgrounds[id].url;
  if (url) {
    const image = document.createElement("img");
    image.src = url;
    image.alt = "";
    image.addEventListener("error", () => image.remove());
    preview.append(image);
  }
  record.locations.forEach((location) => {
    const marker = text("span", `${location.locationId === data.gatewayVisual.gatewayLocationId ? "出入口：" : ""}${location.label}`, `custom-map-location${location.locationId === data.gatewayVisual.gatewayLocationId ? " is-gateway" : ""}`);
    marker.style.left = `${location.position.x * 100}%`;
    marker.style.top = `${location.position.y * 100}%`;
    preview.append(marker);
  });
  const proxy = text("span", "代理", "custom-finish-marker");
  proxy.style.left = `${data.gatewayVisual.proxyPosition.x * 100}%`;
  proxy.style.top = `${data.gatewayVisual.proxyPosition.y * 100}%`;
  preview.append(proxy);
  if (id === "starter_garden" && data.gatewayVisual.entryAffordancePosition) {
    const house = text("span", "家", "custom-finish-marker");
    house.style.left = `${data.gatewayVisual.entryAffordancePosition.x * 100}%`;
    house.style.top = `${data.gatewayVisual.entryAffordancePosition.y * 100}%`;
    preview.append(house);
  }
  Object.entries(data.itemSlots).forEach(([slotId, slot], index) => {
    const item = state.items.find((candidate) => candidate.itemId === slot.itemId);
    const marker = button(item?.name ?? `空き${index + 1}`, () => actions.selectCustomFinishSlot(slotId), ui.saving);
    if (item) {
      marker.replaceChildren(ItemIcon(item.visual.iconKey), text("span", item.name));
      marker.setAttribute("aria-label", item.name);
    }
    marker.className = `slot-preview${slotId === ui.selectedSlotId ? " is-selected" : ""}`;
    marker.style.left = `${slot.position.x * 100}%`;
    marker.style.top = `${slot.position.y * 100}%`;
    if (slotId === ui.selectedSlotId) marker.setAttribute("aria-current", "true");
    preview.append(marker);
  });
  root.append(preview);

  const gatewayLabel = document.createElement("label");
  const gateway = document.createElement("select");
  gatewayLabel.append(text("span", "出入口地点"), gateway);
  record.locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location.locationId;
    option.textContent = location.label;
    option.selected = location.locationId === data.gatewayVisual.gatewayLocationId;
    gateway.append(option);
  });
  gateway.addEventListener("change", () => actions.updateCustomGateway(id, gateway.value));
  root.append(gatewayLabel);

  const ranges = (kind: "proxyPosition" | "entryAffordancePosition" | "slot", value: { x: number; y: number }, heading: string) => {
    root.append(text("h4", heading));
    const minimum = kind === "entryAffordancePosition" ? ".15" : ".05";
    const maximum = kind === "entryAffordancePosition" ? ".85" : ".95";
    (["x", "y"] as const).forEach((axis) => {
      const field = document.createElement("label");
      const input = document.createElement("input");
      const output = document.createElement("output");
      input.type = "range";
      input.min = minimum;
      input.max = maximum;
      input.step = ".01";
      input.value = String(value[axis]);
      output.textContent = `${Math.round(value[axis] * 100)}%`;
      field.append(text("span", axis === "x" ? "横位置" : "縦位置"), output, input);
      input.addEventListener("input", () => actions.updateCustomFinishPoint(id, kind, axis === "x" ? Number(input.value) : value.x, axis === "y" ? Number(input.value) : value.y));
      root.append(field);
    });
  };
  ranges("proxyPosition", data.gatewayVisual.proxyPosition, "代理位置");
  if (id === "starter_garden" && data.gatewayVisual.entryAffordancePosition) ranges("entryAffordancePosition", data.gatewayVisual.entryAffordancePosition, "家の外観位置");

  const slot = data.itemSlots[ui.selectedSlotId] ?? Object.values(data.itemSlots)[0];
  const itemLabel = document.createElement("label");
  const itemSelect = document.createElement("select");
  itemLabel.append(text("span", "選択中スロットのアイテム"), itemSelect);
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "置かない";
  itemSelect.append(none);
  state.items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.itemId;
    option.textContent = `${item.name}（${categoryLabels[item.category]}）`;
    option.selected = item.itemId === slot.itemId;
    itemSelect.append(option);
  });
  itemSelect.addEventListener("change", () => actions.assignCustomFinishItem(itemSelect.value || null));
  root.append(itemLabel);
  ranges("slot", slot.position, "選択中スロット位置");
  const controls = document.createElement("div");
  controls.className = "pin-visual-actions";
  controls.append(
    button("この枠から外す", () => actions.assignCustomFinishItem(null), ui.saving),
    button("仕上げ設定を保存", actions.saveCustomMapFinish, ui.saving),
    button("キャンセル", actions.cancelCustomMapFinish, ui.saving)
  );
  const live = text("p", ui.message, "character-image-live");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  root.append(controls, live);
  return root;
};

export const customLocationEditorStateKey = (ui: CustomMapDraftUi, backgroundUrl: string | null): string => JSON.stringify({
  selectedLocationId: ui.selectedLocationId,
  busy: ui.busy,
  backgroundUrl,
  locations: ui.locationDraft
});

export const customLocationEditor = (id: CustomMapTargetId, mapLabel: string, backgroundUrl: string | null, ui: CustomMapDraftUi, actions: Pick<SettingsActions, "selectCustomMapLocation" | "addCustomMapLocation" | "updateCustomMapLocation" | "deleteCustomMapLocation" | "saveCustomMapLocations" | "cancelCustomMapLocations">): HTMLElement => {
  const root = document.createElement("section");
  root.className = "custom-location-editor";
  root.dataset.customMapId = id;
  root.dataset.customMapState = customLocationEditorStateKey(ui, backgroundUrl);
  const selected = ui.locationDraft.find((item) => item.locationId === ui.selectedLocationId) ?? ui.locationDraft[0];
  root.append(text("h4", "カスタム地点"), text("p", `${ui.record?.name ?? "下書き"}・${mapLabel}・${ui.locationDraft.length}/8件`), text("p", "通常マップへ未反映です。"));
  const preview = document.createElement("div");
  preview.className = `custom-map-preview map-canvas--${id === "starter_house_interior" ? "interior" : "outdoor"}`;
  if (backgroundUrl) {
    const image = document.createElement("img");
    image.src = backgroundUrl;
    image.alt = "";
    image.addEventListener("error", () => image.remove());
    preview.append(image);
  }
  ui.locationDraft.forEach((location) => {
    const marker = button(location.label, () => actions.selectCustomMapLocation(id, location.locationId), ui.busy);
    marker.className = `custom-map-location${location.locationId === selected?.locationId ? " is-selected" : ""}`;
    marker.style.left = `${location.position.x * 100}%`;
    marker.style.top = `${location.position.y * 100}%`;
    if (location.locationId === selected?.locationId) marker.setAttribute("aria-current", "true");
    preview.append(marker);
  });
  root.append(preview);
  const list = document.createElement("div");
  list.className = "custom-location-list";
  ui.locationDraft.forEach((location) => {
    const choice = button(location.label, () => actions.selectCustomMapLocation(id, location.locationId), ui.busy);
    if (location.locationId === selected?.locationId) choice.setAttribute("aria-current", "true");
    list.append(choice);
  });
  root.append(list);
  if (selected) {
    const nameLabel = document.createElement("label");
    const name = document.createElement("input");
    name.type = "text";
    name.maxLength = 24;
    name.value = selected.label;
    name.className = "custom-location-name";
    name.dataset.focusKey = `custom-location-name-${id}-${selected.locationId}`;
    nameLabel.append(text("span", "地点名"), name);
    name.addEventListener("input", () => {
      actions.updateCustomMapLocation(id, selected.locationId, { label: name.value });
      root.dataset.customMapState = customLocationEditorStateKey(ui, backgroundUrl);
    });
    root.append(nameLabel);
    const typeLabel = document.createElement("label");
    const select = document.createElement("select");
    typeLabel.append(text("span", "地点タイプ"), select);
    CUSTOM_LOCATION_TYPES.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      option.textContent = type.label;
      option.selected = type.id === selected.locationTypeId;
      select.append(option);
    });
    select.addEventListener("change", () => actions.updateCustomMapLocation(id, selected.locationId, { locationTypeId: select.value as CustomMapLocation["locationTypeId"] }));
    root.append(typeLabel);
    (["x", "y"] as const).forEach((axis) => {
      const label = document.createElement("label");
      const output = document.createElement("output");
      const input = document.createElement("input");
      input.type = "range";
      input.min = ".05";
      input.max = ".95";
      input.step = ".01";
      input.value = String(selected.position[axis]);
      output.textContent = `${Math.round(selected.position[axis] * 100)}%`;
      label.append(text("span", axis === "x" ? "横位置" : "縦位置"), output, input);
      input.addEventListener("input", () => actions.updateCustomMapLocation(id, selected.locationId, { position: { ...selected.position, [axis]: Number(input.value) } }));
      root.append(label);
    });
  }
  const controls = document.createElement("div");
  controls.className = "pin-visual-actions";
  controls.append(
    button("地点を追加", () => actions.addCustomMapLocation(id), ui.busy || ui.locationDraft.length >= 8),
    button("この地点を削除", () => actions.deleteCustomMapLocation(id), ui.busy || ui.locationDraft.length <= 1),
    button("地点設定を保存", () => actions.saveCustomMapLocations(id), ui.busy),
    button("キャンセル", () => actions.cancelCustomMapLocations(id), ui.busy)
  );
  root.append(controls);
  return root;
};

const itemSlotEditor = (state: AppState, backgrounds: Record<MapBackgroundId, MapBackgroundUi>, ui: ItemSlotsUi, actions: SettingsActions): HTMLElement => {
  const root = document.createElement("section");
  root.className = "location-layout-editor item-slot-editor";
  root.append(text("h3", "アイテムを配置"), text("p", "六つの固定枠をまとめて編集します。保存までは通常マップへ反映されません。"));
  const tabs = document.createElement("div");
  tabs.className = "map-tabs";
  MAP_BACKGROUND_IDS.forEach((id) => {
    const control = button(id === "starter_house_interior" ? "室内" : "庭", () => actions.selectItemSlotMap(id), ui.saving);
    if (id === ui.selectedMapId) control.setAttribute("aria-current", "true");
    tabs.append(control);
  });
  root.append(tabs);
  const preset = starterMaps.find((map) => map.mapId === ui.selectedMapId)!;
  const map = resolveMapLayout(preset, state.mapVisuals[ui.selectedMapId].locationLayout);
  const preview = document.createElement("div");
  preview.className = `location-layout-preview item-slot-preview map-canvas--${map.mapType}`;
  const backgroundUrl = backgrounds[ui.selectedMapId].url;
  if (backgroundUrl) {
    const image = document.createElement("img");
    image.src = backgroundUrl;
    image.alt = "";
    image.addEventListener("error", () => image.remove());
    preview.append(image);
  }
  map.locations.forEach((location) => {
    const marker = text("span", location.label, "layout-location item-slot-location");
    marker.style.left = `${location.position.x * 100}%`;
    marker.style.top = `${location.position.y * 100}%`;
    marker.setAttribute("aria-hidden", "true");
    preview.append(marker);
  });
  Object.entries(ui.draft[ui.selectedMapId]).forEach(([id, slot], index) => {
    const item = state.items.find((value) => value.itemId === slot.itemId);
    const control = button(item?.name ?? `空き${index + 1}`, () => actions.selectItemSlot(id), ui.saving);
    control.className = `slot-preview${id === ui.selectedSlotId ? " is-selected" : ""}`;
    control.style.left = `${slot.position.x * 100}%`;
    control.style.top = `${slot.position.y * 100}%`;
    if (id === ui.selectedSlotId) control.setAttribute("aria-current", "true");
    preview.append(control);
  });
  root.append(preview);
  const slot = ui.draft[ui.selectedMapId][ui.selectedSlotId] ?? Object.values(ui.draft[ui.selectedMapId])[0];
  const selectLabel = document.createElement("label");
  const select = document.createElement("select");
  selectLabel.append(text("span", "配置するアイテム"), select);
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "何も置かない";
  select.append(empty);
  state.items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.itemId;
    option.textContent = `${item.name}（${categoryLabels[item.category]}）`;
    option.selected = item.itemId === slot.itemId;
    select.append(option);
  });
  select.addEventListener("change", () => actions.assignItemSlot(select.value || null));
  root.append(selectLabel);
  (["x", "y"] as const).forEach((axis) => {
    const label = document.createElement("label");
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.min = ".05";
    input.max = ".95";
    input.step = ".01";
    input.value = String(slot.position[axis]);
    output.textContent = `${Math.round(slot.position[axis] * 100)}%`;
    label.append(text("span", axis === "x" ? "横位置" : "縦位置"), output, input);
    input.addEventListener("input", () => actions.updateItemSlotPosition(axis === "x" ? Number(input.value) : slot.position.x, axis === "y" ? Number(input.value) : slot.position.y));
    root.append(label);
  });
  const controls = document.createElement("div");
  controls.className = "pin-visual-actions";
  controls.append(
    button("このスロットを空にする", actions.clearItemSlot, ui.saving),
    button("このスロットの位置を初期値へ戻す", actions.resetItemSlotPosition, ui.saving),
    button("全スロットの位置を初期配置へ戻す", actions.resetAllItemSlotPositions, ui.saving),
    button("すべてのアイテムを外す", actions.clearAllItemSlots, ui.saving),
    button("この配置を保存", actions.saveItemSlots, ui.saving),
    button("キャンセル", actions.cancelItemSlots, ui.saving)
  );
  const live = text("p", ui.message, "character-image-live");
  live.setAttribute("aria-live", "polite");
  root.append(controls, live);
  return root;
};
