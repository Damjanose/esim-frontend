import { landingContent } from "@/content/landing";
import {
  ChevronDown,
  Globe2,
  UserRound,
} from "lucide-react";
import { LinkButton } from "./Button";

type NavbarProps = {
  /**
   * "dark" is for overlaying a dark hero photo (currently only the
   * homepage's Hero) — flips text/icon colors to white so they stay legible
   * over the image instead of the default dark-on-light styling every other
   * page's white background needs.
   */
  theme?: "light" | "dark";
};

export function Navbar({ theme = "light" }: NavbarProps) {
  const isDark = theme === "dark";

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

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 lg:px-10 xl:px-14">
        <a
          aria-label="eSim2you home"
          className="flex shrink-0 items-center gap-2.5"
          href="/"
        >
          <img
            alt="eSim2you app logo"
            className="h-10 w-auto object-contain"
            src="/logo-icon.png"
          />

          <span
            className={[
              "font-display text-lg font-bold tracking-[-0.02em]",
              isDark ? "text-white" : "text-brandInk",
            ].join(" ")}
          >
            {landingContent.brand}
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              className={[
                "text-sm font-medium transition-colors",
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-onSurfaceVariant hover:text-brandInk",
              ].join(" ")}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            aria-label="Change language"
            className={[
              "hidden items-center gap-2 text-sm font-semibold transition md:flex",
              isDark
                ? "text-white/80 hover:text-white"
                : "text-onSurfaceVariant hover:text-brandInk",
            ].join(" ")}
            type="button"
          >
            <Globe2 aria-hidden="true" size={17} />
            <span>EN</span>
            <ChevronDown aria-hidden="true" size={14} />
          </button>

          {/* Showroom mode: no purchase/account functionality yet, so the profile
              entry point is commented out rather than deleted.
              Static on purpose: the navbar renders on statically generated public
              pages, so it must not read cookies. Signed-out visitors are sent on
              to sign-in by the route guard.
          <a
            aria-label="Your profile"
            className={[
              "grid h-11 w-11 place-items-center rounded-full border transition",
              isDark
                ? "border-white/30 text-white/80 hover:border-white/60 hover:text-white"
                : "border-outline text-onSurfaceVariant hover:border-brandBlue/40 hover:text-brandBlue",
            ].join(" ")}
            href="/profile"
          >
            <UserRound aria-hidden="true" size={19} />
          </a>
          */}

          <LinkButton className="px-5 sm:px-7" href="/#download-app">
            Get eSIM Now
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
