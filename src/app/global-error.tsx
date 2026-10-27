"use client";

import { useEffect, useState } from "react";
import { reportClientError } from "@/lib/report-client-error";

/**
 * Last-resort boundary: replaces the root layout, so globals.css and the font
 * variables may be missing. Plain inline styles on purpose, no shared components.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [referenceId, setReferenceId] = useState<string | null>(null);

  useEffect(() => {
    const { referenceId: id } = reportClientError({
      kind: "crash",
      scenario: "render_error",
      stage: "global",
      errorName: error.name,
      message: error.message || "Global render error",
      stack: error.stack,
      extra: error.digest ? { digest: error.digest } : undefined
    });
    setReferenceId(id);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "Canvas",
          color: "CanvasText",
          padding: 16
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 26, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ lineHeight: 1.5, margin: "0 0 12px" }}>
            eSIM2you hit an unexpected problem. If you were paying for a plan, check My eSIMs before trying again:
            do not pay twice.
          </p>
          {referenceId ? (
            <p style={{ fontSize: 13, wordBreak: "break-all", margin: "0 0 20px" }}>
              Error reference: <strong style={{ fontFamily: "monospace" }}>{referenceId}</strong>
            </p>
          ) : null}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ padding: "12px 20px", borderRadius: 999, border: "1px solid currentColor", cursor: "pointer", font: "inherit", background: "transparent", color: "inherit" }}
              type="button"
            >
              Try again
            </button>
            <a
              href={referenceId ? `/support?ref=${encodeURIComponent(referenceId)}` : "/support"}
              style={{ padding: "12px 20px", borderRadius: 999, border: "1px solid currentColor", color: "inherit", textDecoration: "none" }}
            >
              Contact support
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
