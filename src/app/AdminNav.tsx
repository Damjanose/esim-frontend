"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Bug,
  LifeBuoy,
  LogOut,
  Map,
  MessageSquareQuote,
  Percent,
  Rocket,
  Users,
  type LucideIcon
} from "lucide-react";
import { useAdminSession } from "./useAdminSession";

const adminLinks: Array<{
  href: string;
  label: string;
  full: string;
  Icon: LucideIcon;
}> = [
  { href: "/xloginy", label: "Sales", full: "Purchase dashboard", Icon: BarChart3 },
  { href: "/xpricing", label: "Pricing", full: "Price management", Icon: Percent },
  { href: "/xerrors", label: "Errors", full: "Error Inbox", Icon: Bug },
  { href: "/xversion", label: "Version", full: "App version", Icon: Rocket },
  { href: "/xnotificationy", label: "Notify", full: "Push notifications", Icon: Bell },
  { href: "/xactivityy", label: "Activity", full: "User activity", Icon: Activity },
  { href: "/xpartnersy", label: "Partners", full: "Partner program", Icon: Users },
  { href: "/xsupport", label: "Support", full: "Support inbox", Icon: LifeBuoy },
  { href: "/xtestimonialsy", label: "Quotes", full: "Testimonials", Icon: MessageSquareQuote },
  { href: "/xtripplany", label: "Trips", full: "Trip plans", Icon: Map }
];

export function AdminNav() {
  const pathname = usePathname();
  const { token, logout } = useAdminSession();

  return (
    <nav className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-6 border-b border-mist bg-gradient-to-r from-midnight to-ink px-6 py-0">
      <Link aria-label="Home" className="shrink-0" href="/" title="Home">
        <img alt="eSim2you app logo" className="h-8 w-8 rounded-[10px] object-contain shadow-glow" src="/logo-icon.png" />
      </Link>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {adminLinks.map(({ href, label, full, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              aria-label={full}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-[rgba(0,217,245,0.12)] text-aqua shadow-[inset_0_0_0_1px_rgba(0,217,245,0.35)]"
                  : "text-[#7fd8e6] opacity-70 hover:bg-white/5 hover:opacity-100"
              }`}
              href={href}
              key={href}
              title={full}
            >
              <Icon aria-hidden="true" size={16} />
              <span className="font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>

      {token && (
        <button
          aria-label="Logout"
          className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#7fd8e6] transition hover:bg-white/5 hover:text-aqua"
          onClick={logout}
          title="Logout"
          type="button"
        >
          <LogOut aria-hidden="true" size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      )}
    </nav>
  );
}
