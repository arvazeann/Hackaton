import { config as loadEnv } from "dotenv";
import {
  reencryptPaymentRecords,
  validatePaymentPlaintext,
  type PaymentCiphertextRecord,
  type PaymentCiphertextRepository,
} from "../src/server/security/payment-reencryption";
import {
  decryptPaymentData,
  encryptPaymentData,
  validatePaymentEncryptionKey,
} from "../src/server/security/payment-encryption";
import { assertIsolatedStagingTarget } from "../src/server/security/staging-target";

// Keep the production-oriented .env.local and .env out of staging commands.
loadEnv({ path: ".env.staging.local" });
let disconnectDatabase: (() => Promise<void>) | undefined;

function parseMode(args: string[]) {
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  const confirmStaging = args.includes("--confirm-staging");
  if (
    dryRun === apply ||
    args.some(
      (arg) => !["--dry-run", "--apply", "--confirm-staging"].includes(arg),
    )
  )
    throw new Error("Choose exactly one mode: --dry-run or --apply.");
  if (apply && !confirmStaging)
    throw new Error("--apply also requires --confirm-staging.");
  if (dryRun && confirmStaging)
    throw new Error("--confirm-staging is only valid with --apply.");
  return { dryRun, apply };
}

async function main() {
  const { dryRun, apply } = parseMode(process.argv.slice(2));
  assertIsolatedStagingTarget({
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    stagingProjectRef: process.env.STAGING_PROJECT_REF,
    productionProjectRef: process.env.PRODUCTION_PROJECT_REF,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
    stagingStorageBucket: process.env.STAGING_STORAGE_BUCKET,
    productionStorageBucket: process.env.PRODUCTION_STORAGE_BUCKET,
  });

  if (!process.env.PAYMENT_ENCRYPTION_KEY_V2?.trim())
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY_V2 is required for staging re-encryption.",
    );
  validatePaymentEncryptionKey();

  // Import only after target verification; constructing the Prisma pool is deferred.
  const { db } = await import("../src/lib/db");
  disconnectDatabase = () => db.$disconnect();
  const repository: PaymentCiphertextRepository = {
    async scan(kind, afterId, take): Promise<PaymentCiphertextRecord[]> {
      if (kind === "paymentAccount") {
        const rows = await db.paymentAccount.findMany({
          where: afterId ? { id: { gt: afterId } } : {},
          select: { id: true, accountNumberCiphertext: true },
          orderBy: { id: "asc" },
          take,
        });
        return rows.map(({ id, accountNumberCiphertext }) => ({
          id,
          ciphertext: accountNumberCiphertext,
        }));
      }

      const rows = await db.order.findMany({
        where: {
          ...(afterId ? { id: { gt: afterId } } : {}),
          paymentInstructionCiphertext: { not: null },
        },
        select: { id: true, paymentInstructionCiphertext: true },
        orderBy: { id: "asc" },
        take,
      });
      return rows.flatMap((row) =>
        row.paymentInstructionCiphertext
          ? [{ id: row.id, ciphertext: row.paymentInstructionCiphertext }]
          : [],
      );
    },
    async compareAndSwap(kind, id, expectedCiphertext, replacementCiphertext) {
      if (kind === "paymentAccount") {
        const result = await db.paymentAccount.updateMany({
          where: { id, accountNumberCiphertext: expectedCiphertext },
          data: { accountNumberCiphertext: replacementCiphertext },
        });
        return result.count === 1;
      }
      const result = await db.order.updateMany({
        where: { id, paymentInstructionCiphertext: expectedCiphertext },
        data: { paymentInstructionCiphertext: replacementCiphertext },
      });
      return result.count === 1;
    },
  };

  const report = await reencryptPaymentRecords(repository, {
    dryRun,
    batchSize: 50,
    decrypt: decryptPaymentData,
    encryptV2: encryptPaymentData,
    validate: validatePaymentPlaintext,
    onRecordFailure: (kind, id) => {
      process.stderr.write(
        `Payment record failed validation or update: ${kind} ${id}\n`,
      );
    },
    onProgress: (kind, progress) => {
      process.stdout.write(
        `Progress ${kind}: scanned=${progress.scanned} migrated=${progress.migrated} wouldMigrate=${progress.wouldMigrate} skipped=${progress.skipped} failed=${progress.failed}\n`,
      );
    },
  });

  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (
    report.failed > 0 ||
    report.unreadable > 0 ||
    (apply && report.remainingV1 > 0)
  )
    process.exitCode = 1;
  await disconnectDatabase();
  disconnectDatabase = undefined;
}

main().catch(async () => {
  process.stderr.write(
    "Payment re-encryption stopped. Check staging configuration and database availability; sensitive error details were suppressed.\n",
  );
  // The target check precedes the dynamic DB import. Errors after that point
  // still close the pool without printing driver details.
  if (disconnectDatabase) await disconnectDatabase().catch(() => undefined);
  process.exitCode = 1;
});
