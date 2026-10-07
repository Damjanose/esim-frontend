"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../components/Button";

export type LinkedIdentity = {
  provider: "google" | "apple";
  providerEmail: string | null;
  isPrivateRelay: boolean;
  lastLoginAt: string | null;
};

const PROVIDER_LABELS: Record<LinkedIdentity["provider"], string> = {
  google: "Google",
  apple: "Apple"
};

function describeIdentity(identity: LinkedIdentity): string {
  if (identity.isPrivateRelay) return "Hidden email";
  return identity.providerEmail ?? "Linked";
}

export function LinkedProviders({ identities }: { identities: LinkedIdentity[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function unlink(provider: string) {
    setPending(provider);
    setError(null);

    try {
      const response = await fetch(`/bff/auth/identities/${provider}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setPending(null);
        // 409 here means this is the only way into the account.
        setError(payload.error ?? "We could not unlink that provider. Please try again.");
        return;
      }

      setPending(null);
      router.refresh();
    } catch {
      setPending(null);
      setError("We could not reach the server. Please try again.");
    }
  }

  if (identities.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-onSurfaceVariant">
        No sign-in providers linked. You sign in with an emailed code.
      </p>
    );
  }

  return (
    <>
      {/* Inside a SettingsGroup card: rows split by hairlines like the card's own. */}
      <ul className="divide-y divide-outline/60">
        {identities.map((identity) => (
          <li
            className="flex min-h-14 items-center gap-4 px-4 py-3"
            key={identity.provider}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-brandInk">
                {PROVIDER_LABELS[identity.provider]}
              </span>
              <span className="mt-0.5 block truncate text-xs text-onSurfaceVariant">
                {describeIdentity(identity)}
              </span>
            </span>

            <Button
              className="shrink-0"
              disabled={pending !== null}
              onClick={() => void unlink(identity.provider)}
              type="button"
              variant="tint"
            >
              {pending === identity.provider ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={14} />
              ) : null}
              Unlink
            </Button>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="px-4 py-4 text-sm font-semibold text-error">{error}</p>
      ) : null}
    </>
  );
}
