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

describe("matches — seed day-of-month/day-of-week semantics", () => {
  // Deliberately AND when both are restricted; POSIX says OR. Pinned here so
  // the fix (tracked as an issue) has to flip these expectations explicitly.
  const fridayThe13th = parse("0 0 13 * 5");

  it("matches only when both day fields agree", () => {
    expect(matches(fridayThe13th, new Date(2026, 1, 13, 0, 0))).toBe(true); // Fri Feb 13
    expect(matches(fridayThe13th, new Date(2026, 0, 13, 0, 0))).toBe(false); // Tue Jan 13
    expect(matches(fridayThe13th, new Date(2026, 0, 2, 0, 0))).toBe(false); // Fri Jan 2
  });

  it("nextRuns inherits the AND rule", () => {
    expect(nextRuns(fridayThe13th, jan1, 1)).toEqual([new Date(2026, 1, 13, 0, 0)]);
  });
});
