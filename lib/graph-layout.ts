const COL_GAP = 168;
const ROW_GAP = 72;

/** Left-to-right layered positions from a DAG (longest-path levels). Visual only. */
export function layeredGraphPositions(
  taskIds: string[],
  edges: { from: string; to: string }[],
  colGap = COL_GAP,
  rowGap = ROW_GAP,
): Map<string, { x: number; y: number }> {
  const idSet = new Set(taskIds);
  const level = new Map<string, number>();
  const preds = new Map<string, string[]>();
  const succs = new Map<string, string[]>();

  for (const id of taskIds) {
    level.set(id, 0);
    preds.set(id, []);
    succs.set(id, []);
  }

  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to) || e.from === e.to) continue;
    succs.get(e.from)!.push(e.to);
    preds.get(e.to)!.push(e.from);
  }

  const indegree = new Map<string, number>();
  for (const id of taskIds) {
    indegree.set(id, preds.get(id)!.length);
  }

  const queue = taskIds.filter((id) => indegree.get(id) === 0);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of succs.get(id)!) {
      const nextDeg = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }

  for (const id of order) {
    const p = preds.get(id)!;
    level.set(
      id,
      p.length === 0 ? 0 : Math.max(...p.map((pred) => level.get(pred) ?? 0)) + 1,
    );
  }

  const leftover = taskIds.filter((id) => !order.includes(id));
  const maxPlaced = leftover.length
    ? Math.max(0, ...order.map((id) => level.get(id) ?? 0))
    : 0;
  for (const id of leftover) {
    level.set(id, maxPlaced + 1);
  }

  const byLevel = new Map<number, string[]>();
  for (const id of taskIds) {
    const lv = level.get(id) ?? 0;
    const list = byLevel.get(lv) ?? [];
    list.push(id);
    byLevel.set(lv, list);
  }

  const maxInColumn = Math.max(1, ...[...byLevel.values()].map((ids) => ids.length));

  const positions = new Map<string, { x: number; y: number }>();
  for (const [lv, ids] of byLevel) {
    const offsetY = ((maxInColumn - ids.length) * rowGap) / 2;
    ids.forEach((id, i) => {
      positions.set(id, { x: lv * colGap, y: offsetY + i * rowGap });
    });
  }
  return positions;
}
