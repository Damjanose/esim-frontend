"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Loader2, Wallet } from "lucide-react";
import { Button, LinkButton } from "@/app/components/Button";

const TOPUP_AMOUNTS_EUR = [25, 50, 100, 250];

/**
 * Wallet actions attached to the partner dashboard: top up the wallet via
 * Pokpay (reusing the same intent -> redirect pattern as
 * `checkout/PayButton.tsx` and `account/[orderId]/TopUpPanel.tsx`, just
 * against the partner-specific `/bff/partners/me/wallet/topup` route), and
 * move already-earned commission into the wallet
 * (`/bff/partners/me/wallet/transfer`). Buying with the wallet and
 * withdrawing it both live on their own pages (`/partners/buy`,
 * `/partners/withdraw`) — this panel only starts money moving into the
 * wallet, then links onward.
 */
export function WalletPanel() {
  const router = useRouter();

  const [topupPending, setTopupPending] = useState<number | "custom" | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const [transferAmount, setTransferAmount] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Top-up and transfer both move money out of/into the wallet — while
  // either is in flight, every action button in the panel (both groups)
  // must be disabled so a user can't fire a top-up and a transfer
  // concurrently. Each group still shows its own busy spinner.
  const anyActionPending = topupPending !== null || transferBusy;

  async function startTopup(amountCents: number, pendingKey: number | "custom") {
    setTopupPending(pendingKey);
    setTopupError(null);

    try {
      const response = await fetch("/bff/partners/me/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { checkoutUrl?: string };
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/dashboard")}`);
        return;
      }

      if (!response.ok || !payload.data?.checkoutUrl) {
        setTopupPending(null);
        setTopupError(payload.error ?? "We could not start the top-up. Please try again.");
        return;
      }

      // Full-page navigation: popups are unreliable in mobile and in-app browsers.
      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setTopupPending(null);
      setTopupError("We could not reach the payment service. Please try again.");
    }
  }

  function submitCustomTopup(event: FormEvent) {
    event.preventDefault();
    const eur = Number.parseFloat(customAmount.replace(",", "."));
    if (!Number.isFinite(eur) || eur <= 0) {
      setTopupError("Enter a valid amount.");
      return;
    }
    void startTopup(Math.round(eur * 100), "custom");
  }

  async function submitTransfer(event: FormEvent) {
    event.preventDefault();
    setTransferBusy(true);
    setTransferError(null);
    setTransferSuccess(false);

    const eur = Number.parseFloat(transferAmount.replace(",", "."));
    if (!Number.isFinite(eur) || eur <= 0) {
      setTransferBusy(false);
      setTransferError("Enter a valid amount.");
      return;
    }

    try {
      const response = await fetch("/bff/partners/me/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(eur * 100) })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/dashboard")}`);
        return;
      }

      setTransferBusy(false);

      if (!response.ok) {
        setTransferError(payload.error ?? "We could not transfer that amount. Please try again.");
        return;
      }

      setTransferSuccess(true);
      setTransferAmount("");
      // Balances shown in the dashboard's stat cards come from the server
      // component above this panel — refresh so they reflect the transfer.
      router.refresh();
    } catch {
      setTransferBusy(false);
      setTransferError("We could not reach the server. Please try again.");
    }
  }

  return (
    <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <Wallet aria-hidden="true" className="text-brandBlue" size={20} />
        Wallet
      </h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">
        Top up your wallet to buy packages at your partner price, or move earned commission into
        it.
      </p>

      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-onSurfaceVariant">
          Top up with Pokpay
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {TOPUP_AMOUNTS_EUR.map((eur) => {
            const busy = topupPending === eur;
            return (
              <Button
                disabled={anyActionPending}
                key={eur}
                onClick={() => void startTopup(eur * 100, eur)}
                size="sm"
                type="button"
                variant="flat"
              >
                {busy ? <Loader2 className="animate-spin" size={14} /> : <CreditCard size={14} />}
                €{eur}
              </Button>
            );
          })}
        </div>

        <form className="mt-3 flex items-center gap-2.5" onSubmit={submitCustomTopup}>
          <label className="sr-only" htmlFor="wallet-custom-topup">
            Custom amount (EUR)
          </label>
          <input
            className="h-10 w-32 rounded-[10px] border border-outline bg-mist px-3 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
            disabled={anyActionPending}
            id="wallet-custom-topup"
            inputMode="decimal"
            onChange={(event) => setCustomAmount(event.target.value)}
            placeholder="Custom €"
            value={customAmount}
          />
          <Button disabled={anyActionPending || !customAmount} size="sm" type="submit" variant="flat">
            {topupPending === "custom" ? <Loader2 className="animate-spin" size={14} /> : null}
            Top up
          </Button>
        </form>

        {topupError ? <p className="mt-3 text-sm font-semibold text-error">{topupError}</p> : null}

        <p className="mt-3 text-xs text-onSurfaceVariant">
          You will be redirected to Pokpay to complete your payment securely.
        </p>
      </div>

      <div className="mt-7 border-t border-outline/70 pt-6">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-onSurfaceVariant">
          Transfer commission to wallet
        </p>

        <form className="mt-3 flex items-center gap-2.5" onSubmit={submitTransfer}>
          <label className="sr-only" htmlFor="wallet-transfer-amount">
            Amount to transfer (EUR)
          </label>
          <input
            className="h-10 w-32 rounded-[10px] border border-outline bg-mist px-3 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
            disabled={anyActionPending}
            id="wallet-transfer-amount"
            inputMode="decimal"
            onChange={(event) => {
              setTransferSuccess(false);
              setTransferAmount(event.target.value);
            }}
            placeholder="Amount €"
            value={transferAmount}
          />
          <Button disabled={anyActionPending || !transferAmount} size="sm" type="submit" variant="flat">
            {transferBusy ? <Loader2 className="animate-spin" size={14} /> : null}
            Transfer
          </Button>
        </form>

        {transferError ? <p className="mt-3 text-sm font-semibold text-error">{transferError}</p> : null}
        {transferSuccess ? (
          <p className="mt-3 text-sm font-semibold text-brandTeal">Transferred to your wallet.</p>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap gap-3 border-t border-outline/70 pt-6">
        <LinkButton href="/partners/buy" size="sm" variant="flat">
          Buy with wallet
          <ArrowRight size={14} />
        </LinkButton>
        <LinkButton href="/partners/withdraw" size="sm" variant="flat">
          Withdraw commission
          <ArrowRight size={14} />
        </LinkButton>
      </div>
    </div>
  );
}
