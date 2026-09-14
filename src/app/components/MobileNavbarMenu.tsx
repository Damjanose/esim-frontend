"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

export function MobileNavbarMenu({
  navItems,
  dark = false,
}: {
  navItems: readonly NavItem[];
  dark?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        className={[
          "grid h-11 w-11 place-items-center rounded-full border lg:hidden",
          dark
            ? "border-white/30 text-white/80 hover:border-white/60 hover:text-white"
            : "border-outline text-onSurfaceVariant hover:border-brandBlue/40 hover:text-brandBlue",
        ].join(" ")}
        onClick={() => setMobileOpen((open) => !open)}
        type="button"
      >
        {mobileOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
      </button>

      {mobileOpen ? (
        <div className="absolute left-5 right-5 top-20 rounded-[22px] border border-outline bg-surface p-3 shadow-brandCard lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                className="rounded-xl px-4 py-3 text-sm font-semibold text-brandInk transition hover:bg-mist"
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              className="rounded-xl px-4 py-3 text-sm font-semibold text-brandInk transition hover:bg-mist"
              href="/partners/request"
              onClick={() => setMobileOpen(false)}
            >
              Partner with us
            </a>
            <a
              className="mt-1 rounded-xl bg-brandBlue px-4 py-3 text-center text-sm font-black text-white"
              href="/destinations"
              onClick={() => setMobileOpen(false)}
            >
              Browse eSIM plans
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
