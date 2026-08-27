"use client";

import { useEffect, useState, useTransition } from "react";
import { updateProject } from "@/lib/actions";
import { toDateInputValue } from "@/lib/dates";

const fieldClass =
  "rounded-lg border border-border px-3 py-1.5 outline-none ring-accent focus:ring-2";

export function ProjectMetaForm({
  projectId,
  name: initialName,
  eventDate: initialEventDate,
  layout,
  onCancel,
  onSaved,
}: {
  projectId: string;
  name: string;
  eventDate: Date | string;
  layout: "header" | "row";
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [eventDate, setEventDate] = useState(toDateInputValue(initialEventDate));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setName(initialName);
    setEventDate(toDateInputValue(initialEventDate));
  }, [initialName, initialEventDate]);

  const dirty =
    name.trim() !== initialName.trim() ||
    eventDate !== toDateInputValue(initialEventDate);

  function reset() {
    setName(initialName);
    setEventDate(toDateInputValue(initialEventDate));
    setError(null);
    onCancel?.();
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed || !eventDate) {
      setError("Nombre y fecha del evento son obligatorios");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateProject(projectId, { name: trimmed, eventDate });
        onSaved?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  const nameField = (
    <input
      name="name"
      required
      value={name}
      onChange={(e) => setName(e.target.value)}
      aria-label="Nombre del proyecto"
      className={
        layout === "header"
          ? "w-full rounded-lg bg-transparent px-1 -mx-1 text-3xl text-slate-900 outline-none ring-accent focus:ring-2"
          : `${fieldClass} w-full`
      }
      style={
        layout === "header"
          ? { fontFamily: "var(--font-brand), serif" }
          : undefined
      }
    />
  );

  const dateField = (
    <input
      type="date"
      name="eventDate"
      required
      value={eventDate}
      onChange={(e) => setEventDate(e.target.value)}
      aria-label="Fecha del evento"
      className={fieldClass}
    />
  );

  const actions = (
    <div className="flex gap-2">
      <button
        type="submit"
        disabled={pending || !dirty}
        className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {(onCancel || (layout === "header" && dirty)) && (
        <button
          type="button"
          disabled={pending}
          onClick={reset}
          className="rounded-lg border border-border px-4 py-1.5 text-sm hover:border-accent hover:text-accent-dark"
        >
          Cancelar
        </button>
      )}
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className={
        layout === "header"
          ? "space-y-2"
          : "flex w-full flex-col gap-2 sm:flex-row sm:items-end"
      }
    >
      {layout === "header" ? (
        <>
          {nameField}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-0.5 text-sm">
              <span className="text-xs italic text-muted">Fecha límite</span>
              {dateField}
            </label>
            {actions}
          </div>
        </>
      ) : (
        <>
          <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
            <span className="text-xs italic text-muted">Nombre</span>
            {nameField}
          </label>
          <label className="flex flex-col gap-0.5 text-sm">
            <span className="text-xs italic text-muted">Fecha límite</span>
            {dateField}
          </label>
          {actions}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
