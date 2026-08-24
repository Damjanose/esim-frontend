"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";

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
      const response = await fetch("/bff/user/billing-address", {
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
          className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant"
          key={field.key}
        >
          {field.label}
          <input
            autoComplete={field.autoComplete}
            className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
            onChange={(event) => {
              setSaved(false);
              setAddress((current) => ({ ...current, [field.key]: event.target.value }));
            }}
            required
            value={address[field.key]}
          />
        </label>
      ))}

      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

      <div className="flex items-center gap-4 pt-1">
        <Button disabled={busy} type="submit">
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          Save address
        </Button>

        {saved ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-brandTeal">
            <Check size={16} />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
