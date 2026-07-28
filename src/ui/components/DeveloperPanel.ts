import type { AppState } from "../../app/Store";
import { starterMaps } from "../../data/starterMaps";
import { getMapById } from "../../domain/maps/mapSelectors";
import type { LocationRef } from "../../domain/maps/mapTypes";

export const DeveloperPanel = (state: AppState, actions: { close: () => void; interior: () => void; garden: () => void; moveCody: (destination: LocationRef) => void; reset: () => void }): HTMLElement => {
  const aside = document.createElement("aside"); aside.className = "developer-panel"; aside.setAttribute("aria-labelledby", "developer-title");
  const heading = document.createElement("div"); heading.className = "panel-heading";
  const title = document.createElement("h2"); title.id = "developer-title"; title.textContent = "開発者パネル"; heading.append(title, makeButton("閉じる", actions.close, "panel-close"));
  const details = document.createElement("dl");
  appendDetail(details, "マップID", state.viewedMapId); appendDetail(details, "ナビゲーション", state.activeNavigation);
  state.characters.forEach((character) => { const location = getMapById(character.mapId).locations.find((candidate) => candidate.locationId === character.locationId); appendDetail(details, `${character.name}の現在地`, `${character.mapId}:${location?.label ?? character.locationId}`); });
  const controls = document.createElement("div"); controls.className = "developer-actions"; controls.append(makeButton("室内を表示", actions.interior), makeButton("庭を表示", actions.garden), makeButton("初期状態へ戻す", actions.reset));
  const moveLabel = document.createElement("label"); moveLabel.textContent = "コーディの移動先"; const select = document.createElement("select"); select.disabled = Boolean(state.movements.cody);
  const prompt = document.createElement("option"); prompt.textContent = state.movements.cody ? "移動中です" : "地点を選択"; prompt.value = ""; select.append(prompt);
  starterMaps.forEach((map) => map.locations.forEach((location) => { const option = document.createElement("option"); option.value = `${map.mapId}:${location.locationId}`; option.textContent = `${map.name}：${location.label}`; select.append(option); }));
  select.addEventListener("change", () => { const [mapId, locationId] = select.value.split(":") as [LocationRef["mapId"], string]; if (mapId && locationId) actions.moveCody({ mapId, locationId }); }); moveLabel.append(select);
  aside.append(heading, details, moveLabel, controls); return aside;
};

const appendDetail = (list: HTMLDListElement, label: string, value: string): void => {
  const term = document.createElement("dt"); term.textContent = label; const description = document.createElement("dd"); const code = document.createElement("code"); code.textContent = value; description.append(code); list.append(term, description);
};

const makeButton = (label: string, action: () => void, className = ""): HTMLButtonElement => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.className = className; button.addEventListener("click", action); return button; };
