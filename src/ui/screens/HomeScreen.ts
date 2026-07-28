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

export type ScreenActions = { map: (id: MapId) => void; navigation: (id: NavigationId) => void; developer: (open?: boolean) => void; move: (id: CharacterId, destination: LocationRef) => void; reset: () => void };
export const HomeScreen = (state: AppState, actions: ScreenActions): HTMLElement => {
  const shell = document.createElement("div"); shell.className = "app-shell"; const map = getMapById(state.viewedMapId); shell.append(Header(map, () => actions.developer(true)));
  const main = document.createElement("main");
  if (state.activeNavigation === "map") {
    main.append(
      MapView({ map, characters: state.characters, feedback: state.message, onMapChange: actions.map, onLocation: (location) => actions.move("user", { mapId: map.mapId, locationId: location.locationId }), onHouse: () => actions.map("starter_house_interior"), onResidents: (trigger) => showResidentsDialog(state, trigger) }),
      CurrentStatus(state),
      RecentActivity()
    );
  } else {
    const pending = document.createElement("section"); pending.className = "content-card pending-screen";
    pending.append(textElement("p", "ただいま準備中", "eyebrow"), textElement("h2", `${navigationLabels[state.activeNavigation]}画面は準備中です`), textElement("p", "これからの暮らしと一緒に、少しずつ増えていきます。")); main.append(pending);
  }
  shell.append(main, BottomNavigation(state.activeNavigation, actions.navigation));
  if (state.developerPanelOpen) shell.append(DeveloperPanel(state, { close: () => actions.developer(false), interior: () => actions.map("starter_house_interior"), garden: () => actions.map("starter_garden"), moveCody: (destination) => actions.move("cody", destination), reset: actions.reset }));
  return shell;
};

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
