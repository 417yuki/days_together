import { App } from "./app/App";
import { installCustomLocationImeBridge } from "./app/customLocationImeBridge";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/maps.css";
import { Store, initialState } from "./app/Store";
import { IndexedDbSaveRepository } from "./persistence/indexedDbSaveRepository";
import { loadOrCreateMainSave, SaveCoordinator } from "./persistence/saveCoordinator";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("App root was not found");
const loading = document.createElement("p");
loading.className = "startup-status"; loading.setAttribute("role", "status"); loading.textContent = "ふたりの暮らしを読み込んでいます…";
root.replaceChildren(loading);

installCustomLocationImeBridge();

const repository = new IndexedDbSaveRepository();
const start = async (): Promise<void> => {
  const loaded = await loadOrCreateMainSave(repository, initialState);
  const store = new Store({ ...loaded.state, saveStatus: loaded.available ? "available" : "failed" });
  const saves = new SaveCoordinator(repository, () => store.setSaveStatus("failed"));
  new App(root, store, saves).mount();
};
void start();
