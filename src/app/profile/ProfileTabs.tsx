"use client";

import { useState } from "react";
import {
  FileText,
  Globe2,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  UserRound,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SettingsLinkRow } from "../components/SettingsSection";
import { SignOutButton } from "../components/SignOutButton";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { LinkedProviders, type LinkedIdentity } from "./LinkedProviders";

type TabId = "account" | "signin" | "payments" | "support" | "legal";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "signin", label: "Sign-in methods", icon: KeyRound },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "legal", label: "Legal", icon: FileText }
];

export function ProfileTabs({
  email,
  identities
}: {
  email: string | null;
  identities: LinkedIdentity[];
}) {
  const [active, setActive] = useState<TabId>("account");

  return (
    <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      <nav
        aria-label="Profile sections"
        className="flex gap-1 overflow-x-auto pb-2 lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0 lg:sticky lg:top-28"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-mist text-brandBlue"
                  : "text-onSurfaceVariant hover:bg-mist/60 hover:text-brandInk"
              }`}
              key={tab.id}
              onClick={() => setActive(tab.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={17} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1">
        {active === "account" ? (
          <section>
            <h2 className="text-[13px] font-semibold text-onSurfaceVariant">Account</h2>

            <div className="mt-3 border-t border-outline/70">
              <div className="flex items-center gap-4 border-b border-outline/70 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-onSurfaceVariant">Signed in as</span>
                  <span className="mt-0.5 block break-all font-display text-lg font-black text-brandBlue">
                    {email ?? "Your eSim2you account"}
                  </span>
                </span>
              </div>

              <SettingsLinkRow
                description="Your eSIMs, QR codes, and remaining data"
                href="/account"
                icon={Globe2}
                label="My eSIMs"
              />
            </div>

            <div className="mt-8 flex flex-col items-start gap-4">
              <SignOutButton />
              <DeleteAccountCard />
            </div>
          </section>
        ) : null}

        {active === "signin" ? (
          <section>
            <h2 className="text-[13px] font-semibold text-onSurfaceVariant">Sign-in methods</h2>
            <div className="mt-3 border-t border-outline/70">
              <LinkedProviders identities={identities} />
            </div>
          </section>
        ) : null}

        {active === "payments" ? (
          <section>
            <h2 className="text-[13px] font-semibold text-onSurfaceVariant">Payments</h2>
            <div className="mt-3 border-t border-outline/70">
              <SettingsLinkRow
                description="Billing address and how your card is handled"
                href="/profile/billing"
                icon={Wallet}
                label="Payments and billing"
              />
            </div>
          </section>
        ) : null}

        {active === "support" ? (
          <section>
            <h2 className="text-[13px] font-semibold text-onSurfaceVariant">Support</h2>
            <div className="mt-3 border-t border-outline/70">
              <SettingsLinkRow
                description="Installation help and contact options"
                href="/support"
                icon={LifeBuoy}
                label="Help and support"
              />
            </div>
          </section>
        ) : null}

        {active === "legal" ? (
          <section>
            <h2 className="text-[13px] font-semibold text-onSurfaceVariant">Legal</h2>
            <div className="mt-3 border-t border-outline/70">
              <SettingsLinkRow href="/terms" icon={FileText} label="Terms of service" />
              <SettingsLinkRow href="/policy" icon={ShieldCheck} label="Privacy policy" />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
