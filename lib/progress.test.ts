import { describe, expect, it } from "vitest";
import { eventProgressPct, remainingDurationDays } from "./progress";
import { runCpm } from "./cpm";

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

describe("remainingDurationDays", () => {
  it("keeps full duration at 0% progress", () => {
    expect(remainingDurationDays(7, 0)).toBe(7);
  });

  it("rounds half of 7 days to 4", () => {
    expect(remainingDurationDays(7, 50)).toBe(4);
  });

  it("returns 0 at 100%", () => {
    expect(remainingDurationDays(7, 100)).toBe(0);
  });
});

describe("CPM remaining duration", () => {
  it("shortens EF when work is half done", () => {
    const duration = remainingDurationDays(7, 50);
    const result = runCpm([{ id: "A", duration }], [], {
      nowDay: 0,
      horizon: 10,
    });
    expect(result.byId.A.EF).toBe(4);
    expect(result.byId.A.ES).toBe(0);
  });
});
