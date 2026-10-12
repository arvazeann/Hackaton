CREATE TABLE "product_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_images_position_check" CHECK ("position" BETWEEN 0 AND 4),
    CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "product_images_storage_key_key" ON "product_images"("storage_key");
CREATE UNIQUE INDEX "product_images_product_position_key" ON "product_images"("product_id", "position");
