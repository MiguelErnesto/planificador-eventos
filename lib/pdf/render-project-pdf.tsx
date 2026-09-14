import { renderToBuffer } from "@react-pdf/renderer";
import type { PdfGraph } from "@/lib/pdf/build-pdf-graph";
import { ProjectPdfDocument } from "@/lib/pdf/ProjectPdfDocument";
import type { ProjectReport } from "@/lib/project-report";

export async function renderProjectPdf(
  report: ProjectReport,
  graph: PdfGraph | null,
): Promise<Buffer> {
  const bytes = await renderToBuffer(
    <ProjectPdfDocument report={report} graph={graph} />,
  );
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}
