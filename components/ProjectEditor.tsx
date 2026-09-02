"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { TaskFlow, type FlowTask, type FlowEdge } from "@/components/graph/TaskFlow";
import { TaskGantt } from "@/components/gantt/TaskGantt";
import { ProjectMetaForm } from "@/components/ProjectMetaForm";
import { BottomSheet } from "@/components/BottomSheet";
import {
  createDependency,
  createTask,
  deleteDependency,
  deleteTask,
  updateTask,
} from "@/lib/actions";
import { calendarDate, addCalendarDays, formatCalendarDate } from "@/lib/dates";
import { btn } from "@/lib/button-styles";
import { eventProgressPct } from "@/lib/progress";
import { dependencyTypeDisplay } from "@/lib/dependency";
import { useConfirm } from "@/lib/use-confirm";
import { useMediaQuery } from "@/lib/use-media-query";

type Task = FlowTask & {
  earliestStart: Date | string | null;
  earliestFinish: Date | string | null;
  latestStart: Date | string | null;
  latestFinish: Date | string | null;
  fixedStart: Date | string | null;
};

type Edge = FlowEdge;

function daysPhrase(days: number) {
  const n = Math.abs(Math.round(days));
  return `${n} ${n === 1 ? "día" : "días"}`;
}

function TaskMarginCopy({
  slackDays,
  isCritical,
}: {
  slackDays: number;
  isCritical: boolean;
}) {
  const slack = Math.round(slackDays);
  return (
    <div className="space-y-1">
      <p>
        {slack < 0
          ? "Desde hoy, esta tarea no llega a la fecha."
          : `Desde hoy, puedes retrasar ${daysPhrase(slack)} y aún llegar a la fecha.`}
      </p>
      <p className={isCritical ? "text-critical" : "text-muted"}>
        {isCritical
          ? slack < 0
            ? "Crítica: no llega a la fecha del evento."
            : "Crítica: el margen hasta la fecha es de 2 días o menos."
          : "Amplio: aún hay margen hasta la fecha."}
      </p>
    </div>
  );
}

