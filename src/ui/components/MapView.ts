import { starterMaps } from "../../data/starterMaps";
import type { CharacterState } from "../../domain/characters/characterTypes";
import { selectCharactersOnMap, selectProxyCharacters } from "../../domain/maps/mapSelectors";
import type { LocationDefinition, MapDefinition, MapId } from "../../domain/maps/mapTypes";
import { unknownSproutDefinition, type UnknownSproutState } from "../../domain/events/unknownSprout";
import { characterPinStyle, normalizeCharacterPinVisual } from "../../domain/characters/characterPinVisual";
import type { MapGatewayVisual } from "../../domain/maps/mapGatewayVisual";
import type { GameItem } from "../../domain/items/items";
import { resolvePlacedItems, type MapItemSlotLayout } from "../../domain/maps/mapItemSlots";
import { ItemIcon } from "../icons/itemIcons";

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
  characterImages?: Partial<Record<"user" | "cody", string>>;
  backgroundUrl?: string;
  gatewayVisual: MapGatewayVisual;
  itemSlots: MapItemSlotLayout;
  items: GameItem[];
  onItem: (itemId: string) => void;
};

export const MapView = ({ map, characters, characterImages = {}, backgroundUrl, gatewayVisual, itemSlots, items, onItem, feedback: feedbackText, onMapChange, onLocation, onHouse, onResidents, unknownSprout, onEvent }: MapViewOptions): HTMLElement => {
  const section = document.createElement("section"); section.className = "map-section"; section.setAttribute("aria-labelledby", "map-heading");
  const heading = document.createElement("h2"); heading.id = "map-heading"; heading.className = "visually-hidden"; heading.textContent = `${map.name}のマップ`;
  const tabs = document.createElement("div"); tabs.className = "map-tabs"; tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "表示するマップ");
  starterMaps.forEach(({ mapId, name }) => { const button = document.createElement("button"); button.type = "button"; button.textContent = name; if (mapId === map.mapId) { button.className = "is-active"; button.setAttribute("aria-current", "true"); } button.addEventListener("click", () => onMapChange(mapId)); tabs.append(button); });
  const canvas = document.createElement("div"); canvas.className = `map-canvas map-canvas--${map.mapType}`; canvas.setAttribute("aria-label", map.name);
  if (backgroundUrl) { const background = document.createElement("img"); background.className = "map-background-image"; background.src = backgroundUrl; background.alt = ""; background.setAttribute("aria-hidden", "true"); canvas.append(background); }
  if (map.mapType === "outdoor") {
    const house = document.createElement("button"); house.className = "house-panel"; house.type = "button";
    const roof = document.createElement("span"); roof.className = "house-roof"; roof.setAttribute("aria-hidden", "true");
    const name = document.createElement("strong"); name.textContent = "小さな家";
    const description = document.createElement("span"); description.textContent = "家の外観";
    house.append(roof, name, description); house.style.left = `${gatewayVisual.entryAffordancePosition!.x * 100}%`; house.style.top = `${gatewayVisual.entryAffordancePosition!.y * 100}%`; house.dataset.focusKey = `house-${map.mapId}`; house.setAttribute("aria-label", "家の外観。家の中を見る"); house.addEventListener("click", onHouse); canvas.append(house);
  }
  resolvePlacedItems(itemSlots, items).forEach(({ slotId, position, item }) => { const placed = document.createElement("button"); placed.type = "button"; placed.className = "map-item"; placed.dataset.focusKey = `item-${slotId}`; placed.style.left = `${position.x * 100}%`; placed.style.top = `${position.y * 100}%`; placed.setAttribute("aria-label", `${item.name}の詳細を見る`); const name = document.createElement("span"); name.textContent = item.name; placed.append(ItemIcon(item.visual.iconKey), name); placed.addEventListener("click", () => onItem(item.itemId)); canvas.append(placed); });
  map.locations.forEach((location) => { const button = document.createElement("button"); button.type = "button"; button.className = "map-location"; button.dataset.focusKey = `location-${map.mapId}-${location.locationId}`; button.textContent = location.label; positionAt(button, location); button.addEventListener("click", () => onLocation(location)); canvas.append(button); });
  if (map.mapId === unknownSproutDefinition.mapId && unknownSprout.status !== "locked") {
    const marker = document.createElement("button"); marker.type = "button"; marker.className = `event-marker event-marker--${unknownSprout.stage}`; marker.dataset.focusKey = "event-unknown_sprout";
    marker.textContent = unknownSprout.stage === "flower" ? "✿ 花" : unknownSprout.stage === "growing" ? "🌱 育つ芽" : unknownSprout.stage === "observed" ? "🌱 観察中" : "🌱 芽";
    marker.setAttribute("aria-label", unknownSprout.stage === "flower" ? "知らない芽から咲いた花。概要を見る" : `${marker.textContent}。知らない芽の概要を見る`);
    const eventPosition = map.locations.find(({ locationId }) => locationId === "garden")?.position ?? unknownSproutDefinition.position;
    marker.style.left = `${eventPosition.x * 100}%`; marker.style.top = `${eventPosition.y * 100}%`; marker.addEventListener("click", () => onEvent(marker)); canvas.append(marker);
  }
  selectCharactersOnMap(characters, map).forEach(({ character: state, location }) => canvas.append(character(state, location, characterImages[state.characterId])));
  const proxies = selectProxyCharacters(characters, map);
  if (proxies.length > 0) {
    const residents = document.createElement("button"); residents.type = "button"; residents.className = "residents-pin"; residents.style.left = `${gatewayVisual.proxyPosition.x * 100}%`; residents.style.top = `${gatewayVisual.proxyPosition.y * 100}%`;
    const markers = document.createElement("strong"); proxies.forEach(({ character }) => { const url = characterImages[character.characterId]; if (url) { const image = document.createElement("img"); image.src = url; image.alt = ""; const safe = normalizeCharacterPinVisual(character.pinVisual); image.style.objectPosition = `${safe.objectPositionX}% ${safe.objectPositionY}%`; markers.append(image); } else markers.append(document.createTextNode(character.marker)); });
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

const character = (state: CharacterState, location: LocationDefinition, imageUrl?: string): HTMLElement => {
  const pin = document.createElement("div"); pin.className = "character-pin"; positionAt(pin, location); if (imageUrl) { const image = document.createElement("img"); image.src = imageUrl; image.alt = ""; const style = characterPinStyle(state.pinVisual); pin.style.width = style.width; pin.style.height = style.height; pin.style.transform = style.transform; image.style.objectPosition = style.objectPosition; pin.append(image); } else pin.textContent = state.marker;
  const label = `${state.name}：${location.label}`; pin.setAttribute("role", "img"); pin.setAttribute("aria-label", label); pin.title = label; return pin;
};
