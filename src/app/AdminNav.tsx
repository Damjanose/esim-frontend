"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Bug,
  Coins,
  Flame,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Mail,
  Map,
  Megaphone,
  MessageSquareQuote,
  Percent,
  Rocket,
  TrendingUp,
  Users,
  type LucideIcon
} from "lucide-react";
import { useAdminSession } from "./useAdminSession";
import {
  AdminNavClose,
  AdminNavCollapseButton,
  AdminNavGroup,
  AdminNavMobile,
  AdminNavState
} from "./AdminNavControls";

const adminLinks: Array<{
  href: string;
  label: string;
  full: string;
  Icon: LucideIcon;
}> = [
  { href: "/xinsightsy", label: "Insights", full: "Growth insights", Icon: TrendingUp },
  { href: "/xloginy", label: "Sales", full: "Purchase dashboard", Icon: BarChart3 },
  { href: "/xpricing", label: "Pricing", full: "Price management", Icon: Percent },
  { href: "/xerrors", label: "Errors", full: "Error Inbox", Icon: Bug },
  { href: "/xcryptoy", label: "Crypto", full: "Crypto payment reviews", Icon: Coins },
  { href: "/xversion", label: "Version", full: "App version", Icon: Rocket },
  { href: "/xnotificationy", label: "Notify", full: "Push notifications", Icon: Bell },
  { href: "/xactivityy", label: "Activity", full: "User activity", Icon: Activity },
  { href: "/xpartnersy", label: "Partners", full: "Partner program", Icon: Users },
  { href: "/xsupport", label: "Support", full: "Support inbox", Icon: LifeBuoy },
  { href: "/xmailx", label: "Mail", full: "Mailbox", Icon: Mail },
  { href: "/xtestimonialsy", label: "Quotes", full: "Testimonials", Icon: MessageSquareQuote },
  { href: "/xtripplany", label: "Trips", full: "Trip plans", Icon: Map },
  { href: "/xstreaky", label: "Streak", full: "Games streak promo", Icon: Flame },
  { href: "/xtroubley", label: "Troubleshooting", full: "Assistant troubleshooting", Icon: HelpCircle },
  { href: "/xeventsy", label: "Modals", full: "Event modals", Icon: Megaphone }
];

/** Sidebar sections, named by what an admin is trying to do. Every href in adminLinks belongs to exactly one. */
export const adminNavGroups: Array<{ title: string; hrefs: string[] }> = [
  { title: "Growth", hrefs: ["/xinsightsy"] },
  { title: "Money", hrefs: ["/xloginy", "/xpricing", "/xcryptoy", "/xpartnersy"] },
  { title: "People", hrefs: ["/xsupport", "/xmailx", "/xactivityy", "/xnotificationy", "/xtestimonialsy"] },
  { title: "Product", hrefs: ["/xtripplany", "/xstreaky", "/xtroubley", "/xeventsy"] },
  { title: "System", hrefs: ["/xerrors", "/xversion"] }
];

export function AdminNav({ session }: {
  session?: Pick<ReturnType<typeof useAdminSession>, "token" | "logout">;
} = {}) {
  const pathname = usePathname();
  const ownSession = useAdminSession();
  const { token, logout } = session ?? ownSession;
  const current = adminLinks.find((link) => link.href === pathname);

  // Signed out: no sidebar at all, so the sign-in form is the whole page.
  if (!token) return null;

  return (
    <>
    <AdminNavState />
    <AdminNavMobile title={current?.full ?? "Admin"} />
    <nav aria-label="Admin" className="admin-nav">
      <AdminNavClose />

      <div className="admin-nav-top">
        <Link aria-label="Home" className="admin-nav-brand" href="/" title="Home">
          <img alt="eSIM2you app logo" className="h-8 w-8 rounded-[10px] object-contain" src="/app-logo.png" />
          <span className="admin-nav-label">
            <b>eSIM2you</b>
            <small>Admin</small>
          </span>
        </Link>
        <AdminNavCollapseButton />
      </div>

      <div className="admin-nav-scroll">
        {adminNavGroups.map((group) => (
          <AdminNavGroup key={group.title} title={group.title}>
            {group.hrefs.map((href) => {
              const link = adminLinks.find((candidate) => candidate.href === href);
              if (!link) return null;
              const active = pathname === href;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className="admin-nav-link"
                  href={href}
                  key={href}
                  title={link.full}
                >
                  <link.Icon aria-hidden="true" size={18} />
                  <span className="admin-nav-label">{link.full}</span>
                </Link>
              );
            })}
          </AdminNavGroup>
        ))}
      </div>

      <button
          aria-label="Logout"
          className="admin-nav-link admin-nav-logout"
          onClick={logout}
          title="Logout"
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          <span className="admin-nav-label">Logout</span>
        </button>
    </nav>
    </>
  );
}
