-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."IncidentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('ADMIN', 'RESPONDER', 'STANDARD');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MhpssLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4');

-- CreateEnum
CREATE TYPE "public"."IncidentCategory" AS ENUM ('SAFETY_HAZARD', 'EQUIPMENT_MALFUNCTION', 'SECURITY_BREACH', 'NEAR_MISS', 'ENVIRONMENTAL_SPILL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AssessmentType" AS ENUM ('INITIAL_ASSESSMENT', 'RE_ASSESSMENT');

-- CreateEnum
CREATE TYPE "public"."UnahonReassessmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MiSaludTeamRole" AS ENUM ('TEAM_LEADER', 'TEAM_MEMBER');

-- CreateEnum
CREATE TYPE "public"."MiSaludReviewLevel" AS ENUM ('ADMIN', 'TEAM_LEADER');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('MISALUD_REQUEST_APPROVED', 'MISALUD_REQUEST_REJECTED', 'MISALUD_TEAM_APPROVED', 'MISALUD_TEAM_REJECTED', 'MISALUD_NEW_REQUEST', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."MiSaludScreeningType" AS ENUM ('PRE_DEPLOYMENT', 'DURING_DEPLOYMENT', 'POST_DEPLOYMENT');

-- CreateEnum
CREATE TYPE "public"."ScreeningScheduleStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "competency" INTEGER,
    "role" "public"."UserType" NOT NULL DEFAULT 'STANDARD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "gender" "public"."Gender",
    "lastName" TEXT,
    "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "region" TEXT,
    "mhpssLevel" "public"."MhpssLevel",
    "mhpssCertificateFileUrl" TEXT,
    "responderOrganization" TEXT,
    "fullAddress" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromRole" "public"."UserType" NOT NULL,
    "toRole" "public"."UserType" NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedMhpssLevel" "public"."MhpssLevel",
    "requestedMhpssCertificateFileUrl" TEXT,
    "requestedResponderOrganization" TEXT,
    "rejectionReason" TEXT,
    "certificateId" TEXT,

    CONSTRAINT "RoleChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "public"."CertificateUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "public"."Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "public"."Incident" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."IncidentCategory" NOT NULL,
    "reporter" TEXT,
    "contact" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamDeployed" TEXT NOT NULL,
    "otherCategoryDetail" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedByUserId" TEXT,
    "status" "public"."IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IncidentAttachment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "IncidentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Unahon" (
    "id" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "assessmentType" "public"."AssessmentType" NOT NULL,
    "location" TEXT,

    CONSTRAINT "Unahon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UnahonReassessmentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "public"."UnahonReassessmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "affiliation" TEXT,
    "client" TEXT,

    CONSTRAINT "UnahonReassessmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Checklist" (
    "agree" BOOLEAN NOT NULL DEFAULT false,
    "disagree" BOOLEAN NOT NULL DEFAULT false,
    "unahonId" TEXT NOT NULL,
    "category" INTEGER NOT NULL,
    "key" INTEGER NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("category","key","unahonId")
);

-- CreateTable
CREATE TABLE "public"."PlaceCoordinate" (
    "id" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlaceCoordinate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "team" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "scheduleId" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionResponse" (
    "id" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MiSaludTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderUserId" TEXT NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "MiSaludTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MiSaludMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "public"."MiSaludTeamRole" NOT NULL,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "MiSaludMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MiSaludRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "requestedRole" "public"."MiSaludTeamRole" NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamId" TEXT,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewLevel" "public"."MiSaludReviewLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "MiSaludRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "refId" TEXT,
    "refType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MiSaludScreeningSchedule" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "screeningType" "public"."MiSaludScreeningType" NOT NULL,
    "validDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."ScreeningScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiSaludScreeningSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "RoleChangeRequest_userId_idx" ON "public"."RoleChangeRequest"("userId");

-- CreateIndex
CREATE INDEX "RoleChangeRequest_status_idx" ON "public"."RoleChangeRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationOtp_proofHash_key" ON "public"."RegistrationOtp"("proofHash");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_key_key" ON "public"."EmailDelivery"("key");

-- CreateIndex
CREATE INDEX "EmailDelivery_status_nextAttemptAt_idx" ON "public"."EmailDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "CertificateUpload_userId_idx" ON "public"."CertificateUpload"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "public"."Authenticator"("credentialID");

-- CreateIndex
CREATE INDEX "Incident_userId_idx" ON "public"."Incident"("userId");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "public"."Incident"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "public"."Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_teamDeployed_idx" ON "public"."Incident"("teamDeployed");

-- CreateIndex
CREATE INDEX "IncidentAttachment_incidentId_idx" ON "public"."IncidentAttachment"("incidentId");

-- CreateIndex
CREATE INDEX "Unahon_client_idx" ON "public"."Unahon"("client");

-- CreateIndex
CREATE INDEX "Unahon_location_idx" ON "public"."Unahon"("location");

-- CreateIndex
CREATE INDEX "Unahon_date_idx" ON "public"."Unahon"("date");

-- CreateIndex
CREATE INDEX "UnahonReassessmentRequest_userId_idx" ON "public"."UnahonReassessmentRequest"("userId");

-- CreateIndex
CREATE INDEX "UnahonReassessmentRequest_requestedById_idx" ON "public"."UnahonReassessmentRequest"("requestedById");

-- CreateIndex
CREATE INDEX "UnahonReassessmentRequest_status_idx" ON "public"."UnahonReassessmentRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceCoordinate_place_key" ON "public"."PlaceCoordinate"("place");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "public"."Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_teamId_idx" ON "public"."Submission"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_userId_scheduleId_key" ON "public"."Submission"("userId", "scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "MiSaludTeam_name_key" ON "public"."MiSaludTeam"("name");

-- CreateIndex
CREATE INDEX "MiSaludMembership_userId_idx" ON "public"."MiSaludMembership"("userId");

-- CreateIndex
CREATE INDEX "MiSaludMembership_teamId_idx" ON "public"."MiSaludMembership"("teamId");

-- CreateIndex
CREATE INDEX "MiSaludMembership_status_idx" ON "public"."MiSaludMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MiSaludMembership_userId_teamId_key" ON "public"."MiSaludMembership"("userId", "teamId");

-- CreateIndex
CREATE INDEX "MiSaludRequest_userId_idx" ON "public"."MiSaludRequest"("userId");

-- CreateIndex
CREATE INDEX "MiSaludRequest_teamId_idx" ON "public"."MiSaludRequest"("teamId");

-- CreateIndex
CREATE INDEX "MiSaludRequest_status_idx" ON "public"."MiSaludRequest"("status");

-- CreateIndex
CREATE INDEX "MiSaludRequest_reviewLevel_idx" ON "public"."MiSaludRequest"("reviewLevel");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "public"."Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "MiSaludScreeningSchedule_teamId_idx" ON "public"."MiSaludScreeningSchedule"("teamId");

-- CreateIndex
CREATE INDEX "MiSaludScreeningSchedule_status_idx" ON "public"."MiSaludScreeningSchedule"("status");

-- CreateIndex
CREATE INDEX "MiSaludScreeningSchedule_createdAt_idx" ON "public"."MiSaludScreeningSchedule"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."RoleChangeRequest" ADD CONSTRAINT "RoleChangeRequest_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "public"."CertificateUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleChangeRequest" ADD CONSTRAINT "RoleChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleChangeRequest" ADD CONSTRAINT "RoleChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateUpload" ADD CONSTRAINT "CertificateUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IncidentAttachment" ADD CONSTRAINT "IncidentAttachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unahon" ADD CONSTRAINT "Unahon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UnahonReassessmentRequest" ADD CONSTRAINT "UnahonReassessmentRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UnahonReassessmentRequest" ADD CONSTRAINT "UnahonReassessmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Checklist" ADD CONSTRAINT "Checklist_unahonId_fkey" FOREIGN KEY ("unahonId") REFERENCES "public"."Unahon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."MiSaludScreeningSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionResponse" ADD CONSTRAINT "QuestionResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludTeam" ADD CONSTRAINT "MiSaludTeam_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludTeam" ADD CONSTRAINT "MiSaludTeam_leaderUserId_fkey" FOREIGN KEY ("leaderUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludMembership" ADD CONSTRAINT "MiSaludMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludMembership" ADD CONSTRAINT "MiSaludMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludRequest" ADD CONSTRAINT "MiSaludRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludRequest" ADD CONSTRAINT "MiSaludRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludRequest" ADD CONSTRAINT "MiSaludRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludScreeningSchedule" ADD CONSTRAINT "MiSaludScreeningSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiSaludScreeningSchedule" ADD CONSTRAINT "MiSaludScreeningSchedule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
