-- CreateEnum
CREATE TYPE "MiSaludScreeningType" AS ENUM ('PRE_DEPLOYMENT', 'DURING_DEPLOYMENT', 'POST_DEPLOYMENT');

-- CreateEnum
CREATE TYPE "ScreeningScheduleStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MiSaludScreeningSchedule" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "screeningType" "MiSaludScreeningType" NOT NULL,
    "validDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ScreeningScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiSaludScreeningSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MiSaludScreeningSchedule_teamId_idx" ON "MiSaludScreeningSchedule"("teamId");

-- CreateIndex
CREATE INDEX "MiSaludScreeningSchedule_status_idx" ON "MiSaludScreeningSchedule"("status");

-- CreateIndex
CREATE INDEX "MiSaludScreeningSchedule_createdAt_idx" ON "MiSaludScreeningSchedule"("createdAt");

-- AddForeignKey
ALTER TABLE "MiSaludScreeningSchedule" ADD CONSTRAINT "MiSaludScreeningSchedule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "MiSaludTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
