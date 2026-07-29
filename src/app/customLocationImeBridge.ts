const CUSTOM_LOCATION_NAME_SELECTOR =
  '.custom-location-editor input[type="text"][data-focus-key^="custom-location-name-"]';

const CUSTOM_LOCATION_ACTION_SELECTOR = [
  ".custom-location-editor button",
  ".custom-location-editor select",
  '.custom-location-editor input[type="range"]'
].join(", ");

/**
 * iPhone Safari may consume the first tap on a control to finish Japanese IME
 * composition. Commit the active custom-location name before that control's
 * click/change handler runs so the intended action is not lost.
 */
export const installCustomLocationImeBridge = (): void => {
  let composingInput: HTMLInputElement | null = null;

  document.addEventListener(
    "compositionstart",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches(CUSTOM_LOCATION_NAME_SELECTOR)) {
        composingInput = target;
      }
    },
    true
  );

  document.addEventListener(
    "compositionend",
    (event) => {
      if (event.target === composingInput) composingInput = null;
    },
    true
  );

  const commitBeforeAction = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(CUSTOM_LOCATION_ACTION_SELECTOR)) return;

    const active = document.activeElement;
    const input = composingInput
      ?? (active instanceof HTMLInputElement && active.matches(CUSTOM_LOCATION_NAME_SELECTOR) ? active : null);
    if (!input) return;

    // Keep the latest composing text in the App draft before clearing its
    // composition guard. Event is used instead of InputEvent for Safari safety.
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("compositionend", { bubbles: true }));
    input.blur();
    composingInput = null;
  };

  // pointerdown runs before click, which lets the existing button handler run
  // on the same tap. click is retained as a keyboard/fallback path.
  document.addEventListener("pointerdown", commitBeforeAction, true);
  document.addEventListener("click", commitBeforeAction, true);
};
