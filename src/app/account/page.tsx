import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, Inbox, WifiOff } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = createMetadata({
  path: "/account",
  title: "My eSIMs | eSim2you",
  description: "View your eSIM plans, data usage, and installation details.",
  indexable: false
});

type Order = {
  id: number;
  code: string;
  status: string;
  lifecycle_status: "ready" | "active" | "expired";
  package_id: string;
  created_at: string;
  expires_at: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  active: "border-[#1c7a4b] bg-[#07281a] text-[#4ade80]",
  ready: "border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]",
  expired: "border-[#4a4a58] bg-[#16161d] text-[#9ca3af]"
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default async function AccountPage() {
  // Usage is deliberately not fetched here: it is a per-order provider call, so
  // a list of N plans would mean N upstream round-trips. It loads on detail.
  const result = await fetchForPage<{ orders: Order[] }>("/orders", "/account");

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

          <SignOutButton />
        </div>

        {!result.ok ? (
          <div className="mt-10 flex items-center gap-4 rounded-[18px] border border-[#7a4b1c] bg-[#1b1207] px-6 py-5">
            <WifiOff aria-hidden="true" className="shrink-0 text-[#ffb454]" size={22} />
            <div>
              <p className="font-bold">We couldn&apos;t load your plans</p>
              <p className="mt-1 text-sm text-[#c9b393]">{result.message}</p>
            </div>
          </div>
        ) : result.data.orders.length === 0 ? (
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
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {result.data.orders.map((order) => (
              <li key={order.id}>
                <Link
                  className="group flex h-full flex-col rounded-[18px] border border-[#214867]/85 bg-[linear-gradient(145deg,#07182c,#051224)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#168cff]/75"
                  href={`/account/${order.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
                      <Globe2 size={22} />
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                        STATUS_STYLES[order.lifecycle_status] ?? STATUS_STYLES.ready
                      }`}
                    >
                      {order.lifecycle_status}
                    </span>
                  </div>

                  <p className="mt-4 font-display text-lg font-black">{order.package_id}</p>

                  <dl className="mt-3 space-y-1.5 text-xs text-[#8196ad]">
                    <div className="flex justify-between gap-3">
                      <dt>Order</dt>
                      <dd className="font-semibold text-[#c7d6e5]">{order.code}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Purchased</dt>
                      <dd className="font-semibold text-[#c7d6e5]">
                        {formatDate(order.created_at)}
                      </dd>
                    </div>
                  </dl>

                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#42b1ff]">
                    View eSIM
                    <ArrowRight
                      className="transition-transform group-hover:translate-x-1"
                      size={14}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
