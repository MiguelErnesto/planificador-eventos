import { redirect } from "next/navigation";
import { listProjects } from "@/lib/queries";
import { NewProjectNameInput } from "@/components/NewProjectNameInput";
import { LocalTimezoneInput } from "@/components/LocalTimezoneInput";
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

      <section className="rounded-2xl border border-border bg-panel px-4 py-3 shadow-sm">
        <form
          action={createProjectAction}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-0.5 text-sm">
            <span className="text-xs italic text-muted">Nuevo</span>
            <NewProjectNameInput />
          </label>
          <label className="flex flex-col gap-0.5 text-sm">
            <span className="text-xs italic text-muted">Fecha límite</span>
            <input
              type="date"
              name="eventDate"
              required
              className="rounded-lg border border-border px-3 py-1.5 outline-none ring-accent focus:ring-2"
            />
          </label>
          <LocalTimezoneInput />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-1.5 font-medium text-white hover:bg-accent-dark"
          >
            Crear
          </button>
        </form>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-800">Eventos / Tareas / Proyectos</h2>
        {projects.length === 0 && !dbError ? (
          <p className="text-muted">
            No hay proyectos. Crea uno o ejecuta{" "}
            <code className="rounded bg-slate-100 px-1">
              docker compose exec app npm run db:seed
            </code>
            .
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
