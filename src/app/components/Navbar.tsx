import { landingContent } from "@/content/landing";
import Image from "next/image";
import { ArrowRight, Handshake, Smartphone, UserRound } from "lucide-react";
import { BottomDock } from "./BottomDock";
import { DOCK_ITEMS } from "./dockNav";
import { MobileNavbarMenu } from "./MobileNavbarMenu";
import { NavbarTone } from "./NavbarTone";
import { NavLink } from "./NavLink";

/** Real pages only: no homepage #anchors, so every link works from every route. */
const navItems = [
  {
    label: "Destinations",
    href: "/destinations"
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
    href: "/use-cases"
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
            aria-label="eSim2you home"
            className="flex min-h-11 shrink-0 items-center gap-2.5"
            href="/"
          >
            <Image
              alt="eSim2you app logo"
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
              <NavLink href={item.href} key={item.href} label={item.label} />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-onSurfaceVariant transition hover:text-brandBlue group-data-[tone=dark]:text-white/80 group-data-[tone=dark]:hover:text-white xl:flex"
              href="/partners/request"
            >
              <Handshake aria-hidden="true" size={17} />
              Partners
            </a>

            {/* Static on purpose: /account and /profile are guarded by the
                middleware, which sends signed-out visitors to /signin?next=…
                and lets signed-in visitors through. Below lg the dock's
                My eSIMs and Profile tabs replace both. */}
            <a
              aria-label="My eSIMs"
              className="hidden h-11 items-center gap-2 rounded-full border border-outline px-3 text-sm font-semibold text-brandInk transition hover:border-brandBlue/40 hover:text-brandBlue group-data-[tone=dark]:border-white/25 group-data-[tone=dark]:text-white group-data-[tone=dark]:hover:border-white/50 lg:flex xl:px-4"
              href="/account"
            >
              <Smartphone aria-hidden="true" size={17} />
              <span className="hidden xl:inline">My eSIMs</span>
            </a>

            <a
              aria-label="Your profile"
              className="hidden h-11 w-11 place-items-center rounded-full border border-outline text-brandInk transition hover:border-brandBlue/40 hover:text-brandBlue group-data-[tone=dark]:border-white/25 group-data-[tone=dark]:text-white group-data-[tone=dark]:hover:border-white/50 lg:grid"
              href="/profile"
            >
              <UserRound aria-hidden="true" size={19} />
            </a>

            <MobileNavbarMenu navItems={secondaryNavItems} />

            <a
              className="hidden h-12 items-center gap-2 rounded-full bg-brandBlue px-5 text-[15px] font-bold text-white transition hover:bg-brandBlue/90 group-data-[tone=dark]:bg-brandTeal group-data-[tone=dark]:text-brandInk group-data-[tone=dark]:hover:bg-brandTeal/90 lg:inline-flex"
              href="/destinations"
            >
              Get an eSIM
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>
        </nav>
      </NavbarTone>

      <BottomDock />
    </>
  );
}
