"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, Bug, Percent, Rocket, Users, type LucideIcon } from "lucide-react";

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
  { href: "/xpartnersy", label: "Partners", full: "Partner program", Icon: Users }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-20 shrink-0 flex-col items-center gap-1 bg-gradient-to-b from-midnight to-ink py-6">
      <Link aria-label="Home" className="mb-6 block" href="/" title="Home">
        <img alt="eSim2you app logo" className="h-8 w-8 rounded-[10px] object-contain shadow-glow" src="/logo-icon.png" />
      </Link>
      {adminLinks.map(({ href, label, full, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            aria-label={full}
            className={`flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-xl transition ${
              active
                ? "bg-[rgba(0,217,245,0.12)] text-aqua shadow-[inset_0_0_0_1px_rgba(0,217,245,0.35)]"
                : "text-[#7fd8e6] opacity-70 hover:bg-white/5 hover:opacity-100"
            }`}
            href={href}
            key={href}
            title={full}
          >
            <Icon aria-hidden="true" size={18} />
            <span className="text-[8px] font-bold uppercase tracking-wide">{label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
