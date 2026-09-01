import { describe, expect, it } from "vitest";
import { explain } from "./explain";
import { parse } from "./parse";

const sentence = (expr: string): string => explain(parse(expr));

describe("explain", () => {
  it.each([
    ["* * * * *", "every minute"],
    ["30 14 * * *", "at 14:30 every day"],
    ["0,30 * * * *", "at minute 0 and 30 of every hour"],
    ["* 9 * * *", "every minute of hour 9"],
    ["0,30 9,17 * * *", "at minute 0 and 30 of hour 9 and 17 every day"],
    ["30 14 * * 1", "at 14:30 on Monday"],
    ["0 9 1,15 * *", "at 09:00 on day 1 and 15 of the month"],
    ["0 0 * 12 *", "at 00:00 every day in December"],
    ["0 0 13 * 5", "at 00:00 on day 13 of the month and on Friday"],
    ["* * * * 0,6", "every minute on Sunday and Saturday"],
    ["0 6 * 1,2,3 *", "at 06:00 every day in January, February and March"],
  ])("%s → %s", (expr, expected) => {
    expect(sentence(expr)).toBe(expected);
  });
});
