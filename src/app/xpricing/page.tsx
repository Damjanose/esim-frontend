"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, LogOut, Cpu } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type DiscountType = "percentage" | "flat";
type DiscountDirection = "decrease" | "increase";
type RowFilter = "all" | "adjust" | "trending" | "discount-label";
type BulkProfitMode = "set" | "adjust";

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
  originalPrice: number;
  recommendedRetailPrice?: number;
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
  data?: { packages?: PricingRow[] };
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

type ResetPricingPayload = {
  status?: string;
  data?: { resetCount?: number; packages?: PricingRow[] };
  message?: string;
};

type Draft = {
  profit: string;
  discountEnabled: boolean;
  discountLabel: boolean;
  trending: boolean;
  discountType: DiscountType;
  discountValue: string;
  discountDirection: DiscountDirection;
};

function toDraft(row: PricingRow): Draft {
  return {
    profit: String(profitFromPrices(row.originalPrice, row.retailPrice)),
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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(value);
}

function profitFromPrices(buyPrice: number, sellPrice: number) {
  return roundMoney(sellPrice - buyPrice);
}

function sellFromProfit(buyPrice: number, profit: number) {
  return Math.max(0, roundMoney(buyPrice + profit));
}

function suggestedSellPrice(row: Pick<PricingRow, "originalPrice" | "recommendedRetailPrice">) {
  return row.recommendedRetailPrice ?? row.originalPrice;
}

/** Sell price must sit between Airalo buy (min) and Airalo suggested retail (max). */
function sellPriceBounds(row: Pick<PricingRow, "originalPrice" | "recommendedRetailPrice">) {
  const min = row.originalPrice;
  const max = Math.max(min, suggestedSellPrice(row));
  return { min, max };
}

function clampSellPrice(
  row: Pick<PricingRow, "originalPrice" | "recommendedRetailPrice">,
  sellPrice: number
) {
  const { min, max } = sellPriceBounds(row);
  return Math.min(max, Math.max(min, roundMoney(sellPrice)));
}

function validateSellPrice(
  row: Pick<PricingRow, "originalPrice" | "recommendedRetailPrice">,
  sellPrice: number
): string | null {
  if (!Number.isFinite(sellPrice)) return "Sell price must be a number.";
  const { min, max } = sellPriceBounds(row);
  if (sellPrice < min) {
    return `Sell price must be at least the buy price (${formatPrice(min)}).`;
  }
  if (sellPrice > max) {
    return `Sell price must be at most Airalo's suggested sell (${formatPrice(max)}).`;
  }
  return null;
}

function previewSellPrice(buyPrice: number, profitDraft: string): number | null {
  const profit = Number(profitDraft);
  if (!Number.isFinite(buyPrice) || !Number.isFinite(profit)) return null;
  return sellFromProfit(buyPrice, profit);
}

function applyProfitAdjustment(
  profit: number,
  direction: DiscountDirection,
  type: DiscountType,
  value: number
) {
  const delta = type === "flat" ? value : profit * (value / 100);
  const raw = direction === "increase" ? profit + delta : profit - delta;
  return roundMoney(raw);
}

function previewFinalPrice(buyPrice: number, draft: Draft): number | null {
  const retailPrice = previewSellPrice(buyPrice, draft.profit);
  const discountValue = Number(draft.discountValue);
  if (retailPrice == null) return null;
  if (!draft.discountEnabled) return retailPrice;
  if (!Number.isFinite(discountValue) || discountValue < 0) return null;

  const delta = draft.discountType === "flat" ? discountValue : retailPrice * (discountValue / 100);
  const raw = draft.discountDirection === "increase" ? retailPrice + delta : retailPrice - delta;
  return Math.max(0, roundMoney(raw));
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
  const [bulkProfitMode, setBulkProfitMode] = useState<BulkProfitMode>("set");
  const [bulkProfitType, setBulkProfitType] = useState<DiscountType>("flat");
  const [bulkProfitValue, setBulkProfitValue] = useState("1.50");
  const [bulkProfitDirection, setBulkProfitDirection] = useState<DiscountDirection>("increase");
  const [isBulkProfitApplying, setIsBulkProfitApplying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function loadPricing(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");

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
      setPackages(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.packageId, toDraft(row)])));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load package pricing");
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

    const profit = Number(draft.profit);
    const discountValue = Number(draft.discountValue);
    if (!Number.isFinite(profit)) {
      setError("Profit must be a number.");
      return;
    }
    const retailPrice = sellFromProfit(row.originalPrice, profit);
    const sellError = validateSellPrice(row, retailPrice);
    if (sellError) {
      setError(sellError);
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
          retailPrice,
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

  async function applyBulkProfit(scope: "selected" | "all") {
    if (scope === "selected" && selectedIds.size === 0) {
      setError("Select at least one package first.");
      return;
    }

    const value = Number(bulkProfitValue);
    if (!Number.isFinite(value) || value < 0) {
      setError(
        bulkProfitMode === "set"
          ? "Enter a valid profit amount (0 or more)."
          : "Enter a valid profit adjustment value."
      );
      return;
    }

    const targets =
      scope === "all" ? packages : packages.filter((row) => selectedIds.has(row.packageId));
    if (targets.length === 0) {
      setError("No packages to update.");
      return;
    }

    setIsBulkProfitApplying(true);
    setError("");
    setNotice("");

    try {
      let updatedCount = 0;
      let clampedCount = 0;
      for (const row of targets) {
        const draft = drafts[row.packageId] ?? toDraft(row);
        let nextProfit: number;
        if (bulkProfitMode === "set") {
          nextProfit = roundMoney(value);
        } else {
          const currentProfit = Number(draft.profit);
          if (!Number.isFinite(currentProfit)) {
            throw new Error(`Invalid profit on ${row.packageId}`);
          }
          nextProfit = applyProfitAdjustment(
            currentProfit,
            bulkProfitDirection,
            bulkProfitType,
            value
          );
        }
        const uncappedSell = sellFromProfit(row.originalPrice, nextProfit);
        const retailPrice = clampSellPrice(row, uncappedSell);
        if (retailPrice !== uncappedSell) clampedCount += 1;
        const discountValue = Number(draft.discountValue);

        const response = await fetch(`/bff/admin/packages/pricing/${encodeURIComponent(row.packageId)}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            retailPrice,
            discountEnabled: draft.discountEnabled,
            discountLabel: draft.discountLabel,
            trending: draft.trending,
            discountType: draft.discountType,
            discountValue: Number.isFinite(discountValue) ? discountValue : 0,
            discountDirection: draft.discountDirection
          })
        });
        const payload = (await response.json()) as PricingRowPayload;

        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired. Sign in again.");
        }
        if (!response.ok || payload.status !== "success") {
          throw new Error(payload.message ?? `Could not update profit for ${row.packageId}`);
        }
        updatedCount += 1;
      }

      const modeLabel =
        bulkProfitMode === "set"
          ? `Set profit to ${formatPrice(value)}`
          : "Applied profit adjustment";
      const clampNote =
        clampedCount > 0
          ? ` (${clampedCount} clamped to buy…suggested sell range)`
          : "";
      setNotice(`${modeLabel} on ${updatedCount} package(s)${clampNote}.`);
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply bulk profit");
      await loadPricing();
    } finally {
      setIsBulkProfitApplying(false);
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

      setNotice(`Reset ${payload.data?.resetCount ?? 0} package(s) to the Airalo default price.`);
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset package pricing");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-cloud">
      <AdminNav />
      <div className="min-w-0 flex-1 px-6 py-7 md:px-9">
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
              Set profit and adjustments per package. Buy price is what Airalo charges us; Suggested sell is
              Airalo&apos;s recommended retail; sell price is buy plus profit and must stay between buy and
              suggested sell; Price is the final amount shown in the marketplace after adjustments.
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
                Bulk discount only changes the adjustment fields — sell prices and profit are left as they are.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Bulk profit</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-6 md:items-end">
                <label className="text-xs font-bold text-muted">
                  Mode
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight"
                    onChange={(event) => setBulkProfitMode(event.target.value as BulkProfitMode)}
                    value={bulkProfitMode}
                  >
                    <option value="set">Set exact profit</option>
                    <option value="adjust">Adjust (+/−)</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  Direction
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight disabled:opacity-50"
                    disabled={bulkProfitMode === "set"}
                    onChange={(event) => setBulkProfitDirection(event.target.value as DiscountDirection)}
                    value={bulkProfitDirection}
                  >
                    <option value="decrease">Decrease profit</option>
                    <option value="increase">Increase profit</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  Type
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight disabled:opacity-50"
                    disabled={bulkProfitMode === "set"}
                    onChange={(event) => setBulkProfitType(event.target.value as DiscountType)}
                    value={bulkProfitType}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat amount</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  {bulkProfitMode === "set" ? "Profit amount" : "Value"}
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight"
                    inputMode="decimal"
                    onChange={(event) => setBulkProfitValue(event.target.value)}
                    placeholder={bulkProfitMode === "set" ? "1.50" : "0.50"}
                    value={bulkProfitValue}
                  />
                </label>
                <button
                  className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  disabled={isBulkProfitApplying}
                  onClick={() => void applyBulkProfit("selected")}
                  type="button"
                >
                  Apply to selected ({selectedIds.size})
                </button>
                <button
                  className="h-10 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                  disabled={isBulkProfitApplying}
                  onClick={() => void applyBulkProfit("all")}
                  type="button"
                >
                  Apply to ALL packages
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">
                {bulkProfitMode === "set"
                  ? "Set exact profit saves sell price as buy + that amount on every target package (clamped between buy and Airalo suggested sell)."
                  : "Adjust mode changes each row's current profit by % or flat amount, then saves sell as buy + profit (same clamp)."}{" "}
                Adjustment fields are left unchanged.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Reset to default</h2>
              <p className="mt-1 text-xs font-semibold text-muted">
                Clears any admin-set sell price and adjustment, reverting the sell price back to the Airalo buy
                price for the package.
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
                        Buy price
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Pok
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Suggested sell
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
                      const sellPrice = previewSellPrice(row.originalPrice, draft.profit);
                      const preview = previewFinalPrice(row.originalPrice, draft);
                      const profit = Number(draft.profit);
                      const profitValid = Number.isFinite(profit);
                      const sellOutOfBounds =
                        sellPrice != null && validateSellPrice(row, sellPrice) != null;
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
                          <td
                            className={`whitespace-nowrap px-3 py-3 font-bold ${
                              sellOutOfBounds ? "text-red-600" : "text-midnight"
                            }`}
                            title={`Buy + profit; must be between ${formatPrice(row.originalPrice)} and ${formatPrice(suggestedSellPrice(row))}`}
                          >
                            {sellPrice == null ? "—" : formatPrice(sellPrice)}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              className={`h-9 w-24 rounded-lg border px-2 text-sm outline-none focus:border-cyan ${
                                sellOutOfBounds || (profitValid && profit < 0)
                                  ? "border-red-400 text-red-600"
                                  : "border-line text-midnight"
                              }`}
                              inputMode="decimal"
                              onChange={(event) => updateDraft(row.packageId, { profit: event.target.value })}
                              title={`Profit so sell stays between buy (${formatPrice(row.originalPrice)}) and suggested (${formatPrice(suggestedSellPrice(row))})`}
                              value={draft.profit}
                            />
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
                        <td className="px-5 py-8 text-center font-bold text-muted" colSpan={14}>
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
    </div>
  );
}
