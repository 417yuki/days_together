import { navigationLabels } from "../../app/Router";
import type { AppState, NavigationId } from "../../app/Store";
import { getMapById } from "../../domain/maps/mapSelectors";
import type { LocationDefinition, MapId } from "../../domain/maps/mapTypes";
import { BottomNavigation } from "../components/BottomNavigation";
import { CurrentStatus } from "../components/CurrentStatus";
import { DeveloperPanel } from "../components/DeveloperPanel";
import { Header } from "../components/Header";
import { MapView } from "../components/MapView";
import { RecentActivity } from "../components/RecentActivity";

export type ScreenActions = { map: (id: MapId) => void; navigation: (id: NavigationId) => void; developer: (open?: boolean) => void; reset: () => void };
export const HomeScreen = (state: AppState, actions: ScreenActions, selectedLocation: string | null, onSelect: (label: string) => void): HTMLElement => {
  const shell = document.createElement("div"); shell.className = "app-shell"; const map = getMapById(state.viewedMapId); shell.append(Header(map, () => actions.developer(true)));
  const main = document.createElement("main");
  if (state.activeNavigation === "map") main.append(MapView({ map, selectedLocation, onMapChange: actions.map, onLocation: (location) => handleLocation(location, map.mapId, actions, onSelect), onResidents: () => showDialog("ふたりの居場所", "主人公：テーブル\nコーディ：作業台", "わかりました") }), CurrentStatus(map.mapId), RecentActivity());
  else { const pending = document.createElement("section"); pending.className = "content-card pending-screen"; pending.innerHTML = `<p class="eyebrow">ただいま準備中</p><h2>${navigationLabels[state.activeNavigation]}画面は準備中です</h2><p>これからの暮らしと一緒に、少しずつ増えていきます。</p>`; main.append(pending); }
  shell.append(main, BottomNavigation(state.activeNavigation, actions.navigation));
  if (state.developerPanelOpen) shell.append(DeveloperPanel(state, { close: () => actions.developer(false), interior: () => actions.map("starter_house_interior"), garden: () => actions.map("starter_garden"), reset: actions.reset }));
  return shell;
};
const handleLocation = (location: LocationDefinition, mapId: MapId, actions: ScreenActions, onSelect: (label: string) => void): void => { onSelect(location.label); if (!location.gateway) return; const goingOutside = mapId === "starter_house_interior"; showConfirm(goingOutside ? "庭へ出ますか？" : "家の中へ入りますか？", goingOutside ? "庭を見る" : "家の中を見る", () => actions.map(location.gateway!.destinationMapId)); };
const showDialog = (title: string, content: string, closeLabel: string): void => { const dialog = document.createElement("dialog"); dialog.className = "bottom-sheet"; dialog.innerHTML = `<h2>${title}</h2><p>${content.replace("\n", "<br>")}</p>`; const close = document.createElement("button"); close.type = "button"; close.textContent = closeLabel; close.addEventListener("click", () => dialog.close()); dialog.append(close); dialog.addEventListener("close", () => dialog.remove()); document.body.append(dialog); dialog.showModal(); };
const showConfirm = (title: string, confirmLabel: string, confirm: () => void): void => { const dialog = document.createElement("dialog"); dialog.className = "bottom-sheet"; dialog.innerHTML = `<h2>${title}</h2>`; const actions = document.createElement("div"); actions.className = "dialog-actions"; const yes = document.createElement("button"); yes.type = "button"; yes.className = "primary-button"; yes.textContent = confirmLabel; yes.addEventListener("click", () => { dialog.close(); confirm(); }); const no = document.createElement("button"); no.type = "button"; no.textContent = "キャンセル"; no.addEventListener("click", () => dialog.close()); actions.append(yes, no); dialog.append(actions); dialog.addEventListener("close", () => dialog.remove()); document.body.append(dialog); dialog.showModal(); yes.focus(); };