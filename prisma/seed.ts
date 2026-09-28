import { PrismaClient } from "@prisma/client";
import { todayUtcInTimeZone } from "../lib/dates";
import { recalculateProject } from "../lib/project-cpm";
import { upsertSiteSettings } from "../lib/branding";

const prisma = new PrismaClient();

type TaskDef = {
  key: string;
  title: string;
  durationDays: number;
  x: number;
  y: number;
};

type EdgeDef = [string, string, number?];

function daysFromToday(days: number) {
  const today = todayUtcInTimeZone("Europe/Madrid");
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + days,
    ),
  );
}

async function createSampleProject(opts: {
  name: string;
  eventOffsetDays: number;
  locked?: boolean;
  tasks: TaskDef[];
  edges: EdgeDef[];
}) {
  const project = await prisma.project.create({
    data: {
      name: opts.name,
      eventDate: daysFromToday(opts.eventOffsetDays),
      timezone: "Europe/Madrid",
      locked: opts.locked ?? false,
    },
  });

  const created: Record<string, string> = {};
  for (const d of opts.tasks) {
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

  for (const [from, to, lagDays = 0] of opts.edges) {
    await prisma.dependency.create({
      data: {
        projectId: project.id,
        fromTaskId: created[from],
        toTaskId: created[to],
        lagDays,
      },
    });
  }

  await recalculateProject(project.id);
  console.log(`Seed OK — proyecto ${project.id} (${project.name})`);
  return project;
}

async function main() {
  await upsertSiteSettings(prisma);
  await prisma.dependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  await createSampleProject({
    name: "Boda Ana & Luis",
    eventOffsetDays: 90,
    locked: true,
    tasks: [
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
    ],
    edges: [
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
    ],
  });

  await createSampleProject({
    name: "Conferencia anual",
    eventOffsetDays: 60,
    tasks: [
      { key: "programa", title: "Definir programa", durationDays: 3, x: 0, y: 80 },
      { key: "sala", title: "Reservar sala", durationDays: 4, x: 220, y: 0 },
      { key: "ponentes", title: "Confirmar ponentes", durationDays: 5, x: 220, y: 160 },
      { key: "materiales", title: "Diseñar materiales", durationDays: 4, x: 440, y: 160 },
      { key: "inscripciones", title: "Abrir inscripciones", durationDays: 2, x: 440, y: 0 },
      { key: "ensayo", title: "Ensayo técnico", durationDays: 1, x: 660, y: 80 },
      { key: "acreditacion", title: "Acreditación", durationDays: 1, x: 880, y: 80 },
    ],
    edges: [
      ["programa", "sala"],
      ["programa", "ponentes"],
      ["programa", "materiales"],
      ["sala", "inscripciones"],
      ["ponentes", "inscripciones"],
      ["sala", "ensayo"],
      ["materiales", "ensayo"],
      ["inscripciones", "acreditacion"],
      ["ensayo", "acreditacion"],
    ],
  });

  await createSampleProject({
    name: "Lanzamiento de producto",
    eventOffsetDays: 45,
    tasks: [
      { key: "brief", title: "Brief de producto", durationDays: 2, x: 0, y: 80 },
      { key: "landing", title: "Landing", durationDays: 5, x: 220, y: 0 },
      { key: "campana", title: "Campaña", durationDays: 4, x: 220, y: 160 },
      { key: "produccion", title: "Producción", durationDays: 6, x: 220, y: 280 },
      { key: "pruebas", title: "Pruebas", durationDays: 3, x: 440, y: 280 },
      { key: "prensa", title: "Envío a prensa", durationDays: 2, x: 440, y: 80 },
      { key: "publicacion", title: "Publicación", durationDays: 1, x: 660, y: 160 },
    ],
    edges: [
      ["brief", "landing"],
      ["brief", "campana"],
      ["brief", "produccion"],
      ["produccion", "pruebas"],
      ["landing", "prensa"],
      ["campana", "prensa"],
      ["pruebas", "publicacion"],
      ["prensa", "publicacion"],
    ],
  });

  await createSampleProject({
    name: "Festival de verano",
    eventOffsetDays: 120,
    tasks: [
      { key: "permisos", title: "Permisos", durationDays: 8, x: 0, y: 80 },
      { key: "booking", title: "Booking de artistas", durationDays: 10, x: 0, y: 200 },
      { key: "cartel", title: "Cartel", durationDays: 5, x: 220, y: 200 },
      { key: "escenario", title: "Escenario", durationDays: 6, x: 220, y: 80 },
      { key: "taquilla", title: "Taquilla", durationDays: 3, x: 440, y: 200 },
      { key: "logistica", title: "Logística", durationDays: 4, x: 440, y: 80 },
      { key: "montaje", title: "Montaje", durationDays: 2, x: 660, y: 80 },
      { key: "apertura", title: "Apertura", durationDays: 1, x: 880, y: 140 },
    ],
    edges: [
      ["permisos", "escenario"],
      ["booking", "cartel"],
      ["cartel", "taquilla"],
      ["escenario", "logistica"],
      ["logistica", "montaje"],
      ["taquilla", "apertura"],
      ["montaje", "apertura"],
    ],
  });

  await createSampleProject({
    name: "Reforma del local",
    eventOffsetDays: 75,
    tasks: [
      { key: "medicion", title: "Medición", durationDays: 2, x: 0, y: 80 },
      { key: "proyecto", title: "Proyecto", durationDays: 5, x: 220, y: 80 },
      { key: "licencia", title: "Licencia", durationDays: 10, x: 440, y: 0 },
      { key: "mobiliario", title: "Mobiliario", durationDays: 3, x: 440, y: 160 },
      { key: "demolicion", title: "Demolición", durationDays: 4, x: 660, y: 0 },
      { key: "instalaciones", title: "Instalaciones", durationDays: 6, x: 880, y: 0 },
      { key: "acabados", title: "Acabados", durationDays: 5, x: 1100, y: 0 },
      { key: "entrega", title: "Entrega", durationDays: 1, x: 1320, y: 80 },
    ],
    edges: [
      ["medicion", "proyecto"],
      ["proyecto", "licencia"],
      ["proyecto", "mobiliario"],
      ["licencia", "demolicion"],
      ["demolicion", "instalaciones"],
      ["instalaciones", "acabados"],
      ["acabados", "entrega"],
      ["mobiliario", "entrega"],
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
