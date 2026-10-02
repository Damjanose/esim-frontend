"use client";

import { usePathname } from "next/navigation";
import { isNavLinkActive } from "./navTone";

/** A top-level navbar link that marks itself as the current page. */
export function NavLink({ href, label, className = "flex" }: { href: string; label: string; className?: string }) {
  const active = isNavLinkActive(usePathname(), href);

  return (
    <a
      aria-current={active ? "page" : undefined}
      className={[
        className,
        "h-10 items-center whitespace-nowrap rounded-full px-3.5 text-sm transition-colors",
        active
          ? "bg-brandBlue/[0.08] font-bold text-brandBlue group-data-[tone=dark]:bg-white/15 group-data-[tone=dark]:text-white"
          : "font-semibold text-onSurfaceVariant hover:text-brandInk group-data-[tone=dark]:text-white/80 group-data-[tone=dark]:hover:text-white"
      ].join(" ")}
      href={href}
    >
      {label}
    </a>
  );
}
