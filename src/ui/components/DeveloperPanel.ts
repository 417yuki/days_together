import type { AppState } from "../../app/Store";

export const DeveloperPanel = (state: AppState, actions: { close: () => void; interior: () => void; garden: () => void; reset: () => void }): HTMLElement => {
  const aside = document.createElement("aside"); aside.className = "developer-panel"; aside.setAttribute("aria-labelledby", "developer-title");
  const heading = document.createElement("div"); heading.className = "panel-heading";
  const title = document.createElement("h2"); title.id = "developer-title"; title.textContent = "開発者パネル"; heading.append(title, makeButton("閉じる", actions.close, "panel-close"));
  const details = document.createElement("dl");
  appendDetail(details, "マップID", state.viewedMapId); appendDetail(details, "ナビゲーション", state.activeNavigation);
  const controls = document.createElement("div"); controls.className = "developer-actions"; controls.append(makeButton("室内を表示", actions.interior), makeButton("庭を表示", actions.garden), makeButton("初期状態へ戻す", actions.reset));
  aside.append(heading, details, controls); return aside;
};

const appendDetail = (list: HTMLDListElement, label: string, value: string): void => {
  const term = document.createElement("dt"); term.textContent = label; const description = document.createElement("dd"); const code = document.createElement("code"); code.textContent = value; description.append(code); list.append(term, description);
};

const makeButton = (label: string, action: () => void, className = ""): HTMLButtonElement => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.className = className; button.addEventListener("click", action); return button; };
