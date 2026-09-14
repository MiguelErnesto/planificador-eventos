import { btn } from "@/lib/button-styles";

export function ExportPdfLink({ projectId }: { projectId: string }) {
  return (
    <a
      href={`/api/projects/${projectId}/pdf`}
      aria-label="Exportar PDF"
      className={`inline-flex min-h-11 shrink-0 items-center justify-center ${btn.secondary} ${btn.md}`}
    >
      <span className="lg:hidden">PDF</span>
      <span className="hidden lg:inline">Exportar PDF</span>
    </a>
  );
}
