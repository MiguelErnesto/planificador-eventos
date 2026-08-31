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
      220,
      100,
    );
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")).toEqual({ x: 220, y: 0 });
    expect(pos.get("C")).toEqual({ x: 440, y: 0 });
  });

  it("stacks siblings in the same column", () => {
    const pos = layeredGraphPositions(
      ["A", "B", "C"],
      [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
      ],
      220,
      100,
    );
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")?.x).toBe(220);
    expect(pos.get("C")?.x).toBe(220);
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
      220,
      100,
    );
    expect(pos.get("A")?.x).toBe(0);
    expect(pos.get("B")?.x).toBe(220);
    expect(pos.get("C")?.x).toBe(220);
    expect(pos.get("D")?.x).toBe(440);
  });

  it("stacks isolated tasks in the first column", () => {
    const pos = layeredGraphPositions(["A", "B"], [], 220, 100);
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")).toEqual({ x: 0, y: 100 });
  });
});
