import { Store } from "./Store";
import { HomeScreen } from "../ui/screens/HomeScreen";

export class App {
  private selectedLocation: string | null = null;
  constructor(private root: HTMLElement, private store = new Store()) {}
  mount(): void { this.store.subscribe(() => this.render()); this.render(); }
  private render(): void {
    const actions = {
      map: (id: Parameters<Store["setViewedMap"]>[0]) => { this.selectedLocation = null; this.store.setViewedMap(id); },
      navigation: (id: Parameters<Store["setNavigation"]>[0]) => this.store.setNavigation(id),
      developer: (open?: boolean) => this.store.toggleDeveloperPanel(open),
      reset: () => { this.selectedLocation = null; this.store.reset(); }
    };
    this.root.replaceChildren(HomeScreen(this.store.getState(), actions, this.selectedLocation, (label) => { this.selectedLocation = label; this.render(); }));
  }
}
