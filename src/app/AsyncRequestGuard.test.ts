import { describe, expect, it } from "vitest";
import { AsyncRequestGuard } from "./AsyncRequestGuard";

describe("AsyncRequestGuard", () => {
  it("makes an older request stale when a newer request starts", () => {
    const guard = new AsyncRequestGuard();
    const first = guard.begin();
    const second = guard.begin();

    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });

  it("invalidates an in-flight request when the view is cleared", () => {
    const guard = new AsyncRequestGuard();
    const token = guard.begin();

    guard.invalidate();

    expect(guard.isCurrent(token)).toBe(false);
  });
});
