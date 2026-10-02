import type { Metadata } from "next";
import { cookies } from "next/headers";
import { profileTabFromParam } from "@/lib/accountNav";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { accountShellItems } from "../account/accountShellItems";
import { AccountShell } from "../components/AccountShell";
import { Navbar } from "../components/Navbar";
import { SignOutButton } from "../components/SignOutButton";
import { SiteFooter } from "../SiteFooter";
import { ProfileTabs } from "./ProfileTabs";
import type { LinkedIdentity } from "./LinkedProviders";

export const metadata: Metadata = createMetadata({
  path: "/profile",
  title: "Profile | eSim2you",
  description: "Manage your eSim2you account, plans, and preferences.",
  indexable: false
});

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  // lg+: the sidebar's ?tab= picks the one section shown. Below lg every section shows.
  const tab = profileTabFromParam((await searchParams).tab);
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
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems(tab)} label="Account">
          <div className="px-1">
            <h1 className="font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              Profile
            </h1>
            <p className="mt-1 text-sm text-onSurfaceVariant">Your account, plans, and preferences.</p>
          </div>

          <ProfileTabs email={email} identities={identities} tab={tab} />
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
