const CUSTOM_LOCATION_NAME_SELECTOR =
  '.custom-location-editor input[type="text"][data-focus-key^="custom-location-name-"]';
const CUSTOM_LOCATION_BUTTON_SELECTOR = ".custom-location-editor button";

/**
 * iPhone Safari can consume a button tap while Japanese text composition is
 * still active. Intercept only that real composition window. Normal focus and
 * ordinary input must keep the browser's native button behavior.
 */
export const installCustomLocationImeBridge = (): void => {
  let composingInput: HTMLInputElement | null = null;
  let replayingClick = false;
  let suppressedButton: HTMLButtonElement | null = null;
  let suppressionExpiresAt = 0;

  const asNameInput = (target: EventTarget | null): HTMLInputElement | null =>
    target instanceof HTMLInputElement && target.matches(CUSTOM_LOCATION_NAME_SELECTOR)
      ? target
      : null;

  document.addEventListener(
    "compositionstart",
    (event) => {
      composingInput = asNameInput(event.target);
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

  document.addEventListener(
    "pointerdown",
    (event) => {
      const input = composingInput;
      if (!input) return;

      const target = event.target;
      const button = target instanceof Element
        ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
        : null;
      if (!button || button.disabled) return;

      // Run the intended action while App's composition guard still protects
      // the input node. Releasing composition afterwards performs one render
      // with the action's updated draft.
      event.preventDefault();
      event.stopImmediatePropagation();
      input.dispatchEvent(new Event("input", { bubbles: true }));

      suppressedButton = button;
      suppressionExpiresAt = performance.now() + 750;
      replayingClick = true;
      try {
        button.click();
      } finally {
        replayingClick = false;
      }

      input.dispatchEvent(new Event("compositionend", { bubbles: true }));
      if (input.isConnected) input.blur();
      composingInput = null;
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

      // Suppress only a delayed native duplicate after the composition rescue.
      suppressedButton = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  document.addEventListener("click", (event) => {
    const target = event.target;
    const button = target instanceof Element
      ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
      : null;
    if (button?.textContent !== "地点を追加") return;

    // App selects the newly created default name for desktop convenience.
    // On iPhone this looks like the old field swallowed the tap, so release
    // only that selection after the add action has completed.
    queueMicrotask(() => {
      const focused = document.activeElement;
      if (focused instanceof HTMLInputElement && focused.matches(CUSTOM_LOCATION_NAME_SELECTOR)) {
        focused.blur();
      }
    });
  });

  document.addEventListener(
    "focusout",
    (event) => {
      if (event.target === composingInput) composingInput = null;
    },
    true
  );
};
