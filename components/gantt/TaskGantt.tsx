"use client";

import { useMemo, useRef, useState } from "react";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { updateTask } from "@/lib/actions";

export type GanttTask = {
  id: string;
  title: string;
  durationDays: number;
  earliestStart: Date | string | null;
  earliestFinish: Date | string | null;
  isCritical: boolean;
  simulatedStart?: Date | null;
  simulatedFinish?: Date | null;
};

const DAY_PX = 28;

export function TaskGantt({
  tasks,
  eventDate,
  simulation = false,
  onSelectTask,
}: {
  tasks: GanttTask[];
  eventDate: Date | string;
  simulation?: boolean;
  onSelectTask: (id: string) => void;
}) {
  const event = startOfDay(new Date(eventDate));
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStartX = useRef(0);
  const dragOriginDays = useRef(0);

  const { minDay, maxDay, rows } = useMemo(() => {
    const starts = tasks
      .flatMap((t) => [
        t.earliestStart ? startOfDay(new Date(t.earliestStart)) : null,
        t.simulatedStart ? startOfDay(new Date(t.simulatedStart)) : null,
      ])
      .filter(Boolean) as Date[];
    const finishes = tasks
      .flatMap((t) => [
        t.earliestFinish ? startOfDay(new Date(t.earliestFinish)) : null,
        t.simulatedFinish ? startOfDay(new Date(t.simulatedFinish)) : null,
      ])
      .filter(Boolean) as Date[];

    if (starts.length === 0) {
      return { minDay: event, maxDay: event, rows: [] as GanttTask[] };
    }

    const min = starts.reduce((a, b) => (a < b ? a : b));
    const maxCandidates = [...finishes, event];
    const max = maxCandidates.reduce((a, b) => (a > b ? a : b));
    return { minDay: min, maxDay: max, rows: tasks };
  }, [tasks, event]);

  const totalDays = Math.max(1, differenceInCalendarDays(maxDay, minDay) + 2);
  const eventOffset = differenceInCalendarDays(event, minDay);

  async function commitShift(task: GanttTask, deltaDays: number) {
    if (!task.earliestStart || deltaDays === 0) return;
    const next = startOfDay(new Date(task.earliestStart));
    next.setDate(next.getDate() + deltaDays);
    await updateTask(task.id, { fixedStart: next.toISOString() });
  }

  return (
    <div className="overflow-auto rounded-2xl border border-border bg-panel">
      <div className="min-w-full" style={{ width: 200 + totalDays * DAY_PX }}>
        <div className="flex border-b border-border bg-slate-50 text-xs text-muted">
          <div className="sticky left-0 z-10 w-[200px] bg-slate-50 px-3 py-2 font-medium">
            Tarea
          </div>
          <div className="relative flex-1 py-2">
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-accent"
              style={{ left: eventOffset * DAY_PX }}
              title="Fecha del evento"
            />
            <span
              className="absolute -top-0 text-[10px] text-accent-dark"
              style={{ left: eventOffset * DAY_PX + 4 }}
            >
              Evento {format(event, "d MMM", { locale: es })}
            </span>
          </div>
        </div>

        {rows.map((task) => {
          const start = task.earliestStart
            ? startOfDay(new Date(task.earliestStart))
            : minDay;
          const left = differenceInCalendarDays(start, minDay) * DAY_PX;
          const width = Math.max(task.durationDays, 1) * DAY_PX;

          const simStart = task.simulatedStart
            ? startOfDay(new Date(task.simulatedStart))
            : null;
          const simLeft = simStart
            ? differenceInCalendarDays(simStart, minDay) * DAY_PX
            : null;
          const simWidth = task.simulatedFinish && simStart
            ? Math.max(
                differenceInCalendarDays(
                  startOfDay(new Date(task.simulatedFinish)),
                  simStart,
                ),
                1,
              ) * DAY_PX
            : null;

          return (
            <div
              key={task.id}
              className="flex items-center border-b border-border/70 hover:bg-slate-50/80"
            >
              <button
                type="button"
                onClick={() => onSelectTask(task.id)}
                className="sticky left-0 z-10 w-[200px] truncate bg-panel px-3 py-3 text-left text-sm hover:text-accent-dark"
              >
                {task.title}
              </button>
              <div className="relative h-10 flex-1">
                {simulation && simLeft != null && simWidth != null && (
                  <div
                    className="absolute top-1.5 h-7 rounded-md border border-amber-400 bg-amber-200/70"
                    style={{ left: simLeft, width: simWidth }}
                  />
                )}
                <div
                  role="slider"
                  aria-label={`Mover ${task.title}`}
                  tabIndex={0}
                  onMouseDown={(e) => {
                    if (simulation) return;
                    setDragging(task.id);
                    dragStartX.current = e.clientX;
                    dragOriginDays.current = 0;
                    const onMove = (ev: MouseEvent) => {
                      dragOriginDays.current = Math.round(
                        (ev.clientX - dragStartX.current) / DAY_PX,
                      );
                    };
                    const onUp = async () => {
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                      setDragging(null);
                      await commitShift(task, dragOriginDays.current);
                    };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                  className={`absolute top-1.5 h-7 rounded-md text-[10px] leading-7 text-white ${
                    simulation ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                  } ${
                    task.isCritical ? "bg-critical" : "bg-accent"
                  } ${dragging === task.id ? "opacity-80" : ""}`}
                  style={{ left, width }}
                >
                  <span className="px-2">{task.durationDays}d</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
