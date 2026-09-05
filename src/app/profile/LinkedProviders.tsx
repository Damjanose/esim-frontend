"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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
      <p className="border-b border-outline/70 px-1 py-4 text-sm text-onSurfaceVariant">
        No sign-in providers linked. You sign in with an emailed code.
      </p>
    );
  }

  return (
    <>
      <ul>
        {identities.map((identity) => (
          <li
            className="flex items-center gap-4 border-b border-outline/70 px-1 py-4"
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

            <button
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-outline px-4 text-xs font-black text-onSurfaceVariant transition hover:border-brandBlue/75 hover:text-brandInk disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending !== null}
              onClick={() => void unlink(identity.provider)}
              type="button"
            >
              {pending === identity.provider ? (
                <Loader2 className="animate-spin" size={13} />
              ) : null}
              Unlink
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="border-b border-outline/70 px-1 py-4 text-sm font-semibold text-error">{error}</p>
      ) : null}
    </>
  );
}
