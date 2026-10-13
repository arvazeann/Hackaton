CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "users"
ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'USER',
ADD COLUMN "last_login_at" TIMESTAMPTZ(6),
ADD COLUMN "last_active_at" TIMESTAMPTZ(6);

CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);
CREATE INDEX "users_last_active_at_idx" ON "users"("last_active_at");
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at" DESC);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_id" UUID,
  "action" VARCHAR(80) NOT NULL,
  "target_type" VARCHAR(80) NOT NULL,
  "target_id" VARCHAR(255) NOT NULL,
  "request_id" VARCHAR(64),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_actor_created_at_idx"
ON "audit_logs"("actor_id", "created_at" DESC);

CREATE INDEX "audit_logs_target_created_at_idx"
ON "audit_logs"("target_type", "target_id", "created_at" DESC);

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_actor_id_fkey"
FOREIGN KEY ("actor_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
