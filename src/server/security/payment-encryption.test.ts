import { afterEach, describe, expect, it } from "vitest";
import {
  decryptPaymentData,
  encryptPaymentData,
  lastFour,
} from "@/server/security/payment-encryption";

const previous = process.env.PAYMENT_ENCRYPTION_KEY;
const previousV2 = process.env.PAYMENT_ENCRYPTION_KEY_V2;
const key = Buffer.alloc(32, 7).toString("base64");
const keyV2 = Buffer.alloc(32, 8).toString("base64");

afterEach(() => {
  if (previous === undefined) delete process.env.PAYMENT_ENCRYPTION_KEY;
  else process.env.PAYMENT_ENCRYPTION_KEY = previous;
  if (previousV2 === undefined) delete process.env.PAYMENT_ENCRYPTION_KEY_V2;
  else process.env.PAYMENT_ENCRYPTION_KEY_V2 = previousV2;
});

describe("payment encryption", () => {
  it("encrypts with a fresh IV and round-trips data", () => {
    process.env.PAYMENT_ENCRYPTION_KEY = key;
    const first = encryptPaymentData("BCA|1234567890");
    const second = encryptPaymentData("BCA|1234567890");
    expect(first).not.toBe(second);
    expect(first.startsWith("v1.")).toBe(true);
    expect(decryptPaymentData(first)).toBe("BCA|1234567890");
  });

  it("rejects absent or malformed keys without exposing their value", () => {
    delete process.env.PAYMENT_ENCRYPTION_KEY;
    expect(() => encryptPaymentData("secret")).toThrow(
      "PAYMENT_ENCRYPTION_KEY",
    );
    process.env.PAYMENT_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => encryptPaymentData("secret")).toThrow(
      "PAYMENT_ENCRYPTION_KEY",
    );
  });

  it("reads v1 data and writes v2 data when the separate v2 key is configured", () => {
    process.env.PAYMENT_ENCRYPTION_KEY = key;
    delete process.env.PAYMENT_ENCRYPTION_KEY_V2;
    const oldCiphertext = encryptPaymentData("synthetic-payment-data");

    process.env.PAYMENT_ENCRYPTION_KEY_V2 = keyV2;
    const newCiphertext = encryptPaymentData("synthetic-payment-data");

    expect(oldCiphertext.startsWith("v1.")).toBe(true);
    expect(newCiphertext.startsWith("v2.")).toBe(true);
    expect(decryptPaymentData(oldCiphertext)).toBe("synthetic-payment-data");
    expect(decryptPaymentData(newCiphertext)).toBe("synthetic-payment-data");
  });

  it("requires the v2 key to differ from the legacy key", () => {
    process.env.PAYMENT_ENCRYPTION_KEY = key;
    process.env.PAYMENT_ENCRYPTION_KEY_V2 = key;

    expect(() => encryptPaymentData("synthetic-payment-data")).toThrow(
      "PAYMENT_ENCRYPTION_KEY_V2",
    );
  });

  it("rejects a wrong key, malformed envelope, and altered authentication tag", () => {
    process.env.PAYMENT_ENCRYPTION_KEY = key;
    delete process.env.PAYMENT_ENCRYPTION_KEY_V2;
    const ciphertext = encryptPaymentData("synthetic-payment-data");

    process.env.PAYMENT_ENCRYPTION_KEY = keyV2;
    expect(() => decryptPaymentData(ciphertext)).toThrow();
    expect(() => decryptPaymentData(`${ciphertext}.extra`)).toThrow(
      "Unsupported encrypted payment data format",
    );

    process.env.PAYMENT_ENCRYPTION_KEY = key;
    const [version, iv, , encrypted] = ciphertext.split(".");
    const altered = `${version}.${iv}.${Buffer.alloc(16, 9).toString("base64url")}.${encrypted}`;
    expect(() => decryptPaymentData(altered)).toThrow();
  });

  it("derives a separate masked suffix", () => {
    expect(lastFour("1234567890")).toBe("7890");
  });
});
