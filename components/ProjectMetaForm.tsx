"use client";

import { useEffect, useState, useTransition } from "react";
import { updateProject } from "@/lib/actions";
import { btn } from "@/lib/button-styles";
import { localTimeZone, toDateInputValue } from "@/lib/dates";

const fieldClass =
  "rounded-lg border border-border px-3 py-1.5 outline-none ring-accent focus:ring-2";

export function ProjectMetaForm({
  projectId,
  name: initialName,
  eventDate: initialEventDate,
  timezone: initialTimezone,
  layout,
  onCancel,
  onSaved,
}: {
  projectId: string;
  name: string;
  eventDate: Date | string;
  timezone: string;
  layout: "header" | "row";
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [eventDate, setEventDate] = useState(toDateInputValue(initialEventDate));
  const [timezone, setTimezone] = useState(initialTimezone);
  const [deviceTz, setDeviceTz] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setName(initialName);
    setEventDate(toDateInputValue(initialEventDate));
    setTimezone(initialTimezone);
  }, [initialName, initialEventDate, initialTimezone]);

  useEffect(() => {
    setDeviceTz(localTimeZone());
  }, []);

  const dirty =
    name.trim() !== initialName.trim() ||
    eventDate !== toDateInputValue(initialEventDate) ||
    timezone !== initialTimezone;

  function reset() {
    setName(initialName);
    setEventDate(toDateInputValue(initialEventDate));
    setTimezone(initialTimezone);
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
        await updateProject(projectId, { name: trimmed, eventDate, timezone });
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
          ? "w-full rounded-lg bg-transparent px-1 -mx-1 text-xl text-slate-900 outline-none ring-accent focus:ring-2 sm:text-2xl lg:text-3xl"
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

  const timezoneField = (
    <div className="flex min-w-0 flex-col gap-0.5 text-sm">
      <span className="text-xs italic text-muted">Zona horaria</span>
      <p className="truncate py-1.5 text-sm text-slate-800" title={timezone}>
        {timezone}
      </p>
      {deviceTz && deviceTz !== timezone && (
        <button
          type="button"
          onClick={() => setTimezone(deviceTz)}
          className="break-all text-left text-xs text-accent-dark hover:underline"
          title={deviceTz}
        >
          Usar la de este equipo ({deviceTz})
        </button>
      )}
    </div>
  );

  const actions = (
    <div className="flex gap-2">
      <button
        type="submit"
        disabled={pending || !dirty}
        className={`${btn.primary} px-4 py-1.5 text-sm`}
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {(onCancel || (layout === "header" && dirty)) && (
        <button
          type="button"
          disabled={pending}
          onClick={reset}
          className={`${btn.secondary} px-4 py-1.5 text-sm`}
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
            {timezoneField}
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
          {timezoneField}
          {actions}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
