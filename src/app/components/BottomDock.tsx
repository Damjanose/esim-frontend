"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DockIcon } from "./dockIcons";
import { DOCK_ITEMS, activeDockItem, isDockVisible } from "./dockNav";

/**
 * Floating tab dock for phones and tablets — the web twin of the app's
 * BottomTabBar, using its BOTTOM_TAB_STYLE values: an 80%-wide frosted glass
 * capsule with a lit top rim (the ::before line), tint-only side tabs that lift when active, and a
 * raised center action (white ring, teal border, solid blue when active).
 * The fill is white/60 rather than the app's 0.35: iOS BlurView adds its own
 * light tint, CSS backdrop-blur does not, so 0.35 read as see-through here.
 * Icons are the app's filled MaterialIcons glyphs (dockIcons.tsx), tint-only
 * like the app. Links are static: no session reads, so pages that render it stay statically
 * generated (f022). Hidden at lg+, where the capsule navbar takes over.
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
      className="pointer-events-none fixed inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-40 flex justify-center px-3 min-[360px]:px-[10%] lg:hidden"
      data-bottom-dock
    >
      <ul className="pointer-events-auto relative flex min-h-[60px] w-full max-w-[420px] items-center justify-between rounded-full border border-white/60 bg-white/[0.88] px-4 py-1 shadow-dock backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 backdrop-saturate-150 max-[359px]:px-2 before:pointer-events-none before:absolute before:inset-x-[18%] before:top-0 before:h-px before:bg-white/85 before:content-['']">
        {DOCK_ITEMS.map((item) => {
          const isActive = item.id === active;

          if (item.center) {
            return (
              <li className="relative z-10 flex flex-none justify-center px-1" key={item.id}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className={[
                    "-mt-[30px] grid h-[66px] w-[66px] place-items-center rounded-full border-[3px] border-brandTeal bg-white shadow-dockCenter transition-transform duration-[180ms] ease-out active:opacity-75 motion-reduce:transition-none",
                    isActive ? "-translate-y-px scale-[1.04]" : ""
                  ].join(" ")}
                  href={item.href}
                >
                  <span
                    className={[
                      "grid h-[52px] w-[52px] place-items-center rounded-full text-white transition-colors duration-[180ms] ease-out motion-reduce:transition-none",
                      isActive ? "bg-brandBlue" : "bg-dockCenterInactive"
                    ].join(" ")}
                  >
                    <DockIcon id={item.id} size={28} />
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li className="flex min-w-0 flex-1 justify-center" key={item.id}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-[48px] min-w-[44px] flex-col items-center justify-center gap-[3px] text-[11px] leading-[13px] transition duration-[180ms] ease-out active:opacity-75 motion-reduce:transition-none",
                  isActive ? "-translate-y-0.5 scale-[1.08] text-brandBlue" : "text-dockMuted"
                ].join(" ")}
                href={item.href}
              >
                <DockIcon id={item.id} size={22} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
