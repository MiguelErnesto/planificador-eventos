import { CpmEdge, CpmTask } from "./types";
import { topologicalSort } from "./topological";

export type BackwardResult = {
  LS: Record<string, number>;
  LF: Record<string, number>;
};

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
        ...outgoing.map((e) => (LS[e.to] ?? horizon) - (e.lag ?? 0)),
      );
    }
    LF[id] = lf;
    LS[id] = lf - task.duration;
  }

  // silence unused if EF not needed for logic; kept for API symmetry / future checks
  void EF;

  return { LS, LF };
}
