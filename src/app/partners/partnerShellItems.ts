import { Banknote, BadgeCheck, LayoutDashboard, Megaphone, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountShellItem } from "../components/AccountShell";

export type PartnerNavId = "dashboard" | "buy" | "withdraw" | "materials" | "status";

export type PartnerNavEntry = { id: PartnerNavId; label: string; href: string; description: string };

/**
 * The partner pages, top to bottom: AccountShell's sidebar at lg+ and the grouped
 * list on the phone dashboard. Each page still does its own gating (404 -> apply,
 * wrong status -> status page); the nav only links.
 */
export const PARTNER_NAV: readonly PartnerNavEntry[] = [
  { id: "dashboard", label: "Dashboard", href: "/partners/dashboard", description: "Promo code, referrals and wallet" },
  { id: "buy", label: "Buy for a customer", href: "/partners/buy", description: "Buy a package with your wallet" },
  { id: "withdraw", label: "Withdraw", href: "/partners/withdraw", description: "Pay out your commission" },
  { id: "materials", label: "Materials", href: "/partners/materials", description: "QR code and promo templates" },
  { id: "status", label: "Status", href: "/partners/status", description: "Where your partner account stands" }
];

export const PARTNER_NAV_ICONS: Record<PartnerNavId, LucideIcon> = {
  dashboard: LayoutDashboard,
  buy: ShoppingBag,
  withdraw: Banknote,
  materials: Megaphone,
  status: BadgeCheck
};

/** AccountShell's items for /partners/*, with `current` on the page being viewed. */
export function partnerShellItems(current: PartnerNavId | null): AccountShellItem[] {
  return PARTNER_NAV.map((entry) => ({
    href: entry.href,
    label: entry.label,
    icon: PARTNER_NAV_ICONS[entry.id],
    current: entry.id === current
  }));
}
