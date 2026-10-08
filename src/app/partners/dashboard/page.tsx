import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Users, Wallet } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { getPublicOrigin } from "@/lib/public-origin";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SettingsGroup, SettingsLinkRow } from "../../components/SettingsGroup";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { CopyField } from "../../account/[orderId]/CopyField";
import { PARTNER_NAV, PARTNER_NAV_ICONS, partnerShellItems } from "../partnerShellItems";
import { QrCodeCard } from "./QrCodeCard";
import { DiscountPanel } from "./DiscountPanel";
import { WalletPanel } from "./WalletPanel";

export const metadata: Metadata = createMetadata({
  path: "/partners/dashboard",
  title: "Partner dashboard | eSIM2you",
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
  discountPct: number;
  maxDiscountPct: number;
  partnerProfitCents: number;
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

// White tile: the discount, promo, stat and commission blocks (the wallet is the blue card).
const TILE_CLASSES = "rounded-[18px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6";
const EMPTY_CARD_CLASSES =
  "mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard";
const ERROR_CARD_CLASSES = "mt-8 rounded-[18px] border border-error/30 bg-surface px-6 py-5 shadow-brandCard";

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
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the AccountShell sidebar would stop sticking.
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell
          footer={<SignOutButton appearance="nav" />}
          items={partnerShellItems("dashboard")}
          label="Partner"
        >
          <Link
            className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk lg:hidden"
            href="/profile"
          >
            <ArrowLeft size={14} />
            Profile
          </Link>

          <h1 className="px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
            Partner dashboard
          </h1>

          {!result.ok && result.status === 404 ? (
            <div className={EMPTY_CARD_CLASSES}>
              <p className="font-display text-xl font-black text-brandInk">
                You haven&apos;t applied yet
              </p>
              <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
                Apply to the eSIM2you partner program to start earning commission on referred
                bookings.
              </p>
              <LinkButton className="mt-7" href="/partners/request">
                Apply now
                <ArrowRight size={16} />
              </LinkButton>
            </div>
          ) : !result.ok ? (
            <div className={ERROR_CARD_CLASSES}>
              <p className="font-bold text-brandInk">We couldn&apos;t load your dashboard</p>
              <p className="mt-1 text-sm text-error">{result.message}</p>
            </div>
          ) : !DASHBOARD_STATUSES.has(result.data.status) ? (
            <div className={EMPTY_CARD_CLASSES}>
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
        </AccountShell>
      </div>

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
    <div className="mt-6 space-y-4 lg:mt-8 lg:space-y-5">
      <WalletPanel walletBalanceCents={dashboard.walletBalanceCents} />

      <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
        <StatCard icon={Users} label="Referred customers" value={String(dashboard.validCustomerCount)} />
        <StatCard icon={Wallet} label="Commission balance" value={formatMoney(dashboard.commissionBalanceCents)} />
      </div>

      {/* Phones and tablets: the partner sub-pages as the app's grouped list (lg+ has the sidebar). */}
      <SettingsGroup className="lg:hidden" label="Partner tools">
        {PARTNER_NAV.filter((entry) => entry.id !== "dashboard").map((entry) => (
          <SettingsLinkRow
            description={entry.description}
            href={entry.href}
            icon={PARTNER_NAV_ICONS[entry.id]}
            key={entry.id}
            label={entry.label}
          />
        ))}
      </SettingsGroup>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-5">
        <div className={TILE_CLASSES}>
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

      <DiscountPanel
        discountPct={dashboard.discountPct}
        maxDiscountPct={dashboard.maxDiscountPct ?? 15}
      />

      <div className={TILE_CLASSES}>
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
    <div className={TILE_CLASSES}>
      <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
        <Icon size={20} />
      </span>
      <p className="mt-4 font-display text-2xl font-black tracking-[-0.03em] text-brandInk">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-onSurfaceVariant">{label}</p>
    </div>
  );
}
