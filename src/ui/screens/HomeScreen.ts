import { navigationLabels } from "../../app/Router";
import type { AppState, NavigationId } from "../../app/Store";
import { getMapById } from "../../domain/maps/mapSelectors";
import type { MapId } from "../../domain/maps/mapTypes";
import type { CharacterId } from "../../domain/characters/characterTypes";
import type { LocationRef } from "../../domain/maps/mapTypes";
import { BottomNavigation } from "../components/BottomNavigation";
import { CurrentStatus } from "../components/CurrentStatus";
import { DeveloperPanel } from "../components/DeveloperPanel";
import { Header } from "../components/Header";
import { MapView } from "../components/MapView";
import { RecentActivity } from "../components/RecentActivity";
import type { UnknownSproutChoiceId, UnknownSproutState } from "../../domain/events/unknownSprout";
import { PartnerScreen, type PartnerScreenActions } from "./PartnerScreen";
import { SettingsScreen, type CharacterImageUi, type MapBackgroundUi, type SettingsActions } from "./SettingsScreen";
import type { MapBackgroundId } from "../../domain/assets/mapBackgrounds";
import { ItemsScreen, type ItemImageUi, type ItemScreenActions } from "./ItemsScreen";

export type ScreenActions = PartnerScreenActions & ItemScreenActions & SettingsActions & { map: (id: MapId) => void; navigation: (id: NavigationId) => void; developer: (open?: boolean) => void; move: (id: CharacterId, destination: LocationRef) => void; pausePartner: () => void; resumePartner: () => void; decidePartner: () => void; openEvent: () => void; closeEvent: () => void; advanceEvent: (choice: UnknownSproutChoiceId) => void; triggerEvent: () => void; resetEvent: () => void; reset: () => void; startConsultation: () => void; setConsultationResponse: (value: string) => void; checkConsultation: () => void; editConsultation: () => void; cancelConsultation: () => void; applyConsultation: () => void };
export const HomeScreen = (state: AppState, actions: ScreenActions, itemImage?: ItemImageUi, characterImages?: Record<CharacterId, CharacterImageUi>, backgrounds?: Record<MapBackgroundId, MapBackgroundUi>): HTMLElement => {
  const shell = document.createElement("div"); shell.className = "app-shell"; const map = getMapById(state.viewedMapId); shell.append(Header(map, () => actions.developer(true)));
  const main = document.createElement("main");
  if (state.saveStatus === "failed") {
    const warning = document.createElement("p"); warning.className = "save-warning"; warning.setAttribute("role", "status"); warning.setAttribute("aria-live", "polite"); warning.textContent = "保存できませんでした。この画面を閉じると変更が失われる可能性があります。"; main.append(warning);
  }
  if (state.activeNavigation === "map" && state.openEventId) {
    main.append(state.consultationView === "closed" ? EventDetail(state, actions) : ConsultationScreen(state, actions));
  } else if (state.activeNavigation === "map") {
    main.append(
      MapView({ map, backgroundUrl: backgrounds?.[map.mapId].url ?? undefined, characters: state.characters, characterImages: Object.fromEntries(Object.entries(characterImages ?? {}).filter(([, value]) => value.url).map(([id, value]) => [id, value.url])) as Partial<Record<CharacterId, string>>, feedback: state.message, unknownSprout: state.unknownSprout, onEvent: (trigger) => showEventSummary(state.unknownSprout, trigger, actions.openEvent), onMapChange: actions.map, onLocation: (location) => actions.move("user", { mapId: map.mapId, locationId: location.locationId }), onHouse: () => actions.map("starter_house_interior"), onResidents: (trigger) => showResidentsDialog(state, trigger) }),
      CurrentStatus(state),
      RecentActivity(state.unknownSprout)
    );
  } else if (state.activeNavigation === "partner") {
    main.append(PartnerScreen(state, actions));
  } else if (state.activeNavigation === "items") {
    main.append(ItemsScreen(state, actions, itemImage));
  } else if (state.activeNavigation === "settings" && characterImages && backgrounds) {
    main.append(SettingsScreen(state, actions, characterImages, backgrounds));
  } else {
    const pending = document.createElement("section"); pending.className = "content-card pending-screen";
    pending.append(textElement("p", "ただいま準備中", "eyebrow"), textElement("h2", `${navigationLabels[state.activeNavigation]}画面は準備中です`), textElement("p", "これからの暮らしと一緒に、少しずつ増えていきます。")); main.append(pending);
  }
  shell.append(main, BottomNavigation(state.activeNavigation, actions.navigation));
  if (state.developerPanelOpen) shell.append(DeveloperPanel(state, { close: () => actions.developer(false), interior: () => actions.map("starter_house_interior"), garden: () => actions.map("starter_garden"), moveCody: (destination) => actions.move("cody", destination), pausePartner: actions.pausePartner, resumePartner: actions.resumePartner, decidePartner: actions.decidePartner, triggerEvent: actions.triggerEvent, resetEvent: actions.resetEvent, reset: actions.reset }));
  return shell;
};

