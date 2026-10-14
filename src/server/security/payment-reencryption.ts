export const paymentCiphertextKinds = ["paymentAccount", "order"] as const;
export type PaymentCiphertextKind = (typeof paymentCiphertextKinds)[number];

export type PaymentCiphertextRecord = {
  id: string;
  ciphertext: string;
};

export interface PaymentCiphertextRepository {
  scan(
    kind: PaymentCiphertextKind,
    afterId: string,
    take: number,
  ): Promise<PaymentCiphertextRecord[]>;
  compareAndSwap(
    kind: PaymentCiphertextKind,
    id: string,
    expectedCiphertext: string,
    replacementCiphertext: string,
  ): Promise<boolean>;
}

export type PaymentReencryptionReport = {
  dryRun: boolean;
  scanned: number;
  migrated: number;
  wouldMigrate: number;
  skipped: number;
  failed: number;
  unreadable: number;
  remainingV1: number;
};

export function validatePaymentPlaintext(
  kind: PaymentCiphertextKind,
  plaintext: string,
) {
  if (kind === "paymentAccount") {
    const accountNumber = plaintext.trim();
    if (accountNumber.length < 3 || accountNumber.length > 64)
      throw new Error("Payment account plaintext failed validation.");
    return;
  }

  let value: unknown;
  try {
    value = JSON.parse(plaintext);
  } catch {
    throw new Error("Payment instruction plaintext failed validation.");
  }
  if (typeof value !== "object" || value === null)
    throw new Error("Payment instruction plaintext failed validation.");

  const instruction = value as Record<string, unknown>;
  const providerName = instruction.providerName;
  const accountHolderName = instruction.accountHolderName;
  const accountNumber = instruction.accountNumber;
  if (
    typeof providerName !== "string" ||
    providerName.trim().length < 1 ||
    providerName.trim().length > 100 ||
    typeof accountHolderName !== "string" ||
    accountHolderName.trim().length < 1 ||
    accountHolderName.trim().length > 100 ||
    typeof accountNumber !== "string" ||
    accountNumber.trim().length < 3 ||
    accountNumber.trim().length > 64
  ) {
    throw new Error("Payment instruction plaintext failed validation.");
  }
}

type ReencryptionOptions = {
  dryRun: boolean;
  batchSize?: number;
  decrypt: (ciphertext: string) => string;
  encryptV2: (plaintext: string) => string;
  validate: (kind: PaymentCiphertextKind, plaintext: string) => void;
  onRecordFailure?: (kind: PaymentCiphertextKind, id: string) => void;
  onProgress?: (
    kind: PaymentCiphertextKind,
    report: Readonly<PaymentReencryptionReport>,
  ) => void;
};

function isVersion(ciphertext: string, version: "v1" | "v2") {
  return ciphertext.startsWith(`${version}.`);
}

function assertBatchSize(batchSize: number) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500)
    throw new Error("Batch size must be an integer between 1 and 500.");
}

/**
 * Processes encrypted values in bounded pages and updates each row with a
 * compare-and-swap. Re-running starts at the beginning; already migrated v2
 * values are verified and skipped, while previously failed v1 rows are retried.
 */
export async function reencryptPaymentRecords(
  repository: PaymentCiphertextRepository,
  options: ReencryptionOptions,
): Promise<PaymentReencryptionReport> {
  const batchSize = options.batchSize ?? 50;
  assertBatchSize(batchSize);

  const report: PaymentReencryptionReport = {
    dryRun: options.dryRun,
    scanned: 0,
    migrated: 0,
    wouldMigrate: 0,
    skipped: 0,
    failed: 0,
    unreadable: 0,
    remainingV1: 0,
  };

  for (const kind of paymentCiphertextKinds) {
    let afterId = "";
    while (true) {
      const records = await repository.scan(kind, afterId, batchSize);
      if (records.length === 0) break;

      for (const record of records) {
        report.scanned += 1;
        try {
          const plaintext = options.decrypt(record.ciphertext);
          options.validate(kind, plaintext);

          if (isVersion(record.ciphertext, "v2")) {
            report.skipped += 1;
            continue;
          }
          if (!isVersion(record.ciphertext, "v1"))
            throw new Error("Unsupported ciphertext version.");

          const replacement = options.encryptV2(plaintext);
          if (!isVersion(replacement, "v2"))
            throw new Error("New ciphertext is not version 2.");
          if (options.decrypt(replacement) !== plaintext)
            throw new Error("New ciphertext verification failed.");

          if (options.dryRun) {
            report.wouldMigrate += 1;
            continue;
          }

          const updated = await repository.compareAndSwap(
            kind,
            record.id,
            record.ciphertext,
            replacement,
          );
          if (updated) report.migrated += 1;
          else report.skipped += 1;
        } catch {
          report.failed += 1;
          options.onRecordFailure?.(kind, record.id);
        }
      }

      afterId = records[records.length - 1].id;
      options.onProgress?.(kind, { ...report });
    }
  }

  // A second bounded pass proves that each persisted value is still readable.
  for (const kind of paymentCiphertextKinds) {
    let afterId = "";
    while (true) {
      const records = await repository.scan(kind, afterId, batchSize);
      if (records.length === 0) break;
      for (const record of records) {
        if (isVersion(record.ciphertext, "v1")) report.remainingV1 += 1;
        try {
          const plaintext = options.decrypt(record.ciphertext);
          options.validate(kind, plaintext);
        } catch {
          report.unreadable += 1;
          options.onRecordFailure?.(kind, record.id);
        }
      }
      afterId = records[records.length - 1].id;
    }
  }

  return report;
}
