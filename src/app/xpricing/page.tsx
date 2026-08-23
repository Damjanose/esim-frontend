"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, LogOut, Cpu } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type DiscountType = "percentage" | "flat";

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
  retailPrice: number;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: number;
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
  retailPrice: string;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: string;
};

function toDraft(row: PricingRow): Draft {
  return {
    retailPrice: String(row.retailPrice),
    discountEnabled: row.discountEnabled,
    discountType: row.discountType,
    discountValue: String(row.discountValue)
  };
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(value);
}

function previewFinalPrice(draft: Draft): number | null {
  const retailPrice = Number(draft.retailPrice);
  const discountValue = Number(draft.discountValue);
  if (!Number.isFinite(retailPrice) || retailPrice < 0) return null;
  if (!draft.discountEnabled) return retailPrice;
  if (!Number.isFinite(discountValue) || discountValue < 0) return null;

  const raw =
    draft.discountType === "flat"
      ? retailPrice - discountValue
      : retailPrice * (1 - discountValue / 100);
  return Math.max(0, Math.round(raw * 100) / 100);
}

export default function AdminPricingPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [packages, setPackages] = useState<PricingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [bulkEnabled, setBulkEnabled] = useState(true);
  const [bulkType, setBulkType] = useState<DiscountType>("percentage");
  const [bulkValue, setBulkValue] = useState("10");
  const [isBulkApplying, setIsBulkApplying] = useState(false);
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
    if (!q) return packages;
    return packages.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        (row.country ?? "").toLowerCase().includes(q) ||
        row.packageId.toLowerCase().includes(q)
    );
  }, [packages, search]);

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
    if (!draft) return;

    const retailPrice = Number(draft.retailPrice);
    const discountValue = Number(draft.discountValue);
    if (!Number.isFinite(retailPrice) || retailPrice < 0) {
      setError("Retail price must be a number of 0 or more.");
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
          discountType: draft.discountType,
          discountValue
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
      setPackages((current) => current.map((row) => (row.packageId === packageId ? updated : row)));
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
          discountValue: bulkEnabled ? value : 0
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
              Set retail prices and discounts per package. Retail price defaults to the Airalo cost — raise it to sell above cost.
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
              <div className="mt-3 grid gap-3 md:grid-cols-5 md:items-end">
                <label className="flex items-center gap-2 text-sm font-bold text-midnight">
                  <input
                    checked={bulkEnabled}
                    onChange={(event) => setBulkEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  Enable discount
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
                Bulk discount only changes the discount fields — retail prices are left as they are.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Reset to default</h2>
              <p className="mt-1 text-xs font-semibold text-muted">
                Clears any admin-set retail price and discount, reverting the buy and sell price back to what
                Airalo returns for the package.
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

            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3.5">
                <input
                  className="h-10 w-full max-w-sm rounded-xl border border-line px-3.5 text-sm outline-none transition focus:border-cyan"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, country, or package id"
                  value={search}
                />
                <p className="text-xs font-bold text-muted">
                  Showing {filtered.length} of {packages.length}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
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
                        Retail price
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Discount
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
                      const preview = previewFinalPrice(draft);
                      const discounted = draft.discountEnabled && preview != null && preview < Number(draft.retailPrice);

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
                          <td className="px-3 py-3">
                            <input
                              className="h-9 w-24 rounded-lg border border-line px-2 text-sm outline-none focus:border-cyan"
                              inputMode="decimal"
                              onChange={(event) => updateDraft(row.packageId, { retailPrice: event.target.value })}
                              value={draft.retailPrice}
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
                              Has discount
                            </label>
                            <div className="mt-1.5 flex gap-1">
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
                                  {formatPrice(Number(draft.retailPrice))}
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
                        <td className="px-5 py-8 text-center font-bold text-muted" colSpan={10}>
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
