import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { AuthForm } from "@/components/forms/auth-form";
export default function Register() {
  return (
    <Shell>
      <section className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="rounded-3xl border border-[#e3ded2] bg-[#fffefa] p-6 shadow-[0_12px_34px_rgba(39,52,44,0.07)] sm:p-9">
          <p className="mb-2 text-xs font-bold tracking-[.14em] text-[#568270]">
            MULAI DI RUANGLAGI
          </p>
          <h1 className="mb-5 text-3xl font-bold text-[#26332d]">
            Buat akun RuangLagi
          </h1>
          <AuthForm mode="register" />
          <p className="mt-5 text-center text-sm text-stone-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#174c3c] underline-offset-4 hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
