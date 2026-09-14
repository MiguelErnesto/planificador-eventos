import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { addCalendarDays, calendarDate, formatCalendarDate, toDateInputValue } from "@/lib/dates";
import { eventProgressPct } from "@/lib/progress";
import { APP_TITLE } from "@/lib/branding";

export type ProjectReportTaskInput = {
  id: string;
  title: string;
  durationDays: number;
  earliestStart: Date | string | null;
  earliestFinish: Date | string | null;
  slackDays: number;
  isCritical: boolean;
  progressPct: number;
};

export type ProjectReportInput = {
  name: string;
  eventDate: Date | string;
  timezone: string;
  today: Date | string;
  tasks: ProjectReportTaskInput[];
  criticalPathIds: string[];
  planSlackDays: number;
  exceedsEventDate: boolean;
  overrunDays: number;
};

export type ProjectReportRow = {
  id: string;
  title: string;
  durationDays: number;
  startLabel: string;
  finishLabel: string;
  slackLabel: string;
  criticalLabel: string;
  isCritical: boolean;
  progressPct: number;
};

export type ProjectReport = {
  appTitle: string;
  name: string;
  timezone: string;
  eventDateLabel: string;
  issuedLabel: string;
  planRangeLabel: string;
  durationLabel: string;
  progressPct: number;
  slackHeadline: string;
  slackDetail: string;
  slackIsTight: boolean;
  overrunWarning: string | null;
  tasks: ProjectReportRow[];
  criticalPathLabel: string | null;
};

export function daysPhrase(days: number) {
  const n = Math.abs(Math.round(days));
  return `${n} ${n === 1 ? "día" : "días"}`;
}

export function projectPdfFilename(name: string, eventDate: Date | string) {
  const slug = slugify(name);
  return `${slug}-${toDateInputValue(eventDate)}.pdf`;
}

export function pdfContentDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function buildProjectReport(input: ProjectReportInput): ProjectReport {
  const startDates = input.tasks
    .map((t) => t.earliestStart)
    .filter((d): d is Date | string => d != null)
    .map((d) => calendarDate(d));
  const endDates = input.tasks
    .map((t) => t.earliestFinish)
    .filter((d): d is Date | string => d != null)
    .map((d) => calendarDate(d));

  const startDate = startDates.length
    ? startDates.reduce((a, b) => (a < b ? a : b))
    : calendarDate(input.today);
  const endDate = endDates.length
    ? endDates.reduce((a, b) => (a > b ? a : b))
    : startDate;
  const durationDays = Math.max(0, differenceInCalendarDays(endDate, startDate));
  const slack = Math.round(input.planSlackDays);
  const byId = new Map(input.tasks.map((t) => [t.id, t]));
  const criticalTitles = input.criticalPathIds
    .map((id) => byId.get(id)?.title)
    .filter((title): title is string => Boolean(title));

  return {
    appTitle: APP_TITLE,
    name: input.name,
    timezone: input.timezone,
    eventDateLabel: formatCalendarDate(input.eventDate, "d MMMM yyyy", {
      locale: es,
    }),
    issuedLabel: formatCalendarDate(input.today, "d MMMM yyyy", { locale: es }),
    planRangeLabel: `${format(startDate, "d MMM", { locale: es })} → ${format(endDate, "d MMM", { locale: es })}`,
    durationLabel: daysPhrase(durationDays),
    progressPct: eventProgressPct(input.tasks),
    slackHeadline: `Holgura ${slack < 0 ? "−" : ""}${daysPhrase(slack)}`,
    slackDetail:
      slack < 0
        ? `Desde hoy, el plan se pasa ${daysPhrase(slack)} de la fecha límite.`
        : `Desde hoy hasta el ${format(
            addCalendarDays(calendarDate(input.today), slack),
            "d MMMM yyyy",
            { locale: es },
          )} hay ${daysPhrase(slack)} de holgura.`,
    slackIsTight: slack <= 2,
    overrunWarning: input.exceedsEventDate
      ? `El plan no llega a la fecha del evento${
          input.overrunDays > 0
            ? ` (se pasa ${daysPhrase(input.overrunDays)}).`
            : "."
        }`
      : null,
    tasks: sortReportTasks(input.tasks).map((task) => {
      const slackDays = Math.round(task.slackDays);
      return {
        id: task.id,
        title: task.title,
        durationDays: task.durationDays,
        startLabel: dateOrDash(task.earliestStart),
        finishLabel: dateOrDash(task.earliestFinish),
        slackLabel: `${slackDays < 0 ? "−" : ""}${daysPhrase(slackDays)}`,
        criticalLabel: task.isCritical ? "Sí" : "No",
        isCritical: task.isCritical,
        progressPct: task.progressPct,
      };
    }),
    criticalPathLabel:
      criticalTitles.length > 0 ? criticalTitles.join(" → ") : null,
  };
}

function dateOrDash(value: Date | string | null) {
  if (!value) return "—";
  return formatCalendarDate(value, "d MMM yyyy", { locale: es });
}

function sortReportTasks(tasks: ProjectReportTaskInput[]) {
  return [...tasks].sort((a, b) => {
    if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
    const aStart = a.earliestStart
      ? calendarDate(a.earliestStart).getTime()
      : Number.POSITIVE_INFINITY;
    const bStart = b.earliestStart
      ? calendarDate(b.earliestStart).getTime()
      : Number.POSITIVE_INFINITY;
    if (aStart !== bStart) return aStart - bStart;
    return a.title.localeCompare(b.title, "es");
  });
}

function slugify(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "proyecto";
}
