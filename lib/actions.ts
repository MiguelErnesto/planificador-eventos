"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { recalculateProject } from "./project-cpm";
import { validateDag, CpmError } from "./cpm";
import { z } from "zod";

function revalidateProject(projectId: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const eventDateRaw = String(formData.get("eventDate") ?? "");
  if (!name || !eventDateRaw) {
    throw new Error("Nombre y fecha del evento son obligatorios");
  }
  const project = await prisma.project.create({
    data: {
      name,
      eventDate: new Date(eventDateRaw),
    },
  });
  revalidatePath("/");
  revalidatePath("/projects");
  return project.id;
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/");
  revalidatePath("/projects");
}

export async function createTask(projectId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const durationDays = Number(formData.get("durationDays") ?? 1);
  if (!title || !Number.isFinite(durationDays) || durationDays < 1) {
    throw new Error("Título y duración válidos son obligatorios");
  }
  const count = await prisma.task.count({ where: { projectId } });
  await prisma.task.create({
    data: {
      projectId,
      title,
      durationDays: Math.round(durationDays),
      positionX: 40 + (count % 4) * 220,
      positionY: 40 + Math.floor(count / 4) * 120,
    },
  });
  await recalculateProject(projectId);
  revalidateProject(projectId);
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    durationDays?: number;
    fixedStart?: string | null;
    positionX?: number;
    positionY?: number;
  },
) {
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title ?? undefined,
      durationDays: data.durationDays ?? undefined,
      fixedStart:
        data.fixedStart === undefined
          ? undefined
          : data.fixedStart
            ? new Date(data.fixedStart)
            : null,
      positionX: data.positionX ?? undefined,
      positionY: data.positionY ?? undefined,
    },
  });
  if (
    data.durationDays !== undefined ||
    data.fixedStart !== undefined ||
    data.title !== undefined
  ) {
    await recalculateProject(existing.projectId);
  }
  revalidateProject(existing.projectId);
}

export async function deleteTask(taskId: string) {
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await prisma.task.delete({ where: { id: taskId } });
  await recalculateProject(existing.projectId);
  revalidateProject(existing.projectId);
}

export async function createDependency(
  projectId: string,
  fromTaskId: string,
  toTaskId: string,
  lagDays = 0,
) {
  if (fromTaskId === toTaskId) {
    throw new Error("Una tarea no puede depender de sí misma");
  }

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { tasks: true, edges: true },
  });

  const tasks = project.tasks.map((t) => ({ id: t.id, duration: t.durationDays }));
  const edges = [
    ...project.edges.map((e) => ({
      from: e.fromTaskId,
      to: e.toTaskId,
      lag: e.lagDays,
    })),
    { from: fromTaskId, to: toTaskId, lag: lagDays },
  ];

  try {
    validateDag(tasks, edges);
  } catch (e) {
    if (e instanceof CpmError) throw new Error(e.message);
    throw e;
  }

  await prisma.dependency.create({
    data: { projectId, fromTaskId, toTaskId, lagDays },
  });
  await recalculateProject(projectId);
  revalidateProject(projectId);
}

export async function deleteDependency(dependencyId: string) {
  const edge = await prisma.dependency.findUniqueOrThrow({
    where: { id: dependencyId },
  });
  await prisma.dependency.delete({ where: { id: dependencyId } });
  await recalculateProject(edge.projectId);
  revalidateProject(edge.projectId);
}

const applySchema = z.object({
  patches: z.array(
    z.object({
      taskId: z.string(),
      extraDays: z.number().int(),
    }),
  ),
});

export async function applyScenarioPatches(
  projectId: string,
  patches: { taskId: string; extraDays: number }[],
) {
  const parsed = applySchema.parse({ patches });
  await prisma.$transaction(
    parsed.patches.map((p) =>
      prisma.task.update({
        where: { id: p.taskId },
        data: { durationDays: { increment: p.extraDays } },
      }),
    ),
  );
  await recalculateProject(projectId);
  revalidateProject(projectId);
}
