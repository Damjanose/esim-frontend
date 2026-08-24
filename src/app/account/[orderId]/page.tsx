import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Info,
  QrCode,
  Smartphone,
  WifiOff
} from "lucide-react";
import {
  formatMegabytes,
  resolveQrSource,
  summariseUsage,
  type UsagePayload
} from "@/lib/esim-install";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { CopyField } from "./CopyField";
import { TopUpPanel, type TopupPackage } from "./TopUpPanel";

export const metadata: Metadata = createMetadata({
  path: "/account",
  title: "eSIM details | eSim2you",
  description: "Install your eSIM and track your remaining data.",
  indexable: false
});

type Sim = {
  iccid: string;
  qrcode: string;
  direct_apple_installation_url: string | null;
};

type Order = {
  id: number;
  code: string;
  status: string;
  lifecycle_status: "ready" | "active" | "expired";
  package_id: string;
  created_at: string;
  expires_at: string | null;
  sims: Sim[];
};

type Instructions = {
  available?: boolean;
  reason?: string;
  [key: string]: unknown;
};

/** Every field is optional upstream, so each one is rendered defensively. */
type PackageHistoryEntry = {
  id?: string;
  package_id?: string;
  status?: string;
  remaining?: number;
  total?: number;
  is_unlimited?: boolean;
};

/**
 * The backend answers 200 with `available: false` and an explanation when the
 * provider has nothing to sell or the eSIM is not provisioned yet.
 */
type Topups = {
  available?: boolean;
  packages?: TopupPackage[];
  reason?: string;
  message?: string;
};

