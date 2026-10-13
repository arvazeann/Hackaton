import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"] });

// Load the DB module only after dotenv has populated DATABASE_URL; the pool
// captures its connection string when src/lib/db.ts is first imported.
async function main() {
  try {
    const { promoteExistingAdmin } =
      await import("@/server/services/admin-bootstrap");
    const result = await promoteExistingAdmin({
      email: process.env.ADMIN_BOOTSTRAP_EMAIL,
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    });
    process.stdout.write(
      result === "promoted"
        ? "Existing account promoted to ADMIN.\n"
        : "Account is already ADMIN; no change made.\n",
    );
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AdminBootstrapError"
        ? error.message
        : "Bootstrap failed safely. Check database availability; credentials were not logged.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

void main();
