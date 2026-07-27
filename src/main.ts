import { App } from "./app/App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/maps.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("App root was not found");
new App(root).mount();
