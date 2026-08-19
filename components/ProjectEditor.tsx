"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TaskFlow, type FlowTask, type FlowEdge } from "@/components/graph/TaskFlow";
import { TaskGantt } from "@/components/gantt/TaskGantt";
import {
  createTask,
  deleteDependency,
  deleteTask,
  updateTask,
} from "@/lib/actions";
import { calendarDate, addCalendarDays } from "@/lib/dates";
import { eventProgressPct } from "@/lib/progress";

type Task = FlowTask & {
  earliestStart: Date | string | null;
  earliestFinish: Date | string | null;
  latestStart: Date | string | null;
  latestFinish: Date | string | null;
  fixedStart: Date | string | null;
};

type Edge = FlowEdge;

function TaskProgressSlider({
  taskId,
  progressPct,
  onCommit,
}: {
  taskId: string;
  progressPct: number;
  onCommit: (pct: number) => void;
}) {
  const [value, setValue] = useState(progressPct);
  useEffect(() => {
    setValue(progressPct);
  }, [taskId, progressPct]);

  function commit() {
    if (value !== progressPct) onCommit(value);
  }

  return (
    <label className="block space-y-1">
      <span className="flex items-center justify-between">
        Progreso <strong>{value}%</strong>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        className="w-full accent-accent"
        onChange={(e) => setValue(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
      />
    </label>
  );
}

export function ProjectEditor({
  projectId,
  projectName,
  eventDate,
  tasks,
  edges,
  baseDuration,
}: {
  projectId: string;
  projectName: string;
  eventDate: string;
  tasks: Task[];
  edges: Edge[];
  baseDuration: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectorSelected, setConnectorSelected] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = connectorSelected
    ? null
    : (tasks.find((t) => t.id === selectedId) ?? null);

  const planRange = useMemo(() => {
    const durationDays = baseDuration;
    const startDates = tasks
      .map((t) => t.earliestStart)
      .filter(Boolean)
      .map((d) => calendarDate(d as Date | string));
    const endDates = tasks
      .map((t) => t.earliestFinish)
      .filter(Boolean)
      .map((d) => calendarDate(d as Date | string));

    const startDate = startDates.length
      ? startDates.reduce((a, b) => (a < b ? a : b))
      : calendarDate(eventDate);
    const endDate = endDates.length
      ? endDates.reduce((a, b) => (a > b ? a : b))
      : addCalendarDays(startDate, Math.max(durationDays, 0));

    return {
      startDate,
      endDate,
      durationDays,
      progressPct: eventProgressPct(tasks),
    };
  }, [tasks, baseDuration, eventDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-3xl text-slate-900"
            style={{ fontFamily: "var(--font-brand), serif" }}
          >
            {projectName}
          </h1>
          <div className="text-sm text-muted">
            <p>
              Inicia:{" "}
              {format(planRange.startDate, "d MMMM yyyy", { locale: es })}
            </p>
            <p>
              Termina:{" "}
              {format(planRange.endDate, "d MMMM yyyy", { locale: es })}
            </p>
            <p>
              Duración: {planRange.durationDays}{" "}
              {planRange.durationDays === 1 ? "día" : "días"}
              {pending ? " · guardando…" : ""}
            </p>
            <p>Progreso: {planRange.progressPct}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <TaskFlow
            projectId={projectId}
            tasks={tasks}
            edges={edges}
            onSelectTask={(id) => {
              setSelectedId(id);
              setConnectorSelected(false);
            }}
            onSelectConnector={(selected) => {
              setConnectorSelected(selected);
              if (selected) {
                setSelectedId(null);
                setNewTaskOpen(false);
              }
            }}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel shadow-sm">
            <button
              type="button"
              aria-expanded={newTaskOpen}
              onClick={() => setNewTaskOpen((open) => !open)}
              className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold"
            >
              Nueva tarea
              <span
                aria-hidden
                className={`text-muted transition-transform ${newTaskOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>
            {newTaskOpen && (
              <form
                action={(fd) => {
                  startTransition(async () => {
                    await createTask(projectId, fd);
                  });
                }}
                className="space-y-2 border-t border-border px-4 py-3"
              >
                <input
                  name="title"
                  required
                  placeholder="Título"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  name="durationDays"
                  type="number"
                  min={1}
                  required
                  placeholder="Días de duración"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark"
                >
                  Añadir
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Detalle</h2>
              {selected && (
                <button
                  type="button"
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteTask(selected.id);
                      setSelectedId(null);
                    })
                  }
                >
                  Eliminar tarea
                </button>
              )}
            </div>
            {!selected ? (
              <p className="text-sm text-muted">Selecciona una tarea</p>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="font-medium text-slate-900">{selected.title}</p>
                <p>
                  Duración:{" "}
                  <input
                    type="number"
                    min={1}
                    defaultValue={selected.durationDays}
                    key={selected.id + selected.durationDays}
                    className="w-20 rounded border border-border px-2 py-1"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v >= 1 && v !== selected.durationDays) {
                        startTransition(() => updateTask(selected.id, { durationDays: v }));
                      }
                    }}
                  />{" "}
                  días
                </p>
                <TaskProgressSlider
                  taskId={selected.id}
                  progressPct={selected.progressPct}
                  onCommit={(pct) =>
                    startTransition(() =>
                      updateTask(selected.id, { progressPct: pct }),
                    )
                  }
                />
                <p>
                  Holgura: <strong>{selected.slackDays.toFixed(1)}d</strong>
                  {selected.isCritical && (
                    <span className="ml-2 text-critical">Crítica</span>
                  )}
                </p>
                {selected.earliestStart && selected.earliestFinish && (
                  <p className="text-muted">
                    {format(calendarDate(selected.earliestStart), "d MMM", {
                      locale: es,
                    })}{" "}
                    →{" "}
                    {format(calendarDate(selected.earliestFinish), "d MMM", {
                      locale: es,
                    })}
                  </p>
                )}
                <div>
                  <p className="mb-1 text-muted">Predecesores</p>
                  <ul className="space-y-1">
                    {edges
                      .filter((e) => e.toTaskId === selected.id)
                      .map((e) => {
                        const from = tasks.find((t) => t.id === e.fromTaskId);
                        return (
                          <li
                            key={e.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>
                              {from?.title ?? e.fromTaskId}{" "}
                              <span className="text-muted">{e.type}</span>
                            </span>
                            <button
                              type="button"
                              className="text-xs text-red-600"
                              onClick={() =>
                                startTransition(() => deleteDependency(e.id))
                              }
                            >
                              Quitar
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-muted">Sucesores</p>
                  <ul className="list-disc pl-4">
                    {edges
                      .filter((e) => e.fromTaskId === selected.id)
                      .map((e) => {
                        const to = tasks.find((t) => t.id === e.toTaskId);
                        return (
                          <li key={e.id}>
                            {to?.title ?? e.toTaskId}{" "}
                            <span className="text-muted">{e.type}</span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-2">
          <TaskGantt
            tasks={tasks}
            eventDate={eventDate}
            onSelectTask={(id) => {
              setSelectedId(id);
              setConnectorSelected(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
