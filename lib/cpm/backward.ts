import { CpmEdge, CpmTask } from "./types";
import { topologicalSort } from "./topological";

export type BackwardResult = {
  LS: Record<string, number>;
  LF: Record<string, number>;
};

function lagOf(e: CpmEdge) {
  return e.lag ?? 0;
}

function backwardLFFromEdge(
  e: CpmEdge,
  LS: Record<string, number>,
  durationFrom: number,
  durationTo: number,
  horizon: number,
): number {
  const lag = lagOf(e);
  const lsTo = LS[e.to] ?? horizon;
  switch (e.type ?? "FS") {
    case "SS":
      return lsTo - lag + durationFrom;
    case "FF":
      return lsTo + durationTo - lag;
    case "FS":
    default:
      return lsTo - lag;
  }
}

export function backwardPass(
  tasks: CpmTask[],
  edges: CpmEdge[],
  EF: Record<string, number>,
  horizon: number,
): BackwardResult {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const succs = new Map<string, CpmEdge[]>();
  for (const t of tasks) succs.set(t.id, []);
  for (const e of edges) succs.get(e.from)!.push(e);

  const order = topologicalSort(tasks, edges).slice().reverse();
  const LS: Record<string, number> = {};
  const LF: Record<string, number> = {};

  for (const id of order) {
    const task = byId.get(id)!;
    const outgoing = succs.get(id) ?? [];
    let lf = horizon;
    if (outgoing.length > 0) {
      lf = Math.min(
        ...outgoing.map((e) => {
          const succ = byId.get(e.to);
          return backwardLFFromEdge(
            e,
            LS,
            task.duration,
            succ?.duration ?? 0,
            horizon,
          );
        }),
      );
    }
    LF[id] = lf;
    LS[id] = lf - task.duration;
  }

  void EF;

  return { LS, LF };
}