function TaskTitleInput({
  taskId,
  title,
  onCommit,
}: {
  taskId: string;
  title: string;
  onCommit: (title: string) => void;
}) {
  const [value, setValue] = useState(title);
  useEffect(() => {
    setValue(title);
  }, [taskId, title]);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setValue(title);
      return;
    }
    if (trimmed !== title) onCommit(trimmed);
  }

  return (
    <input
      type="text"
      value={value}
      aria-label="Título de la tarea"
      className="w-full rounded border border-border px-2 py-1 font-medium text-slate-900"
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

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

function AddDependencyControl({
  projectId,
  selectedId,
  tasks,
  edges,
  mode,
  startTransition,
}: {
  projectId: string;
  selectedId: string;
  tasks: Task[];
  edges: Edge[];
  mode: "predecessor" | "successor";
  startTransition: (fn: () => void | Promise<void>) => void;
}) {
  const linkedIds = new Set(
    mode === "predecessor"
      ? edges.filter((e) => e.toTaskId === selectedId).map((e) => e.fromTaskId)
      : edges.filter((e) => e.fromTaskId === selectedId).map((e) => e.toTaskId),
  );
  const candidates = tasks.filter(
    (t) => t.id !== selectedId && !linkedIds.has(t.id),
  );
  const [open, setOpen] = useState(false);
  const [otherId, setOtherId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setOtherId("");
    setError(null);
  }, [selectedId, mode]);

  const chosenId = candidates.some((t) => t.id === otherId)
    ? otherId
    : (candidates[0]?.id ?? "");

  const label =
    mode === "predecessor" ? "Añadir predecesor" : "Añadir sucesor";
  const selectLabel =
    mode === "predecessor" ? "Tarea predecesora" : "Tarea sucesora";

  if (candidates.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-2 w-full text-left ${btn.secondary} ${btn.md}`}
      >
        {label}
      </button>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 rounded-lg border border-border bg-slate-50 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!chosenId) return;
        setError(null);
        const fromTaskId = mode === "predecessor" ? chosenId : selectedId;
        const toTaskId = mode === "predecessor" ? selectedId : chosenId;
        startTransition(async () => {
          try {
            await createDependency(projectId, fromTaskId, toTaskId, 0, "FS");
            setOpen(false);
            setOtherId("");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo crear la dependencia",
            );
          }
        });
      }}
    >
      <label className="block space-y-1">
        <span className="text-xs text-muted">{label}</span>
        <select
          value={chosenId}
          onChange={(e) => setOtherId(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-border bg-white px-3 py-2"
          aria-label={selectLabel}
        >
          {candidates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-muted">Tipo: Fin → Inicio</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className={`${btn.primary} ${btn.md}`}
        >
          Añadir
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className={`${btn.secondary} ${btn.md}`}
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </form>
  );
}

function TaskDetailBody({
  projectId,
  selected,
  tasks,
  edges,
  startTransition,
  onDeleted,
}: {
  projectId: string;
  selected: Task;
  tasks: Task[];
  edges: Edge[];
  startTransition: (fn: () => void | Promise<void>) => void;
  onDeleted: () => void;
}) {
  const [confirm, confirmDialog] = useConfirm();

  async function askRemoveDependency(label: string, dependencyId: string) {
    const ok = await confirm({
      title: "Quitar enlace",
      message: `¿Seguro que quieres quitar el enlace con «${label}»?`,
      confirmLabel: "Quitar",
    });
    if (!ok) return;
    startTransition(() => deleteDependency(dependencyId));
  }

  return (
    <div className="space-y-3 text-sm">
      {confirmDialog}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Detalle
        </span>
        <button
          type="button"
          className={`${btn.danger} ${btn.sm}`}
          onClick={() => {
            void (async () => {
              const ok = await confirm({
                title: "Eliminar tarea",
                message: `¿Seguro que quieres eliminar «${selected.title}»? Esta acción no se puede deshacer.`,
                confirmLabel: "Eliminar",
              });
              if (!ok) return;
              startTransition(async () => {
                await deleteTask(selected.id);
                onDeleted();
              });
            })();
          }}
        >
          Eliminar tarea
        </button>
      </div>
      <TaskTitleInput
        taskId={selected.id}
        title={selected.title}
        onCommit={(nextTitle) =>
          startTransition(async () => {
            await updateTask(selected.id, { title: nextTitle });
          })
        }
      />
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
          startTransition(() => updateTask(selected.id, { progressPct: pct }))
        }
      />
      <TaskMarginCopy
        slackDays={selected.slackDays}
        isCritical={selected.isCritical}
      />
      {selected.earliestStart && selected.earliestFinish && (
        <div className="space-y-0.5 text-muted">
          <p>
            Más temprano:{" "}
            {format(calendarDate(selected.earliestStart), "d MMM", {
              locale: es,
            })}{" "}
            →{" "}
            {format(calendarDate(selected.earliestFinish), "d MMM", {
              locale: es,
            })}
          </p>
          {selected.latestStart && selected.latestFinish && (
            <p>
              Más tarde:{" "}
              {format(calendarDate(selected.latestStart), "d MMM", {
                locale: es,
              })}{" "}
              →{" "}
              {format(calendarDate(selected.latestFinish), "d MMM", {
                locale: es,
              })}
            </p>
          )}
        </div>
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
                    <span className="text-muted">
                      {dependencyTypeDisplay(e.type)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={`shrink-0 ${btn.danger} ${btn.sm}`}
                    onClick={() =>
                      void askRemoveDependency(
                        from?.title ?? e.fromTaskId,
                        e.id,
                      )
                    }
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
        </ul>
        <AddDependencyControl
          projectId={projectId}
          selectedId={selected.id}
          tasks={tasks}
          edges={edges}
          mode="predecessor"
          startTransition={startTransition}
        />
      </div>
      <div>
        <p className="mb-1 text-muted">Sucesores</p>
        <ul className="space-y-1">
          {edges
            .filter((e) => e.fromTaskId === selected.id)
            .map((e) => {
              const to = tasks.find((t) => t.id === e.toTaskId);
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {to?.title ?? e.toTaskId}{" "}
                    <span className="text-muted">
                      {dependencyTypeDisplay(e.type)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={`shrink-0 ${btn.danger} ${btn.sm}`}
                    onClick={() =>
                      void askRemoveDependency(to?.title ?? e.toTaskId, e.id)
                    }
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
        </ul>
        <AddDependencyControl
          projectId={projectId}
          selectedId={selected.id}
          tasks={tasks}
          edges={edges}
          mode="successor"
          startTransition={startTransition}
        />
      </div>
    </div>
  );
}

export function ProjectEditor({
  projectId,
  projectName,
  eventDate,
  timezone,
  today,
  tasks,
  edges,
  baseDuration,
  exceedsEventDate,
  overrunDays,
  planSlackDays,
}: {
  projectId: string;
  projectName: string;
  eventDate: string;
  timezone: string;
  today: string;
  tasks: Task[];
  edges: Edge[];
  baseDuration: number;
  exceedsEventDate: boolean;
  overrunDays: number;
  planSlackDays: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectorSelected, setConnectorSelected] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [pending, startTransition] = useTransition();
  const isLg = useMediaQuery("(min-width: 1024px)");
  const compactHeader = isLg !== true;
  const [graphOverride, setGraphOverride] = useState<boolean | null>(null);
  const graphOpen = graphOverride ?? isLg ?? false;

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
      : calendarDate(today);
    const endDate = endDates.length
      ? endDates.reduce((a, b) => (a > b ? a : b))
      : addCalendarDays(startDate, Math.max(durationDays, 0));

    return {
      startDate,
      endDate,
      durationDays: Math.max(
        0,
        differenceInCalendarDays(endDate, startDate),
      ),
      progressPct: eventProgressPct(tasks),
    };
  }, [tasks, baseDuration, today]);

  function selectTask(id: string | null) {
    setSelectedId(id);
    setConnectorSelected(false);
  }

  const newTaskPanel = (
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
              const id = await createTask(projectId, fd);
              selectTask(id);
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
            className={`w-full ${btn.primary} ${btn.md}`}
          >
            Añadir
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        {compactHeader ? (
          editingMeta ? (
            <ProjectMetaForm
              projectId={projectId}
              name={projectName}
              eventDate={eventDate}
              timezone={timezone}
              layout="header"
              onCancel={() => setEditingMeta(false)}
              onSaved={() => setEditingMeta(false)}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  className="truncate text-xl text-slate-900 sm:text-2xl"
                  style={{ fontFamily: "var(--font-brand), serif" }}
                >
                  {projectName}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  Fecha límite:{" "}
                  {formatCalendarDate(eventDate, "d MMMM yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMeta(true)}
                className={`shrink-0 ${btn.secondary} ${btn.md}`}
              >
                Editar
              </button>
            </div>
          )
        ) : (
          <ProjectMetaForm
            projectId={projectId}
            name={projectName}
            eventDate={eventDate}
            timezone={timezone}
            layout="header"
          />
        )}
        <div className="mt-2 text-sm text-muted">
          <p>
            {format(planRange.startDate, "d MMM", { locale: es })} →{" "}
            {format(planRange.endDate, "d MMM", { locale: es })} ·{" "}
            {planRange.durationDays}{" "}
            {planRange.durationDays === 1 ? "día" : "días"} ·{" "}
            {planRange.progressPct}%
            <span
              className={
                Math.round(planSlackDays) <= 2
                  ? "text-critical font-medium"
                  : undefined
              }
            >
              {" "}
              · Holgura{" "}
              {Math.round(planSlackDays) < 0 ? "−" : ""}
              {daysPhrase(planSlackDays)}
            </span>
            {pending ? " · guardando…" : ""}
          </p>
          <p
            className={`mt-1 text-xs ${
              Math.round(planSlackDays) <= 2
                ? "text-critical"
                : "text-muted"
            }`}
          >
            {Math.round(planSlackDays) < 0
              ? `Desde hoy, el plan se pasa ${daysPhrase(planSlackDays)} de la fecha límite.`
              : `Desde hoy hasta el ${format(
                  addCalendarDays(
                    calendarDate(today),
                    Math.round(planSlackDays),
                  ),
                  "d MMMM yyyy",
                  { locale: es },
                )} hay ${daysPhrase(planSlackDays)} de holgura.`}
          </p>
          {exceedsEventDate && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              El plan no llega a la fecha del evento
              {overrunDays > 0
                ? ` (se pasa ${overrunDays} ${overrunDays === 1 ? "día" : "días"}).`
                : "."}
            </p>
          )}
        </div>
      </div>

      {/* Mobile: Nueva tarea right under header */}
      <div className="lg:hidden">{newTaskPanel}</div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_280px]">
        {/* Gantt first on mobile */}
        <div className="order-1 min-w-0 lg:order-3 lg:col-span-2">
          <p className="mb-2 rounded-lg border border-border/80 bg-slate-50 px-3 py-2 text-xs text-muted lg:hidden">
            <strong className="text-slate-700">Detalle:</strong> toca el{" "}
            <strong className="text-slate-700">nombre</strong> de la tarea, o da{" "}
            <strong className="text-slate-700">doble toque</strong> a una barra
            del calendario. Un solo toque en la barra sirve para moverla. En el{" "}
            <strong className="text-slate-700">grafo</strong>, un toque abre el
            detalle. Los enlaces se editan ahí (predecesor / sucesor).
          </p>
          <TaskGantt
            tasks={tasks}
            eventDate={eventDate}
            today={today}
            onSelectTask={(id) => selectTask(id)}
          />
        </div>

        <div className="order-2 min-w-0 rounded-2xl border border-border bg-panel shadow-sm lg:order-1">
          <button
            type="button"
            aria-expanded={graphOpen}
            onClick={() => setGraphOverride(!graphOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold"
          >
            Grafo de tareas
            <span
              aria-hidden
              className={`text-muted transition-transform ${graphOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          {graphOpen && (
            <div className="border-t border-border p-2 sm:p-3">
              <TaskFlow
                projectId={projectId}
                tasks={tasks}
                edges={edges}
                selectedTaskId={selectedId}
                onSelectTask={(id) => selectTask(id)}
                onSelectConnector={(selectedConn) => {
                  setConnectorSelected(selectedConn);
                  if (selectedConn) {
                    setSelectedId(null);
                    setNewTaskOpen(false);
                  }
                }}
              />
            </div>
          )}
        </div>

        <aside className="order-3 space-y-4 lg:order-2">
          <div className="hidden lg:block">{newTaskPanel}</div>

          {/* Desktop detail panel */}
          <div className="hidden rounded-2xl border border-border bg-panel p-4 shadow-sm lg:block">
            {!selected ? (
              <>
                <h2 className="mb-3 font-semibold">Detalle</h2>
                <p className="text-sm text-muted">Selecciona una tarea</p>
              </>
            ) : (
              <TaskDetailBody
                projectId={projectId}
                selected={selected}
                tasks={tasks}
                edges={edges}
                startTransition={startTransition}
                onDeleted={() => selectTask(null)}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Mobile detail bottom sheet */}
      <BottomSheet
        open={Boolean(selected) && isLg === false}
        title={selected?.title ?? "Detalle"}
        onClose={() => selectTask(null)}
      >
        {selected && (
          <TaskDetailBody
            projectId={projectId}
            selected={selected}
            tasks={tasks}
            edges={edges}
            startTransition={startTransition}
            onDeleted={() => selectTask(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
