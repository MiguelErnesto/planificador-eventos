import { runCpm, RunCpmOptions } from "./run";
import { CpmEdge, CpmResult, CpmTask, DelayPatch } from "./types";

export function simulate(
  tasks: CpmTask[],
  edges: CpmEdge[],
  patches: DelayPatch[],
  options: RunCpmOptions = {},
): CpmResult {
  const extras = new Map<string, number>();
  for (const p of patches) {
    extras.set(p.taskId, (extras.get(p.taskId) ?? 0) + p.extraDays);
  }

  const cloned: CpmTask[] = tasks.map((t) => ({
    ...t,
    duration: t.duration + (extras.get(t.id) ?? 0),
  }));

  return runCpm(cloned, edges, options);
}
