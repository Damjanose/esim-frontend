"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";

export const PROMO_STORAGE_KEY = "esim2you.checkout.promo";
const STORAGE_KEY = PROMO_STORAGE_KEY;

export type AppliedPromo = {
  promoCode: string;
  discountPct: number;
  finalCustomerPriceCents: number;
};

type ApplyPromoResponse =
  | { applied: false }
  | { applied: true; discountPct: number; finalCustomerPriceCents: number };

type StoredPromo = { promoCode: string; packageId: string };

export function readStoredPromo(packageId: string): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPromo;
    if (parsed.packageId !== packageId || !parsed.promoCode) return null;
    return parsed.promoCode;
  } catch {
    return null;
  }
}

export function writeStoredPromo(packageId: string, promoCode: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ promoCode, packageId }));
  } catch {
    // Best-effort only — localStorage can throw in private-browsing contexts.
  }
}

export function clearStoredPromo() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort only.
  }
}

export function PromoCodeField({
  packageId,
  onChange,
  onPendingChange
}: {
  packageId: string;
  onChange: (promo: AppliedPromo | null) => void;
  /**
   * Reports whether an apply-promo request (manual or the silent on-mount
   * re-validation) is currently in flight, so callers can gate other
   * actions (e.g. disabling Pay) on it for the full duration of the check.
   */
  onPendingChange?: (pending: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingStoredCode, setCheckingStoredCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedPromo | null>(null);

  async function apply(promoCode: string, { silent = false }: { silent?: boolean } = {}) {
    if (!silent) {
      setBusy(true);
      setError(null);
    }
    onPendingChange?.(true);

    try {
      const response = await fetch("/bff/checkout/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode, packageId })
      });

      if (response.status === 401) {
        if (silent) {
          // A stale/anonymous session shouldn't bounce the visitor off the
          // checkout page on load — just drop the stored code silently.
          clearStoredPromo();
          return;
        }
        window.location.assign(
          `/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`
        );
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as {
        data?: ApplyPromoResponse;
        error?: string;
      };

      if (!response.ok) {
        // A transient failure (5xx, malformed response) is not a confirmed
        // "invalid code" answer — leave the stored code in place so a later
        // retry (refresh, or clicking Apply again) can still succeed.
        if (!silent) {
          setError(payload.error ?? "We could not check that code. Please try again.");
        }
        return;
      }

      if (!payload.data?.applied) {
        clearStoredPromo();
        setApplied(null);
        onChange(null);
        if (!silent) {
          setError("This code isn't valid for this order.");
        }
        return;
      }

      const next: AppliedPromo = {
        promoCode,
        discountPct: payload.data.discountPct,
        finalCustomerPriceCents: payload.data.finalCustomerPriceCents
      };
      writeStoredPromo(packageId, promoCode);
      setApplied(next);
      setError(null);
      onChange(next);
    } catch {
      // Network failure — same reasoning as the !response.ok branch above:
      // don't discard a possibly-still-valid stored code over a blip.
      if (!silent) {
        setError("We could not reach the server. Please try again.");
      }
    } finally {
      setBusy(false);
      onPendingChange?.(false);
    }
  }

  useEffect(() => {
    const stored = readStoredPromo(packageId);
    if (stored) {
      setCode(stored);
      setCheckingStoredCode(true);
      void apply(stored, { silent: true }).finally(() => setCheckingStoredCode(false));
    }
    // Re-check whenever the package being purchased changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || busy) return;
    void apply(trimmed);
  }

  function change() {
    clearStoredPromo();
    setApplied(null);
    setError(null);
    setCode("");
    onChange(null);
  }

  if (checkingStoredCode) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-[12px] border border-outline bg-mist px-4 py-3 text-sm font-medium text-onSurfaceVariant">
        <Loader2 className="animate-spin" size={16} />
        Checking your saved code…
      </div>
    );
  }

  if (applied) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] border border-outline bg-mist px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-brandInk">
          <Check className="text-brandTeal" size={16} />
          Partner Code: {applied.promoCode.toUpperCase()} ✓
        </span>
        <button
          className="text-xs font-bold text-brandBlue hover:text-brandInk"
          onClick={change}
          type="button"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form className="mt-4" onSubmit={submit}>
      <label
        className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant"
        htmlFor="promo-code"
      >
        Partner code
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="h-11 flex-1 rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium uppercase text-brandInk outline-none transition focus:border-brandBlue"
          disabled={busy}
          id="promo-code"
          onChange={(event) => {
            setError(null);
            setCode(event.target.value);
          }}
          placeholder="Enter code"
          value={code}
        />
        <Button aria-busy={busy} disabled={busy || !code.trim()} size="sm" type="submit">
          {busy ? <Loader2 className="animate-spin" size={16} /> : null}
          {busy ? "Applying…" : "Apply"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-xs font-semibold text-error">{error}</p> : null}
    </form>
  );
}
