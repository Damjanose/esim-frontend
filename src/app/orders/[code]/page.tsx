import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { backendFetchBinary } from "@/lib/backend";
import type { OrderSummary } from "@/lib/order-groups";
import { isOrderCode, receiptDownloadPath } from "@/lib/orderCode";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { ACCESS_COOKIE } from "@/lib/session";
import { resolveButtonClasses } from "../../components/buttonClasses";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  path: "/orders",
  title: "Your order | eSIM2you",
  description: "View your eSIM2you order and download its receipt.",
  indexable: false
});

/**
 * Target of the QR code and link printed on every receipt.
 *
 * Signed out → sign-in, then back here. A buyer who still holds the eSIM is sent
 * to their order page. Anyone else the backend lets fetch the receipt (an admin,
 * or a buyer whose gift was claimed by someone else) gets a small download page. Everyone else gets the same 404 as an unknown code, so
 * the page never reveals whether an order exists.
 */
export default async function OrderByCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isOrderCode(code)) notFound();

  const currentPath = `/orders/${code}`;
  const orders = await fetchForPage<{ orders: OrderSummary[] }>("/orders", currentPath);
  const own = orders.ok ? orders.data.orders.find((order) => order.code === code) : undefined;
  if (own) redirect(`/account/${own.id}`);

  // Not the buyer's order: only an admin can still fetch its receipt.
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const receipt = token
    ? await backendFetchBinary(`/orders/${encodeURIComponent(code)}/receipt`, { token })
    : null;
  if (!receipt?.ok) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-4 py-16">
        <section className="rounded-[22px] border border-outline/60 bg-surface p-6 shadow-brandCard">
          <p className="text-xs font-semibold uppercase tracking-wide text-onSurfaceVariant">Receipt</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-brandInk">Order {code}</h1>
          <p className="mt-2 text-sm text-onSurfaceVariant">
            The eSIM from this order is no longer in your account, but you can still download its receipt.
          </p>
          <a className={`${resolveButtonClasses({ size: "lg" })} mt-5 w-full`} download href={receiptDownloadPath(code)}>
            <Download aria-hidden="true" size={16} />
            Download receipt (PDF)
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
