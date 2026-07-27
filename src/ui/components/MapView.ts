import { starterMaps } from "../../data/starterMaps";
import type { LocationDefinition, MapDefinition, MapId } from "../../domain/maps/mapTypes";

type MapViewOptions = { map: MapDefinition; selectedLocation: string | null; onMapChange: (id: MapId) => void; onLocation: (location: LocationDefinition) => void; onResidents: () => void };

export const MapView = ({ map, selectedLocation, onMapChange, onLocation, onResidents }: MapViewOptions): HTMLElement => {
  const section = document.createElement("section"); section.className = "map-section"; section.setAttribute("aria-labelledby", "map-heading");
  const heading = document.createElement("h2"); heading.id = "map-heading"; heading.className = "visually-hidden"; heading.textContent = `${map.name}のマップ`;
  const tabs = document.createElement("div"); tabs.className = "map-tabs"; tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "表示するマップ");
  starterMaps.forEach(({ mapId, name }) => { const button = document.createElement("button"); button.type = "button"; button.textContent = name; if (mapId === map.mapId) { button.className = "is-active"; button.setAttribute("aria-current", "true"); } button.addEventListener("click", () => onMapChange(mapId)); tabs.append(button); });
  const canvas = document.createElement("div"); canvas.className = `map-canvas map-canvas--${map.mapType}`; canvas.setAttribute("aria-label", map.name);
  if (map.mapType === "outdoor") { const house = document.createElement("button"); house.className = "house-panel"; house.type = "button"; house.innerHTML = `<span class="house-roof" aria-hidden="true"></span><strong>小さな家</strong><span>家の外観</span>`; house.setAttribute("aria-label", "家の外観。家の中へ入る"); house.addEventListener("click", () => onLocation(map.locations[0])); canvas.append(house); }
  map.locations.forEach((location) => { const button = document.createElement("button"); button.type = "button"; button.className = "map-location"; button.textContent = location.label; button.style.left = `${location.position.x * 100}%`; button.style.top = `${location.position.y * 100}%`; button.addEventListener("click", () => onLocation(location)); canvas.append(button); });
  if (map.mapType === "interior") {
    canvas.append(character("U", "主人公：テーブル", 29, 55), character("S", "サム：作業台", 76, 31));
  } else {
    const residents = document.createElement("button"); residents.type = "button"; residents.className = "residents-pin"; residents.innerHTML = `<strong>U・S</strong><span>家の中にいます</span>`; residents.setAttribute("aria-label", "家の中にいる二人の居場所を確認"); residents.addEventListener("click", onResidents); canvas.append(residents);
  }
  const feedback = document.createElement("p"); feedback.className = "map-feedback"; feedback.setAttribute("aria-live", "polite"); feedback.textContent = selectedLocation ? `「${selectedLocation}」を選択しました` : "場所を選んでみましょう";
  section.append(heading, tabs, canvas, feedback); return section;
};

const character = (letter: string, label: string, x: number, y: number): HTMLElement => { const pin = document.createElement("div"); pin.className = "character-pin"; pin.style.left = `${x}%`; pin.style.top = `${y}%`; pin.textContent = letter; pin.setAttribute("role", "img"); pin.setAttribute("aria-label", label); pin.title = label; return pin; };
