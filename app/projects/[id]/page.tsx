import { notFound } from "next/navigation";
import { getProjectBundle } from "@/lib/queries";
import { recalculateProject } from "@/lib/project-cpm";
import { ProjectEditor } from "@/components/ProjectEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const existing = await getProjectBundle(id);
  if (!existing) notFound();

  const cpm = await recalculateProject(id);
  const project = await getProjectBundle(id);
  if (!project) notFound();

  return (
    <ProjectEditor
      projectId={project.id}
      projectName={project.name}
      eventDate={project.eventDate.toISOString()}
      timezone={project.timezone}
      today={cpm.today.toISOString()}
      baseDuration={cpm.workDurationDays}
      exceedsEventDate={cpm.exceedsEventDate}
      overrunDays={cpm.overrunDays}
      planSlackDays={cpm.planSlackDays}
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
        progressPct: t.progressPct,
      }))}
      edges={project.edges.map((e) => ({
        id: e.id,
        fromTaskId: e.fromTaskId,
        toTaskId: e.toTaskId,
        lagDays: e.lagDays,
        type: e.type,
      }))}
    />
  );
}
