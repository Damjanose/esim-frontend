import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Info,
  LifeBuoy,
  QrCode,
  Smartphone,
  WifiOff
} from "lucide-react";
import { describePackage, esimStatusLine, lifecycleBadge, usageMeter } from "@/lib/accountEsims";
import {
  formatMegabytes,
  resolveQrSource,
  summariseUsage,
  type UsagePayload
} from "@/lib/esim-install";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { getPackageOptions } from "@/services/server-packages";
import { AccountShell } from "../../components/AccountShell";
import { ActiveEsimCard } from "../../components/ActiveEsimCard";
import { LinkButton } from "../../components/Button";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { UsageRingCard } from "../../components/UsageRing";
import { SiteFooter } from "../../SiteFooter";
import { accountShellItems } from "../accountShellItems";
import { CopyField } from "./CopyField";
import { OrderReviewCard } from "./OrderReviewCard";
import { PurchaseConversion } from "./PurchaseConversion";
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

const PAGE_CLASSES =
  "mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]";

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
      <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
        <Navbar />
        <div className={PAGE_CLASSES}>
          <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("esims")} label="Account">
            <div className="flex items-center gap-4 rounded-[18px] border border-error/30 bg-surface px-5 py-4 shadow-brandCard">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error/10 text-error">
                <WifiOff aria-hidden="true" size={20} />
              </span>
              <div>
                <p className="font-bold text-brandInk">We couldn&apos;t load this eSIM</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">{orderResult.message}</p>
              </div>
            </div>
          </AccountShell>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const order = orderResult.data.order;
  const sim = order.sims?.[0];

  const [usageResult, instructionsResult, packagesResult, topupsResult, packageOptions] = await Promise.all([
    fetchForPage<{ usage: UsagePayload }>(`/orders/${orderId}/usage`, basePath),
    fetchForPage<{ instructions: Instructions }>(`/orders/${orderId}/instructions`, basePath),
    fetchForPage<{ packages: PackageHistoryEntry[] }>(`/orders/${orderId}/packages`, basePath),
    fetchForPage<{ topups: Topups }>(`/orders/${orderId}/topups`, basePath),
    // Public catalog (60s server cache), already loaded by /account: names the plan on the usage card.
    getPackageOptions()
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
  const plan = describePackage(
    order.package_id,
    new Map(packageOptions.map((option) => [option.id, option]))
  );
  const meter = usageMeter(usage);
  const statusLine = esimStatusLine(order);
  // The list below is the top-up; the card's Top up just jumps to it.
  const topUpHref = topupPackages.length > 0 ? "#top-up" : undefined;

  return (
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className={PAGE_CLASSES}>
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("esims")} label="Account">
          <Link
            className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
            href="/account"
          >
            <ArrowLeft aria-hidden="true" size={14} />
            All eSIMs
          </Link>

          {isNew === "1" ? (
            <>
              <PurchaseConversion transactionId={order.code} />
              <div className="mt-4 flex items-center gap-4 rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 px-5 py-4">
                <CheckCircle2 aria-hidden="true" className="shrink-0 text-brandTeal" size={22} />
                <div>
                  <p className="font-bold text-brandInk">Payment complete — your eSIM is ready</p>
                  <p className="mt-0.5 text-sm text-onSurfaceVariant">
                    Scan the QR code below to install it on your device.
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {isToppedUp === "1" ? (
            <div className="mt-4 flex items-center gap-4 rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 px-5 py-4">
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

          <OrderReviewCard
            airaloOrderId={order.id}
            justPaid={isNew === "1"}
            lifecycle={order.lifecycle_status}
          />

          <h1 className="mt-5 break-words px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
            {order.package_id}
          </h1>
          <p className="mt-1 px-1 text-sm text-onSurfaceVariant">Order {order.code}</p>

          {/* Phones: blue usage card, then install. lg+: usage ring and install side by side. */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="lg:hidden">
                <ActiveEsimCard
                  flagUri={plan.flagUri}
                  meter={meter}
                  statusLine={statusLine}
                  title={plan.title}
                  topUpHref={topUpHref}
                />
              </div>
              <div className="hidden lg:block">
                <UsageRingCard
                  badge={lifecycleBadge(order.lifecycle_status)}
                  details={plan.details}
                  flagUri={plan.flagUri}
                  meter={meter}
                  primaryTopUp
                  statusLine={statusLine}
                  title={plan.title}
                  topUpHref={topUpHref}
                />
              </div>
            </div>

            <section
              className="scroll-mt-6 rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6"
              id="install"
            >
              <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
                <QrCode aria-hidden="true" className="text-brandBlue" size={20} />
                Install your eSIM
              </h2>

              {qr.kind === "image" ? (
                <>
                  <div className="mt-5 flex justify-center rounded-[16px] border border-outline/60 bg-surface p-4">
                    {/* Plain img: the QR may be a data URI, which the image optimiser cannot process. */}
                    <img
                      alt="eSIM installation QR code"
                      className="h-[200px] w-[200px] object-contain"
                      height={200}
                      src={qr.src}
                      width={200}
                    />
                  </div>
                  <p className="mt-4 text-center text-xs text-onSurfaceVariant">
                    On your phone, open Settings → Mobile Data → Add eSIM, then scan this code.
                  </p>
                </>
              ) : qr.kind === "activation" ? (
                <div className="mt-5 space-y-3">
                  <p className="text-sm text-onSurfaceVariant">
                    Install manually with this activation code:
                  </p>
                  <CopyField label="Activation code" value={qr.code} />
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-outline/60 bg-surfaceBright px-5 py-4">
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
                <div className="mt-4">
                  <CopyField label="ICCID" value={sim.iccid} />
                </div>
              ) : null}

              {sim?.direct_apple_installation_url ? (
                <LinkButton className="mt-4 w-full" href={sim.direct_apple_installation_url} variant="tint">
                  <Smartphone aria-hidden="true" size={16} />
                  Install on this iPhone
                </LinkButton>
              ) : null}

              {!instructionsAvailable ? (
                <p className="mt-4 flex items-start gap-2 text-xs text-onSurfaceVariant">
                  <Info aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                  Detailed carrier settings will be available once the eSIM is fully provisioned.
                </p>
              ) : null}

              <LinkButton className="mt-4 w-full" href="/support" variant="tint">
                <LifeBuoy aria-hidden="true" size={16} />
                Need help?
              </LinkButton>
            </section>
          </div>

          {topupPackages.length > 0 ? (
            <TopUpPanel orderId={order.id} packages={topupPackages} />
          ) : topups?.message ? (
            <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-outline/60 bg-surface px-5 py-4 shadow-brandCard">
              <Info aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
              <div>
                <p className="text-sm font-bold text-brandInk">Top-up unavailable</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">{topups.message}</p>
              </div>
            </div>
          ) : null}

          {packageHistory.length > 0 ? (
            <section className="mt-4 rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
                <History aria-hidden="true" className="text-brandBlue" size={20} />
                Plan history
              </h2>
              <p className="mt-2 text-sm text-onSurfaceVariant">
                Every plan that has run on this eSIM, including top-ups.
              </p>

              {/* relative: a scroller must be the containing block of what it scrolls (f195). */}
              <div className="relative mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-label-caps uppercase text-onSurfaceVariant">
                      <th className="pb-3 pr-4 font-semibold">Plan</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageHistory.map((entry, index) => (
                      <tr key={entry.id ?? `${entry.package_id ?? "plan"}-${index}`}>
                        <td className="border-t border-outline/60 py-3 pr-4 font-semibold text-brandInk">
                          {entry.package_id ?? "—"}
                        </td>
                        <td className="border-t border-outline/60 py-3 pr-4 text-onSurfaceVariant">
                          {entry.status ?? "—"}
                        </td>
                        <td className="border-t border-outline/60 py-3 text-brandInk">{describeAllowance(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
