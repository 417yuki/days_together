export type CustomMapFinishAvailability = {
  hasInteriorDraft: boolean;
  hasGardenDraft: boolean;
  hasInteriorLocations: boolean;
  hasGardenLocations: boolean;
  draftBusy: boolean;
  draftEditorActive: boolean;
  normalMapEditorActive: boolean;
};

export const customMapFinishBlockedReason = (availability: CustomMapFinishAvailability): string | null => {
  if (!availability.hasInteriorDraft || !availability.hasGardenDraft) return "室内と庭の下書きを両方作ってください。";
  if (!availability.hasInteriorLocations || !availability.hasGardenLocations) return "室内と庭の両方で地点設定を保存してください。";
  if (availability.draftBusy) return "下書きの読込または保存が終わるまでお待ちください。";
  if (availability.draftEditorActive) return "先に開いている下書き名または地点の編集を保存するか、キャンセルしてください。";
  if (availability.normalMapEditorActive) return "先に開いている背景・通常地点・出入口・アイテム配置の編集を保存するか、キャンセルしてください。";
  return null;
};
