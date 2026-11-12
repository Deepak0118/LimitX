-- CreateEnum
CREATE TYPE "ApiStatus" AS ENUM ('active', 'paused');

-- AlterTable Projects - Add description column
ALTER TABLE "projects" ADD COLUMN "description" TEXT;

-- CreateTable APIs
CREATE TABLE "apis" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "description" TEXT,
    "status" "ApiStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "apis_project_id_idx" ON "apis"("project_id");

-- AddForeignKey
ALTER TABLE "apis" ADD CONSTRAINT "apis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing projects to APIs
-- For each project, create a default API with the project's targetUrl
INSERT INTO "apis" ("id", "project_id", "name", "target_url", "description", "status", "created_at")
SELECT 
    'api_' || substring(md5(random()::text) from 1 for 8),
    "id",
    "name" || ' API',
    "target_url",
    'Default API migrated from project',
    'active',
    "created_at"
FROM "projects"
WHERE "target_url" IS NOT NULL;

-- AlterTable Rules - Add api_id column (temporarily nullable)
ALTER TABLE "rules" ADD COLUMN "api_id" TEXT;

-- Migrate rules to reference APIs instead of projects
-- Match each rule with the project's default API
UPDATE "rules" r
SET "api_id" = a."id"
FROM "apis" a
WHERE r."project_id" = a."project_id";

-- Now make api_id NOT NULL
ALTER TABLE "rules" ALTER COLUMN "api_id" SET NOT NULL;

-- DropIndex old project_id constraint
ALTER TABLE "rules" DROP CONSTRAINT IF EXISTS "rules_project_id_path_key";

-- CreateIndex new api_id constraint
CREATE UNIQUE INDEX "rules_api_id_path_key" ON "rules"("api_id", "path");
CREATE INDEX "rules_api_id_idx" ON "rules"("api_id");

-- AddForeignKey for api_id
ALTER TABLE "rules" ADD CONSTRAINT "rules_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey old project_id foreign key
ALTER TABLE "rules" DROP CONSTRAINT IF EXISTS "rules_project_id_fkey";

-- DropColumn project_id from rules
ALTER TABLE "rules" DROP COLUMN "project_id";

-- AlterTable RequestLogs - Add api_id column (temporarily nullable)
ALTER TABLE "request_logs" ADD COLUMN "api_id" TEXT;

-- Migrate request_logs to reference APIs
UPDATE "request_logs" rl
SET "api_id" = a."id"
FROM "apis" a
WHERE rl."project_id" = a."project_id";

-- DropIndex old index
DROP INDEX IF EXISTS "request_logs_project_id_created_at_idx";

-- CreateIndex new api_id index
CREATE INDEX "request_logs_api_id_created_at_idx" ON "request_logs"("api_id", "created_at" DESC);

-- AddForeignKey for api_id (optional, can be null for orphaned logs)
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropColumn project_id from request_logs
ALTER TABLE "request_logs" DROP COLUMN "project_id";

-- DropColumn target_url from projects (now stored in APIs)
ALTER TABLE "projects" DROP COLUMN "target_url";
