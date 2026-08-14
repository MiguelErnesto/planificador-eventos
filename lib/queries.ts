import { prisma } from "@/lib/prisma";
import { simulate, runCpm, CpmEdge, CpmTask, DelayPatch } from "@/lib/cpm";
import { defaultPlanningAnchor, toRelativeDays } from "@/lib/dates";

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
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true } } },
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
