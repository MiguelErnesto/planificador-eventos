import { prisma } from "@/lib/prisma";
import { APP_TAGLINE, APP_TITLE } from "@/lib/branding";
import { simulate, runCpm, CpmEdge, CpmTask, DelayPatch } from "@/lib/cpm";
import { calendarDate, defaultPlanningAnchor, toRelativeDays } from "@/lib/dates";

export async function getSiteSettings() {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    if (row) return { title: row.title, tagline: row.tagline };
  } catch {
    // La tabla puede no existir aún (antes de migrate).
  }
  return { title: APP_TITLE, tagline: APP_TAGLINE };
}

export type ProjectBundle = NonNullable<Awaited<ReturnType<typeof getProjectBundle>>>;

export async function getProjectBundle(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: { orderBy: { title: "asc" } },
      edges: true,
      scenarios: { orderBy: { name: "asc" } },
    },
  });
}

export async function listProjects() {
  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
      tasks: { select: { earliestStart: true, earliestFinish: true } },
    },
  });

  return rows.map((p) => {
    const startDates = p.tasks
      .map((t) => t.earliestStart)
      .filter((d): d is Date => d != null);
    const endDates = p.tasks
      .map((t) => t.earliestFinish)
      .filter((d): d is Date => d != null);
    const startsAt = startDates.length
      ? startDates.reduce((a, b) => (a < b ? a : b))
      : p.eventDate;
    const endsAt = endDates.length
      ? endDates.reduce((a, b) => (a > b ? a : b))
      : startsAt;
    const durationDays = Math.max(
      0,
      Math.round(
        (calendarDate(endsAt).getTime() - calendarDate(startsAt).getTime()) /
          86_400_000,
      ),
    );
    return {
      id: p.id,
      name: p.name,
      eventDate: p.eventDate,
      taskCount: p._count.tasks,
      startsAt,
      endsAt,
      durationDays,
    };
  });
}

export function runProjectSimulation(
  project: ProjectBundle,
  patches: DelayPatch[],
) {
  const anchor = defaultPlanningAnchor(project.eventDate);
  const eventDay = toRelativeDays(project.eventDate, anchor);

  const tasks: CpmTask[] = project.tasks.map((t) => ({
    id: t.id,
    duration: t.durationDays,
    fixedStart:
      t.fixedStart != null ? toRelativeDays(t.fixedStart, anchor) : undefined,
  }));

  const edges: CpmEdge[] = project.edges.map((e) => ({
    from: e.fromTaskId,
    to: e.toTaskId,
    lag: e.lagDays,
  }));

  const preliminary = runCpm(tasks, edges);
  const horizon = Math.max(preliminary.projectDuration, eventDay);
  const base = runCpm(tasks, edges, { horizon });
  const sim = simulate(tasks, edges, patches, { horizon });

  return {
    base,
    sim,
    anchor,
    eventDay,
    exceedsEventDate: sim.projectDuration > eventDay,
  };
}
