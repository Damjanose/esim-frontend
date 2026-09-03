"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";

// Mirrors MINIMUM_WITHDRAWAL_CENTS in
// `E-SIM backend/src/services/partnerPayout.service.ts` — kept as a client-side
// guard only (to disable the button before a round trip), the backend still
// owns and enforces the real rule via `BelowMinimumWithdrawalError`.
const MINIMUM_WITHDRAWAL_CENTS = 5000;

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Withdrawal always claims the partner's ENTIRE `commissionBalanceCents` —
 * `requestWithdrawal` (`E-SIM backend/src/services/partnerPayout.service.ts`)
 * takes no amount parameter, partners don't do partial cash-outs. So this
 * form only collects the PayPal email; the amount is shown read-only.
 */
export function WithdrawForm({ commissionBalanceCents }: { commissionBalanceCents: number }) {
  const router = useRouter();
  const [payoutEmail, setPayoutEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const belowMinimum = commissionBalanceCents < MINIMUM_WITHDRAWAL_CENTS;

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (
      !window.confirm(
        `Withdraw your full balance of ${formatMoney(commissionBalanceCents)} to ${payoutEmail}?`
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/bff/partners/me/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutEmail })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/withdraw")}`);
        return;
      }

      setBusy(false);

      if (!response.ok) {
        setError(payload.error ?? "We could not request the withdrawal. Please try again.");
        return;
      }

      setSuccess(true);
      // Balance and, potentially, status (VerificationRequired) both change
      // server-side on a successful withdrawal request — refresh so the
      // page above reflects them.
      router.refresh();
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <Banknote aria-hidden="true" className="text-brandBlue" size={20} />
        Withdraw
      </h2>

      <p className="mt-2 text-sm text-onSurfaceVariant">Available to withdraw</p>
      <p className="mt-1 font-display text-2xl font-black tracking-[-0.03em] text-brandInk">
        {formatMoney(commissionBalanceCents)}
      </p>

      {belowMinimum ? (
        <p className="mt-3 text-sm text-onSurfaceVariant">
          Withdrawals require a minimum of {formatMoney(MINIMUM_WITHDRAWAL_CENTS)} — keep earning
          commission and check back once you&apos;re above that.
        </p>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
            PayPal email
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
              onChange={(event) => {
                setSuccess(false);
                setPayoutEmail(event.target.value);
              }}
              required
              type="email"
              value={payoutEmail}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
          {success ? (
            <p className="text-sm font-semibold text-brandTeal">
              Withdrawal requested — it will show up in your history below.
            </p>
          ) : null}

          <Button disabled={busy || !payoutEmail} type="submit">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Request withdrawal
          </Button>
        </form>
      )}
    </div>
  );
}
