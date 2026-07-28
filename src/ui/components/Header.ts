import type { MapDefinition } from "../../domain/maps/mapTypes";

export const Header = (map: MapDefinition, onDeveloperClick: () => void): HTMLElement => {
  const header = document.createElement("header");
  header.className = "status-header";
  const summary = document.createElement("div");
  const time = document.createElement("p"); time.className = "eyebrow"; time.textContent = "1日目　朝　";
  const weather = document.createElement("span"); weather.setAttribute("aria-label", "晴れ"); weather.textContent = "☀ 晴れ"; time.append(weather);
  const heading = document.createElement("h1"); heading.textContent = map.name; summary.append(time, heading); header.append(summary);
  const button = document.createElement("button");
  button.className = "icon-button"; button.type = "button"; button.textContent = "開発";
  button.setAttribute("aria-label", "開発者パネルを開く"); button.addEventListener("click", onDeveloperClick);
  header.append(button); return header;
};
