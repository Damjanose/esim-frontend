"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, LogOut, Cpu } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type DiscountType = "percentage" | "flat";
type DiscountDirection = "decrease" | "increase";
type RowFilter = "all" | "adjust" | "trending" | "discount-label";

type PricingRow = {
  packageId: string;
  title: string;
  country: string | null;
  countryCode: string | null;
  flagUrl: string | null;
  type: string;
  network: string | null;
  dataLabel: string;
  durationDays: number;
  /** Weekly-snapshot Airalo net cost (what we pay). */
  originalPrice: number;
  /** Weekly-snapshot Airalo suggested resale price; caps the sell price. */
  recommendedRetailPrice?: number;
  /** This package's own markup %, or null when it follows the default. */
  markupPct: number | null;
  /** Markup actually applied (own ?? default); null = no default set, sells at suggested. */
  effectiveMarkupPct: number | null;
  /** True when the markup was cut down to the suggested sell price. */
  capped: boolean;
  retailPrice: number;
  discountEnabled: boolean;
  discountLabel: boolean;
  trending: boolean;
  discountType: DiscountType;
  discountValue: number;
  discountDirection: DiscountDirection;
  finalPrice: number;
};

type PricingListPayload = {
  status?: string;
  data?: { packages?: PricingRow[]; defaultMarkupPct?: number | null; basePricesCapturedAt?: string | null };
  message?: string;
};

type PricingRowPayload = {
  status?: string;
  data?: { pricing?: PricingRow };
  message?: string;
};

type BulkDiscountPayload = {
  status?: string;
  data?: { updatedCount?: number };
  message?: string;
};

type BulkMarkupPayload = {
  status?: string;
  data?: { updatedCount?: number; cappedCount?: number; markupPct?: number | null };
  message?: string;
};

type PricingSettingsPayload = {
  status?: string;
  data?: { defaultMarkupPct?: number | null; basePricesCapturedAt?: string | null };
  message?: string;
};

type RefreshBasePayload = {
  status?: string;
  data?: { packageCount?: number; capturedAt?: string | null };
  message?: string;
};

type ResetPricingPayload = {
  status?: string;
  data?: { resetCount?: number; packages?: PricingRow[] };
  message?: string;
};

type Draft = {
  /** Markup % as typed; "" = follow the default markup. */
  markup: string;
  discountEnabled: boolean;
  discountLabel: boolean;
  trending: boolean;
  discountType: DiscountType;
  discountValue: string;
  discountDirection: DiscountDirection;
};

function toDraft(row: PricingRow): Draft {
  return {
    markup: row.markupPct == null ? "" : String(row.markupPct),
    discountEnabled: row.discountEnabled,
    discountLabel: Boolean(row.discountLabel),
    trending: Boolean(row.trending),
    discountType: row.discountType,
    discountValue: String(row.discountValue),
    discountDirection: row.discountDirection
  };
}

/** Fixed Pokpay fee shown on every pricing row (EUR). */
const POK_FEE = 0.25;
const MAX_MARKUP_PCT = 1000;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/** Same as the backend: any cents round up to the next .00 / .50. */
function roundUpToHalf(value: number) {
  const cents = Math.round(value * 100);
  return Math.ceil(cents / 50) / 2;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(value);
}

function formatPct(value: number) {
  return `${Number(value.toFixed(2))}%`;
}

function suggestedSellPrice(row: Pick<PricingRow, "originalPrice" | "recommendedRetailPrice">) {
  return row.recommendedRetailPrice ?? row.originalPrice;
}

/** "" → null (use default); otherwise a markup between 0 and MAX, or NaN when invalid. */
function parseMarkupDraft(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_MARKUP_PCT ? parsed : Number.NaN;
}

/**
 * Mirrors the backend's computeRetailPrice: net × (1 + markup%), clamped to
 * [net, Airalo suggested]; with no markup at all it sells at suggested.
 */
function previewSellPrice(
  row: Pick<PricingRow, "originalPrice" | "recommendedRetailPrice">,
  markupDraft: string,
  defaultMarkupPct: number | null
): { sellPrice: number; capped: boolean } | null {
  const own = parseMarkupDraft(markupDraft);
  if (Number.isNaN(own)) return null;
  const cost = roundMoney(row.originalPrice);
  const cap = Math.max(cost, roundMoney(suggestedSellPrice(row)));
  const pct = own ?? defaultMarkupPct;
  if (pct == null) return { sellPrice: cap, capped: false };
  const uncapped = roundMoney(cost * (1 + pct / 100));
  return { sellPrice: Math.min(cap, Math.max(cost, uncapped)), capped: uncapped > cap };
}

