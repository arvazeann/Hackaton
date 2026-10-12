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

function encryptionKey() {
  const parsed = keySchema.safeParse(process.env.PAYMENT_ENCRYPTION_KEY);
  if (!parsed.success)
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  return parsed.data;
}

export function validatePaymentEncryptionKey() {
  encryptionKey();
}

export function encryptPaymentData(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptPaymentData(value: string): string {
  const [version, ivText, tagText, ciphertextText] = value.split(".");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText)
    throw new Error("Unsupported encrypted payment data format.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
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