const summary = (event: UnknownSproutState): string => event.stage === "sprout" ? "庭の土から、見覚えのない小さな芽が顔を出しています。" : event.stage === "observed" ? "葉は二枚。植えた覚えはないけれど、元気そうです。" : event.stage === "growing" ? event.path === "tended" ? "土を整えて水をあげた芽が、ゆっくり茎を伸ばしています。" : "そっと見守っている芽が、日差しの方へ少し傾いています。" : event.path === "tended" ? "手入れを続けた芽は、淡い黄色の小さな花になりました。" : "そっと見守った芽は、白い小さな花を静かに開きました。";
const showEventSummary = (event: UnknownSproutState, trigger: HTMLElement, open: () => void): void => {
  const dialog = document.createElement("dialog"); dialog.className = "bottom-sheet"; dialog.append(textElement("h2", "知らない芽"), textElement("p", summary(event)));
  const actions = document.createElement("div"); actions.className = "dialog-actions"; const detail = document.createElement("button"); detail.type = "button"; detail.className = "primary-button"; detail.textContent = "詳しく見る"; detail.addEventListener("click", () => { dialog.close(); open(); }); const close = document.createElement("button"); close.type = "button"; close.textContent = "閉じる"; close.addEventListener("click", () => dialog.close()); actions.append(detail, close); dialog.append(actions); finishDialog(dialog, trigger); document.body.append(dialog); dialog.showModal(); detail.focus();
};
const EventDetail = (state: AppState, actions: ScreenActions): HTMLElement => { const event = state.unknownSprout;
  const section = document.createElement("section"); section.className = "content-card event-detail"; section.setAttribute("aria-labelledby", "event-title"); const back = document.createElement("button"); back.type = "button"; back.textContent = "マップへ戻る"; back.addEventListener("click", actions.closeEvent); const title = textElement("h2", "知らない芽"); title.id = "event-title";
  const stage = textElement("p", `現在の段階：${event.stage === "sprout" ? "小さな芽" : event.stage === "observed" ? "観察済み" : event.stage === "growing" ? "成長中" : "花"}`, "eyebrow"); const description = textElement("p", event.stage === "observed" ? "葉は二枚。植えた覚えはないけれど、茎はまっすぐで元気そうです。" : event.stage === "flower" ? event.path === "tended" ? "淡い黄色の小さな花が咲きました。特別な正体は決めず、庭の新しい花として残ります。" : "白い小さな花が静かに開きました。特別な正体は決めず、庭の新しい花として残ります。" : summary(event)); section.append(back, title, stage, description);
  const choices: [UnknownSproutChoiceId, string][] = event.status === "available" ? [["observe", "観察する"]] : event.stage === "observed" ? [["tend", "土を整えて水をあげる"], ["watch", "触れずに見守る"]] : event.stage === "growing" ? [["finish", "次の様子を見る"]] : [];
  if (choices.length) { const controls = document.createElement("div"); controls.className = "event-choices"; choices.forEach(([id, label]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.addEventListener("click", () => actions.advanceEvent(id)); controls.append(button); }); section.append(controls); }
  if (state.unknownSproutExtension) { const extension = state.unknownSproutExtension; section.append(textElement("h3", extension.flowerName ?? "庭の小さな花"), textElement("blockquote", extension.partnerLine, "consultation-quote"), textElement("p", extension.note), textElement("p", "パートナーチャットから手動で取り込んだ言葉です。", "eyebrow")); }
  else if (event.status === "completed") { const consult = document.createElement("button"); consult.type = "button"; consult.className = "primary-button consultation-start"; consult.textContent = state.pendingConsultation ? "相談を再開する" : "パートナーに相談する"; consult.addEventListener("click", actions.startConsultation); section.append(consult); }
  return section;
};

