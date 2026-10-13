import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { AuthForm } from "@/components/forms/auth-form";
export default function Login() {
  return (
    <Shell>
      <section className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="rounded-3xl border border-[#e3ded2] bg-[#fffefa] p-6 shadow-[0_12px_34px_rgba(39,52,44,0.07)] sm:p-9">
          <p className="mb-2 text-xs font-bold tracking-[.14em] text-[#568270]">
            RUANGLAGI
          </p>
          <h1 className="mb-5 text-3xl font-bold text-[#26332d]">
            Selamat datang kembali
          </h1>
          <AuthForm mode="login" />
          <p className="mt-5 text-center text-sm text-stone-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#174c3c] underline-offset-4 hover:underline"
            >
              Daftar
            </Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
