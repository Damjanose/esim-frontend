"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

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
      const response = await fetch("/api/user/account", { method: "DELETE" });

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
    <div className="mt-3 rounded-[18px] border border-[#7a1c2c]/70 bg-[#1b0710] p-6">
      <h3 className="flex items-center gap-2.5 font-display text-lg font-black text-[#ff8792]">
        <Trash2 aria-hidden="true" size={19} />
        Delete account
      </h3>

      {confirming ? (
        <>
          <p className="mt-3 text-sm leading-6 text-[#e0b6bd]">
            This removes your eSim2you account and the account data we store. Purchased
            eSIM service records may be retained where required for payment, fraud
            prevention, tax, or provider obligations. Any eSIM you have already installed
            keeps working until its data runs out.
          </p>

          {error ? (
            <p className="mt-4 text-sm font-semibold text-[#ff8792]">{error}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#c2283c] px-6 text-sm font-black text-white transition hover:bg-[#d93951] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => void deleteAccount()}
              type="button"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              {busy ? "Deleting…" : "Yes, delete my account"}
            </button>

            <button
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#214867] px-6 text-sm font-black text-[#8ea3ba] transition hover:text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-[#c99aa3]">
            Permanently remove your account and its data. This cannot be undone.
          </p>

          <button
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[12px] border border-[#7a1c2c] px-6 text-sm font-black text-[#ff8792] transition hover:bg-[#c2283c] hover:text-white"
            onClick={() => setConfirming(true)}
            type="button"
          >
            Delete account
          </button>
        </>
      )}
    </div>
  );
}
