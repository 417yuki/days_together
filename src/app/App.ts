import { Store } from "./Store";
import { HomeScreen } from "../ui/screens/HomeScreen";
import type { CharacterId } from "../domain/characters/characterTypes";
import type { LocationRef } from "../domain/maps/mapTypes";
import type { SaveCoordinator } from "../persistence/saveCoordinator";
import { PartnerActivityController } from "./PartnerActivityController";

const MOVEMENT_STEP_MS = 380;

export class App {
  private movementTimers = new Map<CharacterId, number>();
  private partner: PartnerActivityController;
  constructor(private root: HTMLElement, private store = new Store(), private saves?: SaveCoordinator) { this.partner = new PartnerActivityController(store, (destination, done) => this.move("cody", destination, done)); }
  mount(): void {
    this.store.subscribe((state) => { this.render(); void this.saves?.save(state); });
    this.render();
    this.partner.start();
    this.store.checkEvents();
    document.addEventListener("visibilitychange", this.onVisibility);
  }
  private render(): void {
    const actions = {
      map: (id: Parameters<Store["setViewedMap"]>[0]) => this.store.setViewedMap(id),
      navigation: (id: Parameters<Store["setNavigation"]>[0]) => this.store.setNavigation(id),
      developer: (open?: boolean) => this.store.toggleDeveloperPanel(open),
      move: (characterId: CharacterId, destination: LocationRef) => this.move(characterId, destination),
      pausePartner: () => this.partner.pause(), resumePartner: () => this.partner.resume(), decidePartner: () => this.partner.decideNow(),
      openEvent: () => this.store.openEvent(), closeEvent: () => { this.store.closeEvent(); requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-focus-key="event-unknown_sprout"]')?.focus()); }, advanceEvent: (choice: Parameters<Store["advanceEvent"]>[0]) => { this.store.advanceEvent(choice); }, triggerEvent: () => this.store.triggerEvent(), resetEvent: () => this.store.resetEvent(),
      reset: () => { this.stopTimers(); this.store.reset(); this.partner.reset(); void this.saves?.save(this.store.getState(), true); }
    };
    this.root.replaceChildren(HomeScreen(this.store.getState(), actions));
  }
  private move(characterId: CharacterId, destination: LocationRef, done?: (arrived: boolean) => void): void {
    const result = this.store.beginMovement(characterId, destination); if (result !== "started") { done?.(result === "same"); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { while (this.store.advanceCharacter(characterId)) { /* apply the complete route */ } done?.(true); return; }
    const step = (): void => { if (this.store.advanceCharacter(characterId)) this.movementTimers.set(characterId, window.setTimeout(step, MOVEMENT_STEP_MS)); else { this.movementTimers.delete(characterId); done?.(true); } };
    this.movementTimers.set(characterId, window.setTimeout(step, MOVEMENT_STEP_MS));
  }
  private onVisibility = (): void => { if (document.visibilityState === "visible") this.store.checkEvents(); };
  private stopTimers(): void { this.movementTimers.forEach((timer) => clearTimeout(timer)); this.movementTimers.clear(); }
}
