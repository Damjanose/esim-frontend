/**
 * Navigation rules for the signed-in account area (AccountShell's lg+ sidebar and
 * the /profile sections). Pure, so the tab mapping is unit-tested; the icons live
 * with the component (src/app/account/accountShellItems.ts).
 */
export type ProfileTabId = "account" | "signin" | "payments" | "support" | "legal";
export type AccountNavId = "esims" | ProfileTabId;

export type AccountNavEntry = { id: AccountNavId; label: string; href: string };

/**
 * The sidebar, top to bottom (Sign out is the shell's footer, not a link).
 * Profile's old in-page tabs became `?tab=` links: a server-rendered selection, so
 * a tab is a real URL (deep links, back button) and the page needs no client state.
 */
export const ACCOUNT_NAV: readonly AccountNavEntry[] = [
  { id: "esims", label: "My eSIMs", href: "/account" },
  { id: "account", label: "Account", href: "/profile" },
  { id: "signin", label: "Sign-in methods", href: "/profile?tab=signin" },
  { id: "payments", label: "Payments", href: "/profile?tab=payments" },
  { id: "support", label: "Support", href: "/profile?tab=support" },
  { id: "legal", label: "Legal", href: "/profile?tab=legal" }
];

const PROFILE_TABS: readonly ProfileTabId[] = ["account", "signin", "payments", "support", "legal"];

/** `?tab=` → a known tab. Missing, repeated (first wins) or unknown values fall back to Account. */
export function profileTabFromParam(value: string | string[] | undefined): ProfileTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  return PROFILE_TABS.find((tab) => tab === raw) ?? "account";
}

/**
 * One profile tree for every width: phones and tablets list every group (the app's
 * grouped settings); at lg+ only the group the sidebar selected is shown.
 */
export function profileGroupClass(group: ProfileTabId, selected: ProfileTabId): string {
  return group === selected ? "" : "lg:hidden";
}
