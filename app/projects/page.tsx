import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCalendarDate } from "@/lib/dates";
import { es } from "date-fns/locale";
import { listProjects } from "@/lib/queries";
import { NewProjectNameInput } from "@/components/NewProjectNameInput";
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
              <li
                key={p.id}
                className="relative flex flex-col gap-2 overflow-hidden border-b-[3px] border-double border-border px-4 py-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 bg-accent/25"
                  style={{
                    width: `${Math.min(100, Math.max(0, p.progressPct))}%`,
                  }}
                />
                <Link
                  href={`/projects/${p.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Abrir ${p.name}`}
                />
                <div className="pointer-events-none relative z-10">
                  <p className="text-base font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-muted">
                    Inicia:{" "}
                    {formatCalendarDate(p.startsAt, "d MMMM yyyy", {
                      locale: es,
                    })}{" "}
                    - Termina:{" "}
                    {formatCalendarDate(p.endsAt, "d MMMM yyyy", {
                      locale: es,
                    })}{" "}
                    - Duración: {p.durationDays}{" "}
                    {p.durationDays === 1 ? "día" : "días"} - Progreso Total:{" "}
                    {p.progressPct}% - {p.taskCount}{" "}
                    {p.taskCount === 1 ? "tarea" : "tareas"}
                  </p>
                </div>
                <div className="relative z-10 flex gap-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent-dark"
                  >
                    Abrir
                  </Link>
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
