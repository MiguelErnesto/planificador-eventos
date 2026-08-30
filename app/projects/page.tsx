import { redirect } from "next/navigation";
import { listProjects } from "@/lib/queries";
import { NewProjectForm } from "@/components/NewProjectForm";
import { ProjectListItem } from "@/components/ProjectListItem";
import { createProject, deleteProject } from "@/lib/actions";

export const dynamic = "force-dynamic";

async function createProjectAction(formData: FormData) {
  "use server";
  const id = await createProject(formData);
  redirect(`/projects/${id}`);
}

async function deleteProjectAction(formData: FormData) {
  "use server";
  const projectId = String(formData.get("projectId") ?? "");
  if (projectId) await deleteProject(projectId);
}

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let dbError: string | null = null;
  try {
    projects = await listProjects();
  } catch {
    dbError =
      "No se pudo conectar a la base de datos. Arranca el stack con `docker compose up --build`.";
  }

  return (
    <div className="-mt-4 space-y-4">
      {dbError && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dbError}
        </p>
      )}

      <NewProjectForm
        action={createProjectAction}
        hasProjects={projects.length > 0}
      />

      <section className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-800">
          Eventos / Tareas / Proyectos
        </h2>
        {projects.length === 0 && !dbError ? (
          <p className="text-sm text-muted">
            Cuando crees un proyecto, aparecerá aquí.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-panel shadow-sm">
            {projects.map((p) => (
              <ProjectListItem
                key={p.id}
                id={p.id}
                name={p.name}
                eventDate={p.eventDate.toISOString()}
                timezone={p.timezone}
                startsAt={p.startsAt.toISOString()}
                endsAt={p.endsAt.toISOString()}
                durationDays={p.durationDays}
                progressPct={p.progressPct}
                taskCount={p.taskCount}
                onDelete={deleteProjectAction}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
