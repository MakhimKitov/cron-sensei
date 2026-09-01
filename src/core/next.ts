import type { CronExpr } from "./parse";

/**
 * Does the wall-clock minute of `date` (local time) match the expression?
 *
 * Seed semantics: every restricted field must match — including day-of-month
 * AND day-of-week together, which diverges from POSIX (both restricted means
 * OR there). Tracked as an issue; the tests pin the current behavior.
 */
export function matches(expr: CronExpr, date: Date): boolean {
  const ok = (field: number[] | null, value: number): boolean =>
    field === null || field.includes(value);
  return (
    ok(expr.minute, date.getMinutes()) &&
    ok(expr.hour, date.getHours()) &&
    ok(expr.dayOfMonth, date.getDate()) &&
    ok(expr.month, date.getMonth() + 1) &&
    ok(expr.dayOfWeek, date.getDay())
  );
}

/**
 * The next `count` runs strictly after `from`, scanning minute by minute in
 * local time. Bounded at ~4 years — a rarer schedule (five Feb 29ths) returns
 * fewer runs rather than spinning.
 */
export function nextRuns(expr: CronExpr, from: Date, count: number): Date[] {
  const runs: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  const limit = 4 * 366 * 24 * 60;
  for (let i = 0; i < limit && runs.length < count; i++) {
    cursor.setMinutes(cursor.getMinutes() + 1);
    if (matches(expr, cursor)) runs.push(new Date(cursor));
  }
  return runs;
}
