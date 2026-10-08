"use client";

import { useRef, useState } from "react";
import { Button } from "@/app/components/Button";

/**
 * Trigger is a flat danger button at the end of the settings list (never solid
 * red, never the page's gradient), so the destructive action never visually
 * competes with the rest of the page. The confirm flow itself lives in a native
 * <dialog> — deletion is irreversible and the confirm step spells out what
 * is removed and what is kept.
 */
export function DeleteAccountCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setConfirming(false);
    setError(null);
  }

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
    <>
      <div className="flex flex-col gap-2 px-1 lg:flex-row lg:items-center lg:gap-4">
        <p className="text-xs text-onSurfaceVariant">Want to leave?</p>
        <Button className="w-full lg:w-auto" onClick={openDialog} tone="danger" type="button" variant="tint">
          Delete account
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        onClose={() => {
          setConfirming(false);
          setError(null);
        }}
        className="m-auto w-[min(420px,calc(100vw-2.5rem))] rounded-[18px] border border-outline p-0 backdrop:bg-brandInk/40"
      >
        <div className="p-6">
          <h3 className="font-display text-lg font-black text-error">Delete account</h3>

          {confirming ? (
            <>
              <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
                This removes your eSIM2you account and the account data we store. Purchased
                eSIM service records may be retained where required for payment, fraud
                prevention, tax, or provider obligations. Any eSIM you have already installed
                keeps working until its data runs out.
              </p>

              {error ? (
                <p className="mt-4 text-sm font-semibold text-error">{error}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {/* The final destructive confirm is the only red lit button (matches mobile). */}
                <Button loading={busy} onClick={() => void deleteAccount()} tone="danger" type="button">
                  Yes, delete my account
                </Button>

                <Button
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  tone="brand"
                  type="button"
                  variant="tint"
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

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setConfirming(true)} tone="danger" type="button" variant="tint">
                  Delete account
                </Button>
                <Button onClick={closeDialog} tone="brand" type="button" variant="tint">
                  Never mind
                </Button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
