import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

/**
 * Read the UTC calendar day from an ISO instant and return a local Date at
 * midnight on that same Y-M-D. Keeps SSR and the browser aligned when they
 * do not share a timezone.
 */
export function calendarDate(value: Date | string): Date {
  if (typeof value === "string") {
    const d = new Date(value);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return startOfDay(value);
}

/** Persist a local calendar day as UTC midnight so the day does not shift. */
export function toUtcDateIso(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

/** Day 0 = start of projectAnchor (usually earliest planning day or eventDate - N). */
export function toRelativeDays(date: Date, anchor: Date): number {
  return differenceInCalendarDays(startOfDay(date), startOfDay(anchor));
}

export function toAbsoluteDate(day: number, anchor: Date): Date {
  return addDays(startOfDay(anchor), day);
}

/**
 * Planning anchor: eventDate minus a generous horizon so relative days stay non-negative
 * for typical wedding prep. Callers may also pass an explicit planningStart.
 */
export function defaultPlanningAnchor(eventDate: Date, lookbackDays = 180): Date {
  return addDays(startOfDay(eventDate), -lookbackDays);
}
