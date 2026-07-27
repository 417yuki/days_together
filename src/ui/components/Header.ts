import type { MapDefinition } from "../../domain/maps/mapTypes";

export const Header = (map: MapDefinition, onDeveloperClick: () => void): HTMLElement => {
  const header = document.createElement("header");
  header.className = "status-header";
  header.innerHTML = `<div><p class="eyebrow">1日目　朝　<span aria-label="晴れ">☀ 晴れ</span></p><h1>${map.name}</h1></div>`;
  const button = document.createElement("button");
  button.className = "icon-button"; button.type = "button"; button.textContent = "開発";
  button.setAttribute("aria-label", "開発者パネルを開く"); button.addEventListener("click", onDeveloperClick);
  header.append(button); return header;
};
