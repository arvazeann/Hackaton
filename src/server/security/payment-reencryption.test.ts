import { afterEach, describe, expect, it } from "vitest";
import {
  decryptPaymentData,
  encryptPaymentData,
} from "@/server/security/payment-encryption";
import {
  paymentCiphertextKinds,
  reencryptPaymentRecords,
  validatePaymentPlaintext,
  type PaymentCiphertextKind,
  type PaymentCiphertextRecord,
  type PaymentCiphertextRepository,
} from "@/server/security/payment-reencryption";

class MemoryRepository implements PaymentCiphertextRepository {
  records: Record<PaymentCiphertextKind, PaymentCiphertextRecord[]> = {
    paymentAccount: [],
    order: [],
  };
  failNextUpdate = false;
  beforeCompareAndSwap?: (kind: PaymentCiphertextKind, id: string) => void;

  async scan(kind: PaymentCiphertextKind, afterId: string, take: number) {
    return this.records[kind]
      .filter((record) => record.id > afterId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .slice(0, take)
      .map((record) => ({ ...record }));
  }

  async compareAndSwap(
    kind: PaymentCiphertextKind,
    id: string,
    expectedCiphertext: string,
    replacementCiphertext: string,
  ) {
    if (this.failNextUpdate) {
      this.failNextUpdate = false;
      throw new Error("synthetic database failure");
    }
    this.beforeCompareAndSwap?.(kind, id);
    const record = this.records[kind].find((item) => item.id === id);
    if (!record || record.ciphertext !== expectedCiphertext) return false;
    record.ciphertext = replacementCiphertext;
    return true;
  }
}

const repository = (...records: PaymentCiphertextRecord[]) => {
  const value = new MemoryRepository();
  value.records.paymentAccount = records.filter((_, index) => index % 2 === 0);
  value.records.order = records.filter((_, index) => index % 2 === 1);
  return value;
};

const decrypt = (ciphertext: string) => {
  if (ciphertext.includes("corrupt") || ciphertext.includes("wrong-key"))
    throw new Error("synthetic decrypt failure");
  const separator = ciphertext.indexOf(".");
  if (separator < 0) throw new Error("synthetic malformed ciphertext");
  const version = ciphertext.slice(0, separator);
  if (version !== "v1" && version !== "v2")
    throw new Error("synthetic unsupported version");
  return ciphertext.slice(separator + 1);
};

const options = (dryRun: boolean, batchSize = 1) => ({
  dryRun,
  batchSize,
  decrypt,
  encryptV2: (plaintext: string) => `v2.${plaintext}`,
  validate: (_kind: PaymentCiphertextKind, plaintext: string) => {
    if (plaintext.length === 0) throw new Error("empty synthetic payload");
  },
});

const previousKey = process.env.PAYMENT_ENCRYPTION_KEY;
const previousKeyV2 = process.env.PAYMENT_ENCRYPTION_KEY_V2;

afterEach(() => {
  if (previousKey === undefined) delete process.env.PAYMENT_ENCRYPTION_KEY;
  else process.env.PAYMENT_ENCRYPTION_KEY = previousKey;
  if (previousKeyV2 === undefined) delete process.env.PAYMENT_ENCRYPTION_KEY_V2;
  else process.env.PAYMENT_ENCRYPTION_KEY_V2 = previousKeyV2;
});

describe("resumable payment ciphertext migration", () => {
  it("validates both stored plaintext shapes without exposing the values", () => {
    expect(() =>
      validatePaymentPlaintext("paymentAccount", "1234567890"),
    ).not.toThrow();
    expect(() =>
      validatePaymentPlaintext(
        "order",
        JSON.stringify({
          providerName: "Synthetic Bank",
          accountHolderName: "Test Seller",
          accountNumber: "1234567890",
        }),
      ),
    ).not.toThrow();
    expect(() => validatePaymentPlaintext("order", "not-json")).toThrow(
      "Payment instruction plaintext failed validation",
    );
    expect(() =>
      validatePaymentPlaintext(
        "order",
        JSON.stringify({
          providerName: "",
          accountHolderName: "",
          accountNumber: "",
        }),
      ),
    ).toThrow("Payment instruction plaintext failed validation");
  });

  it("dry-runs v1 records and verifies both v1 and v2 without writing", async () => {
    const store = repository(
      { id: "a1", ciphertext: "v1.synthetic-account" },
      { id: "o1", ciphertext: "v2.synthetic-order" },
    );

    const report = await reencryptPaymentRecords(store, options(true));

    expect(report).toMatchObject({
      dryRun: true,
      wouldMigrate: 1,
      migrated: 0,
      skipped: 1,
      failed: 0,
      unreadable: 0,
      remainingV1: 1,
    });
    expect(store.records.paymentAccount[0].ciphertext).toBe(
      "v1.synthetic-account",
    );
  });

  it("migrates v1 fields in both models and can be safely rerun", async () => {
    const store = repository(
      { id: "a1", ciphertext: "v1.synthetic-account" },
      { id: "o1", ciphertext: "v1.synthetic-order" },
    );

    const first = await reencryptPaymentRecords(store, options(false));
    const second = await reencryptPaymentRecords(store, options(false));

    expect(first).toMatchObject({ migrated: 2, remainingV1: 0, failed: 0 });
    expect(second).toMatchObject({ migrated: 0, skipped: 2, remainingV1: 0 });
    expect(store.records.paymentAccount[0].ciphertext).toBe(
      "v2.synthetic-account",
    );
    expect(store.records.order[0].ciphertext).toBe("v2.synthetic-order");
    expect(paymentCiphertextKinds).toEqual(["paymentAccount", "order"]);
  });

  it("migrates actual AES-GCM v1 ciphertext to v2 using synthetic data", async () => {
    process.env.PAYMENT_ENCRYPTION_KEY = Buffer.alloc(32, 31).toString(
      "base64",
    );
    delete process.env.PAYMENT_ENCRYPTION_KEY_V2;
    const store = repository({
      id: "a1",
      ciphertext: encryptPaymentData("123456789012"),
    });
    process.env.PAYMENT_ENCRYPTION_KEY_V2 = Buffer.alloc(32, 32).toString(
      "base64",
    );

    const report = await reencryptPaymentRecords(store, {
      dryRun: false,
      decrypt: decryptPaymentData,
      encryptV2: encryptPaymentData,
      validate: (_kind, plaintext) => {
        if (plaintext.trim().length < 3)
          throw new Error("Synthetic payment data failed validation.");
      },
    });

    expect(report).toMatchObject({
      migrated: 1,
      remainingV1: 0,
      unreadable: 0,
    });
    expect(store.records.paymentAccount[0].ciphertext.startsWith("v2.")).toBe(
      true,
    );
    expect(decryptPaymentData(store.records.paymentAccount[0].ciphertext)).toBe(
      "123456789012",
    );
  });

  it("leaves corrupt or wrong-key ciphertext untouched and marks it unreadable", async () => {
    const store = repository(
      { id: "a1", ciphertext: "v1.corrupt-account" },
      { id: "o1", ciphertext: "v1.wrong-key-order" },
    );
    const failures: string[] = [];

    const report = await reencryptPaymentRecords(store, {
      ...options(false),
      onRecordFailure: (kind, id) => failures.push(`${kind}:${id}`),
    });

    expect(report).toMatchObject({ failed: 2, unreadable: 2, remainingV1: 2 });
    expect(failures).toEqual([
      "paymentAccount:a1",
      "order:o1",
      "paymentAccount:a1",
      "order:o1",
    ]);
    expect(store.records.paymentAccount[0].ciphertext).toBe(
      "v1.corrupt-account",
    );
    expect(store.records.order[0].ciphertext).toBe("v1.wrong-key-order");
  });

  it("resumes after a database update failure without redoing completed rows", async () => {
    const store = repository(
      { id: "a1", ciphertext: "v1.synthetic-account" },
      { id: "o1", ciphertext: "v1.synthetic-order" },
    );
    store.failNextUpdate = true;

    const interrupted = await reencryptPaymentRecords(store, options(false));
    const resumed = await reencryptPaymentRecords(store, options(false));

    expect(interrupted).toMatchObject({ failed: 1, remainingV1: 1 });
    expect(resumed).toMatchObject({ migrated: 1, remainingV1: 0, failed: 0 });
  });

  it("uses compare-and-swap when a record changes after it is read", async () => {
    const store = repository({ id: "a1", ciphertext: "v1.original" });
    store.beforeCompareAndSwap = (kind, id) => {
      store.beforeCompareAndSwap = undefined;
      const record = store.records[kind].find((item) => item.id === id);
      if (record) record.ciphertext = "v1.changed-concurrently";
    };

    const report = await reencryptPaymentRecords(store, options(false));

    expect(report).toMatchObject({ skipped: 1, migrated: 0, remainingV1: 1 });
    expect(store.records.paymentAccount[0].ciphertext).toBe(
      "v1.changed-concurrently",
    );
  });

  it("allows concurrent runners to race without overwriting each other", async () => {
    const store = repository({ id: "a1", ciphertext: "v1.synthetic-account" });

    const results = await Promise.all([
      reencryptPaymentRecords(store, options(false)),
      reencryptPaymentRecords(store, options(false)),
    ]);

    expect(results.reduce((total, report) => total + report.migrated, 0)).toBe(
      1,
    );
    expect(results.reduce((total, report) => total + report.skipped, 0)).toBe(
      1,
    );
    expect(store.records.paymentAccount[0].ciphertext).toBe(
      "v2.synthetic-account",
    );
  });

  it("rejects unsafe batch sizes", async () => {
    await expect(
      reencryptPaymentRecords(repository(), { ...options(true), batchSize: 0 }),
    ).rejects.toThrow("between 1 and 500");
  });
});
