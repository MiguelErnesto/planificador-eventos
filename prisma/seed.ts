import { PrismaClient, Prisma } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";
import { recalculateProject } from "../lib/project-cpm";

const prisma = new PrismaClient();

async function main() {
  await prisma.dependency.deleteMany();
  await prisma.delayScenario.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  const eventDate = startOfDay(addDays(new Date(), 90));

  const project = await prisma.project.create({
    data: {
      name: "Boda Ana & Luis",
      eventDate,
      timezone: "Europe/Madrid",
    },
  });

  const defs: Array<{
    key: string;
    title: string;
    durationDays: number;
    x: number;
    y: number;
  }> = [
    { key: "venue", title: "Reservar venue", durationDays: 5, x: 0, y: 80 },
    { key: "catering", title: "Contratar cáterin", durationDays: 7, x: 220, y: 0 },
    { key: "invites", title: "Enviar invitaciones", durationDays: 3, x: 220, y: 160 },
    { key: "decor", title: "Definir decoración", durationDays: 4, x: 440, y: 80 },
    { key: "stage", title: "Montar escenario", durationDays: 2, x: 660, y: 0 },
    { key: "sound", title: "Prueba de sonido", durationDays: 1, x: 880, y: 0 },
    { key: "flowers", title: "Flores y centro de mesa", durationDays: 2, x: 660, y: 160 },
    { key: "cake", title: "Encargar tarta", durationDays: 3, x: 440, y: 240 },
    { key: "rehearsal", title: "Ensayo general", durationDays: 1, x: 880, y: 120 },
    { key: "guests", title: "Llegada de invitados", durationDays: 1, x: 1100, y: 80 },
  ];

  const created: Record<string, string> = {};
  for (const d of defs) {
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: d.title,
        durationDays: d.durationDays,
        positionX: d.x,
        positionY: d.y,
      },
    });
    created[d.key] = task.id;
  }

  const edgeDefs: Array<[string, string, number?]> = [
    ["venue", "catering"],
    ["venue", "invites"],
    ["venue", "decor"],
    ["catering", "stage"],
    ["decor", "stage"],
    ["decor", "flowers"],
    ["invites", "guests"],
    ["stage", "sound"],
    ["sound", "rehearsal"],
    ["flowers", "rehearsal"],
    ["cake", "guests"],
    ["rehearsal", "guests"],
    ["sound", "guests"],
  ];

  for (const [from, to, lagDays = 0] of edgeDefs) {
    await prisma.dependency.create({
      data: {
        projectId: project.id,
        fromTaskId: created[from],
        toTaskId: created[to],
        lagDays,
      },
    });
  }

  await prisma.delayScenario.create({
    data: {
      projectId: project.id,
      name: "¿Qué pasa si llueve?",
      description:
        "Retraso en montaje outdoor: escenario y flores necesitan más días.",
      patches: [
        { taskId: created.stage, extraDays: 2 },
        { taskId: created.flowers, extraDays: 1 },
      ] satisfies Prisma.InputJsonValue,
    },
  });

  await recalculateProject(project.id);
  console.log(`Seed OK — proyecto ${project.id} (${project.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
