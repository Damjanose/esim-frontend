import { landingContent } from "@/content/landing";
import Image from "next/image";
import { Handshake, UserRound } from "lucide-react";
import { BottomDock } from "./BottomDock";
import { LinkButton } from "./Button";
import { DOCK_ITEMS } from "./dockNav";
import { MobileNavbarMenu } from "./MobileNavbarMenu";

const navItems = [
  {
    label: "Home",
    href: "/"
  },
  {
    label: "Plans",
    href: "/#plans"
  },
  {
    label: "Destinations",
    href: "/destinations"
  },
  {
    label: "How it Works",
    href: "/#how-it-works"
  },
  {
    label: "About Us",
    href: "/#benefits"
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
 * Floating capsule nav — the app's glass header at web scale. One style on every
 * page: frosted white reads over both light pages and photo heroes.
 *
 * Static on purpose: it renders on statically generated public pages, so it
 * must not read cookies (f022).
 */
export function Navbar() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-50 px-3 pt-3 lg:px-6">
        <nav
          aria-label="Main"
          className="relative mx-auto flex h-14 max-w-[1240px] items-center justify-between rounded-full border border-outline/60 bg-surface/80 pl-4 pr-2 shadow-brandCard backdrop-blur-md lg:h-16 lg:pl-5"
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

            <span className="font-display text-lg font-bold tracking-[-0.02em] text-brandInk">
              {landingContent.brand}
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <a
                className="text-sm font-medium text-onSurfaceVariant transition-colors hover:text-brandInk"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              aria-label="Partner with eSim2you"
              className="hidden items-center gap-2 rounded-full border border-outline px-4 py-2 text-sm font-semibold text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue lg:flex"
              href="/partners/request"
            >
              <Handshake aria-hidden="true" size={17} />
              Partner with us
            </a>

            {/* Static on purpose: the link always points at /profile — the
                middleware guard sends signed-out visitors to
                /signin?next=/profile and lets signed-in visitors through.
                Below lg the dock's Profile tab replaces it. */}
            <a
              aria-label="Your profile"
              className="hidden h-11 w-11 place-items-center rounded-full border border-outline text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue lg:grid"
              href="/profile"
            >
              <UserRound aria-hidden="true" size={19} />
            </a>

            <MobileNavbarMenu navItems={secondaryNavItems} />

            <LinkButton className="hidden px-6 lg:inline-flex" href="/destinations">
              Get eSIM Now
            </LinkButton>
          </div>
        </nav>
      </header>

      <BottomDock />
    </>
  );
}
