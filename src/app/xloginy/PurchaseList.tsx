import { Fragment } from "react";
import { ChevronDown, ChevronUp, Globe2, RefreshCw } from "lucide-react";
import { Button } from "../components/Button";
import { EmptyState, TablePagination } from "./DashboardFinances";
import {
  formatData,
  formatDate,
  formatMoney,
  providerSummary,
  simStatus,
  type Dashboard,
  type ProviderSim,
  type ProviderState,
  type Purchase,
} from "./dashboard-model";

const tones = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
};
function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {label}
    </span>
  );
}
function RemainingData({ sim }: { sim?: ProviderSim }) {
  if (!sim) return <span className="text-onSurfaceVariant">—</span>;
  const known =
    sim.remainingMb != null &&
    sim.totalMb != null &&
    sim.totalMb > 0 &&
    Number.isFinite(sim.remainingMb) &&
    Number.isFinite(sim.totalMb);
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums text-brandInk">
        {formatData(sim.remainingMb, sim.isUnlimited)}
      </p>
      {!sim.isUnlimited && known ? (
        <>
          <p className="mt-0.5 text-xs text-onSurfaceVariant">
            of {formatData(sim.totalMb, false)} left
          </p>
          <meter
            aria-label="Data remaining"
            className="mt-1 h-1.5 w-full max-w-28 accent-brandBlue"
            min={0}
            max={sim.totalMb!}
            value={Math.max(0, Math.min(sim.totalMb!, sim.remainingMb!))}
          />
        </>
      ) : null}
    </div>
  );
}
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-onSurfaceVariant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-brandInk">
        {value}
      </dd>
    </div>
  );
}
export function PurchaseDetails({
  purchase,
  provider,
  retry,
}: {
  purchase: Purchase;
  provider?: ProviderState;
  retry: () => void;
}) {
  return (
    <div className="border-t border-outline bg-surfaceBright/70 p-5 lg:px-7">
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailField label="Customer" value={purchase.userEmail} />
        <DetailField
          label="Package"
          value={purchase.packageTitle || purchase.packageId}
        />
        <DetailField label="Package ID" value={purchase.packageId} />
        <DetailField label="Order ID" value={purchase.id} />
        <DetailField label="Airalo order" value={String(purchase.airaloId)} />
        <DetailField
          label="Payment status"
          value={purchase.paymentStatus?.replaceAll("_", " ") ?? "Unavailable"}
        />
        <DetailField
          label="Est. Airalo cost"
          value={formatMoney(purchase.costCents, purchase.costCurrency)}
        />
        <DetailField
          label="Network"
          value={purchase.network || "Unavailable"}
        />
        <DetailField
          label="Purchased (UTC)"
          value={formatDate(purchase.providerCreatedAt)}
        />
      </dl>
      <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brandInk">
            Airalo package details
          </h3>
          <p className="mt-1 text-xs text-onSurfaceVariant">
            {provider?.data
              ? `Checked ${formatDate(provider.data.checkedAt)} UTC. Airalo usage can lag by 20 minutes.`
              : "Checking the package with Airalo…"}
          </p>
        </div>
        <Button
          variant="tint"
          size="sm"
          loading={provider?.loading}
          onClick={retry}
        >
          <RefreshCw aria-hidden="true" size={13} />
          Check again
        </Button>
      </div>
      {provider?.error ? (
        <p role="alert" className="mb-3 text-sm text-amber-800">
          {provider.error}
          {provider.data
            ? " Showing the last successful check."
            : " Try checking again."}
        </p>
      ) : null}
      {provider?.data?.sims.length ? (
        <div className="grid gap-3">
          {provider.data.sims.map((sim) => (
            <div
              key={sim.iccid}
              className="rounded-xl border border-outline bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="break-all font-mono text-xs text-onSurfaceVariant">
                  ICCID {sim.iccid}
                </p>
                <StatusBadge
                  {...(sim.status
                    ? simStatus(sim.status)
                    : { label: "Unavailable", tone: "amber" as const })}
                />
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <dt className="mb-1 text-xs text-onSurfaceVariant">
                    Data remaining
                  </dt>
                  <dd>
                    <RemainingData sim={sim} />
                  </dd>
                </div>
                <DetailField
                  label="Activated (UTC)"
                  value={formatDate(sim.activatedAt)}
                />
                <DetailField
                  label="Expires (UTC)"
                  value={formatDate(sim.expiresAt)}
                />
                <DetailField
                  label="Minutes remaining"
                  value={
                    sim.remainingVoice != null
                      ? `${sim.remainingVoice}${sim.totalVoice != null ? ` of ${sim.totalVoice}` : ""}`
                      : "Unavailable"
                  }
                />
                <DetailField
                  label="SMS remaining"
                  value={
                    sim.remainingText != null
                      ? `${sim.remainingText}${sim.totalText != null ? ` of ${sim.totalText}` : ""}`
                      : "Unavailable"
                  }
                />
              </dl>
              {sim.error ? (
                <p className="mt-3 text-xs text-amber-800">{sim.error}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : provider?.data ? (
        <p className="text-sm text-onSurfaceVariant">
          No ICCID available for this order.
        </p>
      ) : null}
      <p className="mt-4 text-xs text-onSurfaceVariant">
        Package activation is reported by Airalo. It does not confirm whether
        the eSIM profile is installed on a phone.
      </p>
    </div>
  );
}

export function PurchaseList({
  dashboard,
  providers,
  expanded,
  onExpand,
  onRetry,
  loading,
  onPageChange,
}: {
  dashboard: Dashboard;
  providers: Record<string, ProviderState>;
  expanded: string | null;
  onExpand: (id: string) => void;
  onRetry: (id: string) => void;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <section
      aria-label="Purchases"
      className="overflow-hidden rounded-2xl border border-outline bg-white"
    >
      <div className="border-b border-outline px-5 py-4">
        <h2 className="font-display text-lg font-bold text-brandInk">
          Customer packages{" "}
          <span className="ml-1 text-sm font-medium text-onSurfaceVariant">
            ({dashboard.purchasesPagination.total.toLocaleString()})
          </span>
        </h2>
        <p className="mt-1 text-xs text-onSurfaceVariant">
          Airalo status and remaining units load automatically. Open details for
          each eSIM.
        </p>
      </div>
      <div
        aria-hidden="true"
        className="hidden grid-cols-12 gap-4 border-b border-outline bg-surfaceBright px-5 py-3 text-xs font-medium text-onSurfaceVariant lg:grid"
      >
        <span className="col-span-3">Customer</span>
        <span className="col-span-3">Package</span>
        <span>Paid</span>
        <span className="col-span-2">Airalo status</span>
        <span className="col-span-2">Data left</span>
        <span />
      </div>
      {dashboard.purchases.length ? (
        <div className="divide-y divide-outline">
          {dashboard.purchases.map((purchase) => {
            const provider = providers[purchase.id];
            const sims = provider?.data?.sims ?? [];
            const open = expanded === purchase.id;
            const id = `purchase-${purchase.id}`;
            return (
              <Fragment key={purchase.id}>
                <article className="min-w-0">
                  <div className="grid min-w-0 grid-cols-2 gap-4 p-5 lg:grid-cols-12 lg:items-center">
                    <div className="col-span-2 min-w-0 lg:col-span-3">
                      <p className="break-all text-sm font-semibold text-brandInk">
                        {purchase.userEmail}
                      </p>
                      <p className="mt-1 text-xs text-onSurfaceVariant">
                        {formatDate(purchase.providerCreatedAt)}
                      </p>
                    </div>
                    <div className="col-span-2 min-w-0 lg:col-span-3">
                      <p className="flex items-start gap-1.5 text-sm font-semibold text-brandInk">
                        <Globe2
                          aria-hidden="true"
                          size={15}
                          className="mt-0.5 shrink-0 text-brandBlue"
                        />
                        {purchase.destination ||
                          purchase.packageTitle ||
                          purchase.packageId}
                      </p>
                      <p className="mt-1 break-words text-xs text-onSurfaceVariant">
                        {[
                          purchase.dataLabel,
                          purchase.durationDays
                            ? `${purchase.durationDays} days`
                            : null,
                          purchase.network,
                        ]
                          .filter(Boolean)
                          .join(" · ") || purchase.packageId}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-onSurfaceVariant lg:hidden">
                        Paid
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-brandInk">
                        {formatMoney(
                          purchase.paymentAmountCents,
                          purchase.paymentCurrency,
                        )}
                      </p>
                    </div>
                    <div className="lg:col-span-2">
                      <p className="mb-1 text-xs text-onSurfaceVariant lg:hidden">
                        Airalo status
                      </p>
                      <StatusBadge {...providerSummary(provider)} />
                      {provider?.data ? (
                        <p
                          className="mt-1 text-[11px] text-onSurfaceVariant"
                          title={`Checked ${formatDate(provider.data.checkedAt)} UTC`}
                        >
                          Checked{" "}
                          {new Date(provider.data.checkedAt).toLocaleTimeString(
                            "en-GB",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            },
                          )}{" "}
                          UTC
                        </p>
                      ) : null}
                      {provider?.error || sims.some((sim) => sim.error) ? (
                        <button
                          className="mt-1 block rounded text-xs font-semibold text-brandBlue underline"
                          type="button"
                          onClick={() => onRetry(purchase.id)}
                        >
                          Retry check
                        </button>
                      ) : null}
                    </div>
                    <div className="lg:col-span-2">
                      <p className="mb-1 text-xs text-onSurfaceVariant lg:hidden">
                        Data left
                      </p>
                      {sims.length > 1 ? (
                        <p className="text-sm text-onSurfaceVariant">
                          {sims.length} eSIMs · see details
                        </p>
                      ) : (
                        <RemainingData sim={sims[0]} />
                      )}
                    </div>
                    <div className="justify-self-end">
                      <Button
                        aria-controls={id}
                        aria-expanded={open}
                        aria-label={`${open ? "Hide" : "Show"} package details for ${purchase.userEmail}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onExpand(purchase.id)}
                      >
                        {open ? (
                          <ChevronUp aria-hidden="true" size={16} />
                        ) : (
                          <ChevronDown aria-hidden="true" size={16} />
                        )}
                        <span className="lg:sr-only">Details</span>
                      </Button>
                    </div>
                  </div>
                  {open ? (
                    <div id={id}>
                      <PurchaseDetails
                        purchase={purchase}
                        provider={provider}
                        retry={() => onRetry(purchase.id)}
                      />
                    </div>
                  ) : null}
                </article>
              </Fragment>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No matching purchases"
          description="Try another customer, package or month, or clear the filters."
        />
      )}
      <TablePagination
        pagination={dashboard.purchasesPagination}
        loading={loading}
        onPageChange={onPageChange}
      />
    </section>
  );
}
