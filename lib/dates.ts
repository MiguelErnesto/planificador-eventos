import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

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
