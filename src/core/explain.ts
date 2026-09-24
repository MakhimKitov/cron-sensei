/** CronExpr → one plain-English sentence. Pinned by tests: wording is API. */

import type { CronExpr } from "./parse";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function explain(expr: CronExpr): string {
  const parts: string[] = [timePhrase(expr)];
  const plainTime = expr.minute !== null && expr.hour !== null;
  if (plainTime && expr.dayOfMonth === null && expr.dayOfWeek === null) {
    parts.push("every day");
  }
  const dates: string[] = [];
  if (expr.dayOfMonth !== null) {
    dates.push(`on day ${list(expr.dayOfMonth.map(String))} of the month`);
  }
  if (expr.dayOfWeek !== null) {
    dates.push(`on ${list(expr.dayOfWeek.map((d) => DAYS[d]!))}`);
  }
  if (dates.length > 0) {
    // POSIX: when both day-of-month and day-of-week are restricted, the
    // command runs if either matches — join with "or" to reflect that. A
    // single restricted day field has nothing to join.
    const joiner = expr.dayOfMonth !== null && expr.dayOfWeek !== null ? " or " : " and ";
    parts.push(dates.join(joiner));
  }
  if (expr.month !== null) {
    parts.push(`in ${list(expr.month.map((m) => MONTHS[m - 1]!))}`);
  }
  return parts.join(" ");
}

function timePhrase(expr: CronExpr): string {
  const { minute, hour } = expr;
  if (minute === null && hour === null) return "every minute";
  if (minute !== null && hour === null) {
    return `at minute ${list(minute.map(String))} of every hour`;
  }
  if (minute === null && hour !== null) {
    return `every minute of hour ${list(hour.map(String))}`;
  }
  if (minute!.length === 1 && hour!.length === 1) {
    return `at ${pad2(hour![0]!)}:${pad2(minute![0]!)}`;
  }
  return `at minute ${list(minute!.map(String))} of hour ${list(hour!.map(String))}`;
}

function list(items: string[]): string {
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]!}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
