"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
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
      <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
        <MailCheck size={22} />
      </span>

      <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
        {step === "email" ? "Confirm your email" : "Enter your code"}
      </h1>

      <p className="mt-2 text-sm leading-6 text-[#8ea3ba]">
        {step === "email"
          ? "Almost there. Tell us the email address for your eSim2you account and we'll send a 6-digit code to confirm it."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
        <form className="mt-7 space-y-4" onSubmit={requestCode}>
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#748aa2]">
            Email address
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-[12px] border border-[#214867] bg-[#040d1a] px-4 text-sm font-medium text-white outline-none transition focus:border-[#168cff]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-[#ff8792]">{error}</p> : null}

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || !email}
            type="submit"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Send code
          </button>
        </form>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={verifyCode}>
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#748aa2]">
            6-digit code
            <input
              autoComplete="one-time-code"
              className="mt-2 h-12 w-full rounded-[12px] border border-[#214867] bg-[#040d1a] px-4 text-center font-display text-xl font-black tracking-[0.4em] text-white outline-none transition focus:border-[#168cff]"
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
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || code.length !== 6}
            type="submit"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Confirm and continue
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

      <button
        className="mt-6 text-xs font-bold text-[#748aa2] transition hover:text-white"
        onClick={onRestart}
        type="button"
      >
        Start over
      </button>
    </>
  );
}
