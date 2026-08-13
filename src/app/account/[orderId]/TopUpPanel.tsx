"use client";

import { useState } from "react";
import { CreditCard, Loader2, Plus } from "lucide-react";

export type TopupPackage = {
  id: string;
  title?: string;
  priceDisplay?: string;
  /** Data allowance in MB. */
  amount?: number;
  /** Validity in days. */
  day?: number;
  is_unlimited?: boolean;
};

function describeAllowance(pkg: TopupPackage): string {
  if (pkg.is_unlimited) return "Unlimited data";
  if (typeof pkg.amount !== "number") return "Data top-up";
  return pkg.amount >= 1024 ? `${(pkg.amount / 1024).toFixed(0)} GB` : `${pkg.amount} MB`;
}

export function TopUpPanel({
  orderId,
  packages
}: {
  orderId: number;
  packages: TopupPackage[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startTopup(packageId: string) {
    setPendingId(packageId);
    setError(null);

    try {
      const response = await fetch("/api/payments/topups/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, package_id: packageId })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { checkoutUrl?: string };
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(`/account/${orderId}`)}`);
        return;
      }

      if (!response.ok || !payload.data?.checkoutUrl) {
        setPendingId(null);
        setError(payload.error ?? "We could not start the top-up. Please try again.");
        return;
      }

      // Full-page navigation: popups are unreliable in mobile and in-app browsers.
      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setPendingId(null);
      setError("We could not reach the payment service. Please try again.");
    }
  }

  return (
    <div className="mt-5 rounded-[20px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-6 sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black">
        <Plus aria-hidden="true" className="text-[#58baff]" size={20} />
        Add more data
      </h2>
      <p className="mt-2 text-sm text-[#8ea3ba]">
        Top up this eSIM without installing a new one.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {packages.map((pkg) => {
          const busy = pendingId === pkg.id;

          return (
            <li key={pkg.id}>
              <button
                className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#214867] bg-[#061427]/85 px-5 py-4 text-left transition hover:border-[#168cff]/75 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pendingId !== null}
                onClick={() => void startTopup(pkg.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block font-display text-base font-black text-white">
                    {describeAllowance(pkg)}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#8ea3ba]">
                    {pkg.title ?? pkg.id}
                    {typeof pkg.day === "number" ? ` · ${pkg.day} days` : ""}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2 text-sm font-black text-[#42b1ff]">
                  {busy ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  ) : (
                    <CreditCard aria-hidden="true" size={16} />
                  )}
                  {pkg.priceDisplay ?? "Top up"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-4 text-sm font-semibold text-[#ff8792]">{error}</p> : null}

      <p className="mt-4 text-xs text-[#748aa2]">
        You will be redirected to Pokpay to complete your payment securely.
      </p>
    </div>
  );
}
