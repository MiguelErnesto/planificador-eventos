import { describe, expect, it } from "vitest";
import {
  buildProjectReport,
  daysPhrase,
  pdfContentDisposition,
  projectPdfFilename,
} from "./project-report";

const today = "2026-03-01T00:00:00.000Z";
const eventDate = "2026-06-10T00:00:00.000Z";

function task(
  partial: Partial<Parameters<typeof buildProjectReport>[0]["tasks"][number]> & {
    id: string;
    title: string;
  },
) {
  return {
    durationDays: 3,
    earliestStart: null,
    earliestFinish: null,
    slackDays: 8,
    isCritical: false,
    progressPct: 0,
    ...partial,
  };
}

describe("daysPhrase", () => {
  it("singular and plural, ignoring sign", () => {
    expect(daysPhrase(1)).toBe("1 día");
    expect(daysPhrase(-2)).toBe("2 días");
  });
});

describe("projectPdfFilename", () => {
  it("slugs the project name and keeps the event day", () => {
    expect(projectPdfFilename("Boda Ana & Luis", eventDate)).toBe(
      "boda-ana-luis-2026-06-10.pdf",
    );
  });

  it("falls back when the name has no letters", () => {
    expect(projectPdfFilename("!!!", eventDate)).toBe("proyecto-2026-06-10.pdf");
  });
});

describe("pdfContentDisposition", () => {
  it("offers an ASCII filename and a UTF-8 fallback", () => {
    expect(pdfContentDisposition("boda-ana-luis-2026-06-10.pdf")).toContain(
      'filename="boda-ana-luis-2026-06-10.pdf"',
    );
    expect(pdfContentDisposition("bodá.pdf")).toContain(
      "filename*=UTF-8''bod%C3%A1.pdf",
    );
  });
});

describe("buildProjectReport", () => {
  it("describes an empty project", () => {
    const report = buildProjectReport({
      name: "Vacío",
      eventDate,
      timezone: "Europe/Madrid",
      today,
      tasks: [],
      criticalPathIds: [],
      planSlackDays: 12,
      exceedsEventDate: false,
      overrunDays: 0,
    });

    expect(report.tasks).toEqual([]);
    expect(report.criticalPathLabel).toBeNull();
    expect(report.overrunWarning).toBeNull();
    expect(report.progressPct).toBe(0);
    expect(report.slackHeadline).toBe("Holgura 12 días");
    expect(report.slackIsTight).toBe(false);
  });

  it("sorts critical tasks first, then by earliest start", () => {
    const report = buildProjectReport({
      name: "Boda",
      eventDate,
      timezone: "Europe/Madrid",
      today,
      tasks: [
        task({
          id: "late",
          title: "Flores",
          earliestStart: "2026-05-01T00:00:00.000Z",
          earliestFinish: "2026-05-03T00:00:00.000Z",
        }),
        task({
          id: "early",
          title: "Venue",
          earliestStart: "2026-03-10T00:00:00.000Z",
          earliestFinish: "2026-03-15T00:00:00.000Z",
          isCritical: true,
          slackDays: 1,
        }),
        task({
          id: "also-critical",
          title: "Cáterin",
          earliestStart: "2026-04-01T00:00:00.000Z",
          earliestFinish: "2026-04-08T00:00:00.000Z",
          isCritical: true,
          slackDays: 0,
        }),
      ],
      criticalPathIds: ["early", "also-critical"],
      planSlackDays: 1,
      exceedsEventDate: false,
      overrunDays: 0,
    });

    expect(report.tasks.map((t) => t.id)).toEqual([
      "early",
      "also-critical",
      "late",
    ]);
    expect(report.criticalPathLabel).toBe("Venue → Cáterin");
    expect(report.slackIsTight).toBe(true);
    expect(report.tasks[0]?.criticalLabel).toBe("Sí");
    expect(report.tasks[2]?.criticalLabel).toBe("No");
  });

  it("warns when the plan misses the event date", () => {
    const report = buildProjectReport({
      name: "Tarde",
      eventDate,
      timezone: "Europe/Madrid",
      today,
      tasks: [
        task({
          id: "a",
          title: "Montaje",
          durationDays: 10,
          earliestStart: "2026-06-01T00:00:00.000Z",
          earliestFinish: "2026-06-20T00:00:00.000Z",
          slackDays: -4,
          isCritical: true,
        }),
      ],
      criticalPathIds: ["a"],
      planSlackDays: -4,
      exceedsEventDate: true,
      overrunDays: 4,
    });

    expect(report.overrunWarning).toBe(
      "El plan no llega a la fecha del evento (se pasa 4 días).",
    );
    expect(report.slackHeadline).toBe("Holgura −4 días");
    expect(report.slackDetail).toBe(
      "Desde hoy, el plan se pasa 4 días de la fecha límite.",
    );
    expect(report.planRangeLabel).toBe("1 jun → 20 jun");
  });
});
