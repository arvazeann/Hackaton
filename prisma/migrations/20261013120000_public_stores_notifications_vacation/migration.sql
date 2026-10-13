ALTER TABLE "seller_profiles"
ADD COLUMN "is_on_vacation" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "notification_type" AS ENUM (
  'ORDER_PLACED',
  'ORDER_CONFIRMED',
  'ORDER_REJECTED',
  'ORDER_CANCELLED',
  'ORDER_COMPLETED'
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "notification_type" NOT NULL,
  "order_id" UUID,
  "title" VARCHAR(120) NOT NULL,
  "body" VARCHAR(300) NOT NULL,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "user_id" UUID NOT NULL,
  "type" "notification_type" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id", "type")
);

CREATE INDEX "notifications_user_read_created_idx"
ON "notifications"("user_id", "read_at", "created_at" DESC);

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_preferences"
ADD CONSTRAINT "notification_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
