import { config as loadEnv } from "dotenv";
import { assertIsolatedStagingTarget } from "../src/server/security/staging-target";

// Keep the production-oriented .env.local and .env out of staging commands.
loadEnv({ path: ".env.staging.local" });

try {
  assertIsolatedStagingTarget({
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    stagingProjectRef: process.env.STAGING_PROJECT_REF,
    productionProjectRef: process.env.PRODUCTION_PROJECT_REF,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
    stagingStorageBucket: process.env.STAGING_STORAGE_BUCKET,
    productionStorageBucket: process.env.PRODUCTION_STORAGE_BUCKET,
  });
  process.stdout.write(
    "Staging database and Storage project refs match; no connection was opened.\n",
  );
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Staging target validation failed."}\n`,
  );
  process.exitCode = 1;
}
