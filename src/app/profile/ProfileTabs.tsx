import { FileText, Globe2, LifeBuoy, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import { profileGroupClass, type ProfileTabId } from "@/lib/accountNav";
import { SettingsGroup, SettingsLinkRow } from "../components/SettingsGroup";
import { SignOutButton } from "../components/SignOutButton";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { LinkedProviders, type LinkedIdentity } from "./LinkedProviders";

/**
 * Profile as the app's grouped settings list. One tree for every width:
 * - phones/tablets: every group, stacked; Sign out and Delete account at the end;
 * - lg+: AccountShell's sidebar selects a tab (?tab=), and profileGroupClass hides
 *   the other groups. Sign out moves to the sidebar footer.
 * So each client island (LinkedProviders, SignOutButton, DeleteAccountCard) mounts once.
 */
export function ProfileTabs({
  email,
  identities,
  tab
}: {
  email: string | null;
  identities: LinkedIdentity[];
  tab: ProfileTabId;
}) {
  return (
    <div className="mt-6 space-y-6 lg:mt-8">
      <SettingsGroup className={profileGroupClass("account", tab)} label="Account">
        <div className="px-4 py-3">
          <span className="block text-xs text-onSurfaceVariant">Signed in as</span>
          <span className="mt-0.5 block break-all font-display text-lg font-black text-brandBlue">
            {email ?? "Your eSim2you account"}
          </span>
        </div>
        <SettingsLinkRow
          description="Your eSIMs, QR codes, and remaining data"
          href="/account"
          icon={Globe2}
          label="My eSIMs"
        />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("signin", tab)} label="Sign-in methods">
        <LinkedProviders identities={identities} />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("payments", tab)} label="Payments">
        <SettingsLinkRow
          description="Billing address and how your card is handled"
          href="/profile/billing"
          icon={Wallet}
          label="Payments and billing"
        />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("support", tab)} label="Support">
        <SettingsLinkRow
          description="Message our team about an order, eSIM, or payment"
          href="/profile/support"
          icon={MessageCircle}
          label="Chat with support"
        />
        <SettingsLinkRow
          description="Installation help and contact options"
          href="/support"
          icon={LifeBuoy}
          label="Help and support"
        />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("legal", tab)} label="Legal">
        <SettingsLinkRow href="/terms" icon={FileText} label="Terms of service" />
        <SettingsLinkRow href="/policy" icon={ShieldCheck} label="Privacy policy" />
      </SettingsGroup>

      {/* lg+: Sign out is the sidebar's footer instead. */}
      <SettingsGroup className="lg:hidden">
        <SignOutButton />
      </SettingsGroup>

      <div className={profileGroupClass("account", tab)}>
        <DeleteAccountCard />
      </div>
    </div>
  );
}
