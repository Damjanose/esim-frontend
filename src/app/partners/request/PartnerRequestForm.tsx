"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";

// Mirrors PARTNER_TYPES in `E-SIM backend/src/services/partner.service.ts` —
// the backend rejects anything outside this fixed list, so the dropdown only
// ever offers values it will accept.
const PARTNER_TYPES = [
  { value: "Hotel", label: "Hotel" },
  { value: "Airbnb", label: "Airbnb / short-term rental" },
  { value: "TravelAgency", label: "Travel agency" },
  { value: "Creator", label: "Creator" },
  { value: "Taxi", label: "Taxi" },
  { value: "RentACar", label: "Car rental" },
  { value: "Other", label: "Other" }
] as const;

type FormState = {
  partnerType: string;
  country: string;
  businessName: string;
  website: string;
};

const EMPTY: FormState = { partnerType: "", country: "", businessName: "", website: "" };

export function PartnerRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/bff/partners/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerType: form.partnerType,
          country: form.country,
          businessName: form.businessName.trim() ? form.businessName.trim() : undefined,
          website: form.website.trim() ? form.website.trim() : undefined
        })
      });

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/request")}`);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      setBusy(false);

      if (response.status === 409) {
        setError("You've already submitted a partner request for this account.");
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "We could not submit your request. Please try again.");
        return;
      }

      router.push("/partners/status");
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
        Partner type
        <select
          className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
          onChange={(event) =>
            setForm((current) => ({ ...current, partnerType: event.target.value }))
          }
          required
          value={form.partnerType}
        >
          <option disabled value="">
            Select a type
          </option>
          {PARTNER_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
        Business or brand name
        <input
          autoComplete="organization"
          className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
          onChange={(event) =>
            setForm((current) => ({ ...current, businessName: event.target.value }))
          }
          value={form.businessName}
        />
      </label>

      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
        Country
        <input
          autoComplete="country-name"
          className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
          onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
          required
          value={form.country}
        />
      </label>

      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
        Website (optional)
        <input
          autoComplete="url"
          className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
          onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
          type="url"
          value={form.website}
        />
      </label>

      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

      <div className="pt-1">
        <Button disabled={busy || !form.partnerType || !form.country} type="submit">
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          Submit request
        </Button>
      </div>
    </form>
  );
}
