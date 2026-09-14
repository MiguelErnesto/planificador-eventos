import { renderToBuffer } from "@react-pdf/renderer";
import type { ProjectReport } from "@/lib/project-report";
import { ProjectPdfDocument } from "@/lib/pdf/ProjectPdfDocument";

export async function renderProjectPdf(report: ProjectReport): Promise<Buffer> {
  const bytes = await renderToBuffer(<ProjectPdfDocument report={report} />);
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}
