"use client";

export function DelayBanner({
  active,
  scenarioName,
  exceedsEventDate,
  baseDuration,
  simDuration,
  onToggle,
  scenarios,
  selectedId,
  onSelectScenario,
  onApply,
}: {
  active: boolean;
  scenarioName?: string;
  exceedsEventDate: boolean;
  baseDuration: number;
  simDuration: number;
  onToggle: (v: boolean) => void;
  scenarios: { id: string; name: string }[];
  selectedId: string | null;
  onSelectScenario: (id: string) => void;
  onApply: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        active
          ? "border-amber-300 bg-amber-50"
          : "border-border bg-panel"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => onToggle(e.target.checked)}
              className="accent-amber-600"
            />
            Simulación de retrasos
          </label>
          {active && (
            <p className="text-sm text-slate-700">
              {scenarioName ?? "Escenario"} · duración {baseDuration}d →{" "}
              <strong>{simDuration}d</strong>
              {exceedsEventDate && (
                <span className="ml-2 font-semibold text-critical">
                  Riesgo: supera la fecha del evento
                </span>
              )}
            </p>
          )}
        </div>

        {active && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedId ?? ""}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onApply}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            >
              Aplicar al plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
