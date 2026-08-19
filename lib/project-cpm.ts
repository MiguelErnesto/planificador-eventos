import { prisma } from "./prisma";
import { runCpm, CpmEdge, CpmTask } from "./cpm";
import { defaultPlanningAnchor, toAbsoluteDate, toRelativeDays } from "./dates";

export async function recalculateProject(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { tasks: true, edges: true },
  });

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
    type: e.type,
  }));

  const preliminary = runCpm(tasks, edges);
  const cpm = runCpm(tasks, edges, {
    horizon: Math.max(preliminary.projectDuration, eventDay),
  });

  await prisma.$transaction(
    project.tasks.map((t) => {
      const r = cpm.byId[t.id];
      return prisma.task.update({
        where: { id: t.id },
        data: {
          earliestStart: toAbsoluteDate(r.ES, anchor),
          earliestFinish: toAbsoluteDate(r.EF, anchor),
          latestStart: toAbsoluteDate(r.LS, anchor),
          latestFinish: toAbsoluteDate(r.LF, anchor),
          slackDays: r.slack,
          isCritical: r.critical,
        },
      });
    }),
  );

  return {
    ...cpm,
    anchor,
    eventDay,
    exceedsEventDate: cpm.projectDuration > eventDay,
  };
}
