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
            <p className="truncate text-base font-medium text-slate-900">{name}</p>
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
              className={`${btn.secondary} ${btn.sm}`}
            >
              Abrir
            </Link>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`${btn.secondary} ${btn.sm}`}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className={`${btn.danger} ${btn.sm}`}
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </li>
  );
}
