import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Inbox, UserRound, WifiOff } from "lucide-react";
import { summariseUsage, type UsagePayload } from "@/lib/esim-install";
import { resolveOrderSections, type OrderSummary } from "@/lib/order-groups";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { getPackageOptions } from "@/services/server-packages";
import { Navbar } from "../components/Navbar";
import { LinkButton } from "../components/Button";
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
      <h2 className="font-display text-xl font-black tracking-[-0.02em] text-brandInk">{title}</h2>
      <p className="mt-1 text-sm text-onSurfaceVariant">{description}</p>
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
  const [ordersResult, usageResult, packageOptions] = await Promise.all([
    fetchForPage<{ orders: OrderSummary[] }>("/orders", "/account"),
    activeOrder
      ? fetchForPage<{ usage: UsagePayload }>(`/orders/${activeOrder.id}/usage`, "/account")
      : null,
    getPackageOptions()
  ]);

  const catalog = new Map(packageOptions.map((option) => [option.id, option]));
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
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-28 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
              My eSIMs
            </h1>
            <p className="mt-2 text-sm text-onSurfaceVariant">
              Your plans, installation details, and remaining data.
            </p>
          </div>

          {/* Sign-out lives on the profile, so the account area has one place
              that owns the session. */}
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-outline px-4 text-xs font-black text-onSurfaceVariant transition hover:border-brandBlue/75 hover:text-brandInk"
            href="/profile"
          >
            <UserRound size={15} />
            Profile
          </Link>
        </div>

        {sections === null ? (
          <div className="mt-10 flex items-center gap-4 rounded-[18px] border border-amber-600/30 bg-amber-50 px-6 py-5">
            <WifiOff aria-hidden="true" className="shrink-0 text-amber-600" size={22} />
            <div>
              <p className="font-bold text-brandInk">We couldn&apos;t load your plans</p>
              <p className="mt-1 text-sm text-amber-700">
                {ordersResult.ok ? "" : ordersResult.message}
              </p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="mt-10 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-14 text-center shadow-brandCard">
            <span className="grid h-14 w-14 place-items-center rounded-[16px] border border-outline bg-mist text-brandBlue">
              <Inbox size={26} />
            </span>
            <p className="mt-5 font-display text-xl font-black text-brandInk">No eSIMs yet</p>
            <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
              Once you buy a plan it will appear here with its QR code and remaining data.
            </p>
            <LinkButton className="mt-7" href="/destinations">
              Browse plans
              <ArrowRight size={16} />
            </LinkButton>
          </div>
        ) : (
          <>
            {sections.active ? (
              <Section
                description="The plan currently using your data."
                title="Active plan"
              >
                <div className="mt-5">
                  <ActivePlanCard catalog={catalog} order={sections.active} usage={usage} />
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
                      <PlanCard catalog={catalog} order={order} />
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
                      <PlanCard catalog={catalog} order={order} />
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
