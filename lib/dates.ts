import { format, type FormatOptions } from "date-fns";

/** UTC Y-M-D of an instant. Avoids Docker vs browser timezone shifts. */
export function utcYmd(value: Date | string): { y: number; m: number; d: number } {
  const d = typeof value === "string" ? new Date(value) : value;
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    d: d.getUTCDate(),
  };
}

/**
 * Interpret an ISO/UTC instant as a calendar day and return a local Date at
 * midnight on that same Y-M-D, so SSR and the browser show the same date.
 */
export function calendarDate(value: Date | string): Date {
  const { y, m, d } = utcYmd(value);
  return new Date(y, m, d);
}

export function addCalendarDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function formatCalendarDate(
  value: Date | string,
  pattern: string,
  options?: FormatOptions,
): string {
  return format(calendarDate(value), pattern, options);
}

/** `YYYY-MM-DD` for `<input type="date">`, using the UTC calendar day. */
export function toDateInputValue(value: Date | string): string {
  const { y, m, d } = utcYmd(value);
  return `${String(y).padStart(4, "0")}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Persist a local calendar day as UTC midnight so the day does not shift. */
export function toUtcDateIso(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

function utcDayIndex(value: Date | string): number {
  const { y, m, d } = utcYmd(value);
  return Date.UTC(y, m, d) / 86_400_000;
}

/** Day 0 = start of projectAnchor (usually earliest planning day or eventDate - N). */
export function toRelativeDays(date: Date, anchor: Date): number {
  return Math.round(utcDayIndex(date) - utcDayIndex(anchor));
}

export function toAbsoluteDate(day: number, anchor: Date): Date {
  const { y, m, d } = utcYmd(anchor);
  return new Date(Date.UTC(y, m, d + day));
}

/**
 * Planning anchor: eventDate minus a generous horizon so relative days stay non-negative
 * for typical wedding prep. Callers may also pass an explicit planningStart.
 */
export function defaultPlanningAnchor(eventDate: Date, lookbackDays = 180): Date {
  const { y, m, d } = utcYmd(eventDate);
  return new Date(Date.UTC(y, m, d - lookbackDays));
}

/** Today's calendar date in a IANA timezone, stored as UTC midnight. */
export function todayUtcInTimeZone(timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
