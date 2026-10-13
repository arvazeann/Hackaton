"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, registerFormSchema } from "@/schemas";
import type { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { signInWithCredentials } from "@/lib/auth/client";

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerFormSchema>;
type RegistrationResponse = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function safeCallback(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginForm() {
  const router = useRouter();
  const callback = safeCallback(useSearchParams().get("callbackUrl"));
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  return (
    <form
      method="post"
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const result = await signInWithCredentials(
          values.email,
          values.password,
          callback,
        );
        if (result !== "success") {
          setFormError(
            result === "invalid"
              ? "Email atau kata sandi tidak cocok."
              : "Layanan login sedang bermasalah. Coba lagi beberapa saat.",
          );
          return;
        }
        router.replace(callback);
        router.refresh();
      })}
    >
      {formError && (
        <p role="alert" className="text-sm text-rose-700">
          {formError}
        </p>
      )}
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          type="email"
          autoComplete="email"
          {...register("email")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal shadow-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.email?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kata sandi
        <input
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal shadow-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.password?.message} />
      </label>
      <button
        disabled={isSubmitting}
        className="min-h-12 rounded-full bg-[#174c3c] px-6 py-3 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerFormSchema) });

  return (
    <form
      method="post"
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        let response: Response;
        try {
          response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(values),
          });
        } catch {
          setFormError("Tidak dapat menghubungi layanan. Coba lagi.");
          return;
        }

        let result: RegistrationResponse;
        try {
          result = (await response.json()) as RegistrationResponse;
        } catch {
          setFormError("Respons layanan tidak valid. Coba lagi.");
          return;
        }
        if (!response.ok) {
          setFormError(result.message ?? "Akun belum dapat dibuat. Coba lagi.");
          for (const [name, messages] of Object.entries(
            result.fieldErrors ?? {},
          )) {
            if (messages?.[0])
              setError(name as keyof RegisterValues, {
                message: messages[0],
              });
          }
          return;
        }

        const login = await signInWithCredentials(
          values.email,
          values.password,
          "/",
        );
        if (login !== "success") {
          setFormError(
            "Akun berhasil dibuat, tetapi login otomatis gagal. Silakan masuk dengan akun baru Anda.",
          );
        } else {
          router.replace("/");
          router.refresh();
        }
      })}
    >
      {formError && (
        <p role="alert" className="text-sm text-rose-700">
          {formError}
        </p>
      )}
      <label className="grid gap-2 text-sm font-medium">
        Nama lengkap
        <input
          autoComplete="name"
          {...register("name")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal shadow-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.name?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          type="email"
          autoComplete="email"
          {...register("email")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal shadow-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.email?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kata sandi
        <input
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal shadow-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.password?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Konfirmasi kata sandi
        <input
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className="rounded-xl border border-[#d9d4c8] bg-[#fffefa] px-4 py-3 font-normal shadow-sm outline-none transition focus:border-[#568270] focus:ring-2 focus:ring-[#568270]/20"
        />
        <FieldError message={errors.confirmPassword?.message} />
      </label>
      <button
        disabled={isSubmitting}
        className="min-h-12 rounded-full bg-[#174c3c] px-6 py-3 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? "Memproses…" : "Daftar"}
      </button>
    </form>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  return mode === "login" ? <LoginForm /> : <RegisterForm />;
}
