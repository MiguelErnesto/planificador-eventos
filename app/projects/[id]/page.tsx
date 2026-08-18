import { notFound } from "next/navigation";
import { getProjectBundle } from "@/lib/queries";
import { defaultPlanningAnchor, toRelativeDays } from "@/lib/dates";
import { runCpm, CpmEdge, CpmTask } from "@/lib/cpm";
import { ProjectEditor } from "@/components/ProjectEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectBundle(id);
  if (!project) notFound();

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
  const cpm = runCpm(tasks, edges, {
    horizon: Math.max(preliminary.projectDuration, eventDay),
  });

  return (
    <ProjectEditor
      projectId={project.id}
      projectName={project.name}
      eventDate={project.eventDate.toISOString()}
      baseDuration={cpm.projectDuration}
      tasks={project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        durationDays: t.durationDays,
        isCritical: t.isCritical,
        slackDays: t.slackDays,
        positionX: t.positionX,
        positionY: t.positionY,
        earliestStart: t.earliestStart?.toISOString() ?? null,
        earliestFinish: t.earliestFinish?.toISOString() ?? null,
        latestStart: t.latestStart?.toISOString() ?? null,
        latestFinish: t.latestFinish?.toISOString() ?? null,
        fixedStart: t.fixedStart?.toISOString() ?? null,
      }))}
      edges={project.edges.map((e) => ({
        id: e.id,
        fromTaskId: e.fromTaskId,
        toTaskId: e.toTaskId,
        lagDays: e.lagDays,
      }))}
    />
  );
}
