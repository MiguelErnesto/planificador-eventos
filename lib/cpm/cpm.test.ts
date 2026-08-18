import { describe, expect, it } from "vitest";
import { runCpm, validateDag, CpmError } from "./index";

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
});
