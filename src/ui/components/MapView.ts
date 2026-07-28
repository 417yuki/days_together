import { starterMaps } from "../../data/starterMaps";
import type { CharacterState } from "../../domain/characters/characterTypes";
import { selectCharactersOnMap, selectProxyCharacters } from "../../domain/maps/mapSelectors";
import type { LocationDefinition, MapDefinition, MapId } from "../../domain/maps/mapTypes";
import { unknownSproutDefinition, type UnknownSproutState } from "../../domain/events/unknownSprout";

type MapViewOptions = {
  map: MapDefinition;
  characters: CharacterState[];
  feedback: string;
  onMapChange: (id: MapId) => void;
  onLocation: (location: LocationDefinition) => void;
  onHouse: () => void;
  onResidents: (trigger: HTMLElement) => void;
  unknownSprout: UnknownSproutState;
  onEvent: (trigger: HTMLElement) => void;
};

export const MapView = ({ map, characters, feedback: feedbackText, onMapChange, onLocation, onHouse, onResidents, unknownSprout, onEvent }: MapViewOptions): HTMLElement => {
  const section = document.createElement("section"); section.className = "map-section"; section.setAttribute("aria-labelledby", "map-heading");
  const heading = document.createElement("h2"); heading.id = "map-heading"; heading.className = "visually-hidden"; heading.textContent = `${map.name}のマップ`;
  const tabs = document.createElement("div"); tabs.className = "map-tabs"; tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "表示するマップ");
  starterMaps.forEach(({ mapId, name }) => { const button = document.createElement("button"); button.type = "button"; button.textContent = name; if (mapId === map.mapId) { button.className = "is-active"; button.setAttribute("aria-current", "true"); } button.addEventListener("click", () => onMapChange(mapId)); tabs.append(button); });
  const canvas = document.createElement("div"); canvas.className = `map-canvas map-canvas--${map.mapType}`; canvas.setAttribute("aria-label", map.name);
  if (map.mapType === "outdoor") {
    const house = document.createElement("button"); house.className = "house-panel"; house.type = "button";
    const roof = document.createElement("span"); roof.className = "house-roof"; roof.setAttribute("aria-hidden", "true");
    const name = document.createElement("strong"); name.textContent = "小さな家";
    const description = document.createElement("span"); description.textContent = "家の外観";
    house.append(roof, name, description); house.dataset.focusKey = `house-${map.mapId}`; house.setAttribute("aria-label", "家の外観。家の中を見る"); house.addEventListener("click", onHouse); canvas.append(house);
  }
  map.locations.forEach((location) => { const button = document.createElement("button"); button.type = "button"; button.className = "map-location"; button.dataset.focusKey = `location-${map.mapId}-${location.locationId}`; button.textContent = location.label; positionAt(button, location); button.addEventListener("click", () => onLocation(location)); canvas.append(button); });
  if (map.mapId === unknownSproutDefinition.mapId && unknownSprout.status !== "locked") {
    const marker = document.createElement("button"); marker.type = "button"; marker.className = `event-marker event-marker--${unknownSprout.stage}`; marker.dataset.focusKey = "event-unknown_sprout";
    marker.textContent = unknownSprout.stage === "flower" ? "✿ 花" : unknownSprout.stage === "growing" ? "🌱 育つ芽" : unknownSprout.stage === "observed" ? "🌱 観察中" : "🌱 芽";
    marker.setAttribute("aria-label", unknownSprout.stage === "flower" ? "知らない芽から咲いた花。概要を見る" : `${marker.textContent}。知らない芽の概要を見る`);
    marker.style.left = `${unknownSproutDefinition.position.x * 100}%`; marker.style.top = `${unknownSproutDefinition.position.y * 100}%`; marker.addEventListener("click", () => onEvent(marker)); canvas.append(marker);
  }
  selectCharactersOnMap(characters, map).forEach(({ character: state, location }) => canvas.append(character(state, location)));
  const proxies = selectProxyCharacters(characters, map);
  if (proxies.length > 0) {
    const residents = document.createElement("button"); residents.type = "button"; residents.className = "residents-pin"; positionAt(residents, proxies[0].location);
    const markers = document.createElement("strong"); markers.textContent = proxies.map(({ character }) => character.marker).join("・");
    const description = document.createElement("span"); description.textContent = `${proxies.map(({ character }) => character.name).join("と")}は別のマップにいます`;
    residents.append(markers, description); residents.dataset.focusKey = `residents-${map.mapId}`; residents.setAttribute("aria-label", `${description.textContent}。居場所を確認`); residents.addEventListener("click", () => onResidents(residents)); canvas.append(residents);
  }
  const feedback = document.createElement("p"); feedback.className = "map-feedback"; feedback.setAttribute("aria-live", "polite"); feedback.textContent = feedbackText;
  section.append(heading, tabs, canvas, feedback); return section;
};

const positionAt = (element: HTMLElement, location: LocationDefinition): void => {
  element.style.left = `${location.position.x * 100}%`;
  element.style.top = `${location.position.y * 100}%`;
};

const character = (state: CharacterState, location: LocationDefinition): HTMLElement => {
  const pin = document.createElement("div"); pin.className = "character-pin"; positionAt(pin, location); pin.textContent = state.marker;
  const label = `${state.name}：${location.label}`; pin.setAttribute("role", "img"); pin.setAttribute("aria-label", label); pin.title = label; return pin;
};
