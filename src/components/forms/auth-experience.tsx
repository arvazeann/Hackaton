"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthForm } from "@/components/forms/auth-form";

type AuthMode = "login" | "register";

const panelCopy = {
  login: {
    eyebrow: "BARANG KOS, HARGA BERSAHABAT",
    title: "Bikin kamar kos lebih nyaman.",
    description:
      "Temukan perabot, alat dapur, dan kebutuhan kos preloved dari sesama anak kos.",
    action: "Buat akun",
  },
  register: {
    eyebrow: "SELAMAT DATANG DI RUANGLAGI",
    title: "Barangmu bisa berguna lagi.",
    description:
      "Bergabung untuk menjual dan menemukan kebutuhan kos dengan harga lebih hemat.",
    action: "Masuk",
  },
} satisfies Record<AuthMode, Record<string, string>>;

function modeFromPath(pathname: string): AuthMode {
  return pathname === "/register" ? "register" : "login";
}

export function AuthExperience({
  initialMode,
  googleEnabled,
}: {
  initialMode: AuthMode;
  googleEnabled: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const loginHeading = useRef<HTMLHeadingElement>(null);
  const registerHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const syncMode = () => setMode(modeFromPath(window.location.pathname));
    window.addEventListener("popstate", syncMode);
    return () => window.removeEventListener("popstate", syncMode);
  }, []);

  function switchMode(nextMode: AuthMode) {
    if (nextMode === mode) return;
    const nextPath = nextMode === "register" ? "/register" : "/login";
    window.history.pushState(
      { authMode: nextMode },
      "",
      `${nextPath}${window.location.search}${window.location.hash}`,
    );
    setMode(nextMode);
    window.setTimeout(() => {
      (nextMode === "login" ? loginHeading : registerHeading).current?.focus();
    }, 0);
  }

  const loginActive = mode === "login";
  const activeCopy = panelCopy[mode];

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mx-auto mb-5 flex max-w-5xl items-center justify-between px-1 sm:mb-7"></div>

      <div className="mx-auto w-full min-w-0 max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_28px_90px_rgba(52,45,37,0.14)] sm:rounded-[2.5rem]">
        <div className="relative min-h-[700px] min-w-0 md:min-h-[680px]">
          <div
            className={`grid min-h-[700px] min-w-0 w-[200%] grid-cols-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:min-h-[680px] md:w-full md:translate-x-0 ${loginActive ? "translate-x-0" : "-translate-x-1/2"}`}
          >
            <section
              aria-hidden={!loginActive}
              inert={!loginActive}
              className="order-1 flex min-w-0 items-center justify-center px-5 py-8 sm:px-10 md:order-2 md:px-12 lg:px-16"
            >
              <div className="w-full max-w-md">
                <p className="mb-2 text-xs font-bold tracking-[.18em] text-brand-orange">
                  SENANG MELIHATMU KEMBALI
                </p>
                <h1
                  ref={loginHeading}
                  tabIndex={-1}
                  className="mb-2 font-serif text-4xl leading-tight tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus sm:text-5xl"
                >
                  Selamat datang.
                </h1>
                <p className="mb-7 text-sm leading-6 text-muted-foreground sm:text-base">
                  Masuk untuk melanjutkan ke RuangLagi.
                </p>
                <AuthForm
                  mode="login"
                  googleEnabled={googleEnabled}
                  onSwitch={() => switchMode("register")}
                />
              </div>
            </section>

            <section
              aria-hidden={loginActive}
              inert={loginActive}
              className="order-2 flex min-w-0 items-center justify-center px-5 py-8 sm:px-10 md:order-1 md:px-12 lg:px-16"
            >
              <div className="w-full max-w-md">
                <p className="mb-2 text-xs font-bold tracking-[.18em] text-brand-orange">
                  MULAI DARI SINI
                </p>
                <h1
                  ref={registerHeading}
                  tabIndex={-1}
                  className="mb-2 font-serif text-4xl leading-tight tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus sm:text-5xl"
                >
                  Buat akun.
                </h1>
                <p className="mb-5 text-sm leading-6 text-muted-foreground sm:mb-6 sm:text-base">
                  Satu akun untuk menemukan dan memberi cerita baru.
                </p>
                <AuthForm
                  mode="register"
                  googleEnabled={googleEnabled}
                  onSwitch={() => switchMode("login")}
                />
              </div>
            </section>
          </div>

          <aside
            aria-live="polite"
            className={`pointer-events-none absolute inset-y-0 hidden w-1/2 overflow-hidden bg-primary px-10 py-12 text-primary-foreground transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:flex md:flex-col md:justify-between lg:px-14 lg:py-16 ${loginActive ? "left-0" : "left-1/2"}`}
          >
            <div className="pointer-events-auto relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xl lowercase tracking-tight">
                  ruanglagi.
                </span>
                <Sparkles
                  aria-hidden="true"
                  className="size-5 text-accent-bright"
                />
              </div>
              <div className="max-w-sm">
                <p className="mb-4 text-xs font-bold tracking-[.2em] text-primary-foreground/65">
                  {activeCopy.eyebrow}
                </p>
                <h2 className="font-serif text-4xl leading-tight tracking-tight lg:text-5xl">
                  {activeCopy.title}
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-7 text-primary-foreground/75 lg:text-base">
                  {activeCopy.description}
                </p>
                <button
                  type="button"
                  onClick={() => switchMode(loginActive ? "register" : "login")}
                  className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full border border-primary-foreground/45 px-6 text-sm font-semibold transition hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"
                >
                  {activeCopy.action}
                  <ArrowRight aria-hidden="true" size={17} />
                </button>
              </div>
              <div aria-hidden="true" className="flex items-end gap-3">
                <span className="h-2 w-8 rounded-full bg-accent-bright" />
                <span className="h-2 w-2 rounded-full bg-primary-foreground/35" />
                <span className="h-2 w-2 rounded-full bg-primary-foreground/35" />
                <span className="ml-auto font-serif text-5xl text-primary-foreground/10">
                  cerita.
                </span>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 size-72 rounded-full border border-primary-foreground/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-20 size-80 rounded-full bg-primary-foreground/[0.035]"
            />
          </aside>
        </div>
      </div>

      <p className="mx-auto mt-5 max-w-5xl text-center text-xs leading-5 text-muted-foreground sm:mt-7 sm:text-sm">
        Dengan melanjutkan, kamu menyetujui untuk menggunakan RuangLagi dengan
        aman dan saling menghargai.
      </p>
    </section>
  );
}
