import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { partnerShellItems } from "../partnerShellItems";
import { PackagePicker } from "./PackagePicker";

export const metadata: Metadata = createMetadata({
  path: "/partners/buy",
  title: "Buy with your partner wallet | eSim2you",
  description: "Buy an eSIM package at your partner price, for yourself or as a gift.",
  indexable: false
});

// Same subset of the raw `Partner` row (`E-SIM backend/prisma/schema.prisma`)
// used by `/partners/status`'s local `Partner` type, plus `walletBalanceCents`
// since this page needs to show the buyer their spendable balance.
type Partner = {
  status: string;
  walletBalanceCents: number;
};

// Mirrors dashboard/page.tsx's DASHBOARD_STATUSES: only a partner who is
// Pending or Active can actually spend from their wallet — every other
// status (PendingApproval/VerificationRequired/Suspended/Cancelled) sends
// the visitor back to the status page instead.
const BUY_STATUSES = new Set(["Pending", "Active"]);

export default async function PartnerBuyPage() {
  const result = await fetchForPage<Partner>("/partners/me", "/partners/buy");

  return (
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the AccountShell sidebar would stop sticking.
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell
          footer={<SignOutButton appearance="nav" />}
          items={partnerShellItems("buy")}
          label="Partner"
        >
          <Link
            className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk lg:hidden"
            href="/partners/dashboard"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>

          <h1 className="px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
            Buy with your wallet
          </h1>

          {!result.ok && result.status === 404 ? (
            <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard">
              <p className="font-display text-xl font-black text-brandInk">
                You haven&apos;t applied yet
              </p>
              <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
                Apply to the eSim2you partner program to start earning commission and buying at
                your partner price.
              </p>
              <LinkButton className="mt-7" href="/partners/request">
                Apply now
                <ArrowRight size={16} />
              </LinkButton>
            </div>
          ) : !result.ok ? (
            <div className="mt-8 rounded-[18px] border border-error/30 bg-surface px-6 py-5 shadow-brandCard">
              <p className="font-bold text-brandInk">We couldn&apos;t load your partner account</p>
              <p className="mt-1 text-sm text-error">{result.message}</p>
            </div>
          ) : !BUY_STATUSES.has(result.data.status) ? (
            <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard">
              <p className="font-display text-xl font-black text-brandInk">
                You can&apos;t buy with your wallet yet
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
            <PackagePicker walletBalanceCents={result.data.walletBalanceCents} />
          )}
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
