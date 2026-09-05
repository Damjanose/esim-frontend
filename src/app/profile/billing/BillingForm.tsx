"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { BILLING_FIELDS } from "@/lib/billingValidation";

const EMPTY: BillingAddress = {
  holdersName: "",
  email: "",
  countryCode: "",
  administrativeArea: "",
  locality: "",
  address1: "",
  postalCode: "",
  phoneNumber: ""
};

type CountryOption = { code: string; name: string };

const FIELD_BY_KEY = Object.fromEntries(BILLING_FIELDS.map((field) => [field.key, field]));

const INPUT_CLASSNAME =
  "mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue";

export function BillingForm({
  countries,
  initialAddress
}: {
  countries: CountryOption[];
  initialAddress: BillingAddress | null;
}) {
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

  function renderField(key: keyof BillingAddress) {
    const field = FIELD_BY_KEY[key];
    return (
      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
        {field.label}
        {key === "countryCode" ? (
          <select
            autoComplete={field.autoComplete}
            className={INPUT_CLASSNAME}
            onChange={(event) => {
              setSaved(false);
              setAddress((current) => ({ ...current, countryCode: event.target.value }));
            }}
            required
            value={address.countryCode}
          >
            <option disabled value="">
              Select a country
            </option>
            {countries.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            autoComplete={field.autoComplete}
            className={INPUT_CLASSNAME}
            onChange={(event) => {
              setSaved(false);
              setAddress((current) => ({ ...current, [key]: event.target.value }));
            }}
            required
            value={address[key]}
          />
        )}
      </label>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={save}>
      {renderField("holdersName")}

      <div className="grid gap-4 sm:grid-cols-2">
        {renderField("email")}
        {renderField("phoneNumber")}
      </div>

      {renderField("address1")}

      <div className="grid gap-4 sm:grid-cols-2">
        {renderField("locality")}
        {renderField("postalCode")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {renderField("administrativeArea")}
        {renderField("countryCode")}
      </div>

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
