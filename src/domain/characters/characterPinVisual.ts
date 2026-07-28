export type CharacterPinVisual = {
  anchorX: number;
  anchorY: number;
  scale: number;
  objectPositionX: number;
  objectPositionY: number;
};

export const DEFAULT_CHARACTER_PIN_VISUAL: CharacterPinVisual = Object.freeze({
  anchorX: 50, anchorY: 100, scale: 1, objectPositionX: 50, objectPositionY: 50
});

const value = (candidate: unknown, fallback: number, min: number, max: number, step?: number): number => {
  if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate < min || candidate > max) return fallback;
  return step ? Math.round(candidate / step) * step : Math.round(candidate);
};

export const normalizeCharacterPinVisual = (candidate: unknown): CharacterPinVisual => {
  const source = typeof candidate === "object" && candidate !== null && !Array.isArray(candidate) ? candidate as Record<string, unknown> : {};
  return {
    anchorX: value(source.anchorX, 50, 0, 100),
    anchorY: value(source.anchorY, 100, 0, 100),
    scale: value(source.scale, 1, 0.5, 2, 0.05),
    objectPositionX: value(source.objectPositionX, 50, 0, 100),
    objectPositionY: value(source.objectPositionY, 50, 0, 100)
  };
};

export const characterPinStyle = (visual: CharacterPinVisual): { width: string; height: string; transform: string; objectPosition: string } => {
  const safe = normalizeCharacterPinVisual(visual);
  return {
    width: `${34 * safe.scale}px`, height: `${34 * safe.scale}px`,
    transform: `translate(-${safe.anchorX}%, -${safe.anchorY}%)`,
    objectPosition: `${safe.objectPositionX}% ${safe.objectPositionY}%`
  };
};
