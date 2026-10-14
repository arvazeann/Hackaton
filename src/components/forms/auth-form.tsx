"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { signInWithCredentials } from "@/lib/auth/client";
import { loginSchema, registerFormSchema } from "@/schemas";

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerFormSchema>;
type RegistrationResponse = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
type AuthMode = "login" | "register";

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-input bg-card px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-focus/20";
const submitClassName =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65";

function safeCallback(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function GoogleButton({
  callback,
  disabled,
  onStart,
  onError,
}: {
  callback: string;
  disabled: boolean;
  onStart: () => void;
  onError: (message: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        onError("");
        onStart();
        try {
          await signIn("google", { redirectTo: callback });
        } catch {
          onError("Tidak dapat memulai login Google. Coba lagi.");
        }
      }}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
          transform="translate(0 4)"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.77 7.18l7.73 6C44.41 37.87 46.98 31.81 46.98 24.55Z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"
          transform="translate(0 4)"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6C30.03 37.8 27.3 38.5 24 38.5c-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
        />
      </svg>
      Lanjutkan dengan Google
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      ATAU
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function PasswordInput({
  autoComplete,
  error,
  id,
  registration,
}: {
  autoComplete: string;
  error?: string;
  id: string;
  registration: UseFormRegisterReturn<"password">;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        {...registration}
        className={`${inputClassName} pr-12`}
      />
      <button
        type="button"
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-1 right-1 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        {visible ? (
          <EyeOff aria-hidden="true" size={18} />
        ) : (
          <Eye aria-hidden="true" size={18} />
        )}
      </button>
      <FieldError message={error} />
    </div>
  );
}

function LoginForm({
  googleEnabled,
  onSwitch,
}: {
  googleEnabled: boolean;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const callback = safeCallback(useSearchParams().get("callbackUrl"));
  const [formError, setFormError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const submitLock = useRef(false);
  const passwordId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const busy = isSubmitting || googlePending;
  const submitValues = handleSubmit(async (values) => {
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
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }
    submitLock.current = true;
    void submitValues(event).finally(() => {
      submitLock.current = false;
    });
  }

  return (
    <form method="post" className="grid gap-4" onSubmit={onSubmit}>
      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-status-error-bg px-3 py-2 text-sm text-status-error-ink"
        >
          {formError}
        </p>
      )}
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
          className={inputClassName}
        />
        <FieldError message={errors.email?.message} />
      </label>
      <div className="grid gap-2 text-sm font-semibold">
        <label htmlFor={passwordId}>Kata sandi</label>
        <PasswordInput
          id={passwordId}
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />
      </div>
      <button type="submit" disabled={busy} className={submitClassName}>
        {busy && (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        )}
        {isSubmitting ? "Memeriksa akun…" : "Masuk"}
      </button>
      {googleEnabled && (
        <>
          <Divider />
          <GoogleButton
            callback={callback}
            disabled={busy}
            onStart={() => setGooglePending(true)}
            onError={(message) => {
              setGooglePending(false);
              setFormError(message || null);
            }}
          />
        </>
      )}
      <p className="pt-1 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary"
        >
          Register
        </button>
      </p>
    </form>
  );
}

function RegisterForm({
  googleEnabled,
  onSwitch,
}: {
  googleEnabled: boolean;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const callback = "/";
  const [formError, setFormError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const submitLock = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerFormSchema) });
  const busy = isSubmitting || googlePending;
  const submitValues = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => null);
    if (!response) {
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
      for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0])
          setError(name as keyof RegisterValues, { message: messages[0] });
      }
      return;
    }

    const login = await signInWithCredentials(
      values.email,
      values.password,
      callback,
    );
    if (login !== "success") {
      setFormError(
        "Akun berhasil dibuat, tetapi login otomatis gagal. Silakan masuk dengan akun baru Anda.",
      );
    } else {
      router.replace(callback);
      router.refresh();
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }
    submitLock.current = true;
    void submitValues(event).finally(() => {
      submitLock.current = false;
    });
  }

  return (
    <form method="post" className="grid gap-3.5" onSubmit={onSubmit}>
      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-status-error-bg px-3 py-2 text-sm text-status-error-ink"
        >
          {formError}
        </p>
      )}
      <label className="grid gap-1.5 text-sm font-semibold">
        Nama lengkap
        <input
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
          className={inputClassName}
        />
        <FieldError message={errors.name?.message} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Email
        <input
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
          className={inputClassName}
        />
        <FieldError message={errors.email?.message} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Kata sandi
        <input
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
          className={inputClassName}
        />
        <FieldError message={errors.password?.message} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Konfirmasi kata sandi
        <input
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
          className={inputClassName}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </label>
      <button type="submit" disabled={busy} className={submitClassName}>
        {busy && (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        )}
        {isSubmitting ? "Membuat akun…" : "Daftar"}
      </button>
      {googleEnabled && (
        <>
          <Divider />
          <GoogleButton
            callback={callback}
            disabled={busy}
            onStart={() => setGooglePending(true)}
            onError={(message) => {
              setGooglePending(false);
              setFormError(message || null);
            }}
          />
        </>
      )}
      <p className="pt-1 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary"
        >
          Login
        </button>
      </p>
    </form>
  );
}

export function AuthForm({
  mode,
  googleEnabled = false,
  onSwitch,
}: {
  mode: AuthMode;
  googleEnabled?: boolean;
  onSwitch: () => void;
}) {
  return mode === "login" ? (
    <LoginForm googleEnabled={googleEnabled} onSwitch={onSwitch} />
  ) : (
    <RegisterForm googleEnabled={googleEnabled} onSwitch={onSwitch} />
  );
}
