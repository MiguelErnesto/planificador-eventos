import { backwardPass } from "./backward";
import { forwardPass } from "./forward";
import { CpmEdge, CpmResult, CpmTask } from "./types";

const SLACK_EPS = 1e-9;

export type RunCpmOptions = {
  /** Absolute horizon in relative days. Defaults to max EF. */
  horizon?: number;
};

export function runCpm(
  tasks: CpmTask[],
  edges: CpmEdge[],
  options: RunCpmOptions = {},
): CpmResult {
  if (tasks.length === 0) {
    return { byId: {}, projectDuration: 0, criticalPath: [] };
  }

  const { ES, EF, projectDuration } = forwardPass(tasks, edges);
  const horizon = options.horizon ?? projectDuration;
  const { LS, LF } = backwardPass(tasks, edges, EF, horizon);

  const byId: CpmResult["byId"] = {};
  for (const task of tasks) {
    const slack = LS[task.id] - ES[task.id];
    byId[task.id] = {
      ES: ES[task.id],
      EF: EF[task.id],
      LS: LS[task.id],
      LF: LF[task.id],
      slack,
      critical: Math.abs(slack) <= SLACK_EPS,
    };
  }

  const criticalPath = buildCriticalPath(tasks, edges, byId);

  return { byId, projectDuration, criticalPath };
}

function buildCriticalPath(
  tasks: CpmTask[],
  edges: CpmEdge[],
  byId: CpmResult["byId"],
): string[] {
  const criticalIds = new Set(
    tasks.filter((t) => byId[t.id]?.critical).map((t) => t.id),
  );
  if (criticalIds.size === 0) return [];

  const succs = new Map<string, string[]>();
  for (const id of criticalIds) succs.set(id, []);
  for (const e of edges) {
    if (criticalIds.has(e.from) && criticalIds.has(e.to)) {
      succs.get(e.from)!.push(e.to);
    }
  }

  const starts = [...criticalIds].filter((id) => {
    return !edges.some((e) => e.to === id && criticalIds.has(e.from));
  });

  let best: string[] = [];
  for (const start of starts) {
    const path: string[] = [];
    const walk = (id: string) => {
      path.push(id);
      const next = (succs.get(id) ?? [])[0];
      if (next) walk(next);
    };
    walk(start);
    if (path.length > best.length) best = path;
  }

  return best;
}
