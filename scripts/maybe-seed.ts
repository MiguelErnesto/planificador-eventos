import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { upsertSiteSettings } from "../lib/branding";

const prisma = new PrismaClient();

async function main() {
  await upsertSiteSettings(prisma);
  const n = await prisma.project.count();
  await prisma.$disconnect();

  if (n > 0) {
    console.log(`[maybe-seed] ${n} proyecto(s) existentes — omitiendo seed`);
    return;
  }

  console.log("[maybe-seed] Base de datos vacía — ejecutando seed");

  const code = await new Promise<number>((resolve) => {
    const child = spawn("npx", ["tsx", "prisma/seed.ts"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    child.on("exit", (c) => resolve(c ?? 1));
  });

  process.exit(code);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