const ConsultationScreen = (state: AppState, actions: ScreenActions): HTMLElement => { const section = document.createElement("section"); section.className = "content-card consultation-screen"; const back = document.createElement("button"); back.type = "button"; back.textContent = "花へ戻る"; back.addEventListener("click", actions.cancelConsultation); section.append(back, textElement("h2", state.consultationView === "confirm" ? "取込内容を確認" : "パートナーに相談")); const live = textElement("p", state.consultationMessage, "consultation-live"); live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
  if (state.consultationView === "confirm" && state.consultationPreview) { const value = state.consultationPreview; section.append(textElement("p", "この内容はまだ反映されていません。"), labelValue("花の名前", value.flowerName ?? "名前を付けない"), labelValue("パートナーの一言", value.partnerLine), labelValue("花の説明", value.note), labelValue("対象イベント", "知らない芽"), labelValue("対象経路", value.expectedPath === "tended" ? "手入れした花" : "見守った花"), live); const controls = document.createElement("div"); controls.className = "event-choices"; controls.append(button("反映する", actions.applyConsultation, "primary-button"), button("返答を修正する", actions.editConsultation), button("相談をやめる", actions.cancelConsultation)); section.append(controls); return section; }
  const pending = state.pendingConsultation; if (!pending) { section.append(textElement("p", "相談を準備できませんでした。"), live); return section; } section.append(textElement("p", "下の文章を、普段のパートナーチャットへ手動で送ってください。ゲームから自動送信はしません。")); const promptLabel = textElement("label", "送信用プロンプト"); promptLabel.htmlFor = "consultation-prompt"; const prompt = document.createElement("textarea"); prompt.id = "consultation-prompt"; prompt.readOnly = true; prompt.value = pending.prompt; const copy = button("プロンプトをコピー", () => { navigator.clipboard.writeText(pending.prompt).then(() => { live.textContent = "プロンプトをコピーしました。"; }).catch(() => { prompt.focus(); prompt.select(); live.textContent = "コピーできませんでした。文章を長押ししてコピーしてください。"; }); }, "primary-button"); const responseLabel = textElement("label", "パートナーチャットからの返答"); responseLabel.htmlFor = "consultation-response"; const response = document.createElement("textarea"); response.id = "consultation-response"; response.maxLength = 30000; response.value = state.consultationResponse; response.addEventListener("input", () => actions.setConsultationResponse(response.value)); section.append(promptLabel, prompt, copy, responseLabel, response, button("内容を確認", actions.checkConsultation, "primary-button"), live); return section; };
const labelValue = (label: string, value: string): HTMLElement => { const group = document.createElement("div"); group.className = "consultation-value"; group.append(textElement("h3", label), textElement("p", value)); return group; };
const button = (label: string, action: () => void, className = ""): HTMLButtonElement => { const element = document.createElement("button"); element.type = "button"; element.textContent = label; element.className = className; element.addEventListener("click", action); return element; };

const showResidentsDialog = (state: AppState, trigger: HTMLElement): void => {
  const content = state.characters.map((character) => {
    const location = getMapById(character.mapId).locations.find(({ locationId }) => locationId === character.locationId);
    return `${character.name}：${location?.label ?? "不明な場所"}`;
  }).join("\n");
  showDialog("ふたりの居場所", content, "わかりました", trigger);
};

const showDialog = (title: string, content: string, closeLabel: string, trigger: HTMLElement): void => {
  const dialog = document.createElement("dialog"); dialog.className = "bottom-sheet";
  dialog.append(textElement("h2", title), textElement("p", content));
  const close = document.createElement("button"); close.type = "button"; close.textContent = closeLabel; close.addEventListener("click", () => dialog.close()); dialog.append(close);
  finishDialog(dialog, trigger); document.body.append(dialog); dialog.showModal(); close.focus();
};

const finishDialog = (dialog: HTMLDialogElement, trigger: HTMLElement): void => {
  const focusKey = trigger.dataset.focusKey;
  dialog.addEventListener("close", () => {
    dialog.remove();
    const currentTrigger = trigger.isConnected ? trigger : [...document.querySelectorAll<HTMLElement>("[data-focus-key]")].find((element) => element.dataset.focusKey === focusKey);
    currentTrigger?.focus();
  });
};

const textElement = <K extends keyof HTMLElementTagNameMap>(tag: K, text: string, className = ""): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag); element.textContent = text; element.className = className; return element;
};
