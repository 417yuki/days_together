const CUSTOM_LOCATION_NAME_SELECTOR =
  '.custom-location-editor input[type="text"][data-focus-key^="custom-location-name-"]';
const CUSTOM_LOCATION_BUTTON_SELECTOR = ".custom-location-editor button";

/**
 * iPhone Safari may use a tap outside a Japanese text field only to settle the
 * IME. Run the intended custom-location button action exactly once on
 * pointerdown, then finish composition. This keeps the existing App render
 * guard, but never refocuses or selects the name field after the action.
 */
export const installCustomLocationImeBridge = (): void => {
  let activeNameInput: HTMLInputElement | null = null;
  let replayingClick = false;
  let suppressedButton: HTMLButtonElement | null = null;
  let suppressionExpiresAt = 0;

  const asNameInput = (target: EventTarget | null): HTMLInputElement | null =>
    target instanceof HTMLInputElement && target.matches(CUSTOM_LOCATION_NAME_SELECTOR)
      ? target
      : null;

  const rememberInput = (event: Event): void => {
    const input = asNameInput(event.target);
    if (input) activeNameInput = input;
  };

  document.addEventListener("focusin", rememberInput, true);
  document.addEventListener("input", rememberInput, true);
  document.addEventListener("compositionstart", rememberInput, true);
  document.addEventListener(
    "compositionend",
    (event) => {
      if (event.target === activeNameInput) activeNameInput = null;
    },
    true
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target;
      const button = target instanceof Element
        ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
        : null;
      if (!button || button.disabled) return;

      const focused = document.activeElement;
      const input = activeNameInput
        ?? (focused instanceof HTMLInputElement && focused.matches(CUSTOM_LOCATION_NAME_SELECTOR)
          ? focused
          : null);
      if (!input) return;

      // Do not let Safari turn this tap into text selection or IME settlement.
      // The existing button click listener is invoked synchronously once here.
      event.preventDefault();
      event.stopImmediatePropagation();

      // Preserve the latest composing text before the button action reads the
      // current draft. The location-name input handler does not rerender.
      input.dispatchEvent(new Event("input", { bubbles: true }));

      suppressedButton = button;
      suppressionExpiresAt = performance.now() + 750;
      replayingClick = true;
      try {
        button.click();
      } finally {
        replayingClick = false;
      }

      // The button action has now changed the draft. Releasing composition lets
      // the App perform its one queued render with that updated draft.
      input.dispatchEvent(new Event("compositionend", { bubbles: true }));
      if (input.isConnected) input.blur();
      activeNameInput = null;
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (replayingClick || !event.isTrusted) return;
      const target = event.target;
      const button = target instanceof Element
        ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
        : null;
      if (!button || button !== suppressedButton || performance.now() > suppressionExpiresAt) return;

      // Some Safari versions still emit a delayed native click after the
      // pointerdown action. Suppress only that duplicate.
      suppressedButton = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  document.addEventListener(
    "focusout",
    (event) => {
      if (event.target === activeNameInput) activeNameInput = null;
    },
    true
  );
};