function describeAllowance(entry: PackageHistoryEntry): string {
  if (entry.is_unlimited) return "Unlimited";
  if (typeof entry.total !== "number") return "—";
  if (typeof entry.remaining !== "number") return formatMegabytes(entry.total);
  return `${formatMegabytes(entry.remaining)} of ${formatMegabytes(entry.total)} left`;
}

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ new?: string; topup?: string }>;
}) {
  const { orderId } = await params;
  const { new: isNew, topup: isToppedUp } = await searchParams;
  const basePath = `/account/${orderId}`;

  const orderResult = await fetchForPage<{ order: Order }>(`/orders/${orderId}`, basePath);

  if (!orderResult.ok && orderResult.status === 404) {
    notFound();
  }

  if (!orderResult.ok) {
    return (
      <main className="min-h-screen bg-surface text-onSurface">
        <Navbar />
        <section className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-28 lg:px-10">
          <div className="flex items-center gap-4 rounded-[18px] border border-amber-600/30 bg-amber-50 px-6 py-5">
            <WifiOff aria-hidden="true" className="shrink-0 text-amber-600" size={22} />
            <div>
              <p className="font-bold text-brandInk">We couldn&apos;t load this eSIM</p>
              <p className="mt-1 text-sm text-amber-700">{orderResult.message}</p>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const order = orderResult.data.order;
  const sim = order.sims?.[0];

  const [usageResult, instructionsResult, packagesResult, topupsResult] = await Promise.all([
    fetchForPage<{ usage: UsagePayload }>(`/orders/${orderId}/usage`, basePath),
    fetchForPage<{ instructions: Instructions }>(`/orders/${orderId}/instructions`, basePath),
    fetchForPage<{ packages: PackageHistoryEntry[] }>(`/orders/${orderId}/packages`, basePath),
    fetchForPage<{ topups: Topups }>(`/orders/${orderId}/topups`, basePath)
  ]);

  const usage = summariseUsage(usageResult.ok ? usageResult.data.usage : null);
  // Plan history is supplementary: if the provider call fails, the install and
  // usage panels above are still worth showing on their own.
  const packageHistory = packagesResult.ok ? packagesResult.data.packages : [];
  const topups = topupsResult.ok ? topupsResult.data.topups : null;
  const topupPackages = topups?.available === true ? (topups.packages ?? []) : [];
  const qr = resolveQrSource(sim?.qrcode);
  const instructionsAvailable =
    instructionsResult.ok && instructionsResult.data.instructions?.available === true;

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-28 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
          href="/account"
        >
          <ArrowLeft size={14} />
          All eSIMs
        </Link>

        {isNew === "1" ? (
          <div className="mt-6 flex items-center gap-4 rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 px-5 py-4">
            <CheckCircle2 aria-hidden="true" className="shrink-0 text-brandTeal" size={22} />
            <div>
              <p className="font-bold text-brandInk">Payment complete — your eSIM is ready</p>
              <p className="mt-0.5 text-sm text-onSurfaceVariant">
                Scan the QR code below to install it on your device.
              </p>
            </div>
          </div>
        ) : null}

        {isToppedUp === "1" ? (
          <div className="mt-6 flex items-center gap-4 rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 px-5 py-4">
            <CheckCircle2 aria-hidden="true" className="shrink-0 text-brandTeal" size={22} />
            <div>
              <p className="font-bold text-brandInk">Top-up complete</p>
              <p className="mt-0.5 text-sm text-onSurfaceVariant">
                Your extra data has been added to this eSIM. Usage can take a few minutes to
                catch up.
              </p>
            </div>
          </div>
        ) : null}

        <h1 className="mt-7 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          {order.package_id}
        </h1>
        <p className="mt-2 text-sm text-onSurfaceVariant">Order {order.code}</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
            <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
              <QrCode aria-hidden="true" className="text-brandBlue" size={20} />
              Install your eSIM
            </h2>

            {qr.kind === "image" ? (
              <>
                <div className="mt-6 flex justify-center rounded-[16px] border border-outline bg-white p-5">
                  {/* Plain img: the QR may be a data URI, which the image optimiser cannot process. */}
                  <img
                    alt="eSIM installation QR code"
                    className="h-[220px] w-[220px] object-contain"
                    src={qr.src}
                  />
                </div>
                <p className="mt-4 text-center text-xs text-onSurfaceVariant">
                  On your phone, open Settings → Mobile Data → Add eSIM, then scan this code.
                </p>
              </>
            ) : qr.kind === "activation" ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-onSurfaceVariant">
                  Install manually with this activation code:
                </p>
                <CopyField label="Activation code" value={qr.code} />
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-outline bg-mist px-5 py-4">
                <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
                <div>
                  <p className="text-sm font-bold text-brandInk">Still provisioning</p>
                  <p className="mt-1 text-sm text-onSurfaceVariant">
                    Your eSIM is being prepared. Refresh this page in a moment to get your QR
                    code.
                  </p>
                </div>
              </div>
            )}

            {sim?.iccid ? (
              <div className="mt-5">
                <CopyField label="ICCID" value={sim.iccid} />
              </div>
            ) : null}

            {sim?.direct_apple_installation_url ? (
              <a
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-brandBlue/50 text-sm font-black text-brandBlue transition hover:bg-brandBlue hover:text-white"
                href={sim.direct_apple_installation_url}
              >
                <Smartphone size={16} />
                Install on this iPhone
              </a>
            ) : null}

            {!instructionsAvailable ? (
              <p className="mt-5 flex items-start gap-2 text-xs text-onSurfaceVariant">
                <Info aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                Detailed carrier settings will be available once the eSIM is fully provisioned.
              </p>
            ) : null}
          </div>

          <aside className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard">
            <h2 className="font-display text-lg font-black text-brandInk">Data usage</h2>

            {usage.available ? (
              <>
                <p className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
                  {usage.remainingLabel}
                </p>
                <p className="mt-1 text-xs text-onSurfaceVariant">of {usage.totalLabel} remaining</p>

                <div
                  aria-label={`${usage.usedPercent}% of data used`}
                  className="mt-5 h-2 w-full overflow-hidden rounded-full bg-mist"
                  role="img"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal"
                    style={{ width: `${Math.min(100, Math.max(0, usage.usedPercent))}%` }}
                  />
                </div>

                {usage.expiresAt ? (
                  <p className="mt-4 text-xs text-onSurfaceVariant">
                    Expires {new Date(usage.expiresAt).toLocaleDateString()}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-onSurfaceVariant">{usage.message}</p>
            )}

            <Link
              className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-outline text-xs font-black text-onSurfaceVariant transition hover:border-brandBlue/75 hover:text-brandInk"
              href="/support"
            >
              Need help?
            </Link>
          </aside>
        </div>

        {topupPackages.length > 0 ? (
          <TopUpPanel orderId={order.id} packages={topupPackages} />
        ) : topups?.message ? (
          <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-outline bg-white px-6 py-5 shadow-brandCard">
            <Info aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
            <div>
              <p className="text-sm font-bold text-brandInk">Top-up unavailable</p>
              <p className="mt-1 text-sm text-onSurfaceVariant">{topups.message}</p>
            </div>
          </div>
        ) : null}

        {packageHistory.length > 0 ? (
          <div className="mt-5 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
            <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
              <History aria-hidden="true" className="text-brandBlue" size={20} />
              Plan history
            </h2>
            <p className="mt-2 text-sm text-onSurfaceVariant">
              Every plan that has run on this eSIM, including top-ups.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-[0.1em] text-onSurfaceVariant">
                    <th className="pb-3 pr-4 font-black">Plan</th>
                    <th className="pb-3 pr-4 font-black">Status</th>
                    <th className="pb-3 font-black">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {packageHistory.map((entry, index) => (
                    <tr
                      className="border-t border-outline/70"
                      key={entry.id ?? `${entry.package_id ?? "plan"}-${index}`}
                    >
                      <td className="py-3 pr-4 font-semibold text-brandInk">
                        {entry.package_id ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-onSurfaceVariant">{entry.status ?? "—"}</td>
                      <td className="py-3 text-brandInk">{describeAllowance(entry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
