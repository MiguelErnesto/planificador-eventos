export function eventProgressPct(
  tasks: { progressPct: number; durationDays: number }[],
): number {
  const total = tasks.reduce((sum, t) => sum + t.durationDays, 0);
  if (total <= 0) return 0;
  const weighted = tasks.reduce(
    (sum, t) => sum + t.progressPct * t.durationDays,
    0,
  );
  return Math.round(weighted / total);
}
