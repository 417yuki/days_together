import type { MapId } from "../domain/maps/mapTypes";
import type { CharacterState } from "../domain/characters/characterTypes";

export type NavigationId = "map" | "items" | "memories" | "partner" | "settings";
export type AppState = { viewedMapId: MapId; activeNavigation: NavigationId; developerPanelOpen: boolean; characters: CharacterState[] };
export const initialState: AppState = {
  viewedMapId: "starter_house_interior",
  activeNavigation: "map",
  developerPanelOpen: false,
  characters: [
    { characterId: "user", name: "主人公", marker: "U", mapId: "starter_house_interior", locationId: "table" },
    { characterId: "cody", name: "コーディ", marker: "C", mapId: "starter_house_interior", locationId: "workbench" }
  ]
};
type Listener = (state: AppState) => void;

export class Store {
  private state: AppState = { ...initialState, characters: initialState.characters.map((character) => ({ ...character })) };
  private listeners = new Set<Listener>();
  getState = (): AppState => ({ ...this.state, characters: this.state.characters.map((character) => ({ ...character })) });
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private update(next: Partial<AppState>): void { this.state = { ...this.state, ...next }; this.listeners.forEach((listener) => listener(this.getState())); }
  setViewedMap(mapId: MapId): void { this.update({ viewedMapId: mapId }); }
  setNavigation(activeNavigation: NavigationId): void { this.update({ activeNavigation }); }
  toggleDeveloperPanel(force?: boolean): void { this.update({ developerPanelOpen: force ?? !this.state.developerPanelOpen }); }
  reset(): void { this.state = { ...initialState, characters: initialState.characters.map((character) => ({ ...character })) }; this.listeners.forEach((listener) => listener(this.getState())); }
}
