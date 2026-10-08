import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { accountShellItems } from "../../account/accountShellItems";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { SupportChat } from "./SupportChat";

export const metadata: Metadata = createMetadata({
  path: "/profile/support",
  title: "Chat with support | eSIM2you",
  description: "Message the eSIM2you support team about your eSIM, order, or payment.",
  indexable: false
});

/** Signed-in only: middleware sends visitors without a session to /signin?next=/profile/support. */
export default function SupportChatPage() {
  return (
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("support")} label="Account">
          <div className="max-w-[720px]">
            <Link
              className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
              href="/profile?tab=support"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              Profile
            </Link>

            <h1 className="mt-3 px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              Chat with support
            </h1>
            <p className="mt-1 px-1 text-sm text-onSurfaceVariant">
              The same conversation you see in the eSIM2you app.
            </p>

            <SupportChat />
          </div>
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
