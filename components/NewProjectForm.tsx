"use client";

import { useEffect, useState } from "react";
import { NewProjectNameInput } from "@/components/NewProjectNameInput";
import { LocalTimezoneInput } from "@/components/LocalTimezoneInput";
import { btn } from "@/lib/button-styles";

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
      <div className="flex flex-col items-stretch gap-2 sm:items-center">
        {!hasProjects && (
          <p className="text-sm text-muted sm:text-center">
            No hay proyectos todavía.
          </p>
        )}
        <button
          type="button"
          onClick={openForm}
          className={`${btn.primary} w-full px-4 py-2.5 text-sm`}
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
          className={`${btn.secondary} ${btn.sm}`}
        >
          Cancelar
        </button>
      </div>
      <form
        action={action}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:contents">
          <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
            <span className="text-xs italic text-muted">Nombre</span>
            <NewProjectNameInput />
          </label>
          <label className="flex w-[9rem] shrink-0 flex-col gap-0.5 text-sm sm:w-auto">
            <span className="text-xs italic text-muted">Fecha límite</span>
            <input
              type="date"
              name="eventDate"
              required
              className="w-full rounded-lg border border-border px-2 py-1.5 outline-none ring-accent focus:ring-2 sm:w-auto sm:px-3"
            />
          </label>
        </div>
        <LocalTimezoneInput />
        <button
          type="submit"
          className={`${btn.primary} w-full px-4 py-2 text-sm sm:w-auto`}
        >
          Crear
        </button>
      </form>
    </section>
  );
}
