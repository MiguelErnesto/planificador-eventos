import type { DependencyType } from "./cpm";

export function dependencyTypeFromHandles(
  sourceHandle?: string | null,
  targetHandle?: string | null,
): DependencyType | null {
  const from = sourceHandle?.includes("start") ? "start" : "finish";
  const to = targetHandle?.includes("start") ? "start" : "finish";
  if (from === "finish" && to === "start") return "FS";
  if (from === "start" && to === "start") return "SS";
  if (from === "finish" && to === "finish") return "FF";
  return null;
}

export function handlesForType(type: DependencyType) {
  switch (type) {
    case "SS":
      return { sourceHandle: "source-start", targetHandle: "target-start" };
    case "FF":
      return { sourceHandle: "source-finish", targetHandle: "target-finish" };
    default:
      return { sourceHandle: "source-finish", targetHandle: "target-start" };
  }
}

export function dependencyTypeDisplay(type: DependencyType) {
  switch (type) {
    case "SS":
      return "Inicio → Inicio";
    case "FF":
      return "Fin → Fin";
    default:
      return "Fin → Inicio";
  }
}

export function dependencyLabel(type: DependencyType, lagDays: number) {
  const lag = lagDays ? `+${lagDays}d` : "";
  if (type === "FS") return lag || undefined;
  return `${type}${lag}`;
}
