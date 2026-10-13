import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  tx: {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));

import {
  AdminBootstrapError,
  promoteExistingAdmin,
} from "@/server/services/admin-bootstrap";

const email = "operator@example.test";
const password = "correct horse battery staple";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
let passwordHash = "";

beforeAll(async () => {
  passwordHash = await bcrypt.hash(password, 4);
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockImplementation(
    (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
  );
  mocks.tx.$queryRaw.mockResolvedValue([{ id }]);
  mocks.tx.user.findUnique.mockResolvedValue({
    id,
    role: "USER",
    passwordHash,
  });
  mocks.tx.user.updateMany.mockResolvedValue({ count: 1 });
});

describe("explicit admin bootstrap", () => {
  it("requires valid input and does not start a transaction for invalid credentials", async () => {
    await expect(
      promoteExistingAdmin({ email: "bad", password: "" }),
    ).rejects.toBeInstanceOf(AdminBootstrapError);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("stops clearly if no pre-registered account exists", async () => {
    mocks.tx.$queryRaw.mockResolvedValue([]);
    await expect(promoteExistingAdmin({ email, password })).rejects.toThrow(
      "Register the account first",
    );
    expect(mocks.tx.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.tx.user.updateMany).not.toHaveBeenCalled();
  });

  it("locks the existing row and promotes only a USER with matching bcrypt credentials", async () => {
    await expect(
      promoteExistingAdmin({ email: " OPERATOR@example.test ", password }),
    ).resolves.toBe("promoted");
    expect(mocks.tx.$queryRaw.mock.calls[0][0].join("")).toContain(
      "FOR UPDATE",
    );
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { id, role: "USER" },
      data: { role: "ADMIN" },
    });
    expect(JSON.stringify(mocks.tx.user.updateMany.mock.calls)).not.toContain(
      password,
    );
    expect(JSON.stringify(mocks.tx.user.updateMany.mock.calls)).not.toContain(
      passwordHash,
    );
  });

  it("does not change role when bcrypt credentials do not match", async () => {
    await expect(
      promoteExistingAdmin({ email, password: "wrong password" }),
    ).rejects.toThrow("credentials did not match");
    expect(mocks.tx.user.updateMany).not.toHaveBeenCalled();
  });

  it("allows an already-ADMIN account to rerun as a no-op without demotion", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({
      id,
      role: "ADMIN",
      passwordHash,
    });
    await expect(promoteExistingAdmin({ email, password })).resolves.toBe(
      "already-admin",
    );
    expect(mocks.tx.user.updateMany).not.toHaveBeenCalled();
  });

  it("handles a concurrent promotion without overwriting or demoting the new ADMIN", async () => {
    mocks.tx.user.updateMany.mockResolvedValue({ count: 0 });
    mocks.tx.user.findUnique
      .mockResolvedValueOnce({ id, role: "USER", passwordHash })
      .mockResolvedValueOnce({ role: "ADMIN" });
    await expect(promoteExistingAdmin({ email, password })).resolves.toBe(
      "already-admin",
    );
    expect(mocks.tx.user.updateMany).toHaveBeenCalledWith({
      where: { id, role: "USER" },
      data: { role: "ADMIN" },
    });
  });

  it("does not expose the input values in safe errors", async () => {
    mocks.tx.$queryRaw.mockResolvedValue([]);
    await expect(promoteExistingAdmin({ email, password })).rejects.toThrow(
      expect.not.stringContaining(password),
    );
  });
});
