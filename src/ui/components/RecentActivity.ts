const activities = [
  "小さな家での生活が始まりました",
  "コーディは作業台を確認しています",
  "庭は穏やかに晴れています"
];

export const RecentActivity = (): HTMLElement => {
  const section = document.createElement("section"); section.className = "content-card";
  const heading = document.createElement("h2"); heading.textContent = "最近の出来事";
  const list = document.createElement("ul"); list.className = "activity-list";
  activities.forEach((activity) => { const item = document.createElement("li"); item.textContent = activity; list.append(item); });
  section.append(heading, list); return section;
};
