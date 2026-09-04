"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import {
  BILLING_FIELDS,
  EMPTY_BILLING_ADDRESS,
  hasBillingErrors,
  normalizeBillingAddress,
  validateBillingAddress,
  type BillingFieldErrors
} from "@/lib/billingValidation";

export function BillingStep({
  accountEmail,
  onContinue
}: {
  accountEmail: string | null;
  onContinue: (address: BillingAddress) => void;
}) {
  const [address, setAddress] = useState<BillingAddress>({
    ...EMPTY_BILLING_ADDRESS,
    email: accountEmail ?? ""
  });
  const [errors, setErrors] = useState<BillingFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/bff/user/billing-address");
        const payload = (await response.json()) as { data?: { billingAddress: BillingAddress | null } };
        if (cancelled) return;
        if (response.ok && payload.data?.billingAddress) {
          setAddress({ ...payload.data.billingAddress, email: payload.data.billingAddress.email || accountEmail || "" });
        }
      } catch {
        if (!cancelled) setLoadError("We could not load your saved billing details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountEmail]);

  const update = useCallback(
    (field: keyof BillingAddress) => (value: string) => {
      setAddress((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    []
  );

  const submit = useCallback(async () => {
    const normalized = normalizeBillingAddress({ ...address, email: address.email || accountEmail || "" });
    const nextErrors = validateBillingAddress(normalized);
    setErrors(nextErrors);
    if (hasBillingErrors(nextErrors)) return;

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/bff/user/billing-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized)
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setSaveError(payload.error ?? "We could not save your billing details.");
        return;
      }
      onContinue(normalized);
    } catch {
      setSaveError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [accountEmail, address, onContinue]);

  if (loading) {
    return <p className="mt-6 text-sm text-onSurfaceVariant">Loading your billing details…</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {loadError ? <p className="text-sm text-error">{loadError}</p> : null}
      {BILLING_FIELDS.map((field) => (
        <label
          className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant"
          key={field.key}
        >
          {field.label}
          <input
            autoComplete={field.autoComplete}
            className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
            onChange={(event) => update(field.key)(event.target.value)}
            value={address[field.key]}
          />
          {errors[field.key] ? (
            <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-error">
              {errors[field.key] === "required"
                ? "This field is required."
                : errors[field.key] === "tooShort"
                  ? "This is too short."
                  : "Check this value."}
            </span>
          ) : null}
        </label>
      ))}
      {saveError ? <p className="text-sm font-semibold text-error">{saveError}</p> : null}
      <Button className="w-full" disabled={saving} onClick={() => void submit()} size="lg" type="button">
        {saving ? "Saving…" : "Continue to payment"}
      </Button>
    </div>
  );
}
