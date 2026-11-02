import Link from "next/link";
import { Clock3, LifeBuoy } from "lucide-react";
import { describePackage } from "@/lib/accountEsims";
import type { PendingPayment } from "@/lib/pendingPayments";
import type { HeroPackageOption } from "@/services/packages";

/** Paid-but-not-yet-provisioned payments, shown above the eSIM list. */
export function PendingPaymentCards({
  pending,
  catalog
}: {
  pending: PendingPayment[];
  catalog: ReadonlyMap<string, HeroPackageOption>;
}) {
  if (pending.length === 0) return null;

  return (
    <ul className="mt-8 space-y-3">
      {pending.map((entry) => {
        const plan = entry.packageId ? describePackage(entry.packageId, catalog) : null;
        const known = entry.packageId ? catalog.has(entry.packageId) : false;
        const needsSupport = entry.state === "needs_support";
        return (
          <li
            className="flex items-start gap-4 rounded-[18px] border border-brandBlue/30 bg-brandBlue/10 px-5 py-4"
            key={entry.paymentReference}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
              {needsSupport ? <LifeBuoy aria-hidden="true" size={20} /> : <Clock3 aria-hidden="true" size={20} />}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-brandInk">
                {needsSupport
                  ? "We're checking your payment — our team will complete it"
                  : entry.kind === "topup"
                    ? "Payment received — adding your data"
                    : "Payment received — setting up your eSIM"}
              </p>
              {plan && known ? (
                <p className="mt-0.5 text-sm text-onSurfaceVariant">
                  {plan.title} · {plan.details}
                </p>
              ) : null}
              <p className="mt-0.5 text-xs text-onSurfaceVariant">
                Payment reference: <span className="break-all font-mono font-bold">{entry.paymentReference}</span>
              </p>
              {needsSupport ? (
                <Link className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-brandBlue hover:underline" href="/support">
                  Contact support
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
