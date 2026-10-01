import { FileText, Globe2, KeyRound, LifeBuoy, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCOUNT_NAV, type AccountNavId } from "@/lib/accountNav";
import type { AccountShellItem } from "../components/AccountShell";

const ICONS: Record<AccountNavId, LucideIcon> = {
  esims: Globe2,
  account: UserRound,
  signin: KeyRound,
  payments: Wallet,
  support: LifeBuoy,
  legal: FileText
};

/** AccountShell's items for /account and /profile, with `current` on the page being viewed. */
export function accountShellItems(current: AccountNavId | null): AccountShellItem[] {
  return ACCOUNT_NAV.map((entry) => ({
    href: entry.href,
    label: entry.label,
    icon: ICONS[entry.id],
    current: entry.id === current
  }));
}
