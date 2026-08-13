"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { BillingAddress } from "@/app/api/user/billing-address/route";

const FIELDS: { autoComplete: string; key: keyof BillingAddress; label: string }[] = [
  { autoComplete: "address-line1", key: "line1", label: "Address" },
  { autoComplete: "address-level2", key: "city", label: "City" },
  { autoComplete: "postal-code", key: "postal", label: "Postal code" },
  { autoComplete: "country-name", key: "country", label: "Country" }
];

const EMPTY: BillingAddress = { line1: "", city: "", postal: "", country: "" };

export function BillingForm({ initialAddress }: { initialAddress: BillingAddress | null }) {
  const [address, setAddress] = useState<BillingAddress>(initialAddress ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/user/billing-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address)
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/profile/billing")}`);
        return;
      }

      setBusy(false);

      if (!response.ok) {
        setError(payload.error ?? "We could not save your address. Please try again.");
        return;
      }

      setSaved(true);
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={save}>
      {FIELDS.map((field) => (
        <label
          className="block text-xs font-bold uppercase tracking-[0.14em] text-[#748aa2]"
          key={field.key}
        >
          {field.label}
          <input
            autoComplete={field.autoComplete}
            className="mt-2 h-12 w-full rounded-[12px] border border-[#214867] bg-[#040d1a] px-4 text-sm font-medium text-white outline-none transition focus:border-[#168cff]"
            onChange={(event) => {
              setSaved(false);
              setAddress((current) => ({ ...current, [field.key]: event.target.value }));
            }}
            required
            value={address[field.key]}
          />
        </label>
      ))}

      {error ? <p className="text-sm font-semibold text-[#ff8792]">{error}</p> : null}

      <div className="flex items-center gap-4 pt-1">
        <button
          className="inline-flex h-12 items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-7 text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          Save address
        </button>

        {saved ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#4ade80]">
            <Check size={16} />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
