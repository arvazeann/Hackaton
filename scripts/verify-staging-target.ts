import { config as loadEnv } from "dotenv";
import { describeStagingDatabaseError } from "../src/server/security/staging-database-diagnostics";
import { assertIsolatedStagingTarget } from "../src/server/security/staging-target";

// Keep the production-oriented .env.local and .env out of staging commands.
loadEnv({ path: ".env.staging.local" });

function stagingTarget() {
  return {
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    stagingProjectRef: process.env.STAGING_PROJECT_REF,
    productionProjectRef: process.env.PRODUCTION_PROJECT_REF,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
    stagingStorageBucket: process.env.STAGING_STORAGE_BUCKET,
    productionStorageBucket: process.env.PRODUCTION_STORAGE_BUCKET,
  };
}

async function main() {
  try {
    assertIsolatedStagingTarget(stagingTarget());
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Staging target validation failed."}\n`,
    );
    process.exitCode = 1;
    return;
  }

  let disconnect: (() => Promise<void>) | undefined;
  try {
    // Import only after the target guard passes. This probe does not mutate data.
    const { db } = await import("../src/lib/db");
    disconnect = () => db.$disconnect();
    const rows = await db.$queryRaw<
      Array<{ ready: number }>
    >`SELECT 1 AS ready`;
    if (rows.length !== 1 || Number(rows[0]?.ready) !== 1)
      throw new Error("Unexpected staging database probe result.");
    process.stdout.write(
      "Staging target matched and database connection succeeded (read-only SELECT 1). No data was changed.\n",
    );
  } catch (error) {
    process.stderr.write(
      `${describeStagingDatabaseError(error)} No URLs, hosts, or credentials were printed.\n`,
    );
    process.exitCode = 1;
  } finally {
    await disconnect?.().catch(() => undefined);
  }
}

void main().catch(() => {
  process.stderr.write(
    "Staging verification failed unexpectedly. No URLs or credentials were printed.\n",
  );
  process.exitCode = 1;
});
