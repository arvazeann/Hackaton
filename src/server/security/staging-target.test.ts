import { describe, expect, it } from "vitest";
import { assertIsolatedStagingTarget } from "@/server/security/staging-target";

const stagingRef = "stageprojectref12345";
const productionRef = "prodprojectref123456";

function config(overrides: Record<string, string | undefined> = {}) {
  return {
    stagingProjectRef: stagingRef,
    productionProjectRef: productionRef,
    supabaseUrl: `https://${stagingRef}.supabase.co`,
    storageBucket: "ruanglagi-images-staging",
    stagingStorageBucket: "ruanglagi-images-staging",
    productionStorageBucket: "ruanglagi-images",
    databaseUrl: `postgresql://postgres.${stagingRef}:synthetic-password@aws-0.pooler.supabase.com:5432/postgres`,
    ...overrides,
  };
}

describe("isolated staging target guard", () => {
  it("accepts database and Storage URLs for the same staging ref", () => {
    expect(() => assertIsolatedStagingTarget(config())).not.toThrow();
  });

  it("blocks when either service points to production", () => {
    expect(() =>
      assertIsolatedStagingTarget(
        config({ supabaseUrl: `https://${productionRef}.supabase.co` }),
      ),
    ).toThrow("not the isolated staging project");
    expect(() =>
      assertIsolatedStagingTarget(
        config({
          databaseUrl: `postgresql://postgres.${productionRef}:synthetic-password@aws-0.pooler.supabase.com:5432/postgres`,
        }),
      ),
    ).toThrow("not the isolated staging project");
  });

  it("blocks missing identifiers and mismatched DB / Storage refs", () => {
    expect(() =>
      assertIsolatedStagingTarget(config({ stagingProjectRef: undefined })),
    ).toThrow("Distinct staging and production project refs are required");
    expect(() =>
      assertIsolatedStagingTarget(
        config({
          databaseUrl: "postgresql://postgres:local@localhost:5432/db",
        }),
      ),
    ).toThrow("not a recognized Supabase endpoint");
  });

  it("blocks a missing or shared Storage bucket", () => {
    expect(() =>
      assertIsolatedStagingTarget(config({ storageBucket: undefined })),
    ).toThrow("distinct staging Storage bucket");
    expect(() =>
      assertIsolatedStagingTarget(
        config({
          storageBucket: "ruanglagi-images",
          stagingStorageBucket: "ruanglagi-images",
        }),
      ),
    ).toThrow("distinct staging Storage bucket");
  });

  it("does not include URL credentials in errors", () => {
    const privateUrl =
      "postgresql://postgres.synthetic-secret@aws-0.pooler.supabase.com:5432/postgres";
    try {
      assertIsolatedStagingTarget(config({ databaseUrl: privateUrl }));
      throw new Error("Expected target guard to reject the production ref.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain("synthetic-secret");
      expect((error as Error).message).not.toContain("postgresql://");
    }
  });
});
