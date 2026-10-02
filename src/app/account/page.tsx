import type { Metadata } from "next";
import { ArrowRight, Inbox, WifiOff } from "lucide-react";
import {
  accountPrimaryAction,
  buyAgainHref,
  describePackage,
  esimCountLine,
  esimStatusLine,
  formatDate,
  lifecycleBadge,
  usageMeter
} from "@/lib/accountEsims";
import { summariseUsage, type UsagePayload, type UsageSummary } from "@/lib/esim-install";
import { resolveOrderSections, type OrderSummary } from "@/lib/order-groups";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import type { HeroPackageOption } from "@/services/packages";
import { getPackageOptions } from "@/services/server-packages";
import { AccountShell } from "../components/AccountShell";
import { ActiveEsimCard } from "../components/ActiveEsimCard";
import { LinkButton } from "../components/Button";
import { Navbar } from "../components/Navbar";
import { SignOutButton } from "../components/SignOutButton";
import { UsageRingCard } from "../components/UsageRing";
import { SiteFooter } from "../SiteFooter";
import { accountShellItems } from "./accountShellItems";
import { EsimListRow } from "./EsimListRow";

export const metadata: Metadata = createMetadata({
  path: "/account",
  title: "My eSIMs | eSim2you",
  description: "View your eSIM plans, data usage, and installation details.",
  indexable: false
});

function AccountSection({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="mt-8 lg:mt-10">
      <h2 className="px-1 text-label-caps uppercase text-onSurfaceVariant">{title}</h2>
      <p className="mt-1 px-1 text-sm text-onSurfaceVariant">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** The live plan: the app's blue card below lg, the usage ring at lg+ (display-switched). */
function ActivePlan({
  order,
  catalog,
  usage,
  primaryTopUp
}: {
  order: OrderSummary;
  catalog: ReadonlyMap<string, HeroPackageOption>;
  usage: UsageSummary;
  primaryTopUp: boolean;
}) {
  const { title, details, flagUri } = describePackage(order.package_id, catalog);
  const meter = usageMeter(usage);
  const statusLine = esimStatusLine(order);
  const topUpHref = `/account/${order.id}#top-up`;
  const detailsHref = `/account/${order.id}`;

  return (
    <>
      <div className="lg:hidden">
        <ActiveEsimCard
          detailsHref={detailsHref}
          flagUri={flagUri}
          meter={meter}
          statusLine={statusLine}
          title={title}
          topUpHref={topUpHref}
        />
      </div>
      <div className="hidden lg:block">
        <UsageRingCard
          badge={lifecycleBadge(order.lifecycle_status)}
          details={`${details} · Order ${order.code}`}
          detailsHref={detailsHref}
          flagUri={flagUri}
          meter={meter}
          primaryTopUp={primaryTopUp}
          statusLine={statusLine}
          title={title}
          topUpHref={topUpHref}
        />
      </div>
    </>
  );
}

/** Phones/tablets: one card of hairline-split rows. lg+: Ready becomes a grid of tiles. */
const ROW_CARD_CLASSES =
  "divide-y divide-outline/60 overflow-hidden rounded-[18px] border border-outline/60 bg-surface shadow-brandCard";
const READY_LIST_CLASSES = `${ROW_CARD_CLASSES} lg:grid lg:grid-cols-2 lg:gap-4 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none`;
const READY_TILE_CLASSES =
  "lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-outline/60 lg:bg-surface lg:shadow-brandCard";

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

  // One data fetch, one tree: only the active plan has two presentations
  // (ActivePlan), switched with display classes.
  const primary = sections ? accountPrimaryAction(sections) : null;
  const countLine = esimCountLine(sections);
  const meta = (order: OrderSummary) => `Order ${order.code} · Purchased ${formatDate(order.created_at)}`;

  return (
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the AccountShell sidebar would stop sticking (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("esims")} label="Account">
          <div className="px-1">
            <h1 className="font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              My eSIMs
            </h1>
            <p className="mt-1 text-sm text-onSurfaceVariant">
              {countLine ?? "Your plans, installation details, and remaining data."}
            </p>
          </div>

          {sections === null ? (
            <div className="mt-8 flex items-center gap-4 rounded-[18px] border border-error/30 bg-surface px-5 py-4 shadow-brandCard">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error/10 text-error">
                <WifiOff aria-hidden="true" size={20} />
              </span>
              <div>
                <p className="font-bold text-brandInk">We couldn&apos;t load your plans</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">
                  {ordersResult.ok ? "" : ordersResult.message}
                </p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard">
              <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-brandBlue/10 text-brandBlue">
                <Inbox aria-hidden="true" size={26} />
              </span>
              <p className="mt-5 font-display text-xl font-black text-brandInk">No eSIMs yet</p>
              <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
                Once you buy a plan it will appear here with its QR code and remaining data.
              </p>
              <LinkButton className="mt-7" href="/destinations">
                Browse plans
                <ArrowRight aria-hidden="true" size={16} />
              </LinkButton>
            </div>
          ) : (
            <>
              {sections.active ? (
                <AccountSection
                  description="The plan currently using your data."
                  title="Active plan"
                >
                  <ActivePlan
                    catalog={catalog}
                    order={sections.active}
                    primaryTopUp={primary?.kind === "topup"}
                    usage={usage}
                  />
                </AccountSection>
              ) : null}

              {sections.ready.length > 0 ? (
                <AccountSection
                  description="Bought and waiting. Install one to start using it."
                  title="Ready to use"
                >
                  <ul className={READY_LIST_CLASSES}>
                    {sections.ready.map((order) => (
                      <li className={READY_TILE_CLASSES} key={order.id}>
                        <EsimListRow
                          action={{
                            kind: "install",
                            href: `/account/${order.id}#install`,
                            primary: primary?.kind === "install" && primary.orderId === order.id
                          }}
                          badge={lifecycleBadge(order.lifecycle_status)}
                          description={describePackage(order.package_id, catalog)}
                          meta={meta(order)}
                          orderId={order.id}
                        />
                      </li>
                    ))}
                  </ul>
                </AccountSection>
              ) : null}

              {sections.history.length > 0 ? (
                <AccountSection description="Plans you have finished." title="History">
                  <ul className={ROW_CARD_CLASSES}>
                    {sections.history.map((order) => {
                      const again = buyAgainHref(order.package_id, catalog);
                      return (
                        <li key={order.id}>
                          <EsimListRow
                            action={again ? { kind: "buy-again", href: again } : null}
                            badge={lifecycleBadge(order.lifecycle_status)}
                            description={describePackage(order.package_id, catalog)}
                            meta={meta(order)}
                            muted
                            orderId={order.id}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </AccountSection>
              ) : null}
            </>
          )}
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
