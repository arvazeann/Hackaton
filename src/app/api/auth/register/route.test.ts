import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { registerFormSchema } from "@/schemas";
import { authorizeCredentials } from "@/lib/auth/credentials";

const { findUnique, create, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique, create, update } } }));

import { POST } from "./route";

const input = {
  name: "  Ayu Lestari  ",
  email: " AYU@example.test ",
  password: "password-valid",
  confirmPassword: "password-valid",
};

function request(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    findUnique.mockReset().mockResolvedValue(null);
    create.mockReset().mockResolvedValue({ id: "new-user" });
    update.mockReset().mockResolvedValue({ id: "new-user" });
  });

  it("membuat akun dengan email ternormalisasi dan password hash saja", async () => {
    const response = await POST(request(input));
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ userId: "new-user" });
    const [args] = create.mock.calls[0] as [
      { data: { name: string; email: string; passwordHash: string } },
    ];
    expect(args.data.email).toBe("ayu@example.test");
    expect(args.data.name).toBe("Ayu Lestari");
    expect(args.data.passwordHash).not.toBe(input.password);
    await expect(
      bcrypt.compare(input.password, args.data.passwordHash),
    ).resolves.toBe(true);
    expect(JSON.stringify(responseBody)).not.toContain("passwordHash");
  });

  it("dapat langsung mengautentikasi kredensial akun yang baru dibuat", async () => {
    const response = await POST(request(input));
    expect(response.status).toBe(201);

    const [args] = create.mock.calls[0] as [
      { data: { name: string; email: string; passwordHash: string } },
    ];
    findUnique.mockResolvedValue({
      id: "new-user",
      ...args.data,
      disabledAt: null,
      sessionVersion: 0,
    });

    await expect(
      authorizeCredentials({
        email: input.email,
        password: input.password,
      }),
    ).resolves.toMatchObject({
      id: "new-user",
      email: "ayu@example.test",
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "new-user" },
        data: { lastLoginAt: expect.any(Date) },
      }),
    );
  });

  it("tidak mencatat lastLoginAt jika verifikasi bcrypt gagal", async () => {
    const passwordHash = await bcrypt.hash("expected-password", 4);
    findUnique.mockResolvedValue({
      id: "existing-user",
      name: "Ayu",
      email: "ayu@example.test",
      passwordHash,
    });
    await expect(
      authorizeCredentials({
        email: "ayu@example.test",
        password: "wrong-password",
      }),
    ).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it("menolak email duplikat tanpa membuat akun", async () => {
    findUnique.mockResolvedValue({ id: "existing" });
    const response = await POST(request(input));
    expect(response.status).toBe(409);
    expect(create).not.toHaveBeenCalled();
  });

  it("menangani race condition unique constraint saat insert", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const response = await POST(request(input));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message: "Email tidak dapat digunakan.",
    });
  });

  it("menangani kegagalan database tanpa mengirim detail internal", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    create.mockRejectedValue(new Error("sensitive database detail"));

    const response = await POST(request(input));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Akun belum dapat dibuat. Coba lagi.",
    });
    expect(log).toHaveBeenCalledWith("[auth] Registration failed", {
      type: "Error",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "sensitive database detail",
    );
    log.mockRestore();
  });

  it("menolak input invalid dan konfirmasi password yang tidak cocok", async () => {
    const invalid = await POST(request({ ...input, email: "invalid" }));
    expect(invalid.status).toBe(400);
    const mismatch = await POST(
      request({ ...input, confirmPassword: "other-pass" }),
    );
    expect(mismatch.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("menolak role platform dari registrasi publik", async () => {
    const response = await POST(request({ ...input, role: "ADMIN" }));
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("memangkas nama sebelum memvalidasi batas minimum", () => {
    expect(registerFormSchema.parse({ ...input, name: "Ayu" }).name).toBe(
      "Ayu",
    );
    expect(
      registerFormSchema.parse({ ...input, name: "  Ayu Lestari  " }).name,
    ).toBe("Ayu Lestari");
    expect(
      registerFormSchema.safeParse({ ...input, name: "   " }).success,
    ).toBe(false);
  });

  it("menolak nama yang hanya berisi spasi di endpoint registrasi", async () => {
    const response = await POST(request({ ...input, name: "   " }));
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
