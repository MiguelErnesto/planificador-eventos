"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { differenceInCalendarDays, format, isSameDay, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import { ControlButton } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { updateTask } from "@/lib/actions";
import { calendarDate, toUtcDateIso, addCalendarDays } from "@/lib/dates";

export type GanttTask = {
  id: string;
  title: string;
  durationDays: number;
  earliestStart: Date | string | null;
  earliestFinish: Date | string | null;
  latestStart: Date | string | null;
  latestFinish: Date | string | null;
  isCritical: boolean;
  progressPct: number;
  slackDays?: number;
};

const DAY_PX = 28;
const LABEL_W = 280;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.2;

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 5">
      <path d="M0 0h32v4.2H0z" />
    </svg>
  );
}

function FitViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30">
      <path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32">
      <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32">
      <path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" />
    </svg>
  );
}

export function TaskGantt({
  tasks,
  eventDate,
  today,
  onSelectTask,
}: {
  tasks: GanttTask[];
  eventDate: Date | string;
  today: Date | string;
  onSelectTask: (id: string) => void;
}) {
  const event = calendarDate(eventDate);
  const todayDate = calendarDate(today);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStartX = useRef(0);
  const dragOriginDays = useRef(0);

  const { minDay, maxDay, rows } = useMemo(() => {
    const starts = tasks
      .map((t) => (t.earliestStart ? calendarDate(t.earliestStart) : null))
      .filter(Boolean) as Date[];
    const finishes = tasks
      .map((t) => (t.earliestFinish ? calendarDate(t.earliestFinish) : null))
      .filter(Boolean) as Date[];
    const latestFinishes = tasks
      .map((t) => (t.latestFinish ? calendarDate(t.latestFinish) : null))
      .filter(Boolean) as Date[];

    const minCandidates = [...starts, todayDate, event];
    const maxCandidates = [...finishes, ...latestFinishes, event, todayDate];
    const min = minCandidates.reduce((a, b) => (a < b ? a : b));
    const max = maxCandidates.reduce((a, b) => (a > b ? a : b));
    return { minDay: min, maxDay: max, rows: tasks };
  }, [tasks, event, todayDate]);

  const totalDays = Math.max(1, differenceInCalendarDays(maxDay, minDay) + 2);
  const eventOffset = differenceInCalendarDays(event, minDay);
  const todayOffset = differenceInCalendarDays(todayDate, minDay);
  const dayPx = DAY_PX * zoom;
  const interactive = !locked;

  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addCalendarDays(minDay, i)),
    [minDay, totalDays],
  );

  const monthSpans = useMemo(() => {
    const spans: { label: string; count: number }[] = [];
    for (const d of days) {
      const label = format(d, "MMMM yyyy", { locale: es });
      const last = spans[spans.length - 1];
      if (last && last.label === label) last.count += 1;
      else spans.push({ label, count: 1 });
    }
    return spans;
  }, [days]);

  const dayLabelStep = dayPx >= 24 ? 1 : dayPx >= 16 ? 2 : 7;

  function clampZoom(value: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  }

  function fitView() {
    const el = wrapRef.current;
    if (!el) return;
    const available = Math.max(el.clientWidth - LABEL_W, DAY_PX);
    setZoom(clampZoom(available / (totalDays * DAY_PX)));
  }

  async function commitShift(task: GanttTask, deltaDays: number) {
    if (!task.earliestStart || deltaDays === 0) return;
    const next = calendarDate(task.earliestStart);
    next.setDate(next.getDate() + deltaDays);
    if (task.latestStart) {
      const latest = calendarDate(task.latestStart);
      if (next > latest) {
        alert(
          "Si empiezas en esa fecha, esta tarea ya no llega a la fecha del evento.",
        );
      }
    }
    await updateTask(task.id, { fixedStart: toUtcDateIso(next) });
  }

  return (
    <div
      ref={wrapRef}
      className="w-full overflow-auto rounded-2xl border border-border bg-panel"
    >
      <div className="min-w-full" style={{ width: LABEL_W + totalDays * dayPx }}>
        <div className="sticky top-0 z-20 flex items-stretch border-b border-border bg-slate-50 text-xs text-muted">
          <div
            className="sticky left-0 z-30 flex items-center justify-between gap-2 bg-slate-50 px-3"
            style={{ width: LABEL_W }}
          >
            <span className="shrink-0 text-base font-bold text-slate-900">
              Tareas
            </span>
            <span className="inline-flex shrink-0">
              <span
                className="react-flow__controls horizontal overflow-hidden rounded-sm border border-border bg-white"
                style={{
                    background: "#ffffff",
                    boxShadow: "none",
                    ["--xy-controls-button-background-color"]: "#ffffff",
                    ["--xy-controls-button-border-color"]: "#e2e8f0",
                  } as CSSProperties}
                aria-label="Controles de la tabla"
              >
                <ControlButton
                  className="react-flow__controls-zoomin"
                  title="Acercar"
                  aria-label="Acercar"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
                >
                  <PlusIcon />
                </ControlButton>
                <ControlButton
                  className="react-flow__controls-zoomout"
                  title="Alejar"
                  aria-label="Alejar"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
                >
                  <MinusIcon />
                </ControlButton>
                <ControlButton
                  className="react-flow__controls-fitview"
                  title="Ajustar vista"
                  aria-label="Ajustar vista"
                  onClick={fitView}
                >
                  <FitViewIcon />
                </ControlButton>
                <ControlButton
                  className="react-flow__controls-interactive"
                  title={locked ? "Desbloquear" : "Bloquear"}
                  aria-label={locked ? "Desbloquear" : "Bloquear"}
                  onClick={() => setLocked((v) => !v)}
                >
                  {locked ? <LockIcon /> : <UnlockIcon />}
                </ControlButton>
              </span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex border-b border-border/70">
              {monthSpans.map((span, i) => (
                <div
                  key={`${span.label}-${i}`}
                  className="truncate border-r border-border/60 px-1 py-0.5 text-center text-[10px] font-semibold capitalize text-slate-600"
                  style={{ width: span.count * dayPx }}
                >
                  {span.label}
                </div>
              ))}
            </div>
            <div className="flex">
              {days.map((d, i) => {
                const isEvent = isSameDay(d, event);
                const isToday = isSameDay(d, todayDate);
                const showLabel = i % dayLabelStep === 0;
                return (
                  <div
                    key={d.toISOString()}
                    title={format(d, "EEEE d MMMM yyyy", { locale: es })}
                    className={`box-border shrink-0 border-r border-border/40 py-0.5 text-center leading-tight ${
                      isEvent
                        ? "bg-accent/20 font-semibold text-accent-dark"
                        : isToday
                          ? "bg-slate-800/10 font-semibold text-slate-800"
                          : isWeekend(d)
                            ? "bg-slate-100/80"
                            : ""
                    }`}
                    style={{ width: dayPx }}
                  >
                    {showLabel ? format(d, "d") : ""}
                    {isEvent && (
                      <span className="mt-0.5 block text-[8px] font-medium uppercase">
                        Evento
                      </span>
                    )}
                    {isToday && !isEvent && (
                      <span className="mt-0.5 block text-[8px] font-medium uppercase">
                        Hoy
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {rows.map((task) => {
            const start = task.earliestStart
              ? calendarDate(task.earliestStart)
              : minDay;
            const finish = task.earliestFinish
              ? calendarDate(task.earliestFinish)
              : addCalendarDays(start, Math.max(task.durationDays, 0));
            const barDays = Math.max(0, differenceInCalendarDays(finish, start));
            const left = differenceInCalendarDays(start, minDay) * dayPx;
            const width = barDays > 0 ? barDays * dayPx : 4;
            const latestFinish = task.latestFinish
              ? calendarDate(task.latestFinish)
              : null;
            const floatDays =
              latestFinish && barDays > 0
                ? differenceInCalendarDays(latestFinish, finish)
                : 0;

            return (
              <div
                key={task.id}
                className="flex items-center border-b border-border/70 hover:bg-slate-50/80"
              >
                <button
                  type="button"
                  onClick={() => onSelectTask(task.id)}
                  className="sticky left-0 z-10 truncate bg-panel px-3 py-1 text-left text-sm hover:text-accent-dark"
                  style={{ width: LABEL_W }}
                >
                  {task.title}
                </button>
                <div
                  className="relative h-9 flex-1"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${dayPx - 1}px, var(--border) ${dayPx - 1}px, var(--border) ${dayPx}px)`,
                  }}
                >
                  <div
                    className="absolute top-0 bottom-0 z-[1] border-l-2 border-dashed border-slate-700/50"
                    style={{ left: todayOffset * dayPx }}
                    title="Hoy"
                  />
                  <div
                    className="absolute top-0 bottom-0 z-[1] border-l-2 border-dashed border-accent/70"
                    style={{ left: eventOffset * dayPx }}
                    title="Fecha del evento"
                  />
                  {floatDays > 0 && (
                    <div
                      className={`absolute top-1 h-7 rounded-md ${
                        task.isCritical ? "bg-critical/20" : "bg-accent/20"
                      }`}
                      style={{
                        left: left + (barDays > 0 ? barDays * dayPx : 4),
                        width: floatDays * dayPx,
                      }}
                      title="Margen hasta la fecha del evento"
                    />
                  )}
                  <div
                    role="slider"
                    aria-label={`Mover ${task.title}`}
                    tabIndex={0}
                    onMouseDown={(e) => {
                      if (!interactive) return;
                      setDragging(task.id);
                      dragStartX.current = e.clientX;
                      dragOriginDays.current = 0;
                      const onMove = (ev: MouseEvent) => {
                        dragOriginDays.current = Math.round(
                          (ev.clientX - dragStartX.current) / dayPx,
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
                    className={`absolute top-1 h-7 overflow-hidden rounded-md text-[10px] leading-7 text-white ${
                      interactive
                        ? "cursor-grab active:cursor-grabbing"
                        : "cursor-default"
                    } ${
                      task.isCritical ? "bg-critical" : "bg-accent"
                    } ${dragging === task.id ? "opacity-80" : ""}`}
                    style={{ left, width }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-white/35"
                      style={{ width: `${Math.min(100, Math.max(0, task.progressPct))}%` }}
                    />
                    <span className="relative px-2">
                      {task.durationDays}d · {task.progressPct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}
