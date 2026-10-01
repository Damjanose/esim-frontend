"use client";

import type { LucideIcon } from "lucide-react";
import { CircleHelp, Globe2, House, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCK_ITEMS, activeDockItem, isDockVisible, type DockItemId } from "./dockNav";

const ICONS: Record<DockItemId, LucideIcon> = {
  home: House,
  esims: Smartphone,
  destinations: Globe2,
  support: CircleHelp,
  profile: UserRound
};

/**
 * Floating tab dock for phones and tablets — the web twin of the app's
 * BottomTabBar (80%-wide capsule, raised gradient center action). Links are
 * static: no session reads, so pages that render it stay statically generated
 * (f022). Hidden at lg+, where the capsule navbar takes over.
 *
 * `data-bottom-dock` is what globals.css keys the footer's bottom clearance on.
 */
export function BottomDock() {
  const pathname = usePathname();
  if (!isDockVisible(pathname)) return null;
  const active = activeDockItem(pathname);

  return (
    <nav
      aria-label="Quick navigation"
      className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex justify-center px-3 min-[360px]:px-[10%] lg:hidden"
      data-bottom-dock
    >
      <ul className="pointer-events-auto flex h-[60px] w-full max-w-[420px] items-center justify-around rounded-full border border-outline/50 bg-surface/95 px-2 shadow-dock backdrop-blur-md">
        {DOCK_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          const isActive = item.id === active;

          if (item.center) {
            return (
              <li key={item.id}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className="-mt-[30px] grid h-[66px] w-[66px] place-items-center rounded-full bg-surface shadow-dockCenter transition active:scale-95"
                  href={item.href}
                >
                  <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal text-white">
                    <Icon aria-hidden="true" size={26} />
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition",
                  isActive ? "text-brandBlue" : "text-onSurfaceVariant hover:text-brandInk"
                ].join(" ")}
                href={item.href}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={isActive ? 2.4 : 2} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
