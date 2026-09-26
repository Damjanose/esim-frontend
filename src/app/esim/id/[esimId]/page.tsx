import type { Metadata } from "next";
import Image from "next/image";
import { createMetadata } from "@/lib/seo";
import { landingContent } from "@/content/landing";
import { backendFetch } from "@/lib/backend";
import { OpenEsimAppActions } from "./OpenEsimAppActions";

export const metadata: Metadata = createMetadata({
  path: "/esim/id",
  title: "Shared eSIM",
  description: "View a shared eSIM, or open it in the eSim2you app.",
  indexable: false
});

/**
 * Redacted, public-safe view of a shared eSIM. Mirrors the backend
 * `SharedEsimSummary` — deliberately never carries the QR / activation code /
 * iccid, so this page can be opened by anyone.
 */
type SharedEsimSummary = {
  coverageTitle: string | null;
  dataLabel: string | null;
  validityDays: number | null;
  status: "ready" | "active" | "expired";
  purchasedAt: string;
};

const STATUS_LABEL: Record<SharedEsimSummary["status"], string> = {
  ready: "Not yet installed",
  active: "Active",
  expired: "Expired"
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-onSurface/10 py-2.5 first:border-t-0">
      <dt className="text-sm text-onSurface/60">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Landing for an eSIM shared from the mobile app (`/esim/id/{token}`).
 *
 * With the app installed, universal / App Links open the app before this page
 * loads. Reaching it means the app isn't installed (or the link was opened
 * where links don't fire), so it shows a redacted summary and offers: open the
 * app, download it, or get your own eSIM. The full detail (with the install QR)
 * only ever appears inside the owner's app, never here.
 */
export default async function SharedEsimPage({
  params
}: {
  params: Promise<{ esimId: string }>;
}) {
  const { esimId } = await params;
  const token = safeDecode(esimId);
  const { appLinks } = landingContent;

  const result = await backendFetch<{ esim: SharedEsimSummary }>(
    `/shared-esim/${encodeURIComponent(token)}`
  );
  const esim = result.ok ? result.data.esim : null;

  const rows: Array<{ label: string; value: string }> = [];
  if (esim) {
    if (esim.coverageTitle) rows.push({ label: "Coverage", value: esim.coverageTitle });
    if (esim.dataLabel) rows.push({ label: "Data", value: esim.dataLabel });
    if (esim.validityDays != null)
      rows.push({ label: "Validity", value: `${esim.validityDays} days` });
    rows.push({ label: "Status", value: STATUS_LABEL[esim.status] });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-onSurface">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lg">
        <Image src="/logo-icon.png" alt="eSim2you" width={72} height={72} className="mx-auto" priority />
        {esim ? (
          <>
            <h1 className="mt-5 text-2xl font-bold">Someone shared an eSIM with you</h1>
            <p className="mt-2 text-sm text-onSurface/70">
              Open it in the eSim2you app, or get your own with the same coverage.
            </p>
            <dl className="mt-6 rounded-2xl bg-surface px-4 py-2 text-left">
              {rows.map((row) => (
                <SummaryRow key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold">This shared eSIM link isn&apos;t available</h1>
            <p className="mt-2 text-sm text-onSurface/70">
              The link may have expired or been revoked. You can still get your own eSIM in the app.
            </p>
          </>
        )}
        <OpenEsimAppActions
          token={token}
          appStoreUrl={appLinks.ios.href}
          playStoreUrl={appLinks.android.href}
          marketplaceUrl="/"
        />
      </div>
    </main>
  );
}
