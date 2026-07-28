import type { MapId } from "../domain/maps/mapTypes";
import type { CharacterState } from "../domain/characters/characterTypes";
import type { CharacterId } from "../domain/characters/characterTypes";
import type { LocationRef } from "../domain/maps/mapTypes";
import { advanceMovement, buildLocationGraph, startMovement, type MovementState } from "../domain/movement/movement";
import { starterMaps } from "../data/starterMaps";

export type NavigationId = "map" | "items" | "memories" | "partner" | "settings";
export type AppState = { viewedMapId: MapId; activeNavigation: NavigationId; developerPanelOpen: boolean; characters: CharacterState[]; movements: Partial<Record<CharacterId, MovementState>>; message: string };
export const initialState: AppState = {
  viewedMapId: "starter_house_interior",
  activeNavigation: "map",
  developerPanelOpen: false,
  movements: {}, message: "場所を選んでみましょう", characters: [
    { characterId: "user", name: "主人公", marker: "U", mapId: "starter_house_interior", locationId: "table" },
    { characterId: "cody", name: "コーディ", marker: "C", mapId: "starter_house_interior", locationId: "workbench" }
  ]
};
type Listener = (state: AppState) => void;

export class Store {
  private state: AppState = cloneInitialState();
  private listeners = new Set<Listener>();
  getState = (): AppState => ({ ...this.state, characters: this.state.characters.map((character) => ({ ...character })), movements: { ...this.state.movements } });
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private update(next: Partial<AppState>): void { this.state = { ...this.state, ...next }; this.listeners.forEach((listener) => listener(this.getState())); }
  setViewedMap(mapId: MapId): void { this.update({ viewedMapId: mapId }); }
  setNavigation(activeNavigation: NavigationId): void { this.update({ activeNavigation }); }
  toggleDeveloperPanel(force?: boolean): void { this.update({ developerPanelOpen: force ?? !this.state.developerPanelOpen }); }
  beginMovement(characterId: CharacterId, destination: LocationRef): "started" | "busy" | "invalid" | "same" {
    if (this.state.movements[characterId]) { this.update({ message: "移動中です" }); return "busy"; }
    const character = this.state.characters.find((candidate) => candidate.characterId === characterId); if (!character) return "invalid";
    if (character.mapId === destination.mapId && character.locationId === destination.locationId) return "same";
    const graph = buildLocationGraph(starterMaps, (message) => console.warn(message)); const movement = startMovement(character, destination, graph);
    if (!movement) { this.update({ message: "その場所への経路が見つかりません" }); return "invalid"; }
    this.update({ movements: { ...this.state.movements, [characterId]: movement }, message: `${character.name}が移動を始めました` }); return "started";
  }
  advanceCharacter(characterId: CharacterId): boolean {
    const movement = this.state.movements[characterId]; const index = this.state.characters.findIndex((character) => character.characterId === characterId); if (!movement || index < 0) return false;
    const result = advanceMovement(this.state.characters[index], movement); const characters = [...this.state.characters]; characters[index] = result.character; const movements = { ...this.state.movements }; if (result.movement) movements[characterId] = result.movement; else delete movements[characterId];
    this.update({ characters, movements, message: result.movement ? `${result.character.name}は移動中です` : `${result.character.name}が目的地に着きました` }); return Boolean(result.movement);
  }
  reset(): void { this.state = cloneInitialState(); this.listeners.forEach((listener) => listener(this.getState())); }
}

const cloneInitialState = (): AppState => ({ ...initialState, characters: initialState.characters.map((character) => ({ ...character })), movements: {} });
