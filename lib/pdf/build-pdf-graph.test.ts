import { describe, expect, it } from "vitest";
import { buildPdfGraph, PDF_NODE_W } from "./build-pdf-graph";

describe("buildPdfGraph", () => {
  it("returns null without tasks", () => {
    expect(buildPdfGraph([], [])).toBeNull();
  });

  it("places a chain left to right like the mobile tree", () => {
    const graph = buildPdfGraph(
      [
        task("A", "Venue"),
        task("B", "Cáterin"),
        task("C", "Montaje"),
      ],
      [
        edge("e1", "A", "B"),
        edge("e2", "B", "C"),
      ],
    );
    expect(graph).not.toBeNull();
    const xs = Object.fromEntries(graph!.nodes.map((n) => [n.id, n.x]));
    expect(xs.A).toBeLessThan(xs.B!);
    expect(xs.B).toBeLessThan(xs.C!);
    expect(graph!.edges).toHaveLength(2);
    expect(graph!.edges[0]?.path.startsWith("M ")).toBe(true);
  });

  it("labels lag and non-FS types, omits plain FS", () => {
    const graph = buildPdfGraph(
      [task("A", "A"), task("B", "B"), task("C", "C")],
      [
        edge("fs", "A", "B"),
        { id: "lag", fromTaskId: "B", toTaskId: "C", lagDays: 2, type: "FS" },
      ],
    );
    expect(graph?.edges.find((e) => e.id === "fs")?.label).toBeNull();
    expect(graph?.edges.find((e) => e.id === "lag")?.label).toBe("+2d");
  });

  it("sizes the canvas to include node boxes", () => {
    const graph = buildPdfGraph([task("A", "Solo")], []);
    expect(graph?.nodes[0]?.x).toBeGreaterThan(0);
    expect(graph!.width).toBeGreaterThan(PDF_NODE_W);
    expect(graph!.height).toBeGreaterThan(graph!.nodes[0]!.y);
  });
});

function task(
  id: string,
  title: string,
): {
  id: string;
  title: string;
  durationDays: number;
  progressPct: number;
  isCritical: boolean;
} {
  return { id, title, durationDays: 3, progressPct: 0, isCritical: false };
}

function edge(
  id: string,
  fromTaskId: string,
  toTaskId: string,
): {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  lagDays: number;
  type: "FS";
} {
  return { id, fromTaskId, toTaskId, lagDays: 0, type: "FS" };
}
