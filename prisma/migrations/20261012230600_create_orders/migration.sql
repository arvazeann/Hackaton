CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_code" VARCHAR(24) NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "price_at_order" INTEGER NOT NULL,
    "product_title_snapshot" VARCHAR(150) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "shipping_name" VARCHAR(100) NOT NULL,
    "shipping_phone" VARCHAR(20) NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "note" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_price_at_order_check" CHECK ("price_at_order" > 0),
    CONSTRAINT "orders_buyer_seller_check" CHECK ("buyer_id" <> "seller_id"),
    CONSTRAINT "orders_cancel_reason_check" CHECK ("status" <> 'cancelled' OR "cancel_reason" IS NOT NULL),
    CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");
CREATE UNIQUE INDEX "orders_one_active_per_product" ON "orders"("product_id") WHERE "status" IN ('pending', 'confirmed');
CREATE INDEX "orders_buyer_created_at_idx" ON "orders"("buyer_id", "created_at" DESC);
CREATE INDEX "orders_seller_created_at_idx" ON "orders"("seller_id", "created_at" DESC);
