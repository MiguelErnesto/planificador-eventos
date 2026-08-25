import { prisma } from "./prisma";
import {
  runCpm,
  isEventCritical,
  CpmEdge,
  CpmTask,
  type DependencyType,
} from "./cpm";
import {
  defaultPlanningAnchor,
  toAbsoluteDate,
  toRelativeDays,
  todayUtcInTimeZone,
} from "./dates";
import { remainingDurationDays } from "./progress";

export type ProjectCpmInput = {
  eventDate: Date;
  timezone: string;
  tasks: Array<{
    id: string;
    durationDays: number;
    progressPct: number;
    fixedStart: Date | null;
    earliestStart?: Date | null;
  }>;
  edges: Array<{
    fromTaskId: string;
    toTaskId: string;
    lagDays: number;
    type: DependencyType;
  }>;
};

export function computeCpmForProject(project: ProjectCpmInput) {
  const anchor = defaultPlanningAnchor(project.eventDate);
  const eventDay = toRelativeDays(project.eventDate, anchor);
  const today = todayUtcInTimeZone(project.timezone);
  const nowDay = toRelativeDays(today, anchor);

  const tasks: CpmTask[] = project.tasks.map((t) => {
    const remaining = remainingDurationDays(t.durationDays, t.progressPct);
    let fixedStart: number | undefined;
    if (t.fixedStart != null) {
      fixedStart = toRelativeDays(t.fixedStart, anchor);
    } else if (remaining === 0 && t.earliestStart != null) {
      fixedStart = toRelativeDays(t.earliestStart, anchor);
    }
    return { id: t.id, duration: remaining, fixedStart };
  });

  const edges: CpmEdge[] = project.edges.map((e) => ({
    from: e.fromTaskId,
    to: e.toTaskId,
    lag: e.lagDays,
    type: e.type,
  }));

  const cpm = runCpm(tasks, edges, { nowDay, horizon: eventDay });

  return {
    ...cpm,
    anchor,
    eventDay,
    nowDay,
    today,
    exceedsEventDate: cpm.projectDuration > eventDay,
    overrunDays: Math.max(0, cpm.projectDuration - eventDay),
    workDurationDays: Math.max(0, cpm.projectDuration - nowDay),
    planSlackDays: eventDay - cpm.projectDuration,
  };
}

export async function recalculateProject(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { tasks: true, edges: true },
  });

  const cpm = computeCpmForProject(project);

  await prisma.$transaction(
    project.tasks.map((t) => {
      const r = cpm.byId[t.id];
      return prisma.task.update({
        where: { id: t.id },
        data: {
          earliestStart: toAbsoluteDate(r.ES, cpm.anchor),
          earliestFinish: toAbsoluteDate(r.EF, cpm.anchor),
          latestStart: toAbsoluteDate(r.LS, cpm.anchor),
          latestFinish: toAbsoluteDate(r.LF, cpm.anchor),
          slackDays: r.slack,
          isCritical: isEventCritical(r.slack),
        },
      });
    }),
  );

  return cpm;
}
