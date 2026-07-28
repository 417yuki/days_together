import type { UnknownSproutState } from "../../domain/events/unknownSprout";

export const RecentActivity = (event: UnknownSproutState): HTMLElement => {
  const section = document.createElement("section"); section.className = "content-card";
  const heading = document.createElement("h2"); heading.textContent = "最近の出来事";
  const list = document.createElement("ul"); list.className = "activity-list";
  const item = document.createElement("li"); item.textContent = event.status === "locked" ? "まだ大きな出来事はありません。" : event.status === "available" ? "庭で見覚えのない芽が見つかりました。" : event.stage === "observed" ? "知らない芽を観察しました。" : event.stage === "growing" ? "知らない芽を見守っています。" : "庭に小さな花が咲きました。"; list.append(item);
  section.append(heading, list); return section;
};
