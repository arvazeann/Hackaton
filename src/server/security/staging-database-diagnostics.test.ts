import { describe, expect, it } from "vitest";
import { describeStagingDatabaseError } from "@/server/security/staging-database-diagnostics";

describe("staging database connection diagnostics", () => {
  it.each([
    ["ENOTFOUND", "hostname could not be resolved"],
    ["ECONNREFUSED", "TCP connection was refused"],
    ["ETIMEDOUT", "connection timed out"],
    ["ECONNRESET", "connection was reset"],
    ["28P01", "authentication failed"],
    ["EMAXCONNSESSION", "Pooler session connection limit reached"],
  ])("classifies %s without emitting raw driver details", (code, expected) => {
    const failure = {
      code: "P1001",
      meta: {
        driverAdapterError: {
          cause: Object.assign(
            new Error("private-host.example:6543 password=private-secret"),
            { code },
          ),
        },
      },
    };

    const result = describeStagingDatabaseError(failure);
    expect(result).toContain(expected);
    expect(result).not.toContain("private-host.example");
    expect(result).not.toContain("private-secret");
  });

  it("does not guess the cause when Prisma exposes only P1001", () => {
    const result = describeStagingDatabaseError({
      code: "P1001",
      message: "Can't reach database server at private-host:6543",
    });

    expect(result).toContain("cannot yet be distinguished");
    expect(result).not.toContain("private-host");
  });

  it("uses P2010 server details while redacting connection strings and secrets", () => {
    const result = describeStagingDatabaseError({
      code: "P2010",
      message:
        "Raw query failed. Code: XX000. Message: failure at postgresql://user:private-secret@private-host.example:6543/db password=private-secret",
    });

    expect(result).toContain("XX000");
    expect(result).toContain("[connection URL redacted]");
    expect(result).toContain("password=[redacted]");
    expect(result).not.toContain("private-host.example");
    expect(result).not.toContain("private-secret");
  });
});
