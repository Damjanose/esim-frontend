import { landingContent } from "@/content/landing";
import {
  ChevronDown,
  Globe2,
  UserRound,
} from "lucide-react";
import { LinkButton } from "./Button";

export function Navbar() {
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
            className="h-12 w-12 object-contain"
            src="/logo-no-bg.png"
          />

          <span className="font-display text-lg font-bold tracking-[-0.02em] text-white">
            {landingContent.brand}
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
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
            className="hidden items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white md:flex"
            type="button"
          >
            <Globe2 aria-hidden="true" size={17} />
            <span>EN</span>
            <ChevronDown aria-hidden="true" size={14} />
          </button>

          {/* Static on purpose: the navbar renders on statically generated public
              pages, so it must not read cookies. Signed-out visitors are sent on
              to sign-in by the route guard. */}
          <a
            aria-label="Your profile"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/75 transition hover:border-white/40 hover:text-white"
            href="/profile"
          >
            <UserRound aria-hidden="true" size={19} />
          </a>

          <LinkButton className="px-5 sm:px-7" href="/#download-app">
            Get eSIM Now
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
