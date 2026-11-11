"use client";

import { useEffect, useState } from "react";

const HASH_PATTERN = /^(\d{4,10})-(\d{9,11})$/;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Target of the "Copy code" button in the verification email. The code arrives in the URL
 * fragment (`/copy-code#123456-1767000000`, code then expiry in epoch seconds), which browsers never send to the server, so it stays out of
 * access logs, analytics and referrers. It is read once and stripped from the address bar.
 */
export function CopyCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    const match = HASH_PATTERN.exec(fromHash);
    if (match) {
      setCode(match[1]);
      setExpiresAt(Number(match[2]) * 1000);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (expiresAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const remaining = expiresAt === null ? null : expiresAt - now;
  const expired = remaining !== null && remaining <= 0;

  async function copy() {
    if (!code || expired) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-outline/50 bg-white p-8 text-center shadow-sm">
      {code ? (
        <>
          <p className="text-sm text-onSurfaceVariant">Your eSIM2you verification code</p>
          <p
            className="mt-3 select-all font-mono text-4xl font-bold tracking-[0.25em] text-onSurface"
            data-testid="copy-code-value"
          >
            {code}
          </p>
          <p
            className={`mt-3 text-sm font-medium tabular-nums ${expired ? "text-red-600" : "text-onSurfaceVariant"}`}
            role="timer"
            aria-live="off"
            data-testid="copy-code-timer"
          >
            {expired ? "Code expired. Request a new one." : `Expires in ${formatRemaining(remaining ?? 0)}`}
          </p>
          <button
            type="button"
            onClick={copy}
            disabled={expired}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#0b1d45] px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? "Copied ✓" : "Copy code"}
          </button>
          {failed ? (
            <p className="mt-3 text-xs text-onSurfaceVariant">
              Couldn&apos;t copy automatically. Press and hold the code to copy it.
            </p>
          ) : null}
          <p className="mt-6 text-xs text-onSurfaceVariant">
            Go back to the eSIM2you app or website and paste it. Never share this code with anyone.
          </p>
        </>
      ) : (
        <p className="text-sm text-onSurfaceVariant">
          This link has no code. Open the latest verification email and tap Copy code again.
        </p>
      )}
    </div>
  );
}
