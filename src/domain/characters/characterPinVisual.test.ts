import { describe, expect, it } from "vitest";
import { DEFAULT_CHARACTER_PIN_VISUAL, characterPinStyle, normalizeCharacterPinVisual } from "./characterPinVisual";

describe("character pin visuals", () => {
  it("accepts defaults and boundaries", () => {
    expect(normalizeCharacterPinVisual(DEFAULT_CHARACTER_PIN_VISUAL)).toEqual(DEFAULT_CHARACTER_PIN_VISUAL);
    expect(normalizeCharacterPinVisual({ anchorX: 0, anchorY: 100, scale: 2, objectPositionX: 100, objectPositionY: 0 })).toEqual({ anchorX: 0, anchorY: 100, scale: 2, objectPositionX: 100, objectPositionY: 0 });
  });
  it("repairs each invalid field independently", () => {
    expect(normalizeCharacterPinVisual({ anchorX: NaN, anchorY: Infinity, scale: "1", objectPositionX: -1, objectPositionY: 75 })).toEqual({ ...DEFAULT_CHARACTER_PIN_VISUAL, objectPositionY: 75 });
  });
  it("builds CSS only from normalized finite numbers", () => {
    expect(characterPinStyle({ anchorX: 25, anchorY: 80, scale: 1.5, objectPositionX: 20, objectPositionY: 70 })).toEqual({ width: "51px", height: "51px", transform: "translate(-25%, -80%)", objectPosition: "20% 70%" });
  });
});
