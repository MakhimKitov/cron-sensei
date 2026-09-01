/**
 * Five-field cron: minute, hour, day-of-month, month, day-of-week.
 *
 * Seed grammar: `*`, plain numbers, comma lists. Ranges, steps, names and
 * `@aliases` are tracked in the issues — the errors below name what's missing
 * so the UI stays honest about scope.
 */

export interface CronExpr {
  /** null = unrestricted (`*`); otherwise sorted unique values. */
  minute: number[] | null;
  hour: number[] | null;
  dayOfMonth: number[] | null;
  month: number[] | null;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number[] | null;
}

export class CronParseError extends Error {}

interface FieldSpec {
  name: string;
  min: number;
  max: number;
}

const FIELDS: readonly FieldSpec[] = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day-of-month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "day-of-week", min: 0, max: 6 },
];

export function parse(input: string): CronExpr {
  const trimmed = input.trim();
  if (trimmed.startsWith("@")) {
    const alias = trimmed.split(/\s/)[0];
    throw new CronParseError(`aliases like ${alias} are not supported yet`);
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    throw new CronParseError(
      `expected 5 fields (minute hour day-of-month month day-of-week), got ${parts.length}`,
    );
  }
  const fields = parts.map((part, i) => parseField(part, FIELDS[i]!));
  return {
    minute: fields[0]!,
    hour: fields[1]!,
    dayOfMonth: fields[2]!,
    month: fields[3]!,
    dayOfWeek: fields[4]!,
  };
}

function parseField(part: string, spec: FieldSpec): number[] | null {
  if (part === "*") return null;
  const values = new Set<number>();
  for (const piece of part.split(",")) {
    if (piece === "") {
      throw new CronParseError(`${spec.name}: empty list item in ${JSON.stringify(part)}`);
    }
    if (!/^\d+$/.test(piece)) {
      throw new CronParseError(
        `${spec.name}: ${JSON.stringify(piece)} is not a number ` +
          `(ranges, steps and names are not supported yet)`,
      );
    }
    const value = Number(piece);
    if (value < spec.min || value > spec.max) {
      throw new CronParseError(`${spec.name}: ${value} is out of range ${spec.min}-${spec.max}`);
    }
    values.add(value);
  }
  return [...values].sort((a, b) => a - b);
}
