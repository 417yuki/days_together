import type { MapId } from "../domain/maps/mapTypes";

export type NavigationId = "map" | "items" | "memories" | "partner" | "settings";
export type AppState = { viewedMapId: MapId; activeNavigation: NavigationId; developerPanelOpen: boolean };
export const initialState: AppState = { viewedMapId: "starter_house_interior", activeNavigation: "map", developerPanelOpen: false };
type Listener = (state: AppState) => void;

export class Store {
  private state: AppState = { ...initialState };
  private listeners = new Set<Listener>();
  getState = (): AppState => ({ ...this.state });
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private update(next: Partial<AppState>): void { this.state = { ...this.state, ...next }; this.listeners.forEach((listener) => listener(this.getState())); }
  setViewedMap(mapId: MapId): void { this.update({ viewedMapId: mapId }); }
  setNavigation(activeNavigation: NavigationId): void { this.update({ activeNavigation }); }
  toggleDeveloperPanel(force?: boolean): void { this.update({ developerPanelOpen: force ?? !this.state.developerPanelOpen }); }
  reset(): void { this.state = { ...initialState }; this.listeners.forEach((listener) => listener(this.getState())); }
}
