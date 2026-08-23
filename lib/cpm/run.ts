import { backwardPass } from "./backward";
import { forwardPass } from "./forward";
import { CpmEdge, CpmResult, CpmTask } from "./types";

const SLACK_EPS = 1e-9;

/** A task is date-critical when event slack is 2 days or less (including overdue). */
export const EVENT_CRITICAL_SLACK_DAYS = 2;

export function isEventCritical(slackDays: number): boolean {
  return slackDays <= EVENT_CRITICAL_SLACK_DAYS;
}

export type RunCpmOptions = {
  /** Event (or other deadline) day in relative days. Defaults to max EF. */
  horizon?: number;
  /** Earliest day pending work may start. Defaults to 0 (planning anchor). */
  nowDay?: number;
};

export function runCpm(
  tasks: CpmTask[],
  edges: CpmEdge[],
  options: RunCpmOptions = {},
): CpmResult {
  if (tasks.length === 0) {
    return { byId: {}, projectDuration: 0, criticalPath: [] };
  }

  const { ES, EF, projectDuration } = forwardPass(tasks, edges, {
    nowDay: options.nowDay,
  });
  const network = backwardPass(tasks, edges, EF, projectDuration);
  const eventHorizon = options.horizon ?? projectDuration;
  const event = backwardPass(tasks, edges, EF, eventHorizon);

  const byId: CpmResult["byId"] = {};
  for (const task of tasks) {
    const networkSlack = network.LS[task.id] - ES[task.id];
    const slack = event.LS[task.id] - ES[task.id];
    byId[task.id] = {
      ES: ES[task.id],
      EF: EF[task.id],
      LS: event.LS[task.id],
      LF: event.LF[task.id],
      slack,
      critical: Math.abs(networkSlack) <= SLACK_EPS,
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
