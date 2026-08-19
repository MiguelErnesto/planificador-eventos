-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('FS', 'SS', 'FF');

-- AlterTable
ALTER TABLE "Dependency" ADD COLUMN "type" "DependencyType" NOT NULL DEFAULT 'FS';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "progressPct" INTEGER NOT NULL DEFAULT 0;
