import type { DependencyType } from "@/lib/cpm";
import { dependencyLabel } from "@/lib/dependency";
import { layeredGraphPositions } from "@/lib/graph-layout";

/** Match the mobile node box (`hideHandles` width in TaskFlow). */
export const PDF_NODE_W = 148;
export const PDF_NODE_H = 56;
const PAD = 16;
const TITLE_MAX = 26;

export type PdfGraphTask = {
  id: string;
  title: string;
  durationDays: number;
  progressPct: number;
  isCritical: boolean;
};

export type PdfGraphEdgeInput = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  lagDays: number;
  type: DependencyType;
};

export type PdfGraphNode = {
  id: string;
  title: string;
  meta: string;
  progressPct: number;
  isCritical: boolean;
  x: number;
  y: number;
};

export type PdfGraphEdge = {
  id: string;
  path: string;
  label: string | null;
  labelX: number;
  labelY: number;
  arrowPoints: string;
};

export type PdfGraph = {
  nodes: PdfGraphNode[];
  edges: PdfGraphEdge[];
  width: number;
  height: number;
};

export function buildPdfGraph(
  tasks: PdfGraphTask[],
  edges: PdfGraphEdgeInput[],
): PdfGraph | null {
  if (tasks.length === 0) return null;

  const positions = layeredGraphPositions(
    tasks.map((t) => t.id),
    edges.map((e) => ({ from: e.fromTaskId, to: e.toTaskId })),
  );

  const nodes: PdfGraphNode[] = tasks.map((t) => {
    const pos = positions.get(t.id) ?? { x: 0, y: 0 };
    return {
      id: t.id,
      title: ellipsize(t.title, TITLE_MAX),
      meta: `${t.durationDays}d · ${t.progressPct}%`,
      progressPct: t.progressPct,
      isCritical: t.isCritical,
      x: pos.x + PAD,
      y: pos.y + PAD,
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const drawn: PdfGraphEdge[] = [];
  for (const e of edges) {
    const from = byId.get(e.fromTaskId);
    const to = byId.get(e.toTaskId);
    if (!from || !to) continue;
    drawn.push(edgeGeometry(e, from, to));
  }

  const maxX = Math.max(...nodes.map((n) => n.x + PDF_NODE_W));
  const maxY = Math.max(...nodes.map((n) => n.y + PDF_NODE_H));

  return {
    nodes,
    edges: drawn,
    width: maxX + PAD,
    height: maxY + PAD,
  };
}

function ellipsize(value: string, max: number) {
  const title = value.trim();
  if (title.length <= max) return title;
  return `${title.slice(0, max - 3)}...`;
}

function edgeGeometry(
  edge: PdfGraphEdgeInput,
  from: PdfGraphNode,
  to: PdfGraphNode,
): PdfGraphEdge {
  const { sx, sy, tx, ty, sourceSide, targetSide } = anchors(from, to, edge.type);
  const dx = Math.abs(tx - sx);
  const bulge = Math.max(36, dx * 0.35);
  const c1x = sourceSide === "right" ? sx + bulge : sx - bulge;
  const c2x = targetSide === "left" ? tx - bulge : tx + bulge;
  const path = `M ${sx} ${sy} C ${c1x} ${sy} ${c2x} ${ty} ${tx} ${ty}`;
  const labelX = cubic(0.5, sx, c1x, c2x, tx);
  const labelY = cubic(0.5, sy, sy, ty, ty);

  return {
    id: edge.id,
    path,
    label: dependencyLabel(edge.type, edge.lagDays) ?? null,
    labelX,
    labelY,
    arrowPoints: arrowPolygon(tx, ty, targetSide),
  };
}

function anchors(
  from: PdfGraphNode,
  to: PdfGraphNode,
  type: DependencyType,
) {
  if (type === "SS") {
    return {
      sx: from.x,
      sy: from.y + PDF_NODE_H * 0.7,
      tx: to.x,
      ty: to.y + PDF_NODE_H * 0.35,
      sourceSide: "left" as const,
      targetSide: "left" as const,
    };
  }
  if (type === "FF") {
    return {
      sx: from.x + PDF_NODE_W,
      sy: from.y + PDF_NODE_H * 0.35,
      tx: to.x + PDF_NODE_W,
      ty: to.y + PDF_NODE_H * 0.7,
      sourceSide: "right" as const,
      targetSide: "right" as const,
    };
  }
  return {
    sx: from.x + PDF_NODE_W,
    sy: from.y + PDF_NODE_H * 0.35,
    tx: to.x,
    ty: to.y + PDF_NODE_H * 0.35,
    sourceSide: "right" as const,
    targetSide: "left" as const,
  };
}

function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * p1 + 3 * mt * t ** 2 * p2 + t ** 3 * p3;
}

function arrowPolygon(tx: number, ty: number, targetSide: "left" | "right") {
  const dir = targetSide === "left" ? 1 : -1;
  const base = tx - 8 * dir;
  return `${tx},${ty} ${base},${ty - 4} ${base},${ty + 4}`;
}
