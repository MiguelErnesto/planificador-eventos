/** Column / row spacing for a readable left-to-right tree on mobile. */
const COL_GAP = 240;
const ROW_GAP = 120;

/**
 * Left-to-right layered tree layout (longest-path levels).
 * Nodes in each column are ordered by the barycenter of their parents
 * so sibling branches stay closer together and edges cross less.
 */
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

  const levelKeys = [...byLevel.keys()].sort((a, b) => a - b);
  const rank = new Map<string, number>();

  // Forward barycenter: keep children near their parents (tree-like).
  for (const lv of levelKeys) {
    const ids = byLevel.get(lv)!;
    if (lv === 0) {
      ids.forEach((id, i) => rank.set(id, i));
      continue;
    }
    const scored = ids.map((id, original) => {
      const parents = preds.get(id) ?? [];
      const parentRanks = parents
        .map((p) => rank.get(p))
        .filter((r): r is number => r != null);
      const bary =
        parentRanks.length > 0
          ? parentRanks.reduce((a, b) => a + b, 0) / parentRanks.length
          : original;
      return { id, bary, original };
    });
    scored.sort((a, b) => a.bary - b.bary || a.original - b.original);
    byLevel.set(
      lv,
      scored.map((s) => s.id),
    );
    scored.forEach((s, i) => rank.set(s.id, i));
  }

  const maxInColumn = Math.max(1, ...[...byLevel.values()].map((ids) => ids.length));

  const positions = new Map<string, { x: number; y: number }>();
  for (const lv of levelKeys) {
    const ids = byLevel.get(lv)!;
    const offsetY = ((maxInColumn - ids.length) * rowGap) / 2;
    ids.forEach((id, i) => {
      positions.set(id, { x: lv * colGap, y: offsetY + i * rowGap });
    });
  }
  return positions;
}
