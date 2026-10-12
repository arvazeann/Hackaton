import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { AuthForm } from "@/components/forms/auth-form";
export default function Register() {
  return (
    <Shell>
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-5 text-3xl font-bold">Buat akun RuangLagi</h1>
        <AuthForm mode="register" />
        <p className="mt-5 text-center text-sm text-stone-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-emerald-800">
            Masuk
          </Link>
        </p>
      </section>
    </Shell>
  );
}
