import { Store } from "./Store";
import { HomeScreen } from "../ui/screens/HomeScreen";
import type { CharacterId } from "../domain/characters/characterTypes";
import type { LocationRef } from "../domain/maps/mapTypes";

const MOVEMENT_STEP_MS = 380;

export class App {
  private movementTimers = new Map<CharacterId, number>();
  constructor(private root: HTMLElement, private store = new Store()) {}
  mount(): void { this.store.subscribe(() => this.render()); this.render(); }
  private render(): void {
    const actions = {
      map: (id: Parameters<Store["setViewedMap"]>[0]) => this.store.setViewedMap(id),
      navigation: (id: Parameters<Store["setNavigation"]>[0]) => this.store.setNavigation(id),
      developer: (open?: boolean) => this.store.toggleDeveloperPanel(open),
      move: (characterId: CharacterId, destination: LocationRef) => this.move(characterId, destination),
      reset: () => { this.stopTimers(); this.store.reset(); }
    };
    this.root.replaceChildren(HomeScreen(this.store.getState(), actions));
  }
  private move(characterId: CharacterId, destination: LocationRef): void {
    if (this.store.beginMovement(characterId, destination) !== "started") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { while (this.store.advanceCharacter(characterId)) { /* apply the complete route */ } return; }
    const step = (): void => { if (this.store.advanceCharacter(characterId)) this.movementTimers.set(characterId, window.setTimeout(step, MOVEMENT_STEP_MS)); else this.movementTimers.delete(characterId); };
    this.movementTimers.set(characterId, window.setTimeout(step, MOVEMENT_STEP_MS));
  }
  private stopTimers(): void { this.movementTimers.forEach((timer) => clearTimeout(timer)); this.movementTimers.clear(); }
}
