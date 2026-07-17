"use client";

import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  {
    label: "Destinations",
    href: "/destinations",
    activePaths: ["/destinations"],
  },
  {
    label: "How it works",
    href: "/#how-it-works",
    activePaths: [],
  },
  {
    label: "About eSIM",
    href: "/about",
    activePaths: ["/about"],
  },
  {
    label: "Help",
    href: "/support",
    activePaths: ["/support"],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  function isActive(activePaths: string[]) {
    return activePaths.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/`),
    );
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-white/[0.04] bg-[#020916]/82 backdrop-blur-2xl">
      <nav className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link
          className="flex shrink-0 items-center gap-3"
          href="/"
          onClick={closeMobileMenu}
        >
          <img
            alt="Velocity eSIM"
            className="h-10 w-10 object-contain"
            src="/app-logo.png"
          />

          <span>
            <span className="block font-display text-lg font-black tracking-[0.16em] text-white">
              VELOCITY
            </span>

            <span className="block text-[9px] font-bold tracking-[0.28em] text-[#7f94aa]">
              eSIM
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => {
            const active = isActive(
              item.activePaths,
            );

            return (
              <Link
                className={[
                  "rounded-[12px] border px-5 py-3 text-sm font-bold transition",
                  active
                    ? "border-[#234c70] bg-[#09182a] text-white"
                    : "border-transparent text-white/70 hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            className="inline-flex h-11 items-center gap-2 px-3 text-sm font-bold text-white/75 transition hover:text-white"
            type="button"
          >
            <Globe2
              aria-hidden="true"
              size={17}
            />

            EN

            <ChevronDown
              aria-hidden="true"
              size={14}
            />
          </button>

          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#3c638a] px-6 text-sm font-bold text-white transition hover:border-[#3eb8ff] hover:bg-white/[0.03]"
            href="/login"
          >
            Log in
          </Link>

          <Link
            className="inline-flex h-11 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(18,102,255,0.3)] transition hover:-translate-y-0.5"
            href="/#download"
          >
            Get eSIM Now

            <ArrowRight
              aria-hidden="true"
              size={17}
            />
          </Link>
        </div>

        <button
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation"
          className="grid h-11 w-11 place-items-center rounded-xl border border-[#244969] bg-[#07182b] text-white md:hidden"
          onClick={() =>
            setMobileMenuOpen(
              (current) => !current,
            )
          }
          type="button"
        >
          {mobileMenuOpen ? (
            <X
              aria-hidden="true"
              size={20}
            />
          ) : (
            <Menu
              aria-hidden="true"
              size={20}
            />
          )}
        </button>
      </nav>

      <div
        className={[
          "grid overflow-hidden border-t border-[#173650] bg-[#041021]/98 transition-[grid-template-rows,opacity] duration-300 md:hidden",
          mobileMenuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-5">
            {navigationItems.map((item) => {
              const active = isActive(
                item.activePaths,
              );

              return (
                <Link
                  className={[
                    "rounded-xl px-4 py-3 text-sm font-bold transition",
                    active
                      ? "border border-[#244c70] bg-[#0a2138] text-white"
                      : "border border-transparent text-white/75 hover:bg-[#081a2e] hover:text-white",
                  ].join(" ")}
                  href={item.href}
                  key={item.label}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="my-2 h-px bg-[#173650]" />

            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#3c638a] text-sm font-bold text-white"
              href="/login"
              onClick={closeMobileMenu}
            >
              Log in
            </Link>

            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-5 text-sm font-black text-white"
              href="/#download"
              onClick={closeMobileMenu}
            >
              Get eSIM Now

              <ArrowRight
                aria-hidden="true"
                size={16}
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
