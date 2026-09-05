import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { ProfileTabs } from "./ProfileTabs";
import type { LinkedIdentity } from "./LinkedProviders";

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

      <section className="mx-auto w-full max-w-4xl px-5 pb-24 pt-28 lg:px-10">
        <h1 className="font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-sm text-onSurfaceVariant">
          Your account, plans, and preferences.
        </p>

        <ProfileTabs email={email} identities={identities} />
      </section>

      <SiteFooter />
    </main>
  );
}
