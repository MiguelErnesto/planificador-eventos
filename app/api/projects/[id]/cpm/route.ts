import { NextRequest, NextResponse } from "next/server";
import { recalculateProject } from "@/lib/project-cpm";
import { CpmError } from "@/lib/cpm";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await recalculateProject(id);
    return NextResponse.json({
      projectDuration: result.projectDuration,
      criticalPath: result.criticalPath,
      exceedsEventDate: result.exceedsEventDate,
      byId: result.byId,
    });
  } catch (e) {
    if (e instanceof CpmError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Error al recalcular CPM" }, { status: 500 });
  }
}
