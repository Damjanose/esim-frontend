"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders a QR code for an arbitrary string client-side (no server round
 * trip, unlike the Airalo-provided eSIM install QR shown on
 * `/account/[orderId]`, which is just an `<img>` of a QR image the backend
 * already generated). Generic on purpose — Task 9.5's promo-materials page
 * is expected to reuse this for the same referral link.
 */
export function QrCodeCard({ value, label }: { value: string; label?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center rounded-[16px] border border-outline bg-white p-5">
      {dataUrl ? (
        // Plain img: the QR is a data URI, which the image optimiser cannot process.
        <img alt={label ?? "QR code"} className="h-[180px] w-[180px] object-contain" src={dataUrl} />
      ) : error ? (
        <p className="flex h-[180px] w-[180px] items-center justify-center text-center text-xs text-onSurfaceVariant">
          Couldn&apos;t generate the QR code.
        </p>
      ) : (
        <div className="h-[180px] w-[180px] animate-pulse rounded-[12px] bg-mist" />
      )}

      {label ? <p className="mt-4 text-center text-xs text-onSurfaceVariant">{label}</p> : null}
    </div>
  );
}
