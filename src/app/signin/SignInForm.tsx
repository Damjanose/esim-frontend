"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import { safeNextPath } from "@/lib/safe-redirect";
import { Button } from "../components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "../components/fieldClasses";
import { LinkEmailStep } from "./LinkEmailStep";
import { CODE_INPUT_CLASSES, SIGN_IN_CARD_CLASSES, SIGN_IN_TEXT_ACTION_CLASSES } from "./signInClasses";
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
  const isCheckout = next.startsWith("/checkout");
  const isReview = searchParams.get("reason") === "review";

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
      <div className={SIGN_IN_CARD_CLASSES}>
        <LinkEmailStep
          challenge={linkChallenge}
          next={next}
          onRestart={() => setLinkChallenge(null)}
        />
      </div>
    );
  }

  return (
    <div className={SIGN_IN_CARD_CLASSES}>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
        {step === "email" ? <ShieldCheck aria-hidden="true" size={26} /> : <MailCheck aria-hidden="true" size={26} />}
      </span>

      <h1 className="mt-4 text-center font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
        {step === "email"
          ? isCheckout
            ? "Sign in to continue your purchase"
            : isReview
              ? "Sign in to post your review"
              : "Sign in to eSim2you"
          : "Enter your code"}
      </h1>

      <p className="mt-2 text-center text-sm leading-6 text-onSurfaceVariant">
        {step === "email"
          ? isCheckout
            ? "We'll email you a 6-digit code so your eSIM and QR code arrive in your account. No password required."
            : isReview
              ? "Your text is saved. Reviews come from travelers who bought a plan, so we just need to know it's you."
              : "We'll email you a 6-digit code. No password required."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
        <>
          <form className="mt-6 space-y-4" onSubmit={requestCode}>
            <label className={FIELD_LABEL_CLASSES}>
              Email address
              <input
                autoComplete="email"
                className={FIELD_INPUT_CLASSES}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

            <Button className="w-full" disabled={!email} hero loading={busy} size="lg" type="submit">
              Send code
              {busy ? null : <ArrowRight size={17} />}
            </Button>
          </form>

          {/* Outside the form: a provider button is its own sign-in path, not a
              second control of the email one. */}
          <SocialSignInButtons next={next} onLinkRequired={setLinkChallenge} />

          <p className="mt-6 text-center text-xs leading-5 text-onSurfaceVariant">
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
        <form className="mt-6 space-y-4" onSubmit={verifyCode}>
          <label className={FIELD_LABEL_CLASSES}>
            6-digit code
            <input
              autoComplete="one-time-code"
              className={CODE_INPUT_CLASSES}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              value={code}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

          <Button className="w-full" disabled={code.length !== 6} hero loading={busy} size="lg" type="submit">
            Verify and continue
          </Button>

          <div className="flex items-center justify-between gap-3">
            <button
              className={`${SIGN_IN_TEXT_ACTION_CLASSES} text-onSurfaceVariant hover:text-brandInk`}
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
              className={`${SIGN_IN_TEXT_ACTION_CLASSES} text-brandBlue hover:text-brandInk`}
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
