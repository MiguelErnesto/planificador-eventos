import { describe, expect, it } from "vitest";
import { layeredGraphPositions } from "./graph-layout";

describe("layeredGraphPositions", () => {
  it("places a chain left-to-right in successive columns", () => {
    const pos = layeredGraphPositions(
      ["A", "B", "C"],
      [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
      ],
      240,
      120,
    );
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")).toEqual({ x: 240, y: 0 });
    expect(pos.get("C")).toEqual({ x: 480, y: 0 });
  });

  it("stacks siblings in the same column and centers shorter columns", () => {
    const pos = layeredGraphPositions(
      ["A", "B", "C"],
      [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
      ],
      240,
      120,
    );
    expect(pos.get("A")).toEqual({ x: 0, y: 60 });
    expect(pos.get("B")?.x).toBe(240);
    expect(pos.get("C")?.x).toBe(240);
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
      240,
      120,
    );
    expect(pos.get("A")?.x).toBe(0);
    expect(pos.get("B")?.x).toBe(240);
    expect(pos.get("C")?.x).toBe(240);
    expect(pos.get("D")?.x).toBe(480);
  });

  it("keeps children near their parent branch (barycenter)", () => {
    // Two roots; each has a child. Children should follow parent order.
    const pos = layeredGraphPositions(
      ["A", "B", "C", "D"],
      [
        { from: "A", to: "C" },
        { from: "B", to: "D" },
      ],
      240,
      120,
    );
    expect(pos.get("A")?.x).toBe(0);
    expect(pos.get("B")?.x).toBe(0);
    expect(pos.get("C")?.x).toBe(240);
    expect(pos.get("D")?.x).toBe(240);
    // A above B ⇒ C above D
    expect(pos.get("A")!.y).toBeLessThan(pos.get("B")!.y);
    expect(pos.get("C")!.y).toBeLessThan(pos.get("D")!.y);
  });

  it("stacks isolated tasks in the first column", () => {
    const pos = layeredGraphPositions(["A", "B"], [], 240, 120);
    expect(pos.get("A")).toEqual({ x: 0, y: 0 });
    expect(pos.get("B")).toEqual({ x: 0, y: 120 });
  });
});
