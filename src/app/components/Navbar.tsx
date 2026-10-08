import { landingContent } from "@/content/landing";
import Image from "next/image";
import { Handshake } from "lucide-react";
import { AssistantLauncher } from "./assistant/AssistantLauncher";
import { BottomDock } from "./BottomDock";
import { DOCK_ITEMS } from "./dockNav";
import { MobileNavbarMenu } from "./MobileNavbarMenu";
import { NavbarAccount } from "./NavbarAccount";
import { NavbarTone } from "./NavbarTone";
import { NavLink } from "./NavLink";

/** Real pages only: no homepage #anchors, so every link works from every route.
 * No Destinations link: /destinations repeats the homepage catalog (the logo goes there). */
const navItems = [
  {
    label: "Trip planner",
    href: "/trip-plan"
  },
  {
    label: "Travel guides",
    href: "/travel"
  },
  {
    label: "Compare",
    href: "/compare"
  },
  {
    label: "Use cases",
    href: "/use-cases",
    // Five links don't all fit beside the actions at lg; still in the footer below xl.
    wideOnly: true
  },
  {
    label: "Support",
    href: "/support"
  }
];

/** Below lg the dock already carries these, so the ☰ panel lists only the rest. */
const dockHrefs = new Set(DOCK_ITEMS.map((item) => item.href));
const secondaryNavItems = navItems.filter((item) => !dockHrefs.has(item.href));

/**
 * Floating capsule nav, fixed to the top while scrolling. NavbarTone switches
 * it between dark glass (over the homepage's dark hero) and light glass
 * (everywhere else); the classes below react through `group-data-[tone=dark]:`.
 *
 * Static on purpose: it renders on statically generated public pages, so it
 * must not read cookies (f022).
 */
export function Navbar() {
  return (
    <>
      <NavbarTone>
        <nav
          aria-label="Main"
          className="relative mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-4 rounded-full border border-outline/60 bg-surface/90 pl-4 pr-2 shadow-brandCard backdrop-blur-md transition-colors duration-300 group-data-[tone=dark]:border-white/15 group-data-[tone=dark]:bg-brandInk/55 group-data-[tone=dark]:shadow-[0_16px_40px_rgba(2,6,20,0.25)] lg:h-16 lg:justify-start lg:gap-5 lg:pl-5"
        >
          <a
            aria-label="eSIM2you home"
            className="flex min-h-11 shrink-0 items-center gap-2.5"
            href="/"
          >
            <Image
              alt="eSIM2you app logo"
              className="h-9 w-9 object-contain lg:h-10 lg:w-10"
              height={40}
              src="/logo-icon.png"
              width={40}
            />

            <span className="font-display text-lg font-bold tracking-[-0.02em] text-brandInk transition-colors group-data-[tone=dark]:text-white">
              {landingContent.brand}
            </span>
          </a>

          <span
            aria-hidden="true"
            className="hidden h-6 w-px shrink-0 bg-outline/70 group-data-[tone=dark]:bg-white/20 lg:block"
          />

          <div className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                className={"wideOnly" in item && item.wideOnly ? "hidden xl:flex" : "flex"}
                href={item.href}
                key={item.href}
                label={item.label}
              />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-onSurfaceVariant transition hover:text-brandBlue group-data-[tone=dark]:text-white/80 group-data-[tone=dark]:hover:text-white 2xl:flex"
              href="/partners/request"
              rel="nofollow"
            >
              <Handshake aria-hidden="true" size={17} />
              Partners
            </a>

            {/* Session-aware client island; below lg the dock's My eSIMs and
                Profile tabs cover this. */}
            <NavbarAccount />

            <MobileNavbarMenu navItems={secondaryNavItems} />
          </div>
        </nav>
      </NavbarTone>

      <BottomDock />
      <AssistantLauncher />
    </>
  );
}
