/**
 * Five-field cron: minute, hour, day-of-month, month, day-of-week.
 *
 * Seed grammar: `*`, plain numbers, comma lists, plus three-letter month and
 * day-of-week names (case-insensitive) and `7` as an alias for Sunday.
 * Ranges, steps and `@aliases` are tracked in the issues — the errors below
 * name what's missing so the UI stays honest about scope.
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
  /** Lowercase three-letter name → value, for fields that accept names. */
  names?: Record<string, number>;
  /** A numeric value that normalizes to `min` (day-of-week's `7` → `0`). */
  wrap?: number;
}

const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
];
const DAY_OF_WEEK_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function nameMap(names: readonly string[], min: number): Record<string, number> {
  const map: Record<string, number> = {};
  names.forEach((name, i) => {
    map[name] = i + min;
  });
  return map;
}

const FIELDS: readonly FieldSpec[] = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day-of-month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: nameMap(MONTH_NAMES, 1) },
  { name: "day-of-week", min: 0, max: 6, names: nameMap(DAY_OF_WEEK_NAMES, 0), wrap: 7 },
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
    values.add(resolveValue(piece, spec));
  }
  return [...values].sort((a, b) => a - b);
}

function resolveValue(piece: string, spec: FieldSpec): number {
  let value: number;
  const named = spec.names?.[piece.toLowerCase()];
  if (named !== undefined) {
    value = named;
  } else if (/^\d+$/.test(piece)) {
    value = Number(piece);
    if (spec.wrap !== undefined && value === spec.wrap) value = spec.min;
  } else {
    throw new CronParseError(
      `${spec.name}: ${JSON.stringify(piece)} is not a number` +
        (spec.names ? ` or name (${namesRange(spec)})` : "") +
        ` (ranges and steps are not supported yet)`,
    );
  }
  if (value < spec.min || value > spec.max) {
    throw new CronParseError(`${spec.name}: ${value} is out of range ${spec.min}-${spec.max}`);
  }
  return value;
}

function namesRange(spec: FieldSpec): string {
  const names = Object.keys(spec.names!);
  return `${names[0]!.toUpperCase()}-${names[names.length - 1]!.toUpperCase()}`;
}
