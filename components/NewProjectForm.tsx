"use client";

import { useEffect, useState } from "react";
import { NewProjectNameInput } from "@/components/NewProjectNameInput";
import { LocalTimezoneInput } from "@/components/LocalTimezoneInput";

export function NewProjectForm({
  action,
  hasProjects,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hasProjects: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setOpen(window.location.hash === "#nuevo");
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("open-nuevo", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("open-nuevo", sync);
    };
  }, []);

  function openForm() {
    if (window.location.hash !== "#nuevo") {
      window.location.hash = "nuevo";
    } else {
      setOpen(true);
      requestAnimationFrame(() => {
        document.getElementById("nuevo")?.focus();
      });
    }
  }

  function closeForm() {
    setOpen(false);
    if (window.location.hash === "#nuevo") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {!hasProjects && (
          <p className="text-sm text-muted">
            No hay proyectos todavía.
          </p>
        )}
        <button
          type="button"
          onClick={openForm}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark sm:ml-auto"
        >
          {hasProjects ? "Nuevo proyecto" : "Crear el primero"}
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-panel px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Nuevo proyecto</h2>
        <button
          type="button"
          onClick={closeForm}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent hover:text-accent-dark"
        >
          Cancelar
        </button>
      </div>
      <form
        action={action}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-0.5 text-sm">
          <span className="text-xs italic text-muted">Nombre</span>
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
          className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
        >
          Crear
        </button>
      </form>
    </section>
  );
}
