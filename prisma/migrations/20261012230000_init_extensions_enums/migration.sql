CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE "product_condition" AS ENUM ('like_new', 'good', 'fair');
CREATE TYPE "product_status" AS ENUM ('active', 'reserved', 'sold', 'archived');
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rejected');
