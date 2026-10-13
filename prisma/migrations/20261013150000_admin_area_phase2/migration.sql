ALTER TABLE "users"
ADD COLUMN "disabled_at" TIMESTAMPTZ(6),
ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "audit_logs"
ADD COLUMN "metadata" JSONB;
