import { describe, expect, it } from "vitest";
import { advanceUnknownSprout, initialUnknownSprout, localDate, makeUnknownSproutAvailable, normalizeLocalDate, parseUnknownSprout, releaseUnknownSprout } from "./unknownSprout";

describe("知らない芽", () => {
  const today = new Date(2026, 6, 28, 12);
  it("ローカル日付を決定的に扱い、不正値を今日へ補完する", () => {
    expect(localDate(today)).toBe("2026-07-28");
    expect(normalizeLocalDate("not-a-date", today)).toBe("2026-07-28");
  });
  it("開始日当日は発生せず翌日以降に一度だけ発生する", () => {
    const locked = initialUnknownSprout();
    expect(releaseUnknownSprout(locked, "2026-07-28", today)).toEqual(locked);
    const available = releaseUnknownSprout(locked, "2026-07-27", today);
    expect(available).toEqual(makeUnknownSproutAvailable());
    expect(releaseUnknownSprout(available, "2026-07-27", today)).toBe(available);
  });
  it("観察から二つの安全な経路で開花できる", () => {
    const observed = advanceUnknownSprout(makeUnknownSproutAvailable(), "observe")!;
    expect(observed).toMatchObject({ status: "active", stage: "observed" });
    for (const choice of ["tend", "watch"] as const) {
      const growing = advanceUnknownSprout(observed, choice)!;
      expect(growing).toMatchObject({ stage: "growing", path: choice === "tend" ? "tended" : "watched" });
      expect(advanceUnknownSprout(growing, "finish")).toMatchObject({ status: "completed", stage: "flower" });
    }
  });
  it("無効な順序、経路変更、完了後の進行を拒否し入力を変更しない", () => {
    const available = makeUnknownSproutAvailable(); const before = structuredClone(available);
    expect(advanceUnknownSprout(available, "finish")).toBeNull(); expect(available).toEqual(before);
    const growing = advanceUnknownSprout(advanceUnknownSprout(available, "observe")!, "tend")!;
    expect(advanceUnknownSprout(growing, "watch")).toBeNull();
    const done = advanceUnknownSprout(growing, "finish")!; expect(advanceUnknownSprout(done, "finish")).toBeNull();
  });
  it("有効な状態だけを復元する", () => {
    const valid = { saveSlotId: "main", eventId: "unknown_sprout", status: "completed", stage: "flower", path: "watched", choiceHistory: ["observe", "watch", "finish"] };
    expect(parseUnknownSprout(valid)).toMatchObject({ status: "completed", path: "watched" });
    expect(parseUnknownSprout({ ...valid, choiceHistory: ["observe", "tend", "finish"] })).toBeNull();
  });
});
