"use client";

import { FormEvent, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "../components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "../components/fieldClasses";
import { CODE_INPUT_CLASSES, SIGN_IN_TEXT_ACTION_CLASSES } from "./signInClasses";
import type { LinkChallenge } from "./SocialSignInButtons";

type Step = "email" | "code";

/**
 * Claim-by-OTP after a social sign-in whose email could not be trusted.
 *
 * Apple's Hide My Email gives a relay address, and a first sign-in may carry no
 * verified address at all. Neither is safe to key an account on, so the visitor
 * names an email and proves it with a code before the identity is bound.
 *
 * The link ticket stays in component state and never reaches the URL.
 */
export function LinkEmailStep({
  challenge,
  next,
  onRestart
}: {
  challenge: LinkChallenge;
  next: string;
  onRestart: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(challenge.suggestedEmail ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/bff/auth/link/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkTicket: challenge.linkTicket, email })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      retryAfterSeconds?: number;
    };

    setBusy(false);

    if (!response.ok) {
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

    const response = await fetch("/bff/auth/link/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkTicket: challenge.linkTicket, email, otp: code })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setBusy(false);
      setError(payload.error ?? "That code did not work. Please try again.");
      return;
    }

    window.location.assign(next);
  }

  return (
    <>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
        <MailCheck aria-hidden="true" size={26} />
      </span>

      <h1 className="mt-4 text-center font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
        {step === "email" ? "Confirm your email" : "Enter your code"}
      </h1>

      <p className="mt-2 text-center text-sm leading-6 text-onSurfaceVariant">
        {step === "email"
          ? "Almost there. Tell us the email address for your eSim2you account and we'll send a 6-digit code to confirm it."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
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
          </Button>
        </form>
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
            Confirm and continue
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

      <button
        className="mx-auto mt-4 flex min-h-11 items-center px-2 text-xs font-bold text-onSurfaceVariant transition hover:text-brandInk"
        onClick={onRestart}
        type="button"
      >
        Start over
      </button>
    </>
  );
}
