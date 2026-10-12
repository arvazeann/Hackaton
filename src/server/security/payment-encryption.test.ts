import { afterEach, describe, expect, it } from "vitest";
import {
  decryptPaymentData,
  encryptPaymentData,
  lastFour,
} from "@/server/security/payment-encryption";

const previous = process.env.PAYMENT_ENCRYPTION_KEY;
const key = Buffer.alloc(32, 7).toString("base64");

afterEach(() => {
  if (previous === undefined) delete process.env.PAYMENT_ENCRYPTION_KEY;
  else process.env.PAYMENT_ENCRYPTION_KEY = previous;
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

  it("derives a separate masked suffix", () => {
    expect(lastFour("1234567890")).toBe("7890");
  });
});
