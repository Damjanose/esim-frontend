import { landingContent } from "@/content/landing";
import {
  ChevronDown,
  Globe2,
} from "lucide-react";

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
          aria-label="Velocity eSIM home"
          className="flex shrink-0 items-center gap-2.5"
          href="/"
        >
          <img
            alt="Velocity eSIM app logo"
            className="h-9 w-9 object-contain"
            src="/app-logo.png"
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

          <a
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#1557ff] to-[#27c6ff] px-5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(24,111,255,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(24,111,255,0.5)] sm:px-7"
            href="/#download-app"
          >
            Get eSIM Now
          </a>
        </div>
      </nav>
    </header>
  );
}
