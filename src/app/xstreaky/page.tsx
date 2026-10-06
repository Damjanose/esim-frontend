"use client";

import { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type PromoSettings = {
  enabled: boolean;
  requiredDays: number;
  discountPct: number;
  rewardValidDays: number;
  maxClaimsPerUser: number;
  campaignStartsAt: string | null;
  campaignEndsAt: string | null;
};

type PromoStats = { claims: number; redeemed: number; active: number; playersWithStreak: number };

type PromoPayload = {
  status?: string;
  data?: { settings?: PromoSettings; stats?: PromoStats };
  message?: string;
};

type Claim = {
  id: string;
  userEmail: string;
  discountPct: number;
  claimedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedKind: string | null;
  status: "redeemed" | "active" | "expired";
};

type ClaimsPayload = { status?: string; data?: { claims?: Claim[] }; message?: string };

/** Form state: numbers as strings so a half-typed value doesn't snap back, dates as `YYYY-MM-DD`. */
type Draft = {
  enabled: boolean;
  requiredDays: string;
  discountPct: string;
  rewardValidDays: string;
  maxClaimsPerUser: string;
  campaignStartsAt: string;
  campaignEndsAt: string;
};

type NumberKey = "requiredDays" | "discountPct" | "rewardValidDays" | "maxClaimsPerUser";

const NUMBER_FIELDS: Array<{ key: NumberKey; label: string; hint: string; max: number }> = [
  { key: "requiredDays", label: "Streak days to unlock", hint: "Consecutive days with all 4 games done", max: 365 },
  { key: "discountPct", label: "Discount %", hint: "Off one plan or top-up, stacks on a partner code", max: 90 },
  { key: "rewardValidDays", label: "Reward valid for (days)", hint: "From the moment it is claimed", max: 365 },
  { key: "maxClaimsPerUser", label: "Max claims per user", hint: "Within the campaign window", max: 1000 }
];

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function toDraft(settings: PromoSettings): Draft {
  return {
    enabled: settings.enabled,
    requiredDays: String(settings.requiredDays),
    discountPct: String(settings.discountPct),
    rewardValidDays: String(settings.rewardValidDays),
    maxClaimsPerUser: String(settings.maxClaimsPerUser),
    campaignStartsAt: toDateInput(settings.campaignStartsAt),
    campaignEndsAt: toDateInput(settings.campaignEndsAt)
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const STATUS_CLASSES: Record<Claim["status"], string> = {
  redeemed: "border-green-200 bg-green-50 text-green-700",
  active: "border-cyan/40 bg-[rgba(0,217,245,0.08)] text-cyanDeep",
  expired: "border-line bg-cloud text-muted"
};

export default function AdminStreakPromoPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function adminFetch<T>(path: string, init: RequestInit = {}, nextToken = token): Promise<T> {
    const response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${nextToken}`, "Content-Type": "application/json" },
      cache: "no-store"
    });
    const payload = (await response.json()) as { status?: string; message?: string };
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error("Session expired. Sign in again.");
    }
    if (!response.ok || payload.status !== "success") {
      throw new Error(payload.message ?? "Request failed");
    }
    return payload as T;
  }

  async function load(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");
    try {
      const [promo, claimList] = await Promise.all([
        adminFetch<PromoPayload>("/bff/admin/games-streak-promo", {}, nextToken),
        adminFetch<ClaimsPayload>("/bff/admin/games-streak-promo/claims?limit=50", {}, nextToken)
      ]);
      if (!promo.data?.settings) throw new Error("Could not load the streak promo");
      setDraft(toDraft(promo.data.settings));
      setStats(promo.data.stats ?? null);
      setClaims(claimList.data?.claims ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the streak promo");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function save() {
    if (!draft) return;
    const numbers: Record<string, number> = {};
    for (const field of NUMBER_FIELDS) {
      const value = Number(draft[field.key]);
      if (!Number.isInteger(value) || value < 1 || value > field.max) {
        setError(`${field.label} must be a whole number between 1 and ${field.max}.`);
        return;
      }
      numbers[field.key] = value;
    }
    if (draft.campaignStartsAt && draft.campaignEndsAt && draft.campaignEndsAt <= draft.campaignStartsAt) {
      setError("The campaign must end after it starts.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = await adminFetch<PromoPayload>("/bff/admin/games-streak-promo", {
        method: "PUT",
        body: JSON.stringify({
          enabled: draft.enabled,
          ...numbers,
          // Start of the first day and end of the last day, in UTC.
          campaignStartsAt: draft.campaignStartsAt ? `${draft.campaignStartsAt}T00:00:00.000Z` : null,
          campaignEndsAt: draft.campaignEndsAt ? `${draft.campaignEndsAt}T23:59:59.999Z` : null
        })
      });
      if (payload.data?.settings) setDraft(toDraft(payload.data.settings));
      if (payload.data?.stats) setStats(payload.data.stats);
      setNotice("Streak promo saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the streak promo");
    } finally {
      setIsSaving(false);
    }
  }

  const update = (patch: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...patch } : current));

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Games streak promo
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-muted">
              Players who finish all 4 daily games for enough days in a row can claim a discount on their next plan or
              top-up. Missing a day resets their run.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void load()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90"
                onClick={session.logout}
                type="button"
              >
                <LogOut aria-hidden="true" size={14} />
                Logout
              </button>
            </div>
          ) : null}
        </div>

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={session.login}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <div className="grid gap-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {notice}
              </div>
            ) : null}

            <section className="grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Claims (campaign)", value: stats?.claims },
                { label: "Redeemed (campaign)", value: stats?.redeemed },
                { label: "Active rewards", value: stats?.active },
                { label: "Live streaks", value: stats?.playersWithStreak }
              ].map((tile) => (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-card" key={tile.label}>
                  <p className="text-[10px] font-black uppercase tracking-wide text-muted">{tile.label}</p>
                  <p className="mt-1 font-display text-2xl font-black text-midnight">
                    {tile.value ?? (isLoading ? "…" : "—")}
                  </p>
                </div>
              ))}
            </section>

            {draft ? (
              <section className="max-w-3xl rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-muted">Promo settings</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-midnight">
                    <input
                      checked={draft.enabled}
                      className="h-4 w-4 accent-cyan"
                      onChange={(event) => update({ enabled: event.target.checked })}
                      type="checkbox"
                    />
                    {draft.enabled ? "Promo is on" : "Promo is off"}
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {NUMBER_FIELDS.map((field) => (
                    <label className="block text-xs font-bold text-muted" key={field.key}>
                      {field.label}
                      <input
                        className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight outline-none focus:border-cyan"
                        inputMode="numeric"
                        max={field.max}
                        min={1}
                        onChange={(event) => update({ [field.key]: event.target.value })}
                        type="number"
                        value={draft[field.key]}
                      />
                      <span className="mt-1 block text-[11px] font-semibold text-muted">{field.hint}</span>
                    </label>
                  ))}
                  <label className="block text-xs font-bold text-muted">
                    Campaign starts (UTC)
                    <input
                      className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight outline-none focus:border-cyan"
                      onChange={(event) => update({ campaignStartsAt: event.target.value })}
                      type="date"
                      value={draft.campaignStartsAt}
                    />
                    <span className="mt-1 block text-[11px] font-semibold text-muted">Empty means already open</span>
                  </label>
                  <label className="block text-xs font-bold text-muted">
                    Campaign ends (UTC)
                    <input
                      className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight outline-none focus:border-cyan"
                      onChange={(event) => update({ campaignEndsAt: event.target.value })}
                      type="date"
                      value={draft.campaignEndsAt}
                    />
                    <span className="mt-1 block text-[11px] font-semibold text-muted">
                      Empty means no end. Rewards already claimed stay valid until they expire.
                    </span>
                  </label>
                </div>

                <button
                  className="mt-5 h-10 w-full rounded-xl bg-gradient-to-r from-midnight to-ink text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50 sm:w-48"
                  disabled={isSaving}
                  onClick={() => void save()}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </section>
            ) : null}

            <section className="max-w-5xl rounded-2xl border border-line bg-white p-5 shadow-card">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted">Recent claims</p>
              {claims.length === 0 ? (
                <p className="mt-3 text-xs font-semibold text-muted">{isLoading ? "Loading..." : "No claims yet"}</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-line text-[10px] font-black uppercase tracking-wide text-muted">
                        <th className="py-2 pr-3">User</th>
                        <th className="py-2 pr-3">Discount</th>
                        <th className="py-2 pr-3">Claimed</th>
                        <th className="py-2 pr-3">Expires</th>
                        <th className="py-2 pr-3">Used</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim) => (
                        <tr className="border-b border-line/60 font-semibold text-midnight last:border-0" key={claim.id}>
                          <td className="py-2 pr-3">{claim.userEmail}</td>
                          <td className="py-2 pr-3">{claim.discountPct}%</td>
                          <td className="py-2 pr-3">{formatDate(claim.claimedAt)}</td>
                          <td className="py-2 pr-3">{formatDate(claim.expiresAt)}</td>
                          <td className="py-2 pr-3">
                            {claim.redeemedAt ? `${formatDate(claim.redeemedAt)} · ${claim.redeemedKind ?? ""}` : "—"}
                          </td>
                          <td className="py-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_CLASSES[claim.status]}`}
                            >
                              {claim.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
