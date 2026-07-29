const CUSTOM_LOCATION_NAME_SELECTOR =
  '.custom-location-editor input[type="text"][data-focus-key^="custom-location-name-"]';

const CUSTOM_LOCATION_BUTTON_SELECTOR = ".custom-location-editor button";
const CUSTOM_LOCATION_CONTROL_SELECTOR = [
  ".custom-location-editor select",
  '.custom-location-editor input[type="range"]'
].join(", ");

type PendingButtonAction = {
  button: HTMLButtonElement;
  nativeClickObserved: boolean;
  fallbackTimer: ReturnType<typeof setTimeout> | null;
};

/**
 * iPhone Safari can leave the App's composition guard active when a Japanese
 * conversion is followed immediately by another control. While that guard is
 * active the action state changes, but the full-screen render is intentionally
 * postponed, which makes the custom-map editor appear frozen.
 *
 * Keep the name input alive until the intended action has run, then release the
 * guard and render once. When Safari consumes the native click only to finish
 * conversion, replay that one button action and suppress a late duplicate.
 */
export const installCustomLocationImeBridge = (): void => {
  let lastNameInput: HTMLInputElement | null = null;
  let pendingButton: PendingButtonAction | null = null;
  let suppressedTrustedButton: HTMLButtonElement | null = null;
  let suppressionTimer: ReturnType<typeof setTimeout> | null = null;
  let replayingButtonClick = false;
  let finishingInput = false;

  const asNameInput = (target: EventTarget | null): HTMLInputElement | null =>
    target instanceof HTMLInputElement && target.matches(CUSTOM_LOCATION_NAME_SELECTOR)
      ? target
      : null;

  const rememberNameInput = (event: Event): void => {
    const input = asNameInput(event.target);
    if (input) lastNameInput = input;
  };

  const finishNameInput = (): void => {
    const input = lastNameInput;
    if (!input || finishingInput) return;

    finishingInput = true;
    try {
      // Preserve the newest composing text in the App draft first. Dispatching
      // directly also works when a queued render has already detached the node.
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("compositionend", { bubbles: true }));
      if (input.isConnected) input.blur();
      lastNameInput = null;
    } finally {
      finishingInput = false;
    }
  };

  const clearPendingButton = (): void => {
    if (pendingButton?.fallbackTimer) clearTimeout(pendingButton.fallbackTimer);
    pendingButton = null;
  };

  document.addEventListener("focusin", rememberNameInput, true);
  document.addEventListener("input", rememberNameInput, true);
  document.addEventListener("compositionstart", rememberNameInput, true);

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !lastNameInput) return;
      const button = target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR);
      if (!button || button.disabled) return;

      // Do not finish composition yet. The existing button listener must run
      // before the queued full-screen render replaces this button node.
      lastNameInput.dispatchEvent(new Event("input", { bubbles: true }));
      clearPendingButton();
      pendingButton = { button, nativeClickObserved: false, fallbackTimer: null };
    },
    true
  );

  document.addEventListener(
    "pointerup",
    (event) => {
      const target = event.target;
      const button = target instanceof Element
        ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
        : null;
      if (!button || pendingButton?.button !== button) return;

      pendingButton.fallbackTimer = setTimeout(() => {
        const pending = pendingButton;
        if (!pending || pending.button !== button || pending.nativeClickObserved) return;

        // Safari used the tap only to settle the IME and never delivered click.
        // Release the App guard, then replay exactly this button action.
        finishNameInput();
        clearPendingButton();
        suppressedTrustedButton = button;
        if (suppressionTimer) clearTimeout(suppressionTimer);
        suppressionTimer = setTimeout(() => { suppressedTrustedButton = null; }, 500);
        replayingButtonClick = true;
        try {
          button.click();
        } finally {
          replayingButtonClick = false;
        }
      }, 0);
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      const button = target instanceof Element
        ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
        : null;
      if (!button) return;

      if (!replayingButtonClick && event.isTrusted && suppressedTrustedButton === button) {
        suppressedTrustedButton = null;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  document.addEventListener("click", (event) => {
    const target = event.target;
    const button = target instanceof Element
      ? target.closest<HTMLButtonElement>(CUSTOM_LOCATION_BUTTON_SELECTOR)
      : null;
    if (!button) return;

    if (pendingButton?.button === button) {
      pendingButton.nativeClickObserved = true;
      clearPendingButton();
    }
    // This bubble listener runs after the button's own action. Any render that
    // action requested is waiting behind the App composition guard.
    finishNameInput();

    if (button.textContent === "地点を追加") {
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(CUSTOM_LOCATION_NAME_SELECTOR);
        input?.focus({ preventScroll: true });
        input?.select();
      });
    }
  });

  const finishAfterControlAction = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches(CUSTOM_LOCATION_CONTROL_SELECTOR)) return;
    // change/input handlers on the target have already updated the App draft.
    finishNameInput();
  };
  document.addEventListener("change", finishAfterControlAction);
  document.addEventListener("input", finishAfterControlAction);

  document.addEventListener(
    "focusout",
    (event) => {
      if (event.target !== lastNameInput) return;
      // iOS occasionally omits compositionend. Wait until the current pointer
      // sequence has completed, then release any remaining guard.
      setTimeout(() => {
        if (event.target === lastNameInput) finishNameInput();
      }, 0);
    },
    true
  );
};
