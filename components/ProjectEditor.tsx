"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TaskFlow, type FlowTask, type FlowEdge } from "@/components/graph/TaskFlow";
import { TaskGantt, type GanttTask } from "@/components/gantt/TaskGantt";
import { DelayBanner } from "@/components/simulation/DelayBanner";
import {
  applyScenarioPatches,
  createTask,
  deleteDependency,
  deleteTask,
  updateTask,
} from "@/lib/actions";
import {
  runCpm,
  simulate,
  type CpmEdge,
  type CpmTask,
  type DelayPatch,
} from "@/lib/cpm";
import {
  defaultPlanningAnchor,
  toAbsoluteDate,
  toRelativeDays,
} from "@/lib/dates";

type Scenario = {
  id: string;
  name: string;
  description: string | null;
  patches: unknown;
};

type Task = FlowTask & {
  earliestStart: Date | string | null;
  earliestFinish: Date | string | null;
  latestStart: Date | string | null;
  latestFinish: Date | string | null;
  fixedStart: Date | string | null;
};

type Edge = FlowEdge;

export function ProjectEditor({
  projectId,
  projectName,
  eventDate,
  tasks,
  edges,
  scenarios,
  baseDuration,
  eventDayRelative,
}: {
  projectId: string;
  projectName: string;
  eventDate: string;
  tasks: Task[];
  edges: Edge[];
  scenarios: Scenario[];
  baseDuration: number;
  eventDayRelative: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simActive, setSimActive] = useState(false);
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? null);
  const [pending, startTransition] = useTransition();

  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? null;
  const patches = (Array.isArray(scenario?.patches)
    ? scenario!.patches
    : []) as DelayPatch[];

  const extraByTask = useMemo(
    () => new Map(patches.map((p) => [p.taskId, p.extraDays])),
    [patches],
  );

  const simulation = useMemo(() => {
    const anchor = defaultPlanningAnchor(new Date(eventDate));
    const cpmTasks: CpmTask[] = tasks.map((t) => ({
      id: t.id,
      duration: t.durationDays,
      fixedStart:
        t.fixedStart != null
          ? toRelativeDays(new Date(t.fixedStart), anchor)
          : undefined,
    }));
    const cpmEdges: CpmEdge[] = edges.map((e) => ({
      from: e.fromTaskId,
      to: e.toTaskId,
      lag: e.lagDays,
    }));
    const preliminary = runCpm(cpmTasks, cpmEdges);
    const horizon = Math.max(preliminary.projectDuration, eventDayRelative);
    const result =
      simActive && patches.length > 0
        ? simulate(cpmTasks, cpmEdges, patches, { horizon })
        : runCpm(cpmTasks, cpmEdges, { horizon });
    return { result, anchor };
  }, [tasks, edges, eventDate, eventDayRelative, simActive, patches]);

  const simTasks: GanttTask[] = useMemo(() => {
    const { result, anchor } = simulation;
    return tasks.map((t) => {
      const r = result.byId[t.id];
      const bump = extraByTask.get(t.id) ?? 0;
      return {
        id: t.id,
        title: t.title,
        durationDays: t.durationDays + (simActive ? bump : 0),
        earliestStart: t.earliestStart,
        earliestFinish: t.earliestFinish,
        isCritical: r?.critical ?? t.isCritical,
        simulatedStart:
          simActive && r ? toAbsoluteDate(r.ES, anchor) : undefined,
        simulatedFinish:
          simActive && r ? toAbsoluteDate(r.EF, anchor) : undefined,
      };
    });
  }, [tasks, simulation, simActive, extraByTask]);

  const simDuration = simActive
    ? simulation.result.projectDuration
    : baseDuration;

  const exceeds = simActive && simDuration > eventDayRelative;

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
          <p className="text-sm text-muted">
            Evento:{" "}
            {format(new Date(eventDate), "d MMMM yyyy", { locale: es })} ·
            duración base {baseDuration} días
            {pending ? " · guardando…" : ""}
          </p>
        </div>
      </div>

      <DelayBanner
        active={simActive}
        scenarioName={scenario?.name}
        exceedsEventDate={exceeds}
        baseDuration={baseDuration}
        simDuration={simDuration}
        onToggle={setSimActive}
        scenarios={scenarios}
        selectedId={scenarioId}
        onSelectScenario={setScenarioId}
        onApply={() => {
          if (!scenario) return;
          startTransition(async () => {
            await applyScenarioPatches(projectId, patches);
            setSimActive(false);
          });
        }}
      />

      {simActive && scenario?.description && (
        <p className="text-sm text-amber-900/80">{scenario.description}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-6">
          <TaskFlow
            projectId={projectId}
            tasks={tasks.map((t) => ({
              ...t,
              isCritical:
                simulation.result.byId[t.id]?.critical ?? t.isCritical,
            }))}
            edges={edges}
            onSelectTask={setSelectedId}
          />
          <TaskGantt
            tasks={simTasks}
            eventDate={eventDate}
            simulation={simActive}
            onSelectTask={setSelectedId}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Nueva tarea</h2>
            <form
              action={(fd) => {
                startTransition(async () => {
                  await createTask(projectId, fd);
                });
              }}
              className="space-y-2"
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
                defaultValue={1}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                Añadir
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Detalle</h2>
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
                <p>
                  Holgura: <strong>{selected.slackDays.toFixed(1)}d</strong>
                  {selected.isCritical && (
                    <span className="ml-2 text-critical">Crítica</span>
                  )}
                </p>
                {selected.earliestStart && selected.earliestFinish && (
                  <p className="text-muted">
                    {format(new Date(selected.earliestStart), "d MMM", {
                      locale: es,
                    })}{" "}
                    →{" "}
                    {format(new Date(selected.earliestFinish), "d MMM", {
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
                            <span>{from?.title ?? e.fromTaskId}</span>
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
                        return <li key={e.id}>{to?.title ?? e.toTaskId}</li>;
                      })}
                  </ul>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteTask(selected.id);
                      setSelectedId(null);
                    })
                  }
                >
                  Eliminar tarea
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
