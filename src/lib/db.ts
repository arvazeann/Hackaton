import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

export const DATABASE_POOL_MAX = 1;

export function createDatabasePool(connectionString?: string) {
  return new Pool({ connectionString, max: DATABASE_POOL_MAX });
}

const pool =
  globalForPrisma.prismaPool ?? createDatabasePool(process.env.DATABASE_URL);
const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaPool = pool;
}
