"use client";

import { useState } from "react";
import Link from "next/link";
import { es } from "date-fns/locale";
import { formatCalendarDate } from "@/lib/dates";
import { ProjectMetaForm } from "@/components/ProjectMetaForm";
import { btn } from "@/lib/button-styles";
import { useConfirm } from "@/lib/use-confirm";

export function ProjectListItem({
  id,
  name,
  eventDate,
  timezone,
  startsAt,
  endsAt,
  durationDays,
  progressPct,
  taskCount,
  locked = false,
  onDelete,
}: {
  id: string;
  name: string;
  eventDate: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  durationDays: number;
  progressPct: number;
  taskCount: number;
  locked?: boolean;
  onDelete: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar proyecto",
      message: `¿Seguro que quieres eliminar «${name}»? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.set("projectId", id);
    await onDelete(fd);
  }

  return (
    <li className="relative flex flex-col gap-2 overflow-hidden border-b-[3px] border-double border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      {confirmDialog}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-accent/25"
        style={{
          width: `${Math.min(100, Math.max(0, progressPct))}%`,
        }}
      />
      {editing ? (
        <div className="relative z-10 w-full">
          <ProjectMetaForm
            projectId={id}
            name={name}
            eventDate={eventDate}
            timezone={timezone}
            layout="row"
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <Link
            href={`/projects/${id}`}
            className="absolute inset-0 z-0"
            aria-label={`Abrir ${name}`}
          />
          <div className="pointer-events-none relative z-10 min-w-0 flex-1">
            <p className="flex min-w-0 items-center gap-2">
              <span className="truncate text-base font-medium text-slate-900">
                {name}
              </span>
              {locked && (
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  Solo lectura
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {formatCalendarDate(eventDate, "d MMM yyyy", { locale: es })} ·{" "}
              {progressPct}% · {taskCount}{" "}
              {taskCount === 1 ? "tarea" : "tareas"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {formatCalendarDate(startsAt, "d MMM", { locale: es })} →{" "}
              {formatCalendarDate(endsAt, "d MMM", { locale: es })} ·{" "}
              {durationDays} {durationDays === 1 ? "día" : "días"}
            </p>
          </div>
          <div className="relative z-10 flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/projects/${id}`}
              className={`inline-flex min-h-11 items-center ${btn.secondary} ${btn.md}`}
            >
              Abrir
            </Link>
            {!locked && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={`min-h-11 ${btn.secondary} ${btn.md}`}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className={`min-h-11 ${btn.danger} ${btn.md}`}
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </>
      )}
    </li>
  );
}
