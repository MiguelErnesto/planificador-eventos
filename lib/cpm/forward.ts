import { CpmEdge, CpmTask } from "./types";
import { topologicalSort } from "./topological";

export type ForwardResult = {
  ES: Record<string, number>;
  EF: Record<string, number>;
  projectDuration: number;
};

function lagOf(e: CpmEdge) {
  return e.lag ?? 0;
}

function forwardESFromEdge(
  e: CpmEdge,
  ES: Record<string, number>,
  EF: Record<string, number>,
  durationTo: number,
): number {
  const lag = lagOf(e);
  switch (e.type ?? "FS") {
    case "SS":
      return (ES[e.from] ?? 0) + lag;
    case "FF":
      return (EF[e.from] ?? 0) + lag - durationTo;
    case "FS":
    default:
      return (EF[e.from] ?? 0) + lag;
  }
}

export type ForwardPassOptions = {
  /** Earliest calendar day a pending task may start (relative to the planning anchor). */
  nowDay?: number;
};

export function forwardPass(
  tasks: CpmTask[],
  edges: CpmEdge[],
  options: ForwardPassOptions = {},
): ForwardResult {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const preds = new Map<string, CpmEdge[]>();
  for (const t of tasks) preds.set(t.id, []);
  for (const e of edges) preds.get(e.to)!.push(e);

  const nowDay = options.nowDay ?? 0;
  const order = topologicalSort(tasks, edges);
  const ES: Record<string, number> = {};
  const EF: Record<string, number> = {};

  for (const id of order) {
    const task = byId.get(id)!;
    const incoming = preds.get(id) ?? [];
    const pending = task.duration > 0;
    let es: number;
    if (!pending && task.fixedStart !== undefined) {
      // Finished work stays on its frozen day, even before nowDay.
      es = task.fixedStart;
    } else {
      es = nowDay;
      if (incoming.length > 0) {
        es = Math.max(
          es,
          ...incoming.map((e) => forwardESFromEdge(e, ES, EF, task.duration)),
        );
      }
      if (task.fixedStart !== undefined) {
        es = Math.max(es, task.fixedStart);
      }
    }
    ES[id] = es;
    EF[id] = es + task.duration;
  }

  const projectDuration = Math.max(0, ...Object.values(EF));
  return { ES, EF, projectDuration };
}
