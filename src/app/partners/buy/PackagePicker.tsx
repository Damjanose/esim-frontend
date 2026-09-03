"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/app/components/Button";
import { fetchPackageOptions, filterPackageOptions, type HeroPackageOption } from "@/services/packages";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100);
}

type PurchaseResult = {
  giftCode?: string;
  /**
   * `purchaseWithWallet` (`E-SIM backend/src/services/partnerWallet.service.ts`)
   * computes the partner-discounted price server-side and debits the wallet
   * for it, but the `POST /partners/me/purchase` response
   * (`{ order, giftCode }`) never echoes that amount back — `order` comes
   * from `saveOrderForUser(userEmail, providerOrder)` called with no
   * `payment` argument, so `payment_amount_cents` is never set on it either.
   * The only way to show what was actually charged is to diff the wallet
   * balance we already had against a fresh read after the purchase.
   */
  chargedCents: number | null;
  newWalletBalanceCents: number;
};

/**
 * Package picker for "Partner Buy": search the same public catalog used by
 * `/destinations`, pick a package, choose self vs. gift, and purchase at the
 * partner-discounted price from the wallet. There is no per-package field
 * exposing the partner discount to a non-admin caller, so only the retail
 * price is ever shown before purchase — the actual price is only known from
 * a successful purchase's wallet-balance delta (see `PurchaseResult` above).
 */
export function PackagePicker({ walletBalanceCents }: { walletBalanceCents: number }) {
  const [options, setOptions] = useState<HeroPackageOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HeroPackageOption | null>(null);
  const [sendAsGift, setSendAsGift] = useState(false);

  const [walletBalance, setWalletBalance] = useState(walletBalanceCents);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPackageOptions()
      .then((loaded) => {
        if (!cancelled) setOptions(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError("We could not load packages. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!options) return [];
    return filterPackageOptions(options, query, 20);
  }, [options, query]);

  async function purchase() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/bff/partners/me/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected.id, sendAsGift })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { giftCode?: string };
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent("/partners/buy")}`);
        return;
      }

      if (!response.ok) {
        setBusy(false);
        setError(payload.error ?? "We could not complete the purchase. Please try again.");
        return;
      }

      // Read the balance back to learn what was actually charged — see
      // PurchaseResult's doc comment above.
      const balanceBefore = walletBalance;
      let newWalletBalanceCents = balanceBefore;
      try {
        const meResponse = await fetch("/bff/partners/me", { cache: "no-store" });
        const mePayload = (await meResponse.json().catch(() => ({}))) as {
          data?: { walletBalanceCents?: number };
        };
        if (meResponse.ok && typeof mePayload.data?.walletBalanceCents === "number") {
          newWalletBalanceCents = mePayload.data.walletBalanceCents;
        }
      } catch {
        // Best-effort — the purchase itself already succeeded.
      }

      setWalletBalance(newWalletBalanceCents);
      setBusy(false);
      setResult({
        giftCode: payload.data?.giftCode,
        chargedCents:
          newWalletBalanceCents === balanceBefore ? null : balanceBefore - newWalletBalanceCents,
        newWalletBalanceCents
      });
      setSelected(null);
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-onSurfaceVariant">
          Wallet balance
        </p>
        <p className="mt-1 font-display text-2xl font-black tracking-[-0.03em] text-brandInk">
          {formatMoney(walletBalance)}
        </p>
        <p className="mt-3 text-xs text-onSurfaceVariant">
          Prices below are retail — your partner discount is applied automatically when you
          purchase, and the amount actually charged is shown afterward.
        </p>
      </div>

      <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant"
            size={16}
          />
          <input
            className="h-12 w-full rounded-[12px] border border-outline bg-mist pl-11 pr-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a destination or package"
            value={query}
          />
        </label>

        {loadError ? <p className="mt-4 text-sm font-semibold text-error">{loadError}</p> : null}

        {!options && !loadError ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-onSurfaceVariant">
            <Loader2 className="animate-spin" size={16} />
            Loading packages…
          </div>
        ) : null}

        {options ? (
          <ul className="mt-5 max-h-[420px] space-y-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="py-6 text-center text-sm text-onSurfaceVariant">
                No packages match &quot;{query}&quot;.
              </li>
            ) : (
              filtered.map((option) => {
                const isSelected = selected?.id === option.id;
                return (
                  <li key={option.id}>
                    <button
                      className={`flex w-full items-center justify-between gap-4 rounded-[14px] border px-5 py-4 text-left transition ${
                        isSelected
                          ? "border-brandBlue bg-mist"
                          : "border-outline bg-white hover:border-brandBlue/60"
                      }`}
                      onClick={() => {
                        setSelected(option);
                        setResult(null);
                        setError(null);
                      }}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-base font-black text-brandInk">
                          {option.country}
                        </span>
                        <span className="mt-0.5 block text-xs text-onSurfaceVariant">
                          {option.title} · {option.dataLabel} · {option.durationLabel}
                        </span>
                      </span>
                      <span className="shrink-0 font-black text-brandBlue">{option.price}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>

      {selected ? (
        <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
          <p className="font-display text-lg font-black text-brandInk">{selected.country}</p>
          <p className="mt-1 text-sm text-onSurfaceVariant">
            {selected.title} · {selected.dataLabel} · {selected.durationLabel} ·{" "}
            <span className="font-bold text-brandInk">{selected.price}</span> retail
          </p>

          <div className="mt-5 flex gap-2.5">
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-3 text-sm font-black transition ${
                !sendAsGift
                  ? "border-brandBlue bg-mist text-brandInk"
                  : "border-outline text-onSurfaceVariant"
              }`}
              onClick={() => setSendAsGift(false)}
              type="button"
            >
              <User size={16} />
              Use for myself
            </button>
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-3 text-sm font-black transition ${
                sendAsGift
                  ? "border-brandBlue bg-mist text-brandInk"
                  : "border-outline text-onSurfaceVariant"
              }`}
              onClick={() => setSendAsGift(true)}
              type="button"
            >
              <Gift size={16} />
              Send as gift
            </button>
          </div>

          {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}

          <div className="mt-5">
            <Button disabled={busy} onClick={() => void purchase()} type="button">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
              {busy ? "Purchasing…" : "Buy with wallet"}
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-[20px] border border-brandTeal/40 bg-white p-6 shadow-brandCard sm:p-8">
          <p className="font-display text-lg font-black text-brandInk">Purchase complete</p>
          <p className="mt-2 text-sm text-onSurfaceVariant">
            Your new wallet balance is{" "}
            <span className="font-bold text-brandInk">{formatMoney(result.newWalletBalanceCents)}</span>
            .{" "}
            {result.chargedCents !== null
              ? `Wallet balance change: −${formatMoney(result.chargedCents)} (may include other wallet activity around the same time, not only this purchase).`
              : "Your wallet balance did not change, or the change could not be confirmed."}
          </p>
          {result.giftCode ? (
            <p className="mt-3 text-sm text-onSurfaceVariant">
              Gift code: <span className="font-mono font-bold text-brandInk">{result.giftCode}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
