import { afterEach, describe, expect, it } from "vitest";
import { createDatabasePool, DATABASE_POOL_MAX } from "./db";

describe("database connection pool", () => {
  let pool: ReturnType<typeof createDatabasePool> | undefined;

  afterEach(async () => {
    await pool?.end();
    pool = undefined;
  });

  it("limits each Prisma adapter pool to one connection", () => {
    pool = createDatabasePool("postgresql://localhost/test");

    expect(pool.options.max).toBe(1);
    expect(pool.options.max).toBe(DATABASE_POOL_MAX);
  });
});
