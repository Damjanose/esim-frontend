"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileWarning, Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";

/**
 * Shown when a partner's status is `VerificationRequired` (set after their
 * first withdrawal request while unverified — see
 * `attemptDrain`/`AwaitingVerification` in
 * `E-SIM backend/src/services/partnerPayout.service.ts`). The backend's
 * `/partners/me/verification` route (`E-SIM backend/src/routes/partners.ts`)
 * deliberately has no fixed shape for v1 — admin reviews it manually — so
 * this form is a single free-text field rather than a structured KYC form;
 * the only client-side check mirrored from the BFF route
 * (`src/app/bff/partners/me/verification/route.ts`) is "non-empty".
 */
export function VerificationForm() {
  const router = useRouter();
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/bff/partners/me/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: details.trim() })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/withdraw")}`);
        return;
      }

      setBusy(false);

      if (!response.ok) {
        setError(payload.error ?? "We could not submit your verification info. Please try again.");
        return;
      }

      setSuccess(true);
      setDetails("");
      router.refresh();
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <div className="rounded-[20px] border border-amber-600/30 bg-amber-50 p-6 sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <FileWarning aria-hidden="true" className="text-amber-600" size={20} />
        Verification needed
      </h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">
        Before your parked withdrawal can be paid out, tell us a bit more about your business —
        e.g. your legal/business name, address, and how customers find your promo code. An admin
        reviews this manually.
      </p>

      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
          Verification details
          <textarea
            className="mt-2 min-h-[120px] w-full rounded-[12px] border border-outline bg-white px-4 py-3 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
            onChange={(event) => {
              setSuccess(false);
              setDetails(event.target.value);
            }}
            required
            value={details}
          />
        </label>

        {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
        {success ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-brandTeal">
            <Check size={16} />
            Submitted — we&apos;ll review it shortly.
          </span>
        ) : null}

        <Button disabled={busy || !details.trim()} type="submit">
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          Submit for review
        </Button>
      </form>
    </div>
  );
}
