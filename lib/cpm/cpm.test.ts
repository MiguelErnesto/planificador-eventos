import { describe, expect, it } from "vitest";
import { runCpm, validateDag, CpmError, isEventCritical } from "./index";

describe("CPM", () => {
  const tasks = [
    { id: "A", duration: 3 }, // contratar caterin
    { id: "B", duration: 2 }, // enviar invitaciones
    { id: "C", duration: 4 }, // montar escenario
    { id: "D", duration: 1 }, // prueba de sonido
    { id: "E", duration: 1 }, // llegada invitados
  ];

  const edges = [
    { from: "A", to: "C" },
    { from: "B", to: "E" },
    { from: "C", to: "D" },
    { from: "D", to: "E" },
  ];

  it("calculates forward/backward and critical path", () => {
    const result = runCpm(tasks, edges);
    // Path A→C→D→E = 3+4+1+1 = 9
    expect(result.projectDuration).toBe(9);
    expect(result.byId.A.ES).toBe(0);
    expect(result.byId.A.EF).toBe(3);
    expect(result.byId.C.ES).toBe(3);
    expect(result.byId.C.EF).toBe(7);
    expect(result.byId.D.ES).toBe(7);
    expect(result.byId.E.ES).toBe(8);
    expect(result.byId.E.EF).toBe(9);

    expect(result.byId.A.critical).toBe(true);
    expect(result.byId.C.critical).toBe(true);
    expect(result.byId.D.critical).toBe(true);
    expect(result.byId.E.critical).toBe(true);
    // B can start later: LS = 6 (must finish before E@8)
    expect(result.byId.B.critical).toBe(false);
    expect(result.byId.B.slack).toBe(6);

    expect(result.criticalPath).toEqual(["A", "C", "D", "E"]);
  });

  it("detects cycles", () => {
    expect(() =>
      validateDag(tasks, [...edges, { from: "E", to: "A" }]),
    ).toThrow(CpmError);
  });

  it("respects fixedStart", () => {
    const result = runCpm(
      [
        { id: "X", duration: 2 },
        { id: "Y", duration: 2, fixedStart: 5 },
      ],
      [{ from: "X", to: "Y" }],
    );
    expect(result.byId.Y.ES).toBe(5);
    expect(result.byId.Y.EF).toBe(7);
  });

  it("uses lag days", () => {
    const result = runCpm(
      [
        { id: "X", duration: 2 },
        { id: "Y", duration: 1 },
      ],
      [{ from: "X", to: "Y", lag: 3 }],
    );
    expect(result.byId.Y.ES).toBe(5);
  });

  it("SS: successor starts with predecessor", () => {
    const result = runCpm(
      [
        { id: "A", duration: 5 },
        { id: "B", duration: 3 },
      ],
      [{ from: "A", to: "B", type: "SS" }],
    );
    expect(result.byId.A.ES).toBe(0);
    expect(result.byId.B.ES).toBe(0);
    expect(result.byId.A.EF).toBe(5);
    expect(result.byId.B.EF).toBe(3);
  });

  it("FF: successor finishes with predecessor", () => {
    const result = runCpm(
      [
        { id: "A", duration: 5 },
        { id: "B", duration: 3 },
      ],
      [{ from: "A", to: "B", type: "FF" }],
    );
    expect(result.byId.A.EF).toBe(5);
    expect(result.byId.B.EF).toBe(5);
    expect(result.byId.B.ES).toBe(2);
  });

  it("SS with lag delays successor start", () => {
    const result = runCpm(
      [
        { id: "A", duration: 4 },
        { id: "B", duration: 2 },
      ],
      [{ from: "A", to: "B", type: "SS", lag: 2 }],
    );
    expect(result.byId.B.ES).toBe(2);
    expect(result.byId.B.EF).toBe(4);
  });

  it("nowDay + event horizon: event slack vs network critical", () => {
    const chain = [
      { id: "A", duration: 5 },
      { id: "B", duration: 5 },
      { id: "C", duration: 3 },
    ];
    const chainEdges = [{ from: "A", to: "B" }, { from: "B", to: "C" }];
    const result = runCpm(chain, chainEdges, { nowDay: 0, horizon: 90 });
    expect(result.projectDuration).toBe(13);
    expect(result.byId.A.ES).toBe(0);
    expect(result.byId.C.EF).toBe(13);
    expect(result.byId.A.critical).toBe(true);
    expect(result.byId.B.critical).toBe(true);
    expect(result.byId.C.critical).toBe(true);
    expect(result.byId.A.slack).toBe(77);
    expect(result.byId.C.slack).toBe(77);
  });

  it("short parallel branch has network slack and more event slack", () => {
    const result = runCpm(
      [
        { id: "A", duration: 10 },
        { id: "B", duration: 3 },
        { id: "C", duration: 1 },
      ],
      [
        { from: "A", to: "C" },
        { from: "B", to: "C" },
      ],
      { nowDay: 0, horizon: 90 },
    );
    expect(result.byId.A.critical).toBe(true);
    expect(result.byId.B.critical).toBe(false);
    expect(result.byId.C.critical).toBe(true);
    expect(result.byId.A.slack).toBe(79);
    expect(result.byId.B.slack).toBeGreaterThan(result.byId.A.slack);
  });

  it("overrunning the event yields negative event slack", () => {
    const result = runCpm(
      [
        { id: "A", duration: 50 },
        { id: "B", duration: 50 },
      ],
      [{ from: "A", to: "B" }],
      { nowDay: 0, horizon: 90 },
    );
    expect(result.projectDuration).toBe(100);
    expect(result.byId.A.critical).toBe(true);
    expect(result.byId.B.critical).toBe(true);
    expect(result.byId.A.slack).toBe(-10);
    expect(result.byId.B.slack).toBe(-10);
  });

  it("floors starts at nowDay", () => {
    const result = runCpm(
      [
        { id: "A", duration: 4 },
        { id: "B", duration: 2 },
      ],
      [{ from: "A", to: "B" }],
      { nowDay: 20, horizon: 40 },
    );
    expect(result.byId.A.ES).toBe(20);
    expect(result.byId.B.ES).toBe(24);
    expect(result.byId.B.EF).toBe(26);
    expect(result.byId.A.critical).toBe(true);
    expect(result.byId.A.slack).toBe(14);
  });

  it("keeps a future fixedStart later than nowDay", () => {
    const result = runCpm(
      [
        { id: "X", duration: 2 },
        { id: "Y", duration: 2, fixedStart: 30 },
      ],
      [{ from: "X", to: "Y" }],
      { nowDay: 10, horizon: 40 },
    );
    expect(result.byId.Y.ES).toBe(30);
    expect(result.byId.Y.EF).toBe(32);
  });

  it("isEventCritical when event slack is 2 days or less", () => {
    expect(isEventCritical(3)).toBe(false);
    expect(isEventCritical(2)).toBe(true);
    expect(isEventCritical(1)).toBe(true);
    expect(isEventCritical(0)).toBe(true);
    expect(isEventCritical(-4)).toBe(true);
  });
});
