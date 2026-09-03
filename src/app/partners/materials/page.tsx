import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { getPublicOrigin } from "@/lib/public-origin";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { CopyField } from "../../account/[orderId]/CopyField";
import { QrCodeCard } from "../dashboard/QrCodeCard";

export const metadata: Metadata = createMetadata({
  path: "/partners/materials",
  title: "Promo materials | eSim2you",
  description: "Download promo templates and share your QR code and referral link.",
  indexable: false
});

// Mirrors the same subset of `Partner` used on `/partners/status` — just
// enough to show the promo code. `getPartner` in
// `E-SIM backend/src/services/partner.service.ts` returns the full row
// (a plain `client.partner.findUnique`), so this endpoint gives us
// `promoCode` directly without the dashboard's stats/commission fields.
type Partner = {
  status: string;
  partnerType: string;
  promoCode: string | null;
};

// Static, generic templates per the design spec — not per-partner generated
// artwork with a baked-in QR. Partners pair these with their own QR/promo
// code, shown separately below. The files themselves don't exist yet (see
// `public/partner-materials/README.md`) — every entry is marked "coming
// soon" until real artwork is supplied, so nobody clicks through to a
// missing file.
const MATERIALS: Array<{ label: string; description: string; href: string; comingSoon: boolean }> = [
  {
    label: "A4 flyer",
    description: "Full-page flyer for print handouts.",
    href: "/partner-materials/flyer-a4.pdf",
    comingSoon: true
  },
  {
    label: "A5 flyer",
    description: "Half-page flyer for counters and mailers.",
    href: "/partner-materials/flyer-a5.pdf",
    comingSoon: true
  },
  {
    label: "Hotel counter card",
    description: "Standee-style card for front desks and counters.",
    href: "/partner-materials/counter-card.pdf",
    comingSoon: true
  },
  {
    label: "Instagram story",
    description: "Vertical template sized for Instagram stories.",
    href: "/partner-materials/instagram-story.png",
    comingSoon: true
  },
  {
    label: "Instagram post",
    description: "Square template sized for Instagram feed posts.",
    href: "/partner-materials/instagram-post.png",
    comingSoon: true
  },
  {
    label: "Facebook post",
    description: "Template sized for Facebook feed posts.",
    href: "/partner-materials/facebook-post.png",
    comingSoon: true
  },
  {
    label: "WhatsApp share image",
    description: "Image sized for sharing in WhatsApp chats and statuses.",
    href: "/partner-materials/whatsapp-share.png",
    comingSoon: true
  }
];

export default async function PartnerMaterialsPage() {
  // Unlike `/partners/dashboard` (which gates on Pending/Active because it
  // shows stats/commission tied to earning status) and `/partners/buy` or
  // `/partners/withdraw` (which involve real money movement), this page
  // just shows a partner their own promo code/QR and static template
  // downloads. There's no risk in a not-yet-active partner (e.g.
  // PendingApproval) previewing their future promo materials ahead of
  // approval, so this page is shown for any existing partner record
  // regardless of status — it only gates on "no partner record exists",
  // same as `/partners/status`.
  const result = await fetchForPage<Partner>("/partners/me", "/partners/materials");

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
          Promo materials
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
            <p className="font-bold text-brandInk">We couldn&apos;t load your promo materials</p>
            <p className="mt-1 text-sm text-amber-700">{result.message}</p>
          </div>
        ) : (
          <MaterialsContent partner={result.data} referralLink={referralLink} />
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

function MaterialsContent({ partner, referralLink }: { partner: Partner; referralLink: string | null }) {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
          <h2 className="font-display text-xl font-black text-brandInk">Your promo code</h2>
          <p className="mt-2 text-sm text-onSurfaceVariant">
            Pair this code or your referral link with the templates below — anyone who books with
            it counts toward your referrals.
          </p>

          {partner.promoCode ? (
            <p className="mt-5 font-display text-3xl font-black tracking-[0.04em] text-brandInk">
              {partner.promoCode}
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

      <div className="rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
        <h2 className="font-display text-xl font-black text-brandInk">Templates</h2>
        <p className="mt-2 text-sm text-onSurfaceVariant">
          Print and social templates for sharing your promo code. Artwork is on its way — check
          back soon.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {MATERIALS.map((material) => (
            <MaterialCard key={material.href} material={material} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MaterialCard({
  material
}: {
  material: { label: string; description: string; href: string; comingSoon: boolean };
}) {
  return (
    <div className="flex items-start gap-4 rounded-[16px] border border-outline bg-mist px-5 py-4">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-outline bg-white text-brandBlue">
        <Download size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-brandInk">{material.label}</p>
        <p className="mt-0.5 text-xs text-onSurfaceVariant">{material.description}</p>

        {material.comingSoon ? (
          <span
            className="mt-2 inline-flex items-center rounded-full border border-outline bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-onSurfaceVariant"
            title="This template hasn't been designed yet — check back soon."
          >
            Coming soon
          </span>
        ) : (
          <a
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-brandBlue transition hover:text-brandInk"
            download
            href={material.href}
          >
            <Download size={13} />
            Download
          </a>
        )}
      </div>
    </div>
  );
}
