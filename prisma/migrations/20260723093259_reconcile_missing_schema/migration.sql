-- Fill missing schema definitions before the existing screening migration. Existing columns and data are preserved.
DO $$ BEGIN CREATE TYPE "public"."IncidentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."UserType" AS ENUM ('ADMIN', 'RESPONDER', 'STANDARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."MhpssLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."IncidentCategory" AS ENUM ('SAFETY_HAZARD', 'EQUIPMENT_MALFUNCTION', 'SECURITY_BREACH', 'NEAR_MISS', 'ENVIRONMENTAL_SPILL', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."AssessmentType" AS ENUM ('INITIAL_ASSESSMENT', 'RE_ASSESSMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."UnahonReassessmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."MiSaludTeamRole" AS ENUM ('TEAM_LEADER', 'TEAM_MEMBER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."MiSaludReviewLevel" AS ENUM ('ADMIN', 'TEAM_LEADER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "public"."NotificationType" AS ENUM ('MISALUD_REQUEST_APPROVED', 'MISALUD_REQUEST_REJECTED', 'MISALUD_TEAM_APPROVED', 'MISALUD_TEAM_REJECTED', 'MISALUD_NEW_REQUEST', 'GENERAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "public"."User" (
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

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "name" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "password" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "image" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "competency" INTEGER;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "role" "public"."UserType" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "gender" "public"."Gender";

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "region" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "mhpssLevel" "public"."MhpssLevel";

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "mhpssCertificateFileUrl" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "responderOrganization" TEXT;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "fullAddress" TEXT;

CREATE TABLE IF NOT EXISTS "public"."RoleChangeRequest" (
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

    CONSTRAINT "RoleChangeRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "fromRole" "public"."UserType" NOT NULL;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "toRole" "public"."UserType" NOT NULL;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "requestedMhpssLevel" "public"."MhpssLevel";

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "requestedMhpssCertificateFileUrl" TEXT;

ALTER TABLE "public"."RoleChangeRequest" ADD COLUMN IF NOT EXISTS "requestedResponderOrganization" TEXT;

CREATE TABLE IF NOT EXISTS "public"."Account" (
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

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "providerAccountId" TEXT NOT NULL;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "refresh_token" TEXT;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "access_token" TEXT;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "expires_at" INTEGER;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "token_type" TEXT;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "scope" TEXT;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "id_token" TEXT;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "session_state" TEXT;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."Account" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "public"."Session" ADD COLUMN IF NOT EXISTS "sessionToken" TEXT NOT NULL;

ALTER TABLE "public"."Session" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."Session" ADD COLUMN IF NOT EXISTS "expires" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."Session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."Session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

ALTER TABLE "public"."VerificationToken" ADD COLUMN IF NOT EXISTS "identifier" TEXT NOT NULL;

ALTER TABLE "public"."VerificationToken" ADD COLUMN IF NOT EXISTS "token" TEXT NOT NULL;

ALTER TABLE "public"."VerificationToken" ADD COLUMN IF NOT EXISTS "expires" TIMESTAMP(3) NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."Authenticator" (
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

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "credentialID" TEXT NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "providerAccountId" TEXT NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "credentialPublicKey" TEXT NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "counter" INTEGER NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "credentialDeviceType" TEXT NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "credentialBackedUp" BOOLEAN NOT NULL;

ALTER TABLE "public"."Authenticator" ADD COLUMN IF NOT EXISTS "transports" TEXT;

CREATE TABLE IF NOT EXISTS "public"."Incident" (
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
    "status" "public"."IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "summary" TEXT NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "category" "public"."IncidentCategory" NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "reporter" TEXT;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "contact" TEXT;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "teamDeployed" TEXT NOT NULL;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "otherCategoryDetail" TEXT;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "status" "public"."IncidentStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "public"."Incident" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."Unahon" (
    "id" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "assessmentType" "public"."AssessmentType" NOT NULL,
    "location" TEXT,

    CONSTRAINT "Unahon_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "client" TEXT NOT NULL;

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "affiliation" TEXT NOT NULL;

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "assessmentType" "public"."AssessmentType" NOT NULL;

ALTER TABLE "public"."Unahon" ADD COLUMN IF NOT EXISTS "location" TEXT;

CREATE TABLE IF NOT EXISTS "public"."UnahonReassessmentRequest" (
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

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "requestedById" TEXT NOT NULL;

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "status" "public"."UnahonReassessmentStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "affiliation" TEXT;

ALTER TABLE "public"."UnahonReassessmentRequest" ADD COLUMN IF NOT EXISTS "client" TEXT;

CREATE TABLE IF NOT EXISTS "public"."Checklist" (
    "agree" BOOLEAN NOT NULL DEFAULT false,
    "disagree" BOOLEAN NOT NULL DEFAULT false,
    "unahonId" TEXT NOT NULL,
    "category" INTEGER NOT NULL,
    "key" INTEGER NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("category","key","unahonId")
);

ALTER TABLE "public"."Checklist" ADD COLUMN IF NOT EXISTS "agree" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."Checklist" ADD COLUMN IF NOT EXISTS "disagree" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."Checklist" ADD COLUMN IF NOT EXISTS "unahonId" TEXT NOT NULL;

ALTER TABLE "public"."Checklist" ADD COLUMN IF NOT EXISTS "category" INTEGER NOT NULL;

ALTER TABLE "public"."Checklist" ADD COLUMN IF NOT EXISTS "key" INTEGER NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."PlaceCoordinate" (
    "id" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlaceCoordinate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."PlaceCoordinate" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."PlaceCoordinate" ADD COLUMN IF NOT EXISTS "place" TEXT NOT NULL;

ALTER TABLE "public"."PlaceCoordinate" ADD COLUMN IF NOT EXISTS "count" INTEGER NOT NULL;

ALTER TABLE "public"."PlaceCoordinate" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION NOT NULL;

ALTER TABLE "public"."PlaceCoordinate" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."Submission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "team" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL;

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "team" TEXT NOT NULL;

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."Submission" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."QuestionResponse" (
    "id" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."QuestionResponse" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."QuestionResponse" ADD COLUMN IF NOT EXISTS "questionId" INTEGER NOT NULL;

ALTER TABLE "public"."QuestionResponse" ADD COLUMN IF NOT EXISTS "questionText" TEXT NOT NULL;

ALTER TABLE "public"."QuestionResponse" ADD COLUMN IF NOT EXISTS "selectedOption" TEXT NOT NULL;

ALTER TABLE "public"."QuestionResponse" ADD COLUMN IF NOT EXISTS "submissionId" TEXT NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."MiSaludTeam" (
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

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "leaderUserId" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE "public"."MiSaludTeam" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

CREATE TABLE IF NOT EXISTS "public"."MiSaludMembership" (
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

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "teamId" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "role" "public"."MiSaludTeamRole" NOT NULL;

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."MiSaludMembership" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "public"."MiSaludRequest" (
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

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "fullName" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "age" INTEGER NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "address" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "requestedRole" "public"."MiSaludTeamRole" NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "teamName" TEXT NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "reviewLevel" "public"."MiSaludReviewLevel" NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

ALTER TABLE "public"."MiSaludRequest" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

CREATE TABLE IF NOT EXISTS "public"."Notification" (
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

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "type" "public"."NotificationType" NOT NULL;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "read" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "link" TEXT;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "refId" TEXT;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "refType" TEXT;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."Notification" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");

CREATE INDEX IF NOT EXISTS "RoleChangeRequest_userId_idx" ON "public"."RoleChangeRequest"("userId");

CREATE INDEX IF NOT EXISTS "RoleChangeRequest_status_idx" ON "public"."RoleChangeRequest"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "public"."Session"("sessionToken");

CREATE UNIQUE INDEX IF NOT EXISTS "Authenticator_credentialID_key" ON "public"."Authenticator"("credentialID");

CREATE INDEX IF NOT EXISTS "Incident_userId_idx" ON "public"."Incident"("userId");

CREATE INDEX IF NOT EXISTS "Incident_createdAt_idx" ON "public"."Incident"("createdAt");

CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "public"."Incident"("status");

CREATE INDEX IF NOT EXISTS "Incident_teamDeployed_idx" ON "public"."Incident"("teamDeployed");

CREATE INDEX IF NOT EXISTS "Unahon_client_idx" ON "public"."Unahon"("client");

CREATE INDEX IF NOT EXISTS "Unahon_location_idx" ON "public"."Unahon"("location");

CREATE INDEX IF NOT EXISTS "Unahon_date_idx" ON "public"."Unahon"("date");

CREATE INDEX IF NOT EXISTS "UnahonReassessmentRequest_userId_idx" ON "public"."UnahonReassessmentRequest"("userId");

CREATE INDEX IF NOT EXISTS "UnahonReassessmentRequest_requestedById_idx" ON "public"."UnahonReassessmentRequest"("requestedById");

CREATE INDEX IF NOT EXISTS "UnahonReassessmentRequest_status_idx" ON "public"."UnahonReassessmentRequest"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "PlaceCoordinate_place_key" ON "public"."PlaceCoordinate"("place");

CREATE INDEX IF NOT EXISTS "Submission_userId_idx" ON "public"."Submission"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "MiSaludTeam_name_key" ON "public"."MiSaludTeam"("name");

CREATE INDEX IF NOT EXISTS "MiSaludMembership_userId_idx" ON "public"."MiSaludMembership"("userId");

CREATE INDEX IF NOT EXISTS "MiSaludMembership_teamId_idx" ON "public"."MiSaludMembership"("teamId");

CREATE INDEX IF NOT EXISTS "MiSaludMembership_status_idx" ON "public"."MiSaludMembership"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "MiSaludMembership_userId_teamId_key" ON "public"."MiSaludMembership"("userId", "teamId");

CREATE INDEX IF NOT EXISTS "MiSaludRequest_userId_idx" ON "public"."MiSaludRequest"("userId");

CREATE INDEX IF NOT EXISTS "MiSaludRequest_teamId_idx" ON "public"."MiSaludRequest"("teamId");

CREATE INDEX IF NOT EXISTS "MiSaludRequest_status_idx" ON "public"."MiSaludRequest"("status");

CREATE INDEX IF NOT EXISTS "MiSaludRequest_reviewLevel_idx" ON "public"."MiSaludRequest"("reviewLevel");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "public"."Notification"("userId");

CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "public"."Notification"("read");

CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

DO $$ BEGIN ALTER TABLE "public"."RoleChangeRequest" ADD CONSTRAINT "RoleChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."RoleChangeRequest" ADD CONSTRAINT "RoleChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Unahon" ADD CONSTRAINT "Unahon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."UnahonReassessmentRequest" ADD CONSTRAINT "UnahonReassessmentRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."UnahonReassessmentRequest" ADD CONSTRAINT "UnahonReassessmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Checklist" ADD CONSTRAINT "Checklist_unahonId_fkey" FOREIGN KEY ("unahonId") REFERENCES "public"."Unahon"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."QuestionResponse" ADD CONSTRAINT "QuestionResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."MiSaludTeam" ADD CONSTRAINT "MiSaludTeam_leaderUserId_fkey" FOREIGN KEY ("leaderUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."MiSaludMembership" ADD CONSTRAINT "MiSaludMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."MiSaludMembership" ADD CONSTRAINT "MiSaludMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."MiSaludRequest" ADD CONSTRAINT "MiSaludRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."MiSaludRequest" ADD CONSTRAINT "MiSaludRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."MiSaludTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."MiSaludRequest" ADD CONSTRAINT "MiSaludRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;