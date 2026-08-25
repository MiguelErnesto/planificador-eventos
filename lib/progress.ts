export function remainingDurationDays(
  durationDays: number,
  progressPct: number,
): number {
  const pct = Math.min(100, Math.max(0, progressPct));
  if (pct >= 100) return 0;
  return Math.max(0, Math.round(durationDays * (1 - pct / 100)));
}

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
