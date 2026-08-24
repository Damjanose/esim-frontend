import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FileText, Globe2, LifeBuoy, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { Navbar } from "../components/Navbar";
import { SettingsLinkRow, SettingsSection } from "../components/SettingsSection";
import { SignOutButton } from "../components/SignOutButton";
import { SiteFooter } from "../SiteFooter";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { LinkedProviders, type LinkedIdentity } from "./LinkedProviders";

export const metadata: Metadata = createMetadata({
  path: "/profile",
  title: "Profile | eSim2you",
  description: "Manage your eSim2you account, plans, and preferences.",
  indexable: false
});

export default async function ProfilePage() {
  const jar = await cookies();
  const email = readEmailFromAccessToken(jar.get(ACCESS_COOKIE)?.value);

  // Supplementary: an email-only account has no identities, and a failure here
  // should not cost the visitor the rest of their profile.
  const identitiesResult = await fetchForPage<{ identities: LinkedIdentity[] }>(
    "/auth/identities",
    "/profile"
  );
  const identities = identitiesResult.ok ? identitiesResult.data.identities : [];

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-28 lg:px-10">
        <h1 className="font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-sm text-onSurfaceVariant">
          Your account, plans, and preferences.
        </p>

        <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-9 text-center shadow-brandCard">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-outline bg-mist text-brandBlue">
            <UserRound size={32} />
          </span>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.12em] text-onSurfaceVariant">
            Signed in as
          </p>
          <p className="mt-1.5 break-all font-display text-lg font-black text-brandBlue">
            {email ?? "Your eSim2you account"}
          </p>

          <div className="mt-7">
            <SignOutButton />
          </div>
        </div>

        <SettingsSection label="Plans">
          <SettingsLinkRow
            description="Your eSIMs, QR codes, and remaining data"
            href="/account"
            icon={Globe2}
            label="My eSIMs"
          />
        </SettingsSection>

        <SettingsSection label="Sign-in methods">
          <LinkedProviders identities={identities} />
        </SettingsSection>

        <SettingsSection label="Payments">
          <SettingsLinkRow
            description="Billing address and how your card is handled"
            href="/profile/billing"
            icon={Wallet}
            label="Payments and billing"
          />
        </SettingsSection>

        <SettingsSection label="Support">
          <SettingsLinkRow
            description="Installation help and contact options"
            href="/support"
            icon={LifeBuoy}
            label="Help and support"
          />
        </SettingsSection>

        <SettingsSection label="Legal">
          <SettingsLinkRow href="/terms" icon={FileText} label="Terms of service" />
          <SettingsLinkRow href="/policy" icon={ShieldCheck} label="Privacy policy" />
        </SettingsSection>

        <section className="mt-8">
          <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-onSurfaceVariant">
            Account
          </h2>
          <DeleteAccountCard />
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}
