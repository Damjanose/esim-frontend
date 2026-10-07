import Link from "next/link";
import type { LifecycleBadge, PackageDescription } from "@/lib/accountEsims";
import { LinkButton } from "../components/Button";
import { EsimFlag } from "../components/EsimFlag";
import { StatusBadge } from "../components/StatusBadge";

export type EsimRowAction =
  | { kind: "install"; href: string; primary: boolean }
  | { kind: "buy-again"; href: string }
  | null;

/**
 * One plan in a My eSIMs section (the app's EsimListRow): flag, country + status,
 * plan details, order line, and a trailing action: Install (ready) or Buy again
 * (history, muted). The country name is a stretched link to the eSIM page, so the
 * whole row is tappable without nesting the action inside a link.
 */
export function EsimListRow({
  orderId,
  description,
  badge,
  meta,
  action,
  muted = false
}: {
  orderId: number;
  description: PackageDescription;
  badge: LifecycleBadge;
  /** "Order LC-102 · Purchased 29 Sept 2026". */
  meta: string;
  action: EsimRowAction;
  muted?: boolean;
}) {
  return (
    <div className="relative flex min-h-[76px] items-center gap-3 px-4 py-3 transition hover:bg-surfaceBright lg:px-5">
      <EsimFlag
        className={`h-10 w-10 rounded-[12px] border border-outline/60 bg-surfaceBright text-brandBlue ${muted ? "opacity-50" : ""}`}
        flagUri={description.flagUri}
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className={`truncate font-display text-[15px] font-black ${muted ? "text-onSurfaceVariant" : "text-brandInk"}`}>
            <Link
              className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brandBlue"
              href={`/account/${orderId}`}
            >
              {description.title}
            </Link>
          </h3>
          <StatusBadge badge={badge} />
        </div>
        <p className="truncate text-xs text-onSurfaceVariant">{description.details}</p>
        <p className="truncate text-xs text-onSurfaceVariant">{meta}</p>
      </div>

      {action?.kind === "install" ? (
        <LinkButton
          aria-label={`Install ${description.title}`}
          className="relative z-10 shrink-0"
          href={action.href}
          variant={action.primary ? "lit" : "tint"}
        >
          Install
        </LinkButton>
      ) : null}

      {action?.kind === "buy-again" ? (
        <Link
          aria-label={`Buy again: ${description.title}`}
          className="relative z-10 inline-flex min-h-11 shrink-0 items-center rounded-[10px] px-2 text-sm font-black text-brandBlue transition hover:bg-brandBlue/5"
          href={action.href}
        >
          Buy again
        </Link>
      ) : null}
    </div>
  );
}
