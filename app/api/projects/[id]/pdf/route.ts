import { NextResponse } from "next/server";
import { CpmError } from "@/lib/cpm";
import { renderProjectPdf } from "@/lib/pdf/render-project-pdf";
import {
  buildProjectReport,
  pdfContentDisposition,
  projectPdfFilename,
} from "@/lib/project-report";
import { recalculateProject } from "@/lib/project-cpm";
import { getProjectBundle } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const existing = await getProjectBundle(id);
    if (!existing) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const cpm = await recalculateProject(id);
    const project = await getProjectBundle(id);
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const report = buildProjectReport({
      name: project.name,
      eventDate: project.eventDate,
      timezone: project.timezone,
      today: cpm.today,
      tasks: project.tasks,
      criticalPathIds: cpm.criticalPath,
      planSlackDays: cpm.planSlackDays,
      exceedsEventDate: cpm.exceedsEventDate,
      overrunDays: cpm.overrunDays,
    });

    const pdf = await renderProjectPdf(report);
    const filename = projectPdfFilename(project.name, project.eventDate);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": pdfContentDisposition(filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof CpmError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "No se pudo generar el PDF" }, { status: 500 });
  }
}
