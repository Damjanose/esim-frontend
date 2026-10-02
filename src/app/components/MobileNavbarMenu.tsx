"use client";

import { Handshake, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LinkButton } from "./Button";

type NavItem = {
  label: string;
  href: string;
};

/**
 * Phone/tablet ☰ panel. Holds only the links the bottom dock doesn't
 * (Trip planner, Travel guides, Compare, Use cases, Support, Partner with us)
 * plus the browse CTA. Borderless icon button: the capsule already frames it.
 * Anchored to the capsule nav, which is `relative`.
 */
export function MobileNavbarMenu({ navItems }: { navItems: readonly NavItem[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [mobileOpen]);

  return (
    <div className="contents" ref={rootRef}>
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        className="grid h-11 w-11 place-items-center rounded-full text-onSurfaceVariant transition hover:bg-brandBlue/[0.06] hover:text-brandBlue group-data-[tone=dark]:text-white group-data-[tone=dark]:hover:bg-white/10 lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
        type="button"
      >
        {mobileOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
      </button>

      {mobileOpen ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] rounded-[22px] border border-outline/60 bg-surface p-2 shadow-brandCard lg:hidden">
          <div className="flex flex-col">
            {navItems.map((item) => (
              <a
                className="rounded-[14px] px-4 py-3 text-sm font-semibold text-brandInk transition hover:bg-surfaceBright"
                href={item.href}
                key={item.href}
                onClick={close}
              >
                {item.label}
              </a>
            ))}
            <a
              className="flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-brandInk transition hover:bg-surfaceBright"
              href="/partners/request"
              onClick={close}
            >
              <Handshake aria-hidden="true" className="text-brandBlue" size={17} />
              Partner with us
            </a>
            <LinkButton className="mt-2 w-full" href="/destinations" onClick={close}>
              Browse eSIM plans
            </LinkButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
