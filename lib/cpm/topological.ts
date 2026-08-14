import { CpmEdge, CpmError, CpmTask } from "./types";

export function topologicalSort(tasks: CpmTask[], edges: CpmEdge[]): string[] {
  const ids = new Set(tasks.map((t) => t.id));
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const id of ids) {
    indegree.set(id, 0);
    adj.set(id, []);
  }

  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      throw new CpmError(`Arista inválida: ${edge.from} → ${edge.to}`);
    }
    adj.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const queue = [...ids].filter((id) => (indegree.get(id) ?? 0) === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      const nextDeg = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }

  if (order.length !== ids.size) {
    throw new CpmError("El grafo tiene un ciclo; las dependencias deben formar un DAG");
  }

  return order;
}

export function validateDag(tasks: CpmTask[], edges: CpmEdge[]): void {
  topologicalSort(tasks, edges);
}
