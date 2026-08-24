"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/app/components/Button";

/**
 * Two-step by design: deletion is irreversible and the confirm step spells out
 * what is removed and what is kept.
 */
export function DeleteAccountCard() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/bff/user/account", { method: "DELETE" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setBusy(false);
        setError(
          payload.error ?? "We could not delete your account. Check your connection and try again."
        );
        return;
      }

      // The route handler has cleared the session cookies, so a full navigation
      // starts from a clean, signed-out state.
      window.location.assign("/profile/deleted");
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <div className="mt-3 rounded-[18px] border border-error/30 bg-error/5 p-6">
      <h3 className="flex items-center gap-2.5 font-display text-lg font-black text-error">
        <Trash2 aria-hidden="true" size={19} />
        Delete account
      </h3>

      {confirming ? (
        <>
          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
            This removes your eSim2you account and the account data we store. Purchased
            eSIM service records may be retained where required for payment, fraud
            prevention, tax, or provider obligations. Any eSIM you have already installed
            keeps working until its data runs out.
          </p>

          {error ? (
            <p className="mt-4 text-sm font-semibold text-error">{error}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void deleteAccount()} tone="danger" type="button" variant="flat">
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              {busy ? "Deleting…" : "Yes, delete my account"}
            </Button>

            <Button
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              tone="brand"
              type="button"
              variant="flat"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
            Permanently remove your account and its data. This cannot be undone.
          </p>

          <Button className="mt-5" onClick={() => setConfirming(true)} tone="danger" type="button" variant="flat">
            Delete account
          </Button>
        </>
      )}
    </div>
  );
}
