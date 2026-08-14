import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCalendarDate } from "@/lib/dates";
import { es } from "date-fns/locale";
import { listProjects } from "@/lib/queries";
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
    <div className="space-y-10">
      <section className="space-y-3">
        <h1
          className="text-3xl text-slate-900 sm:text-4xl"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          Proyectos
        </h1>
        <p className="max-w-2xl text-muted">
          Planifica la logística del evento con dependencias visuales. El camino
          crítico se recalcula al mover fechas o simular retrasos.
        </p>
      </section>

      {dbError && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dbError}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-panel p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Nuevo proyecto
        </h2>
        <form
          action={createProjectAction}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-muted">Nombre</span>
            <input
              name="name"
              required
              placeholder="Boda Ana & Luis"
              className="rounded-lg border border-border px-3 py-2 outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Fecha del evento</span>
            <input
              type="date"
              name="eventDate"
              required
              className="rounded-lg border border-border px-3 py-2 outline-none ring-accent focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
          >
            Crear
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {projects.length === 0 && !dbError ? (
          <p className="text-muted">
            No hay proyectos. Crea uno o ejecuta{" "}
            <code className="rounded bg-slate-100 px-1">
              docker compose exec app npm run db:seed
            </code>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-panel shadow-sm">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-lg font-medium text-slate-900 hover:text-accent-dark"
                  >
                    {p.name}
                  </Link>
                  <p className="text-sm text-muted">
                    Evento:{" "}
                    {formatCalendarDate(p.eventDate, "d MMMM yyyy", { locale: es })} ·{" "}
                    {p._count.tasks} tareas
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent hover:text-accent-dark"
                  >
                    Abrir
                  </Link>
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
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
