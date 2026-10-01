"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
import { FIELD_ERROR_CLASSES, FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import {
  BILLING_FIELDS,
  EMPTY_BILLING_ADDRESS,
  hasBillingErrors,
  normalizeBillingAddress,
  validateBillingAddress,
  type BillingFieldErrors,
  type BillingFieldError
} from "@/lib/billingValidation";

type CountryOption = { code: string; name: string };

const FIELD_BY_KEY = Object.fromEntries(BILLING_FIELDS.map((field) => [field.key, field]));

/** "Change address" toggles: text-style, but a 44px tap target. */
const TOGGLE_CLASSNAME =
  "inline-flex min-h-11 items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-brandBlue transition hover:text-brandInk";

function fieldErrorMessage(error: BillingFieldError | undefined): string | null {
  if (!error) return null;
  if (error === "required") return "This field is required.";
  if (error === "tooShort") return "This is too short.";
  return "Check this value.";
}

export function BillingStep({
  accountEmail,
  countries,
  onAddressReady,
  onLoaded
}: {
  accountEmail: string | null;
  countries: CountryOption[];
  /** Fires once a complete address is on file — right after load if one was already saved, or after a manual save. */
  onAddressReady: (address: BillingAddress) => void;
  /** Fires once the saved-address lookup settles (found, empty or failed), i.e. when this step reaches its real height. */
  onLoaded?: () => void;
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
  // Starts true (form visible) so nothing flashes before the load below
  // resolves; flips to false only once a genuinely complete saved address is
  // confirmed, so a first-time buyer or an incomplete address always lands on
  // the editable form instead of an empty summary.
  const [editing, setEditing] = useState(true);
  // The last confirmed (loaded or saved) address, so "Change address" can be
  // collapsed back without discarding the on-file address if the buyer edited
  // fields but didn't save.
  const [savedAddress, setSavedAddress] = useState<BillingAddress | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/bff/user/billing-address");
        const payload = (await response.json()) as { data?: { billingAddress: BillingAddress | null } };
        if (cancelled) return;
        if (response.ok && payload.data?.billingAddress) {
          const loaded = {
            ...payload.data.billingAddress,
            email: payload.data.billingAddress.email || accountEmail || ""
          };
          setAddress(loaded);
          const normalized = normalizeBillingAddress(loaded);
          const complete = !hasBillingErrors(validateBillingAddress(normalized));
          setEditing(!complete);
          if (complete) {
            setSavedAddress(normalized);
            onAddressReady(normalized);
          }
        }
      } catch {
        if (!cancelled) setLoadError("We could not load your saved billing details.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          onLoaded?.();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // onAddressReady/onLoaded are setState-backed callbacks from the parent, stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const save = useCallback(async () => {
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
      setAddress(normalized);
      setSavedAddress(normalized);
      setEditing(false);
      onAddressReady(normalized);
    } catch {
      setSaveError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [accountEmail, address, onAddressReady]);

  const collapse = useCallback(() => {
    if (savedAddress) setAddress(savedAddress);
    setErrors({});
    setSaveError(null);
    setEditing(false);
  }, [savedAddress]);

  if (loading) {
    return <p className="mt-6 text-sm text-onSurfaceVariant">Loading your billing details…</p>;
  }

  function renderField(key: keyof BillingAddress) {
    const field = FIELD_BY_KEY[key];
    return (
      <label className={FIELD_LABEL_CLASSES}>
        {field.label}
        {key === "countryCode" ? (
          <select
            autoComplete={field.autoComplete}
            className={FIELD_INPUT_CLASSES}
            onChange={(event) => update("countryCode")(event.target.value)}
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
            className={FIELD_INPUT_CLASSES}
            onChange={(event) => update(key)(event.target.value)}
            value={address[key]}
          />
        )}
        {errors[key] ? (
          <span className={FIELD_ERROR_CLASSES}>
            {fieldErrorMessage(errors[key])}
          </span>
        ) : null}
      </label>
    );
  }

  const countryName = countries.find((option) => option.code === address.countryCode)?.name ?? address.countryCode;

  return (
    <div className="space-y-4">
      {loadError ? <p className="text-sm text-error">{loadError}</p> : null}

      {editing ? (
        <>
          {savedAddress ? (
            <button
              className={TOGGLE_CLASSNAME}
              onClick={collapse}
              type="button"
            >
              Change address
              <span aria-hidden="true" className="text-[10px]">
                ▲
              </span>
            </button>
          ) : null}

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

          {saveError ? <p className="text-sm font-semibold text-error">{saveError}</p> : null}
          {/* Flat: Pay is the page's one gradient primary, and it can show at the same time. */}
          <Button className="w-full" disabled={saving} onClick={() => void save()} size="lg" type="button" variant="flat">
            {saving ? "Saving…" : "Save address"}
          </Button>
        </>
      ) : (
        <div className="rounded-[16px] border border-outline/70 bg-surfaceBright p-4">
          <p className="text-sm font-bold text-brandInk">{address.holdersName}</p>
          <p className="mt-1 text-sm text-onSurfaceVariant">{address.address1}</p>
          <p className="text-sm text-onSurfaceVariant">
            {address.locality}, {address.administrativeArea} {address.postalCode}
          </p>
          <p className="text-sm text-onSurfaceVariant">{countryName}</p>
          <p className="mt-1 text-sm text-onSurfaceVariant">{address.phoneNumber}</p>
          <button
            className={`mt-1 ${TOGGLE_CLASSNAME}`}
            onClick={() => setEditing(true)}
            type="button"
          >
            Change address
            <span aria-hidden="true" className="text-[10px]">
              ▼
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
