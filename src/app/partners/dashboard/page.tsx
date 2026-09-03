import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Users, Wallet } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { getPublicOrigin } from "@/lib/public-origin";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { CopyField } from "../../account/[orderId]/CopyField";
import { QrCodeCard } from "./QrCodeCard";

export const metadata: Metadata = createMetadata({
  path: "/partners/dashboard",
  title: "Partner dashboard | eSim2you",
  description: "Track your promo code, referrals, and commission balance.",
  indexable: false
});

// Mirrors `PartnerDashboard` in `E-SIM backend/src/services/partner.service.ts`.
// `recentCredits` is the backend's own safe projection — it never includes
// `supplierCostCents` or any other cost/margin field, so nothing here can leak
// beyond what's already exposed.
type Dashboard = {
  status: string;
  partnerType: string;
  promoCode: string | null;
  validCustomerCount: number;
  commissionBalanceCents: number;
  walletBalanceCents: number;
  recentCredits: Array<{
    packagePriceCents: number;
    finalCustomerPriceCents: number;
    commissionAmountCents: number;
    commissionStatus: string;
    createdAt: string;
  }>;
};

// A dashboard-worthy state, mirroring the two statuses `/partners/status`
// itself links to a dashboard from (Pending: approved but not yet verified,
// still earns commission; Active: verified). Every other status
// (PendingApproval/VerificationRequired/Suspended/Cancelled) sends the
// visitor back to the status page instead of showing stats for an account
// that isn't earning yet or no longer is.
const DASHBOARD_STATUSES = new Set(["Pending", "Active"]);

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export default async function PartnerDashboardPage() {
  const result = await fetchForPage<Dashboard>("/partners/me/dashboard", "/partners/dashboard");

  let referralLink: string | null = null;
  if (result.ok && result.data.promoCode) {
    // getPublicOrigin reads x-forwarded-host/-proto off a Request, which route
    // handlers get for free but a Server Component doesn't — headers() gives
    // the same forwarded headers, so a throwaway Request just carries them.
    const requestHeaders = await headers();
    const origin = getPublicOrigin(new Request("http://placeholder", { headers: requestHeaders }));
    referralLink = `${origin}/?promo=${encodeURIComponent(result.data.promoCode)}`;
  }

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-28 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
          href="/profile"
        >
          <ArrowLeft size={14} />
          Profile
        </Link>

        <h1 className="mt-7 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          Partner dashboard
        </h1>

        {!result.ok && result.status === 404 ? (
          <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-14 text-center shadow-brandCard">
            <p className="font-display text-xl font-black text-brandInk">
              You haven&apos;t applied yet
            </p>
            <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
              Apply to the eSim2you partner program to start earning commission on referred
              bookings.
            </p>
            <LinkButton className="mt-7" href="/partners/request">
              Apply now
              <ArrowRight size={16} />
            </LinkButton>
          </div>
        ) : !result.ok ? (
          <div className="mt-8 rounded-[18px] border border-amber-600/30 bg-amber-50 px-6 py-5">
            <p className="font-bold text-brandInk">We couldn&apos;t load your dashboard</p>
            <p className="mt-1 text-sm text-amber-700">{result.message}</p>
          </div>
        ) : !DASHBOARD_STATUSES.has(result.data.status) ? (
          <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-14 text-center shadow-brandCard">
            <p className="font-display text-xl font-black text-brandInk">
              Your dashboard isn&apos;t ready yet
            </p>
            <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
              Check your partner status to see what&apos;s next.
            </p>
            <LinkButton className="mt-7" href="/partners/status">
              View partner status
              <ArrowRight size={16} />
            </LinkButton>
          </div>
        ) : (
          <DashboardContent dashboard={result.data} referralLink={referralLink} />
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

function DashboardContent({
  dashboard,
  referralLink
}: {
  dashboard: Dashboard;
  referralLink: string | null;
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
          <h2 className="font-display text-xl font-black text-brandInk">Your promo code</h2>
          <p className="mt-2 text-sm text-onSurfaceVariant">
            Share this code or your referral link — anyone who books with it counts toward your
            referrals.
          </p>

          {dashboard.promoCode ? (
            <p className="mt-5 font-display text-3xl font-black tracking-[0.04em] text-brandInk">
              {dashboard.promoCode}
            </p>
          ) : (
            <p className="mt-5 text-sm text-onSurfaceVariant">
              Your promo code hasn&apos;t been generated yet.
            </p>
          )}

          {referralLink ? (
            <div className="mt-5">
              <CopyField label="Referral link" value={referralLink} />
            </div>
          ) : null}
        </div>

        {referralLink ? <QrCodeCard label="Scan to open your referral link" value={referralLink} /> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={Users} label="Referred customers" value={String(dashboard.validCustomerCount)} />
        <StatCard icon={Wallet} label="Commission balance" value={formatMoney(dashboard.commissionBalanceCents)} />
        <StatCard icon={Wallet} label="Wallet balance" value={formatMoney(dashboard.walletBalanceCents)} />
      </div>

      <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
        <h2 className="font-display text-xl font-black text-brandInk">Recent commissions</h2>

        {dashboard.recentCredits.length === 0 ? (
          <p className="mt-4 text-sm text-onSurfaceVariant">
            No commissions yet — they&apos;ll show up here once someone books with your promo
            code.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-[0.1em] text-onSurfaceVariant">
                  <th className="pb-3 pr-4 font-black">Date</th>
                  <th className="pb-3 pr-4 font-black">Package price</th>
                  <th className="pb-3 pr-4 font-black">Customer paid</th>
                  <th className="pb-3 pr-4 font-black">Your commission</th>
                  <th className="pb-3 font-black">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentCredits.map((credit, index) => (
                  <tr className="border-t border-outline/70" key={`${credit.createdAt}-${index}`}>
                    <td className="py-3 pr-4 text-onSurfaceVariant">{formatDate(credit.createdAt)}</td>
                    <td className="py-3 pr-4 text-brandInk">{formatMoney(credit.packagePriceCents)}</td>
                    <td className="py-3 pr-4 text-brandInk">{formatMoney(credit.finalCustomerPriceCents)}</td>
                    <td className="py-3 pr-4 font-semibold text-brandInk">
                      {formatMoney(credit.commissionAmountCents)}
                    </td>
                    <td className="py-3 text-onSurfaceVariant">{credit.commissionStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard">
      <span className="grid h-11 w-11 place-items-center rounded-[12px] border border-outline bg-mist text-brandBlue">
        <Icon size={20} />
      </span>
      <p className="mt-4 font-display text-2xl font-black tracking-[-0.03em] text-brandInk">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-onSurfaceVariant">{label}</p>
    </div>
  );
}
