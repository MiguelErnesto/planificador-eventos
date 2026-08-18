import type { PrismaClient } from "@prisma/client";

export const APP_TITLE = "Planificador de Eventos, Tareas y Proyectos";
export const APP_TAGLINE = "Traza la ruta hacia tu éxito...";

export async function upsertSiteSettings(db: PrismaClient) {
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", title: APP_TITLE, tagline: APP_TAGLINE },
    update: { title: APP_TITLE, tagline: APP_TAGLINE },
  });
}