function previewFinalPrice(sellPrice: number, draft: Draft): number | null {
  const discountValue = Number(draft.discountValue);
  if (!draft.discountEnabled) return roundUpToHalf(sellPrice);
  if (!Number.isFinite(discountValue) || discountValue < 0) return null;

  const delta = draft.discountType === "flat" ? discountValue : sellPrice * (discountValue / 100);
  const raw = draft.discountDirection === "increase" ? sellPrice + delta : sellPrice - delta;
  return Math.max(0, roundUpToHalf(raw));
}

function formatCapturedAt(value: string | null) {
  if (!value) return "never (snapshot fills on first catalog sync)";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminPricingPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [packages, setPackages] = useState<PricingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [bulkEnabled, setBulkEnabled] = useState(true);
  const [bulkType, setBulkType] = useState<DiscountType>("percentage");
  const [bulkValue, setBulkValue] = useState("10");
  const [bulkDirection, setBulkDirection] = useState<DiscountDirection>("decrease");
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [bulkMarkupValue, setBulkMarkupValue] = useState("30");
  const [isBulkMarkupApplying, setIsBulkMarkupApplying] = useState(false);
  const [defaultMarkupPct, setDefaultMarkupPct] = useState<number | null>(null);
  const [defaultMarkupDraft, setDefaultMarkupDraft] = useState("");
  const [basePricesCapturedAt, setBasePricesCapturedAt] = useState<string | null>(null);
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const [isRefreshingBase, setIsRefreshingBase] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function loadPricing(nextToken = token, options?: { clearError?: boolean }) {
    if (!nextToken) return;
    setIsLoading(true);
    if (options?.clearError !== false) {
      setError("");
    }

    try {
      const response = await fetch("/bff/admin/packages/pricing", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as PricingListPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load package pricing");
      }

      const rows = payload.data?.packages ?? [];
      const nextDefault = payload.data?.defaultMarkupPct ?? null;
      setDefaultMarkupPct(nextDefault);
      setDefaultMarkupDraft(nextDefault == null ? "" : String(nextDefault));
      setBasePricesCapturedAt(payload.data?.basePricesCapturedAt ?? null);
      setPackages(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.packageId, toDraft(row)])));
      setSelectedIds(new Set());
    } catch (err) {
      if (options?.clearError !== false) {
        setError(err instanceof Error ? err.message : "Could not load package pricing");
      }
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void loadPricing(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((row) => {
      const draft = drafts[row.packageId] ?? toDraft(row);
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        (row.country ?? "").toLowerCase().includes(q) ||
        row.packageId.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      switch (rowFilter) {
        case "adjust":
          return draft.discountEnabled;
        case "trending":
          return draft.trending;
        case "discount-label":
          return draft.discountLabel;
        default:
          return true;
      }
    });
  }, [drafts, packages, rowFilter, search]);

  const discountedCount = useMemo(() => packages.filter((row) => row.discountEnabled).length, [packages]);

  function updateDraft(packageId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [packageId]: { ...current[packageId], ...patch } }));
  }

  function toggleSelected(packageId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(packageId)) next.delete(packageId);
      else next.add(packageId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      const allSelected = filtered.every((row) => current.has(row.packageId));
      const next = new Set(current);
      for (const row of filtered) {
        if (allSelected) next.delete(row.packageId);
        else next.add(row.packageId);
      }
      return next;
    });
  }

  async function saveRow(packageId: string) {
    const draft = drafts[packageId];
    const row = packages.find((item) => item.packageId === packageId);
    if (!draft || !row) return;

    const markupPct = parseMarkupDraft(draft.markup);
    const discountValue = Number(draft.discountValue);
    if (Number.isNaN(markupPct)) {
      setError(`Markup must be a number between 0 and ${MAX_MARKUP_PCT}, or empty to use the default.`);
      return;
    }
    if (draft.discountEnabled && (!Number.isFinite(discountValue) || discountValue < 0)) {
      setError("Discount value must be a number of 0 or more.");
      return;
    }

    setSavingId(packageId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/packages/pricing/${encodeURIComponent(packageId)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          markupPct,
          discountEnabled: draft.discountEnabled,
          discountLabel: draft.discountLabel,
          trending: draft.trending,
          discountType: draft.discountType,
          discountValue,
          discountDirection: draft.discountDirection
        })
      });
      const payload = (await response.json()) as PricingRowPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.pricing) {
        throw new Error(payload.message ?? "Could not save pricing");
      }

      const updated = payload.data.pricing;
      setPackages((current) => current.map((item) => (item.packageId === packageId ? updated : item)));
      setDrafts((current) => ({ ...current, [packageId]: toDraft(updated) }));
      setNotice(`Saved ${updated.title}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save pricing");
    } finally {
      setSavingId(null);
    }
  }

  async function applyBulkDiscount(scope: "selected" | "all") {
    if (scope === "selected" && selectedIds.size === 0) {
      setError("Select at least one package first.");
      return;
    }

    const value = Number(bulkValue);
    if (bulkEnabled && (!Number.isFinite(value) || value < 0)) {
      setError("Enter a valid discount value.");
      return;
    }

    setIsBulkApplying(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/packages/pricing/bulk-discount", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          packageIds: scope === "all" ? "all" : Array.from(selectedIds),
          discountEnabled: bulkEnabled,
          discountType: bulkType,
          discountValue: bulkEnabled ? value : 0,
          discountDirection: bulkDirection
        })
      });
      const payload = (await response.json()) as BulkDiscountPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not apply bulk discount");
      }

      setNotice(`Applied discount to ${payload.data?.updatedCount ?? 0} package(s).`);
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply bulk discount");
    } finally {
      setIsBulkApplying(false);
    }
  }

  async function applyBulkMarkup(scope: "selected" | "all", clear = false) {
    if (scope === "selected" && selectedIds.size === 0) {
      setError("Select at least one package first.");
      return;
    }

    const markupPct = clear ? null : parseMarkupDraft(bulkMarkupValue);
    if (!clear && (markupPct == null || Number.isNaN(markupPct))) {
      setError(`Enter a markup between 0 and ${MAX_MARKUP_PCT}.`);
      return;
    }

    setIsBulkMarkupApplying(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/packages/pricing/bulk-markup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ packageIds: scope === "all" ? "all" : Array.from(selectedIds), markupPct })
      });
      const payload = (await response.json()) as BulkMarkupPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not apply bulk markup");
      }

      const updatedCount = payload.data?.updatedCount ?? 0;
      const cappedCount = payload.data?.cappedCount ?? 0;
      const label = markupPct == null ? "Cleared markup (now default)" : `Set markup to ${formatPct(markupPct)}`;
      const capNote = cappedCount > 0 ? ` (${cappedCount} capped at Airalo suggested sell)` : "";
      setNotice(`${label} on ${updatedCount} package(s)${capNote}.`);
      await loadPricing(token, { clearError: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply bulk markup");
    } finally {
      setIsBulkMarkupApplying(false);
    }
  }

  async function saveDefaultMarkup() {
    const next = parseMarkupDraft(defaultMarkupDraft);
    if (Number.isNaN(next)) {
      setError(`Default markup must be a number between 0 and ${MAX_MARKUP_PCT}, or empty for none.`);
      return;
    }

    setIsSavingDefault(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/pricing/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ defaultMarkupPct: next })
      });
      const payload = (await response.json()) as PricingSettingsPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not save default markup");
      }

      setNotice(next == null ? "Default markup cleared." : `Default markup set to ${formatPct(next)}.`);
      await loadPricing(token, { clearError: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save default markup");
    } finally {
      setIsSavingDefault(false);
    }
  }

  async function refreshBasePrices() {
    setIsRefreshingBase(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/packages/pricing/refresh-base", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as RefreshBasePayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not refresh prices from Airalo");
      }

      setNotice(`Pulled Airalo's latest prices for ${payload.data?.packageCount ?? 0} package(s).`);
      await loadPricing(token, { clearError: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh prices from Airalo");
    } finally {
      setIsRefreshingBase(false);
    }
  }

  async function resetPricing(packageIds: "all" | string[]) {
    if (packageIds !== "all" && packageIds.length === 0) {
      setError("Select at least one package first.");
      return;
    }

    setIsResetting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/packages/pricing/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ packageIds })
      });
      const payload = (await response.json()) as ResetPricingPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not reset package pricing");
      }

      setNotice(`Reset ${payload.data?.resetCount ?? 0} package(s) to the default markup.`);
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset package pricing");
    } finally {
      setIsResetting(false);
    }
  }

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
              Price management
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Buy price is what Airalo charges us, frozen weekly (Monday 03:00). Sell price is buy price plus the
              markup % (the package&apos;s own, or the default), capped at Airalo&apos;s suggested sell. Price is
              the final marketplace amount after adjustments, rounded up to .00/.50.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void loadPricing()}
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
          <div className="grid min-w-0 gap-5">
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,217,245,0.14),transparent_70%)]"
                />
                <p className="text-[10px] font-black uppercase tracking-wide text-muted">Total packages</p>
                <p className="mt-1 font-display text-2xl font-black text-midnight">{packages.length}</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,217,245,0.14),transparent_70%)]"
                />
                <p className="text-[10px] font-black uppercase tracking-wide text-muted">With discount</p>
                <p className="mt-1 font-display text-2xl font-black text-midnight">{discountedCount}</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,217,245,0.14),transparent_70%)]"
                />
                <p className="text-[10px] font-black uppercase tracking-wide text-muted">Selected</p>
                <p className="mt-1 font-display text-2xl font-black text-midnight">{selectedIds.size}</p>
              </div>
            </div>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Pricing basis</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-6 md:items-end">
                <label className="text-xs font-bold text-muted md:col-span-2">
                  Default markup %
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight"
                    inputMode="decimal"
                    onChange={(event) => setDefaultMarkupDraft(event.target.value)}
                    placeholder="none — sells at Airalo suggested"
                    value={defaultMarkupDraft}
                  />
                </label>
                <button
                  className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  disabled={isSavingDefault}
                  onClick={() => void saveDefaultMarkup()}
                  type="button"
                >
                  {isSavingDefault ? "Saving..." : "Save default"}
                </button>
                <div className="text-xs font-semibold text-muted md:col-span-2">
                  Airalo prices last updated
                  <p className="mt-1 text-sm font-bold text-midnight">{formatCapturedAt(basePricesCapturedAt)}</p>
                </div>
                <button
                  className="h-10 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                  disabled={isRefreshingBase}
                  onClick={() => void refreshBasePrices()}
                  type="button"
                >
                  {isRefreshingBase ? "Refreshing..." : "Refresh prices now"}
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">
                Applies to every package without its own markup
                {defaultMarkupPct == null ? " (none set: those packages sell at Airalo's suggested price)" : ` (now ${formatPct(defaultMarkupPct)})`}.
                Airalo prices refresh automatically every Monday at 03:00; &ldquo;Refresh prices now&rdquo; pulls them
                immediately and may move every price.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Bulk discount</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-6 md:items-end">
                <label className="flex items-center gap-2 text-sm font-bold text-midnight">
                  <input
                    checked={bulkEnabled}
                    onChange={(event) => setBulkEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  Enable adjustment
                </label>
                <label className="text-xs font-bold text-muted">
                  Direction
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight disabled:opacity-50"
                    disabled={!bulkEnabled}
                    onChange={(event) => setBulkDirection(event.target.value as DiscountDirection)}
                    value={bulkDirection}
                  >
                    <option value="decrease">Decrease (discount)</option>
                    <option value="increase">Increase (markup)</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  Type
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight disabled:opacity-50"
                    disabled={!bulkEnabled}
                    onChange={(event) => setBulkType(event.target.value as DiscountType)}
                    value={bulkType}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat amount</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  Value
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight disabled:opacity-50"
                    disabled={!bulkEnabled}
                    inputMode="decimal"
                    onChange={(event) => setBulkValue(event.target.value)}
                    value={bulkValue}
                  />
                </label>
                <button
                  className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  disabled={isBulkApplying}
                  onClick={() => void applyBulkDiscount("selected")}
                  type="button"
                >
                  Apply to selected ({selectedIds.size})
                </button>
                <button
                  className="h-10 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                  disabled={isBulkApplying}
                  onClick={() => void applyBulkDiscount("all")}
                  type="button"
                >
                  Apply to ALL packages
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">
                Bulk discount only changes the adjustment fields — markups are left as they are.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Bulk markup</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-6 md:items-end">
                <label className="text-xs font-bold text-muted">
                  Markup %
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight"
                    inputMode="decimal"
                    onChange={(event) => setBulkMarkupValue(event.target.value)}
                    placeholder="30"
                    value={bulkMarkupValue}
                  />
                </label>
                <button
                  className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  disabled={isBulkMarkupApplying}
                  onClick={() => void applyBulkMarkup("selected")}
                  type="button"
                >
                  {isBulkMarkupApplying ? "Applying…" : `Apply to selected (${selectedIds.size})`}
                </button>
                <button
                  className="h-10 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                  disabled={isBulkMarkupApplying}
                  onClick={() => void applyBulkMarkup("all")}
                  type="button"
                >
                  {isBulkMarkupApplying ? "Applying…" : "Apply to ALL packages"}
                </button>
                <button
                  className="h-10 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                  disabled={isBulkMarkupApplying}
                  onClick={() => void applyBulkMarkup("selected", true)}
                  type="button"
                >
                  Use default for selected
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">
                Sets each target package&apos;s own markup. Sell price = buy price × (1 + markup), capped at Airalo&apos;s
                suggested sell. Adjustment fields are left unchanged.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Reset to default</h2>
              <p className="mt-1 text-xs font-semibold text-muted">
                Clears a package&apos;s own markup and adjustment, so it goes back to the default markup with no
                adjustment.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="h-10 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                  disabled={isResetting}
                  onClick={() => void resetPricing(Array.from(selectedIds))}
                  type="button"
                >
                  {isResetting ? "Resetting..." : `Reset selected (${selectedIds.size})`}
                </button>
                <button
                  className="h-10 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                  disabled={isResetting}
                  onClick={() => void resetPricing("all")}
                  type="button"
                >
                  {isResetting ? "Resetting..." : "Reset ALL to default"}
                </button>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3.5">
                <div className="flex w-full max-w-2xl flex-wrap items-center gap-2">
                  <input
                    className="h-10 min-w-[240px] flex-1 rounded-xl border border-line px-3.5 text-sm outline-none transition focus:border-cyan"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, country, or package id"
                    value={search}
                  />
                  <select
                    className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-midnight outline-none transition focus:border-cyan"
                    onChange={(event) => setRowFilter(event.target.value as RowFilter)}
                    value={rowFilter}
                  >
                    <option value="all">All rows</option>
                    <option value="adjust">Adjust on</option>
                    <option value="trending">Trending on</option>
                    <option value="discount-label">Discount label on</option>
                  </select>
                </div>
                <p className="text-xs font-bold text-muted">
                  Showing {filtered.length} of {packages.length}
                </p>
              </div>
              <div className="max-w-full overflow-x-auto overscroll-x-contain">
                <table className="w-max min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8fdfe]">
                      <th className="px-5 py-3">
                        <input
                          checked={filtered.length > 0 && filtered.every((row) => selectedIds.has(row.packageId))}
                          onChange={toggleSelectAllVisible}
                          type="checkbox"
                        />
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Coverage
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Type
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Network
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Package
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Validity
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Buy price (weekly)
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Pok
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Suggested sell
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Markup %
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Sell price
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Profit
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Adjustment
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Price
                      </th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const draft = drafts[row.packageId] ?? toDraft(row);
                      const sell = previewSellPrice(row, draft.markup, defaultMarkupPct);
                      const sellPrice = sell?.sellPrice ?? null;
                      const preview = sellPrice == null ? null : previewFinalPrice(sellPrice, draft);
                      const markupInvalid = sell == null;
                      const discounted =
                        draft.discountEnabled &&
                        preview != null &&
                        sellPrice != null &&
                        preview !== sellPrice;

                      return (
                        <tr className="border-t border-line/60 align-top hover:bg-[#fbfeff]" key={row.packageId}>
                          <td className="px-5 py-3">
                            <input
                              checked={selectedIds.has(row.packageId)}
                              onChange={() => toggleSelected(row.packageId)}
                              type="checkbox"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {row.flagUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" className="h-4 w-6 rounded-sm object-cover" src={row.flagUrl} />
                              ) : null}
                              <p className="font-bold text-midnight">{row.country ?? "N/A"}</p>
                            </div>
                            <p className="text-xs text-muted">{row.packageId}</p>
                          </td>
                          <td className="px-3 py-3 text-muted" title={row.type}>
                            <Cpu aria-hidden="true" size={18} />
                          </td>
                          <td className="px-3 py-3 text-midnight">{row.network ?? "N/A"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-midnight">{row.dataLabel}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-midnight">{row.durationDays} days</td>
                          <td className="whitespace-nowrap px-3 py-3 text-muted" title="What Airalo charges us for this package">
                            {formatPrice(row.originalPrice)}
                          </td>
                          <td
                            className="whitespace-nowrap px-3 py-3 text-muted"
                            title="Fixed Pokpay fee"
                          >
                            {formatPrice(POK_FEE)}
                          </td>
                          <td
                            className="whitespace-nowrap px-3 py-3 text-muted"
                            title="Airalo recommended retail price"
                          >
                            {formatPrice(row.recommendedRetailPrice ?? row.originalPrice)}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              className={`h-9 w-20 rounded-lg border px-2 text-sm outline-none focus:border-cyan ${
                                markupInvalid ? "border-red-400 text-red-600" : "border-line text-midnight"
                              }`}
                              inputMode="decimal"
                              onChange={(event) => updateDraft(row.packageId, { markup: event.target.value })}
                              placeholder={defaultMarkupPct == null ? "—" : String(defaultMarkupPct)}
                              title="Empty = use the default markup"
                              value={draft.markup}
                            />
                            {draft.markup.trim() === "" ? (
                              <p className="mt-1 text-[10px] font-bold text-muted">default</p>
                            ) : null}
                          </td>
                          <td
                            className="whitespace-nowrap px-3 py-3 font-bold text-midnight"
                            title={`Buy × (1 + markup), capped at suggested ${formatPrice(suggestedSellPrice(row))}`}
                          >
                            {sellPrice == null ? "—" : formatPrice(sellPrice)}
                            {sell?.capped ? (
                              <span className="ml-1.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                                capped
                              </span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-midnight" title="Sell price − buy price">
                            {sellPrice == null ? "—" : formatPrice(roundMoney(sellPrice - row.originalPrice))}
                          </td>
                          <td className="px-3 py-3">
                            <label className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-midnight">
                              <input
                                checked={draft.discountEnabled}
                                onChange={(event) =>
                                  updateDraft(row.packageId, { discountEnabled: event.target.checked })
                                }
                                type="checkbox"
                              />
                              Adjust
                            </label>
                            <label className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-midnight">
                              <input
                                checked={draft.discountLabel}
                                onChange={(event) =>
                                  updateDraft(row.packageId, { discountLabel: event.target.checked })
                                }
                                type="checkbox"
                              />
                              Discount label
                            </label>
                            <label className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-midnight">
                              <input
                                checked={draft.trending}
                                onChange={(event) =>
                                  updateDraft(row.packageId, { trending: event.target.checked })
                                }
                                type="checkbox"
                              />
                              Trending
                            </label>
                            <div className="mt-1.5 flex gap-1">
                              <select
                                className="h-9 rounded-lg border border-line px-1 text-xs disabled:opacity-50"
                                disabled={!draft.discountEnabled}
                                onChange={(event) =>
                                  updateDraft(row.packageId, {
                                    discountDirection: event.target.value as DiscountDirection
                                  })
                                }
                                value={draft.discountDirection}
                              >
                                <option value="decrease">−</option>
                                <option value="increase">+</option>
                              </select>
                              <select
                                className="h-9 rounded-lg border border-line px-1 text-xs disabled:opacity-50"
                                disabled={!draft.discountEnabled}
                                onChange={(event) =>
                                  updateDraft(row.packageId, { discountType: event.target.value as DiscountType })
                                }
                                value={draft.discountType}
                              >
                                <option value="percentage">%</option>
                                <option value="flat">flat</option>
                              </select>
                              <input
                                className="h-9 w-16 rounded-lg border border-line px-2 text-xs disabled:opacity-50"
                                disabled={!draft.discountEnabled}
                                inputMode="decimal"
                                onChange={(event) => updateDraft(row.packageId, { discountValue: event.target.value })}
                                value={draft.discountValue}
                              />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {preview == null ? (
                              "—"
                            ) : discounted ? (
                              <span className="flex flex-col leading-tight">
                                <span className="text-xs text-muted line-through">
                                  {formatPrice(sellPrice!)}
                                </span>
                                <span className="font-black text-midnight">{formatPrice(preview)}</span>
                              </span>
                            ) : (
                              <span className="font-black text-midnight">{formatPrice(preview)}</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5">
                              <button
                                className="h-9 rounded-lg bg-gradient-to-r from-midnight to-ink px-3 text-xs font-black text-aqua shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                disabled={savingId === row.packageId}
                                onClick={() => void saveRow(row.packageId)}
                                type="button"
                              >
                                {savingId === row.packageId ? "Saving..." : "Save"}
                              </button>
                              <button
                                className="h-9 rounded-lg border border-line px-3 text-xs font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
                                disabled={isResetting}
                                onClick={() => void resetPricing([row.packageId])}
                                type="button"
                              >
                                Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-center font-bold text-muted" colSpan={15}>
                          {isLoading ? "Loading packages..." : "No packages found"}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
