"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Percent } from "lucide-react";
import { Button } from "@/app/components/Button";

export function DiscountPanel({
  discountPct,
  maxDiscountPct = 15,
}: {
  discountPct: number;
  maxDiscountPct?: number;
}) {
  const router = useRouter();

  const [draft, setDraft] = useState(String(discountPct));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const value = Number.parseInt(draft, 10);
    if (!Number.isInteger(value) || value < 0 || value > maxDiscountPct) {
      setError(`Enter a whole number between 0 and ${maxDiscountPct}.`);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/bff/partners/me/discount", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPct: value })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/dashboard")}`);
        return;
      }

      setBusy(false);

      if (!response.ok) {
        setError(payload.error ?? "We could not save your discount. Please try again.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <Percent aria-hidden="true" className="text-brandBlue" size={20} />
        Your discount
      </h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">
        Set the discount customers get when they use your promo code, on any package
        (0–{maxDiscountPct}%). Some cheaper packages may receive less so margins stay safe.
      </p>

      <form className="mt-4 flex items-center gap-2.5" onSubmit={submit}>
        <label className="sr-only" htmlFor="partner-discount-pct">
          Discount percentage
        </label>
        <input
          className="h-10 w-24 rounded-[10px] border border-outline bg-mist px-3 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
          disabled={busy}
          id="partner-discount-pct"
          inputMode="numeric"
          max={maxDiscountPct}
          min={0}
          onChange={(event) => {
            setSuccess(false);
            setDraft(event.target.value);
          }}
          step={1}
          type="number"
          value={draft}
        />
        <span className="text-sm font-bold text-onSurfaceVariant">%</span>
        <Button disabled={busy} size="sm" type="submit" variant="flat">
          {busy ? <Loader2 className="animate-spin" size={14} /> : null}
          Save
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm font-semibold text-error">{error}</p> : null}
      {success ? <p className="mt-3 text-sm font-semibold text-brandTeal">Discount saved.</p> : null}
    </div>
  );
}
