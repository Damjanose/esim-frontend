import { History } from "lucide-react";

// Mirrors `PartnerPayoutSummary` in
// `E-SIM backend/src/services/partner.service.ts`'s `listPartnerPayouts` —
// the destination PayPal address is deliberately omitted there (redundant
// on every row), so it's not expected here either.
export type PartnerPayoutSummary = {
  id: string;
  amountCents: number;
  status: string;
  requestedAt: string;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

export function PayoutHistory({
  payouts,
  loadError
}: {
  payouts: PartnerPayoutSummary[];
  loadError: string | null;
}) {
  return (
    <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <History aria-hidden="true" className="text-brandBlue" size={20} />
        Payout history
      </h2>

      {loadError ? (
        <p className="mt-4 text-sm text-amber-700">We couldn&apos;t load your payout history.</p>
      ) : payouts.length === 0 ? (
        <p className="mt-4 text-sm text-onSurfaceVariant">
          No withdrawals yet — they&apos;ll show up here once you request one.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-[11px] font-black uppercase tracking-[0.1em] text-onSurfaceVariant">
                <th className="pb-3 pr-4 font-black">Requested</th>
                <th className="pb-3 pr-4 font-black">Amount</th>
                <th className="pb-3 pr-4 font-black">Status</th>
                <th className="pb-3 font-black">Detail</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr className="border-t border-outline/70" key={payout.id}>
                  <td className="py-3 pr-4 text-onSurfaceVariant">{formatDate(payout.requestedAt)}</td>
                  <td className="py-3 pr-4 font-semibold text-brandInk">
                    {formatMoney(payout.amountCents)}
                  </td>
                  <td className="py-3 pr-4 text-brandInk">{payout.status}</td>
                  <td className="py-3 text-onSurfaceVariant">
                    {payout.status === "Paid" && payout.paidAt
                      ? `Paid ${formatDate(payout.paidAt)}`
                      : payout.status === "Failed" && payout.failedAt
                        ? `Failed ${formatDate(payout.failedAt)}${
                            payout.failureReason ? ` — ${payout.failureReason}` : ""
                          }`
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
