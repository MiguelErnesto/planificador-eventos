import { describe, expect, it } from "vitest";
import { eventProgressPct } from "./progress";

describe("eventProgressPct", () => {
  it("returns 0 without tasks", () => {
    expect(eventProgressPct([])).toBe(0);
  });

  it("weights by duration", () => {
    expect(
      eventProgressPct([
        { progressPct: 100, durationDays: 1 },
        { progressPct: 0, durationDays: 3 },
      ]),
    ).toBe(25);
  });
});
