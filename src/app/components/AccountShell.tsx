import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AccountShellItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Marks the page the visitor is on (aria-current="page"). */
  current?: boolean;
};

/**
 * The lg+ dashboard frame of the signed-in areas: a sticky sidebar of links (plus an
 * optional footer slot, e.g. Sign out) beside the page content. Reused by /partners/*
 * (spec section 9), so everything comes in as props: no data fetching, no hooks, no
 * route knowledge. Below lg the sidebar is display:none and the content is
 * full-width: the dock and the page itself handle navigation.
 *
 * Sticky needs an ancestor that doesn't clip: pages put it in a `<main>` with
 * overflow-x-clip, never overflow-x-hidden (f215).
 */
export function AccountShell({
  label,
  items,
  footer,
  children
}: {
  /** Names the sidebar landmark, e.g. "Account". */
  label: string;
  items: readonly AccountShellItem[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <nav aria-label={label} className="hidden lg:block lg:self-stretch">
        <div className="sticky top-6 rounded-[20px] border border-outline/60 bg-surface p-2 shadow-brandCard">
          <ul className="space-y-0.5">
            {items.map(({ href, label: itemLabel, icon: Icon, current }) => (
              <li key={href}>
                <Link
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold transition ${
                    current
                      ? "bg-brandBlue/10 text-brandBlue"
                      : "text-onSurfaceVariant hover:bg-surfaceBright hover:text-brandInk"
                  }`}
                  href={href}
                >
                  <Icon aria-hidden="true" className="shrink-0" size={18} />
                  {itemLabel}
                </Link>
              </li>
            ))}
          </ul>

          {footer ? <div className="mt-2 border-t border-outline/60 pt-2">{footer}</div> : null}
        </div>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
