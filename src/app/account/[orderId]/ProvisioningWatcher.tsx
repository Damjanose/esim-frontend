"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";

const POLL_INTERVAL_MS = 10_000;
const POLL_WINDOW_MS = 2 * 60_000;

/**
 * Rendered only while the order has no QR/activation code yet. Re-fetches the server
 * page every 10s for up to 2 minutes (the page itself stops rendering this once a code
 * exists), then falls back to a support link.
 */
export function ProvisioningWatcher({ orderCode }: { orderCode: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedAt >= POLL_WINDOW_MS) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  if (timedOut) {
    return (
      <p className="mt-1 text-sm text-onSurfaceVariant">
        Still not ready?{" "}
        <Link className="inline-flex items-center gap-1 font-bold text-brandBlue hover:underline" href="/support">
          <LifeBuoy aria-hidden="true" size={13} />
          Contact support
        </Link>{" "}
        and quote order <span className="font-mono font-bold text-brandInk">{orderCode}</span>.
      </p>
    );
  }

  return (
    <p className="mt-1 text-sm text-onSurfaceVariant">
      This page updates automatically. Your QR code will appear here as soon as it is ready.
    </p>
  );
}
