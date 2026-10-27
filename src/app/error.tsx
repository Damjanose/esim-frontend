"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LifeBuoy, RotateCcw } from "lucide-react";
import { Button, LinkButton } from "./components/Button";
import { reportClientError } from "@/lib/report-client-error";

/** Route-segment error boundary: reports the crash and gives the visitor a reference id to quote to support. */
export default function RouteError({
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
      stage: "route",
      errorName: error.name,
      message: error.message || "Render error",
      stack: error.stack,
      extra: error.digest ? { digest: error.digest } : undefined
    });
    setReferenceId(id);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-surfaceBright px-4 text-onSurface">
      <div className="w-full max-w-[520px] rounded-[24px] border border-outline/70 bg-surface p-6 shadow-brandCard sm:p-9">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-error/10 text-error">
          <AlertTriangle aria-hidden="true" size={24} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
          We hit an unexpected problem loading this page. If you were paying for a plan, check My eSIMs before
          trying again: do not pay twice.
        </p>
        {referenceId ? (
          <p className="mt-4 break-all text-xs text-onSurfaceVariant">
            Error reference: <span className="font-mono font-bold text-brandInk">{referenceId}</span>
          </p>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:flex-1" onClick={reset} size="lg">
            <RotateCcw aria-hidden="true" size={17} />
            Try again
          </Button>
          <LinkButton
            className="w-full sm:flex-1"
            href={referenceId ? `/support?ref=${encodeURIComponent(referenceId)}` : "/support"}
            size="lg"
            tone="brand"
            variant="tint"
          >
            <LifeBuoy aria-hidden="true" size={17} />
            Contact support
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
