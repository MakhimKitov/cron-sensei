import { describe, expect, it } from "vitest";
import { CronParseError, parse } from "./parse";

describe("parse", () => {
  it("reads * as unrestricted", () => {
    expect(parse("* * * * *")).toEqual({
      minute: null,
      hour: null,
      dayOfMonth: null,
      month: null,
      dayOfWeek: null,
    });
  });

  it("reads numbers and comma lists, sorted and deduplicated", () => {
    const expr = parse("30,0,30 9 1,15 12 1");
    expect(expr.minute).toEqual([0, 30]);
    expect(expr.hour).toEqual([9]);
    expect(expr.dayOfMonth).toEqual([1, 15]);
    expect(expr.month).toEqual([12]);
    expect(expr.dayOfWeek).toEqual([1]);
  });

  it("tolerates surrounding and repeated whitespace", () => {
    expect(parse("  0  0   *  *  *  ")).toEqual(parse("0 0 * * *"));
  });

  it("wants exactly five fields", () => {
    expect(() => parse("0 0 * *")).toThrow(/expected 5 fields.*got 4/);
    expect(() => parse("0 0 * * * *")).toThrow(/got 6/);
  });

  it("enforces each field's range", () => {
    expect(() => parse("60 * * * *")).toThrow(/minute: 60 is out of range 0-59/);
    expect(() => parse("* 24 * * *")).toThrow(/hour: 24 is out of range/);
    expect(() => parse("* * 0 * *")).toThrow(/day-of-month: 0 is out of range 1-31/);
    expect(() => parse("* * * 13 *")).toThrow(/month: 13 is out of range/);
    expect(() => parse("* * * * 7")).toThrow(/day-of-week: 7 is out of range 0-6/);
  });

  it("names the missing grammar instead of a bare syntax error", () => {
    expect(() => parse("*/15 * * * *")).toThrow(/not supported yet/);
    expect(() => parse("0 9 * * 1-5")).toThrow(/not supported yet/);
    expect(() => parse("0 9 * * MON")).toThrow(/not supported yet/);
    expect(() => parse("@daily")).toThrow(/aliases like @daily are not supported yet/);
  });

  it("refuses empty list items", () => {
    expect(() => parse("1,,2 * * * *")).toThrow(CronParseError);
    expect(() => parse(", * * * *")).toThrow(/empty list item/);
  });
});
