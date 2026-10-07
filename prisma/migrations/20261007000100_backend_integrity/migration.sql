-- Additive backend repair: preserves existing and legacy tables.
ALTER TABLE "public"."Incident" ADD COLUMN     "reviewedByUserId" TEXT;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN     "certificateId" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

ALTER TABLE "public"."Submission" ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "teamId" TEXT;

ALTER TABLE "public"."User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "public"."RegistrationOtp" (
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendCount" INTEGER NOT NULL DEFAULT 1,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofHash" TEXT,
    "proofExpiresAt" TIMESTAMP(3),

    CONSTRAINT "RegistrationOtp_pkey" PRIMARY KEY ("email")
);

CREATE TABLE "public"."EmailDelivery" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CertificateUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."IncidentAttachment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "IncidentAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegistrationOtp_proofHash_key" ON "public"."RegistrationOtp"("proofHash");

CREATE UNIQUE INDEX "EmailDelivery_key_key" ON "public"."EmailDelivery"("key");

CREATE INDEX "EmailDelivery_status_nextAttemptAt_idx" ON "public"."EmailDelivery"("status", "nextAttemptAt");

CREATE INDEX "CertificateUpload_userId_idx" ON "public"."CertificateUpload"("userId");

CREATE INDEX "IncidentAttachment_incidentId_idx" ON "public"."IncidentAttachment"("incidentId");

CREATE INDEX "Submission_teamId_idx" ON "public"."Submission"("teamId");

CREATE UNIQUE INDEX "Submission_userId_scheduleId_key" ON "public"."Submission"("userId", "scheduleId");

ALTER TABLE "public"."RoleChangeRequest" ADD CONSTRAINT "RoleChangeRequest_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "public"."CertificateUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."CertificateUpload" ADD CONSTRAINT "CertificateUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."IncidentAttachment" ADD CONSTRAINT "IncidentAttachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."MiSaludScreeningSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."MiSaludTeam" ADD CONSTRAINT "MiSaludTeam_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."MiSaludScreeningSchedule" ADD CONSTRAINT "MiSaludScreeningSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Bind historical submissions to existing uniquely named teams without rewriting history.
UPDATE "public"."Submission" s SET "teamId"=t.id FROM "public"."MiSaludTeam" t WHERE s.team=t.name AND s."teamId" IS NULL;

-- Link a historical screening only when its time window identifies one schedule and one submission per user.
WITH matches AS (
    SELECT s.id,s."userId",min(c.id) AS schedule_id,count(*) AS matches
    FROM "public"."Submission" s JOIN "public"."MiSaludScreeningSchedule" c
      ON c."teamId"=s."teamId" AND s."createdAt" BETWEEN c."validDate" AND c."dueDate"
    WHERE s."scheduleId" IS NULL GROUP BY s.id,s."userId"
), unique_matches AS (
    SELECT *,count(*) OVER (PARTITION BY "userId",schedule_id) AS user_matches FROM matches WHERE matches=1
)
UPDATE "public"."Submission" s SET "scheduleId"=m.schedule_id FROM unique_matches m WHERE s.id=m.id AND m.user_matches=1;
UPDATE "public"."Incident" i SET "reviewedByUserId"=u.id FROM "public"."User" u WHERE i."reviewedBy"=u.email AND i."reviewedByUserId" IS NULL;
-- One pending workflow and one answer per question. Abort instead of discarding duplicates.
CREATE UNIQUE INDEX "RoleChangeRequest_one_pending_per_user" ON "public"."RoleChangeRequest"("userId") WHERE status='PENDING';
CREATE UNIQUE INDEX "MiSaludRequest_one_pending_per_user" ON "public"."MiSaludRequest"("userId") WHERE status='PENDING';
CREATE UNIQUE INDEX "UnahonReassessmentRequest_one_pending_per_user" ON "public"."UnahonReassessmentRequest"("userId") WHERE status='PENDING';
CREATE UNIQUE INDEX "User_email_normalized_key" ON "public"."User"(lower(btrim(email)));
CREATE UNIQUE INDEX "MiSaludTeam_name_normalized_key" ON "public"."MiSaludTeam"(lower(btrim(name)));
ALTER TABLE "public"."RegistrationOtp" ADD CONSTRAINT "RegistrationOtp_attempts_check" CHECK (attempts BETWEEN 0 AND 5);
ALTER TABLE "public"."EmailDelivery" ADD CONSTRAINT "EmailDelivery_status_check" CHECK (status IN ('PENDING','SENDING','SENT'));
-- Prisma uses the server database role. Browser roles receive no access to private application tables.
DO $security$ DECLARE item record; BEGIN
    FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',item.tablename);
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated',item.tablename);
    END LOOP;
END $security$;
