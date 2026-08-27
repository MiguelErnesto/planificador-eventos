"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { recalculateProject } from "./project-cpm";
import { isValidTimeZone } from "./dates";
import { validateDag, CpmError, type DependencyType } from "./cpm";

function revalidateProject(projectId: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const eventDateRaw = String(formData.get("eventDate") ?? "");
  const timezoneRaw = String(formData.get("timezone") ?? "").trim();
  if (!name || !eventDateRaw) {
    throw new Error("Nombre y fecha del evento son obligatorios");
  }
  const timezone = isValidTimeZone(timezoneRaw) ? timezoneRaw : "Europe/Madrid";
  const project = await prisma.project.create({
    data: {
      name,
      eventDate: new Date(`${eventDateRaw}T00:00:00.000Z`),
      timezone,
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

export async function updateProject(
  projectId: string,
  data: { name?: string; eventDate?: string; timezone?: string },
) {
  const name = data.name?.trim();
  if (data.name !== undefined && !name) {
    throw new Error("El nombre es obligatorio");
  }
  if (data.eventDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) {
    throw new Error("Fecha del evento no válida");
  }
  if (data.timezone !== undefined && !isValidTimeZone(data.timezone)) {
    throw new Error("Zona horaria no válida");
  }

  const existing = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  const nextEventDate = data.eventDate
    ? new Date(`${data.eventDate}T00:00:00.000Z`)
    : undefined;
  const nameChanged = name !== undefined && name !== existing.name;
  const eventDateChanged =
    nextEventDate !== undefined &&
    nextEventDate.getTime() !== existing.eventDate.getTime();
  const timezoneChanged =
    data.timezone !== undefined && data.timezone !== existing.timezone;

  if (!nameChanged && !eventDateChanged && !timezoneChanged) return;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: nameChanged ? name : undefined,
      eventDate: eventDateChanged ? nextEventDate : undefined,
      timezone: timezoneChanged ? data.timezone : undefined,
    },
  });

  if (eventDateChanged || timezoneChanged) {
    await recalculateProject(projectId);
  }
  revalidateProject(projectId);
}

export async function createTask(projectId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const durationDays = Number(formData.get("durationDays") ?? 1);
  if (!title || !Number.isFinite(durationDays) || durationDays < 1) {
    throw new Error("Título y duración válidos son obligatorios");
  }
  const count = await prisma.task.count({ where: { projectId } });
  const task = await prisma.task.create({
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
  return task.id;
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    durationDays?: number;
    fixedStart?: string | null;
    positionX?: number;
    positionY?: number;
    progressPct?: number;
  },
) {
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  const progressPct =
    data.progressPct === undefined
      ? undefined
      : Math.min(100, Math.max(0, Math.round(data.progressPct)));
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
      progressPct,
    },
  });
  if (
    data.durationDays !== undefined ||
    data.fixedStart !== undefined ||
    data.title !== undefined ||
    data.progressPct !== undefined
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
  type: DependencyType = "FS",
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
      type: e.type,
    })),
    { from: fromTaskId, to: toTaskId, lag: lagDays, type },
  ];

  try {
    validateDag(tasks, edges);
  } catch (e) {
    if (e instanceof CpmError) throw new Error(e.message);
    throw e;
  }

  await prisma.dependency.create({
    data: { projectId, fromTaskId, toTaskId, lagDays, type },
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
