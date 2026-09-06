import { describe, expect, it } from "vitest";
import { matches, nextRuns } from "./next";
import { parse } from "./parse";

// Local-time constructor on purpose: cron thinks in wall-clock, and so do
// these tests — they pass in any CI timezone.
const jan1 = new Date(2026, 0, 1, 12, 0); // Thursday, Jan 1 2026, 12:00

describe("nextRuns", () => {
  it("walks minute by minute for * * * * *", () => {
    const runs = nextRuns(parse("* * * * *"), jan1, 3);
    expect(runs).toEqual([
      new Date(2026, 0, 1, 12, 1),
      new Date(2026, 0, 1, 12, 2),
      new Date(2026, 0, 1, 12, 3),
    ]);
  });

  it("finds today's run when it is still ahead", () => {
    expect(nextRuns(parse("30 14 * * *"), jan1, 1)).toEqual([new Date(2026, 0, 1, 14, 30)]);
  });

  it("rolls into the next matching day", () => {
    // Jan 1 2026 is a Thursday; the next Monday is Jan 5.
    expect(nextRuns(parse("0 0 * * 1"), jan1, 1)).toEqual([new Date(2026, 0, 5, 0, 0)]);
  });

  it("is strictly after `from`", () => {
    const noon = new Date(2026, 0, 1, 12, 0, 0, 0);
    expect(nextRuns(parse("0 12 * * *"), noon, 1)).toEqual([new Date(2026, 0, 2, 12, 0)]);
  });

  it("returns fewer runs instead of scanning past the bound", () => {
    // Feb 29 exists once within the 4-year window from 2026.
    expect(nextRuns(parse("0 0 29 2 *"), jan1, 5)).toEqual([new Date(2028, 1, 29, 0, 0)]);
  });
});

describe("matches — POSIX day-of-month/day-of-week OR semantics", () => {
  // When both are restricted, POSIX (and Vixie cron) run the job when
  // *either* matches — not only when both agree.
  const fridayThe13th = parse("0 0 13 * 5");

  it("matches when either day field agrees", () => {
    expect(matches(fridayThe13th, new Date(2026, 1, 13, 0, 0))).toBe(true); // Fri Feb 13 — both agree
    expect(matches(fridayThe13th, new Date(2026, 0, 13, 0, 0))).toBe(true); // Tue Jan 13 — day-of-month matches
    expect(matches(fridayThe13th, new Date(2026, 0, 2, 0, 0))).toBe(true); // Fri Jan 2 — day-of-week matches
    expect(matches(fridayThe13th, new Date(2026, 0, 3, 0, 0))).toBe(false); // Sat Jan 3 — neither matches
  });

  it("nextRuns follows the OR rule", () => {
    expect(nextRuns(fridayThe13th, jan1, 1)).toEqual([new Date(2026, 0, 2, 0, 0)]);
  });
});
