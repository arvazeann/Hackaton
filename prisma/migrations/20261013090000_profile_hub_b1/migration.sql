ALTER TABLE "users"
  ADD COLUMN "avatar_key" TEXT,
  ADD COLUMN "bio" VARCHAR(300);

CREATE TYPE "address_kind" AS ENUM ('SHIPPING', 'PICKUP');
CREATE TYPE "payment_account_type" AS ENUM ('BANK', 'EWALLET');
CREATE TYPE "uploaded_file_purpose" AS ENUM ('AVATAR', 'LOGO', 'PRODUCT');

CREATE TABLE "addresses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "kind" "address_kind" NOT NULL,
  "label" VARCHAR(60) NOT NULL,
  "contact_name" VARCHAR(100) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "street" TEXT NOT NULL,
  "city" VARCHAR(100) NOT NULL,
  "province" VARCHAR(100) NOT NULL,
  "postal_code" VARCHAR(12) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "addresses_user_kind_created_idx" ON "addresses"("user_id", "kind", "created_at" DESC);
CREATE UNIQUE INDEX "addresses_one_default_per_kind" ON "addresses"("user_id", "kind") WHERE "is_default" = true;

CREATE TABLE "seller_profiles" (
  "user_id" UUID NOT NULL,
  "store_name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "logo_key" TEXT,
  "city" VARCHAR(100) NOT NULL,
  "province" VARCHAR(100),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "seller_profiles_slug_key" ON "seller_profiles"("slug");

DO $$
DECLARE
  seller RECORD;
  base_slug TEXT;
  candidate TEXT;
  suffix INTEGER;
  reserved TEXT[] := ARRAY['admin','api','login','register','profile','products','orders','seller','dashboard','favorites','uploads','about','help','settings'];
BEGIN
  FOR seller IN
    SELECT DISTINCT u."id", u."name", u."city"
    FROM "users" u
    JOIN "products" p ON p."seller_id" = u."id"
    ORDER BY u."id"
  LOOP
    base_slug := trim(both '-' from regexp_replace(lower(seller."name"), '[^a-z0-9]+', '-', 'g'));
    IF base_slug = '' THEN base_slug := 'toko'; END IF;
    IF base_slug = ANY(reserved) THEN base_slug := base_slug || '-store'; END IF;
    base_slug := left(base_slug, 100);
    candidate := base_slug;
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM "seller_profiles" WHERE "slug" = candidate) LOOP
      suffix := suffix + 1;
      candidate := left(base_slug, 120 - length(suffix::text) - 1) || '-' || suffix::text;
    END LOOP;
    INSERT INTO "seller_profiles" ("user_id", "store_name", "slug", "city", "province")
    VALUES (seller."id", left(seller."name", 100), candidate, coalesce(nullif(seller."city", ''), 'Belum diatur'), NULL);
  END LOOP;
END $$;

CREATE TABLE "payment_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "seller_profile_id" UUID NOT NULL,
  "type" "payment_account_type" NOT NULL,
  "provider_name" VARCHAR(100) NOT NULL,
  "account_number_ciphertext" TEXT NOT NULL,
  "account_number_last4" VARCHAR(4) NOT NULL,
  "account_holder_name" VARCHAR(100) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_accounts_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "payment_accounts_seller_active_idx" ON "payment_accounts"("seller_profile_id", "is_active");
CREATE FUNCTION enforce_active_payment_account_limit() RETURNS trigger AS $$
BEGIN
  IF NEW."is_active" THEN
    PERFORM 1 FROM "seller_profiles" WHERE "user_id" = NEW."seller_profile_id" FOR UPDATE;
    IF (SELECT count(*) FROM "payment_accounts" WHERE "seller_profile_id" = NEW."seller_profile_id" AND "is_active" = true AND "id" <> NEW."id") >= 3 THEN
      RAISE EXCEPTION 'active payment account limit exceeded' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "payment_accounts_active_limit" BEFORE INSERT OR UPDATE OF "is_active", "seller_profile_id" ON "payment_accounts" FOR EACH ROW EXECUTE FUNCTION enforce_active_payment_account_limit();

CREATE TABLE "uploaded_files" (
  "key" VARCHAR(255) NOT NULL,
  "owner_id" UUID NOT NULL,
  "purpose" "uploaded_file_purpose" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "uploaded_files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "uploaded_files_owner_purpose_idx" ON "uploaded_files"("owner_id", "purpose");

ALTER TABLE "orders"
  ADD COLUMN "payment_instruction_ciphertext" TEXT,
  ADD COLUMN "payment_account_number_last4" VARCHAR(4);

-- Keep the existing partial index in the canonical form emitted by Prisma 7
-- so a migrations-to-schema drift check reports an empty diff.
DROP INDEX "orders_one_active_per_product";
CREATE UNIQUE INDEX "orders_one_active_per_product"
  ON "orders"("product_id")
  WHERE (status = ANY (ARRAY['pending'::order_status, 'confirmed'::order_status]));
