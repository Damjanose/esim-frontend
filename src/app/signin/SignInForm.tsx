"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { safeNextPath } from "@/lib/safe-redirect";
import { LinkEmailStep } from "./LinkEmailStep";
import { SocialSignInButtons, type LinkChallenge } from "./SocialSignInButtons";

type Step = "email" | "code";

type ApiError = {
  error?: string;
  retryAfterSeconds?: number;
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = (await response.json().catch(() => ({}))) as ApiError;
  return { ok: response.ok, status: response.status, payload };
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [linkChallenge, setLinkChallenge] = useState<LinkChallenge | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);

    const { ok, payload } = await postJson("/api/auth/otp/send", { email });

    setBusy(false);

    if (!ok) {
      setError(payload.error ?? "We could not send your code. Please try again.");
      if (typeof payload.retryAfterSeconds === "number") {
        setCooldown(payload.retryAfterSeconds);
      }
      return;
    }

    setStep("code");
    setCooldown(30);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { ok, payload } = await postJson("/api/auth/otp/verify", { email, otp: code });

    if (!ok) {
      setBusy(false);
      setError(payload.error ?? "That code did not work. Please try again.");
      return;
    }

    // Session cookies are already set by the route handler.
    router.replace(next);
    router.refresh();
  }

  if (linkChallenge) {
    return (
      <div className="relative w-full max-w-[460px] rounded-[22px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-7 shadow-[0_28px_70px_rgba(0,0,0,0.35)] sm:p-9">
        <LinkEmailStep
          challenge={linkChallenge}
          next={next}
          onRestart={() => setLinkChallenge(null)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[460px] rounded-[22px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-7 shadow-[0_28px_70px_rgba(0,0,0,0.35)] sm:p-9">
      <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
        {step === "email" ? <ShieldCheck size={22} /> : <MailCheck size={22} />}
      </span>

      <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
        {step === "email" ? "Sign in to eSim2you" : "Enter your code"}
      </h1>

      <p className="mt-2 text-sm leading-6 text-[#8ea3ba]">
        {step === "email"
          ? "We'll email you a 6-digit code. No password required."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
        <>
          <form className="mt-7 space-y-4" onSubmit={requestCode}>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#748aa2]">
              Email address
              <input
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-[12px] border border-[#214867] bg-[#040d1a] px-4 text-sm font-medium text-white outline-none transition focus:border-[#168cff] focus:ring-4 focus:ring-[#168cff]/15"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            {error ? <p className="text-sm font-semibold text-[#ff8792]">{error}</p> : null}

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42b1ff] motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={busy || !email}
              type="submit"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : null}
              Send code
              {busy ? null : <ArrowRight size={17} />}
            </button>
          </form>

          {/* Outside the form: a provider button is its own sign-in path, not a
              second control of the email one. */}
          <SocialSignInButtons next={next} onLinkRequired={setLinkChallenge} />

          <p className="mt-7 text-center text-xs leading-5 text-[#6d849c]">
            By continuing you agree to our{" "}
            <Link className="text-[#8ea3ba] underline underline-offset-2 transition hover:text-white" href="/terms">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="text-[#8ea3ba] underline underline-offset-2 transition hover:text-white" href="/policy">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={verifyCode}>
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#748aa2]">
            6-digit code
            <input
              autoComplete="one-time-code"
              className="mt-2 h-12 w-full rounded-[12px] border border-[#214867] bg-[#040d1a] px-4 text-center font-display text-xl font-black tracking-[0.4em] text-white outline-none transition focus:border-[#168cff] focus:ring-4 focus:ring-[#168cff]/15"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              value={code}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-[#ff8792]">{error}</p> : null}

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42b1ff] motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            disabled={busy || code.length !== 6}
            type="submit"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Verify and continue
          </button>

          <div className="flex items-center justify-between pt-1 text-xs font-semibold">
            <button
              className="text-[#8ea3ba] transition hover:text-white"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              type="button"
            >
              Use a different email
            </button>

            <button
              className="text-[#42b1ff] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode()}
              type="button"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
