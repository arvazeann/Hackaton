CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" "product_condition" NOT NULL,
    "status" "product_status" NOT NULL DEFAULT 'active',
    "city" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_title_length_check" CHECK (char_length("title") >= 3),
    CONSTRAINT "products_price_range_check" CHECK ("price" > 0 AND "price" <= 1000000000),
    CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "products_status_created_at_idx" ON "products"("status", "created_at" DESC);
CREATE INDEX "products_category_status_idx" ON "products"("category_id", "status");
CREATE INDEX "products_seller_status_idx" ON "products"("seller_id", "status");
CREATE INDEX "products_price_idx" ON "products"("price");
