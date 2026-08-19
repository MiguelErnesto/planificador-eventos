import { prisma } from "@/lib/prisma";
import { APP_TAGLINE, APP_TITLE } from "@/lib/branding";
import { calendarDate } from "@/lib/dates";
import { eventProgressPct } from "@/lib/progress";

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
    },
  });
}

export async function listProjects() {
  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
      tasks: { select: { earliestStart: true, earliestFinish: true, progressPct: true, durationDays: true } },
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
      progressPct: eventProgressPct(p.tasks),
    };
  });
}
