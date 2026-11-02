import Link from "next/link";
import { formatRelativeTime } from "@/lib/esim-install";

/**
 * "Updated 5 minutes ago · Refresh" under a usage meter. Refresh is a plain link to
 * the same page with ?refresh=1, which the server page forwards to the usage
 * endpoint to bypass its 30s cache. Renders nothing without a sync time.
 */
export function UsageUpdated({
  syncedAt,
  refreshHref,
  onDark = false
}: {
  syncedAt?: string | null;
  refreshHref?: string;
  onDark?: boolean;
}) {
  const relative = formatRelativeTime(syncedAt);
  if (!relative) return null;
  const muted = onDark ? "text-surface/80" : "text-onSurfaceVariant";
  const link = onDark ? "text-surface underline" : "font-bold text-brandBlue hover:underline";
  return (
    <p className={`mt-2 text-xs ${muted}`} data-usage-updated>
      Updated {relative}
      {refreshHref ? (
        <>
          {" · "}
          <Link className={link} href={refreshHref} prefetch={false}>
            Refresh
          </Link>
        </>
      ) : null}
    </p>
  );
}
