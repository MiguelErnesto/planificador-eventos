import { describe, expect, it } from "vitest";
import { layeredGraphPositions } from "./graph-layout";

describe("layeredGraphPositions", () => {
  it("places a chain in successive columns", () => {
    const pos = layeredGraphPositions(
      ["A", "B", "C"],
      [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
      ],
      168,
      72,
    );
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")).toEqual({ x: 168, y: 0 });
    expect(pos.get("C")).toEqual({ x: 336, y: 0 });
  });

  it("stacks siblings in the same column and centers shorter columns", () => {
    const pos = layeredGraphPositions(
      ["A", "B", "C"],
      [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
      ],
      168,
      72,
    );
    // Level 1 has 2 nodes → max column height; A alone is vertically centered.
    expect(pos.get("A")).toEqual({ x: 0, y: 36 });
    expect(pos.get("B")?.x).toBe(168);
    expect(pos.get("C")?.x).toBe(168);
    expect(pos.get("B")?.y).not.toBe(pos.get("C")?.y);
  });

  it("puts a join node after the longest predecessor path", () => {
    const pos = layeredGraphPositions(
      ["A", "B", "C", "D"],
      [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
      168,
      72,
    );
    expect(pos.get("A")?.x).toBe(0);
    expect(pos.get("B")?.x).toBe(168);
    expect(pos.get("C")?.x).toBe(168);
    expect(pos.get("D")?.x).toBe(336);
  });

  it("stacks isolated tasks in the first column", () => {
    const pos = layeredGraphPositions(["A", "B"], [], 168, 72);
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")).toEqual({ x: 0, y: 72 });
  });
});
