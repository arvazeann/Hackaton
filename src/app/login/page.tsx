import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { AuthForm } from "@/components/forms/auth-form";
export default function Login() {
  return (
    <Shell>
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-5 text-3xl font-bold">Selamat datang kembali</h1>
        <AuthForm mode="login" />
        <p className="mt-5 text-center text-sm text-stone-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-emerald-800">
            Daftar
          </Link>
        </p>
      </section>
    </Shell>
  );
}
