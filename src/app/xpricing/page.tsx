"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminNav } from "../AdminNav";
import { useAdminSession } from "../useAdminSession";

type DiscountType = "percentage" | "flat";

type PricingRow = {
  packageId: string;
  title: string;
  country: string | null;
  type: string;
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

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Price management</h1>
            <p className="text-sm font-semibold text-slate-600">
              Set retail prices and discounts per package. Original price is the Airalo cost — informational only.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="rounded border bg-white px-3 py-2 text-sm font-bold"
                disabled={isLoading}
                onClick={() => void loadPricing()}
                type="button"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <button className="rounded border bg-white px-3 py-2 text-sm font-bold" onClick={session.logout} type="button">
                Logout
              </button>
            </div>
          ) : null}
        </div>

        {!token ? (
          <form className="max-w-md rounded border bg-white p-4" onSubmit={session.login}>
            <label className="block text-sm font-bold" htmlFor="admin-email">
              Email
            </label>
            <input
              className="mt-1 h-10 w-full rounded border px-3"
              id="admin-email"
              onChange={(event) => session.setEmail(event.target.value)}
              required
              type="email"
              value={session.email}
            />
            <label className="mt-3 block text-sm font-bold" htmlFor="admin-password">
              Password
            </label>
            <input
              className="mt-1 h-10 w-full rounded border px-3"
              id="admin-password"
              onChange={(event) => session.setPassword(event.target.value)}
              required
              type="password"
              value={session.password}
            />
            {session.error ? <p className="mt-3 text-sm font-bold text-red-700">{session.error}</p> : null}
            <button
              className="mt-4 h-10 w-full rounded bg-slate-950 px-3 text-sm font-black text-white"
              disabled={session.isLoggingIn}
              type="submit"
            >
              {session.isLoggingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="grid gap-4">
            {error ? (
              <div className="rounded border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>
            ) : null}
            {notice ? (
              <div className="rounded border border-green-300 bg-green-50 p-3 text-sm font-bold text-green-800">
                {notice}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded border bg-white p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Total packages</p>
                <p className="text-2xl font-black">{packages.length}</p>
              </div>
              <div className="rounded border bg-white p-3">
                <p className="text-xs font-bold uppercase text-slate-500">With discount</p>
                <p className="text-2xl font-black">{discountedCount}</p>
              </div>
              <div className="rounded border bg-white p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Selected</p>
                <p className="text-2xl font-black">{selectedIds.size}</p>
              </div>
            </div>

            <section className="rounded border bg-white p-3">
              <h2 className="text-sm font-black uppercase text-slate-600">Bulk discount</h2>
              <div className="mt-2 grid gap-2 md:grid-cols-5">
                <label className="mt-1 flex items-center gap-2 text-sm font-bold">
                  <input
                    checked={bulkEnabled}
                    onChange={(event) => setBulkEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  Enable discount
                </label>
                <label className="text-sm font-bold">
                  Type
                  <select
                    className="mt-1 h-10 w-full rounded border px-2 font-normal"
                    disabled={!bulkEnabled}
                    onChange={(event) => setBulkType(event.target.value as DiscountType)}
                    value={bulkType}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat amount</option>
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Value
                  <input
                    className="mt-1 h-10 w-full rounded border px-2 font-normal"
                    disabled={!bulkEnabled}
                    inputMode="decimal"
                    onChange={(event) => setBulkValue(event.target.value)}
                    value={bulkValue}
                  />
                </label>
                <button
                  className="mt-6 h-10 rounded bg-slate-950 px-3 text-sm font-black text-white disabled:opacity-50"
                  disabled={isBulkApplying}
                  onClick={() => void applyBulkDiscount("selected")}
                  type="button"
                >
                  Apply to selected ({selectedIds.size})
                </button>
                <button
                  className="mt-6 h-10 rounded border border-red-700 bg-white px-3 text-sm font-black text-red-700 disabled:opacity-50"
                  disabled={isBulkApplying}
                  onClick={() => void applyBulkDiscount("all")}
                  type="button"
                >
                  Apply to ALL packages
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Bulk discount only changes the discount fields — retail prices are left as they are.
              </p>
            </section>

            <section className="overflow-hidden rounded border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                <input
                  className="h-10 w-full max-w-sm rounded border px-3 text-sm"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, country, or package id"
                  value={search}
                />
                <p className="text-xs font-bold text-slate-500">
                  Showing {filtered.length} of {packages.length}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          checked={filtered.length > 0 && filtered.every((row) => selectedIds.has(row.packageId))}
                          onChange={toggleSelectAllVisible}
                          type="checkbox"
                        />
                      </th>
                      <th className="px-3 py-2">Package</th>
                      <th className="px-3 py-2">Original price</th>
                      <th className="px-3 py-2">Retail price</th>
                      <th className="px-3 py-2">Discount</th>
                      <th className="px-3 py-2">Final price</th>
                      <th className="px-3 py-2">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const draft = drafts[row.packageId] ?? toDraft(row);
                      const preview = previewFinalPrice(draft);

                      return (
                        <tr className="border-t align-top" key={row.packageId}>
                          <td className="px-3 py-2">
                            <input
                              checked={selectedIds.has(row.packageId)}
                              onChange={() => toggleSelected(row.packageId)}
                              type="checkbox"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-bold">{row.title}</p>
                            <p className="text-xs text-slate-500">
                              {row.country ?? "N/A"} · {row.type} · {row.packageId}
                            </p>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatPrice(row.originalPrice)}</td>
                          <td className="px-3 py-2">
                            <input
                              className="h-9 w-24 rounded border px-2"
                              inputMode="decimal"
                              onChange={(event) => updateDraft(row.packageId, { retailPrice: event.target.value })}
                              value={draft.retailPrice}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <label className="flex items-center gap-2 whitespace-nowrap text-xs font-bold">
                              <input
                                checked={draft.discountEnabled}
                                onChange={(event) =>
                                  updateDraft(row.packageId, { discountEnabled: event.target.checked })
                                }
                                type="checkbox"
                              />
                              Has discount
                            </label>
                            <div className="mt-1 flex gap-1">
                              <select
                                className="h-9 rounded border px-1 text-xs"
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
                                className="h-9 w-16 rounded border px-2"
                                disabled={!draft.discountEnabled}
                                inputMode="decimal"
                                onChange={(event) => updateDraft(row.packageId, { discountValue: event.target.value })}
                                value={draft.discountValue}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-bold">
                            {preview == null ? "—" : formatPrice(preview)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              className="h-9 rounded bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-50"
                              disabled={savingId === row.packageId}
                              onClick={() => void saveRow(row.packageId)}
                              type="button"
                            >
                              {savingId === row.packageId ? "Saving..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center font-bold text-slate-500" colSpan={7}>
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
    </main>
  );
}
