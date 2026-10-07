CREATE TABLE "LegacyDatasetRecord" (
 "source" TEXT NOT NULL, "collection" TEXT NOT NULL, "recordId" TEXT NOT NULL,
 "payload" JSONB NOT NULL, "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LegacyDatasetRecord_pkey" PRIMARY KEY ("source", "collection", "recordId")
);
ALTER TABLE "LegacyDatasetRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LegacyDatasetRecord" FROM anon, authenticated;
