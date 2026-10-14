import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const keySchema = z
  .string()
  .base64()
  .transform((value, context) => {
    const key = Buffer.from(value, "base64");
    if (key.length !== 32) {
      context.addIssue({ code: "custom", message: "must decode to 32 bytes" });
      return Buffer.alloc(0);
    }
    return key;
  });

function encryptionKey(version: "v1" | "v2") {
  const variable =
    version === "v1" ? "PAYMENT_ENCRYPTION_KEY" : "PAYMENT_ENCRYPTION_KEY_V2";
  const parsed = keySchema.safeParse(process.env[variable]);
  if (!parsed.success)
    throw new Error(`${variable} must be a base64-encoded 32-byte key.`);
  return parsed.data;
}

export function validatePaymentEncryptionKey() {
  const v1Key = encryptionKey("v1");
  if (process.env.PAYMENT_ENCRYPTION_KEY_V2?.trim()) {
    const v2Key = encryptionKey("v2");
    if (v1Key.equals(v2Key)) {
      throw new Error(
        "PAYMENT_ENCRYPTION_KEY_V2 must be different from PAYMENT_ENCRYPTION_KEY.",
      );
    }
  }
}

export function encryptPaymentData(plaintext: string): string {
  validatePaymentEncryptionKey();
  const version = process.env.PAYMENT_ENCRYPTION_KEY_V2?.trim() ? "v2" : "v1";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(version), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${version}.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptPaymentData(value: string): string {
  const parts = value.split(".");
  const [version, ivText, tagText, ciphertextText] = parts;
  if (
    parts.length !== 4 ||
    (version !== "v1" && version !== "v2") ||
    !ivText ||
    !tagText ||
    !ciphertextText
  )
    throw new Error("Unsupported encrypted payment data format.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(version),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function lastFour(value: string) {
  return value.slice(-4);
}
