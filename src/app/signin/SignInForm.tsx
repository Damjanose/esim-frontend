"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { safeNextPath } from "@/lib/safe-redirect";
import { Button } from "../components/Button";
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

    const { ok, payload } = await postJson("/bff/auth/otp/send", { email });

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

    const { ok, payload } = await postJson("/bff/auth/otp/verify", { email, otp: code });

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
      <div className="relative w-full max-w-[460px] rounded-[22px] border border-outline bg-white p-7 shadow-brandCard sm:p-9">
        <LinkEmailStep
          challenge={linkChallenge}
          next={next}
          onRestart={() => setLinkChallenge(null)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[460px] rounded-[22px] border border-outline bg-white p-7 shadow-brandCard sm:p-9">
      <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-outline bg-mist text-brandBlue">
        {step === "email" ? <ShieldCheck size={22} /> : <MailCheck size={22} />}
      </span>

      <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
        {step === "email" ? "Sign in to eSim2you" : "Enter your code"}
      </h1>

      <p className="mt-2 text-sm leading-6 text-onSurfaceVariant">
        {step === "email"
          ? "We'll email you a 6-digit code. No password required."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
        <>
          <form className="mt-7 space-y-4" onSubmit={requestCode}>
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
              Email address
              <input
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition placeholder:text-onSurfaceVariant/60 focus:border-brandBlue focus:ring-4 focus:ring-brandBlue/15"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

            <Button className="w-full" disabled={busy || !email} size="lg" type="submit">
              {busy ? <Loader2 className="animate-spin" size={18} /> : null}
              Send code
              {busy ? null : <ArrowRight size={17} />}
            </Button>
          </form>

          {/* Outside the form: a provider button is its own sign-in path, not a
              second control of the email one. */}
          <SocialSignInButtons next={next} onLinkRequired={setLinkChallenge} />

          <p className="mt-7 text-center text-xs leading-5 text-onSurfaceVariant">
            By continuing you agree to our{" "}
            <Link className="text-onSurfaceVariant underline underline-offset-2 transition hover:text-brandInk" href="/terms">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="text-onSurfaceVariant underline underline-offset-2 transition hover:text-brandInk" href="/policy">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={verifyCode}>
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
            6-digit code
            <input
              autoComplete="one-time-code"
              className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-center font-display text-xl font-black tracking-[0.4em] text-brandInk outline-none transition focus:border-brandBlue focus:ring-4 focus:ring-brandBlue/15"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              value={code}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

          <Button className="w-full" disabled={busy || code.length !== 6} size="lg" type="submit">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Verify and continue
          </Button>

          <div className="flex items-center justify-between pt-1 text-xs font-semibold">
            <button
              className="text-onSurfaceVariant transition hover:text-brandInk"
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
              className="text-brandBlue transition hover:text-brandInk disabled:cursor-not-allowed disabled:opacity-50"
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
