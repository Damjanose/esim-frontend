import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Inbox, UserRound, WifiOff } from "lucide-react";
import { summariseUsage, type UsagePayload } from "@/lib/esim-install";
import { resolveOrderSections, type OrderSummary } from "@/lib/order-groups";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { ActivePlanCard, PlanCard } from "./PlanCard";

export const metadata: Metadata = createMetadata({
  path: "/account",
  title: "My eSIMs | eSim2you",
  description: "View your eSIM plans, data usage, and installation details.",
  indexable: false
});

function Section({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-black tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-sm text-[#8ea3ba]">{description}</p>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  // Fetched first and on its own: this endpoint checks remaining data and
  // expires a depleted plan as a side effect, so asking it before the list means
  // the list already reflects that expiry.
  const activeResult = await fetchForPage<{ order: OrderSummary | null }>(
    "/orders/active",
    "/account"
  );
  const activeOrder = activeResult.ok ? activeResult.data.order : undefined;

  // Per-order usage is one upstream round-trip each, so only the live plan gets
  // one here. The rest load their usage on the detail page.
  const [ordersResult, usageResult] = await Promise.all([
    fetchForPage<{ orders: OrderSummary[] }>("/orders", "/account"),
    activeOrder
      ? fetchForPage<{ usage: UsagePayload }>(`/orders/${activeOrder.id}/usage`, "/account")
      : null
  ]);

  const sections = ordersResult.ok
    ? resolveOrderSections(ordersResult.data.orders, activeOrder)
    : null;
  const usage = summariseUsage(usageResult?.ok ? usageResult.data.usage : null);
  const isEmpty =
    sections !== null &&
    sections.active === null &&
    sections.ready.length === 0 &&
    sections.history.length === 0;

  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-28 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              My eSIMs
            </h1>
            <p className="mt-2 text-sm text-[#8ea3ba]">
              Your plans, installation details, and remaining data.
            </p>
          </div>

          {/* Sign-out lives on the profile, so the account area has one place
              that owns the session. */}
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-[#214867] px-4 text-xs font-black text-[#8ea3ba] transition hover:border-[#168cff]/75 hover:text-white"
            href="/profile"
          >
            <UserRound size={15} />
            Profile
          </Link>
        </div>

        {sections === null ? (
          <div className="mt-10 flex items-center gap-4 rounded-[18px] border border-[#7a4b1c] bg-[#1b1207] px-6 py-5">
            <WifiOff aria-hidden="true" className="shrink-0 text-[#ffb454]" size={22} />
            <div>
              <p className="font-bold">We couldn&apos;t load your plans</p>
              <p className="mt-1 text-sm text-[#c9b393]">
                {ordersResult.ok ? "" : ordersResult.message}
              </p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="mt-10 flex flex-col items-center rounded-[20px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] px-6 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-[16px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
              <Inbox size={26} />
            </span>
            <p className="mt-5 font-display text-xl font-black">No eSIMs yet</p>
            <p className="mt-2 max-w-[380px] text-sm text-[#8ea3ba]">
              Once you buy a plan it will appear here with its QR code and remaining data.
            </p>
            <Link
              className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-6 text-sm font-black transition hover:-translate-y-0.5"
              href="/destinations"
            >
              Browse plans
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {sections.active ? (
              <Section
                description="The plan currently using your data."
                title="Active plan"
              >
                <div className="mt-5">
                  <ActivePlanCard order={sections.active} usage={usage} />
                </div>
              </Section>
            ) : null}

            {sections.ready.length > 0 ? (
              <Section
                description="Bought and waiting. Install one to start using it."
                title="Ready to use"
              >
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {sections.ready.map((order) => (
                    <li key={order.id}>
                      <PlanCard order={order} />
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {sections.history.length > 0 ? (
              <Section description="Plans you have finished." title="History">
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {sections.history.map((order) => (
                    <li key={order.id}>
                      <PlanCard order={order} />
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
