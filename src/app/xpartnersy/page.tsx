"use client";

// BFF routes this page talks to (see `src/app/bff/admin/partners/**`):
//   GET  /bff/admin/partners
//   POST /bff/admin/partners/{email}/approve
//   POST /bff/admin/partners/{email}/suspend
//   POST /bff/admin/partners/{email}/cancel
//   POST /bff/admin/partners/{email}/verify
//   GET/PUT /bff/admin/partners/packages/{packageId}/affiliate-config
//   GET/PATCH /bff/admin/partners/hold-period
//   GET  /bff/admin/partners/review-queue
//   POST /bff/admin/partners/order-credits/{id}/clear
//   POST /bff/admin/partners/order-credits/{id}/cancel

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, LogOut, Handshake } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type PartnerStatus = "PendingApproval" | "Pending" | "Active" | "Suspended" | "Cancelled" | string;

type Partner = {
  userEmail: string;
  status: PartnerStatus;
  partnerType: string;
  country: string;
  businessName: string | null;
  promoCode: string | null;
  validCustomerCount: number;
  commissionBalanceCents: number;
  walletBalanceCents: number;
  requestedAt: string;
};

type PartnersListPayload = { status?: string; data?: { partners?: Partner[] }; message?: string };
type PartnerActionPayload = { status?: string; data?: Partner; message?: string };

type PricingRow = { packageId: string; title: string; country: string | null };
type PackagesListPayload = { status?: string; data?: { packages?: PricingRow[] }; message?: string };

type MarginScenario = {
  normalPriceCents: number;
  supplierCostCents: number;
  customerDiscountCents: number;
  customerPaysCents: number;
  affiliateCommissionCents: number;
  remainingMarginCents: number;
};

type AffiliateConfig = {
  affiliateEnabled: boolean;
  affiliateCommissionPct: number;
  partnerBuyDiscountPct: number;
  minimumProfitCents: number;
  preview: { worstCase: MarginScenario };
};

type AffiliateConfigPayload = { status?: string; data?: AffiliateConfig; message?: string };

type AffiliateDraft = {
  affiliateEnabled: boolean;
  affiliateCommissionPct: string;
  partnerBuyDiscountPct: string;
  minimumProfitCents: string;
};

type HoldPeriodPayload = { status?: string; data?: { holdDays?: number }; message?: string };

type ReviewCredit = {
  id: string;
  partnerEmail: string;
  promoCodeUsed: string;
  packagePriceCents: number;
  discountAmountCents: number;
  finalCustomerPriceCents: number;
  commissionAmountCents: number;
  isFirstPurchaseForCustomer: boolean;
  commissionStatus: string;
  createdAt: string;
};

type ReviewQueuePayload = { status?: string; data?: { reviewQueue?: ReviewCredit[] }; message?: string };

const STATUS_OPTIONS = ["All", "PendingApproval", "Pending", "Active", "Suspended", "Cancelled"];

function toAffiliateDraft(config: AffiliateConfig): AffiliateDraft {
  return {
    affiliateEnabled: config.affiliateEnabled,
    affiliateCommissionPct: String(config.affiliateCommissionPct),
    partnerBuyDiscountPct: String(config.partnerBuyDiscountPct),
    minimumProfitCents: String(config.minimumProfitCents)
  };
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

/**
 * Mirrors the backend's computeFinalCustomerPrice / computeCommissionAmount /
 * computeRemainingMargin (E-SIM backend/src/services/partnerCommission.calc.ts)
 * so the panel can preview the effect of an unsaved draft as-you-type. The
 * server's GET only returns a preview for the currently-saved config — there
 * is no query-param preview endpoint — so a live-as-you-edit preview has to
 * be computed client-side against the same normalPriceCents/supplierCostCents
 * the GET response carries for the selected package.
 */
function previewScenario(
  normalPriceCents: number,
  supplierCostCents: number,
  discountPct: number,
  commissionPct: number
): MarginScenario {
  const raw = normalPriceCents - normalPriceCents * (discountPct / 100);
  const customerPaysCents = Math.max(0, Math.round(raw));
  const customerDiscountCents = normalPriceCents - customerPaysCents;
  const affiliateCommissionCents = Math.round(customerPaysCents * (commissionPct / 100));
  const remainingMarginCents = customerPaysCents - supplierCostCents - affiliateCommissionCents;
  return {
    normalPriceCents,
    supplierCostCents,
    customerDiscountCents,
    customerPaysCents,
    affiliateCommissionCents,
    remainingMarginCents
  };
}

const WORST_CASE_DISCOUNT_PCT = 20;

function isDraftAllowed(scenario: MarginScenario, minimumProfitCents: number): boolean {
  return scenario.remainingMarginCents >= minimumProfitCents;
}

export default function AdminPartnersPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [partners, setPartners] = useState<Partner[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [partnerActionEmail, setPartnerActionEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [packages, setPackages] = useState<PricingRow[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packageSearch, setPackageSearch] = useState("");
  const [affiliateBase, setAffiliateBase] = useState<AffiliateConfig | null>(null);
  const [affiliateDraft, setAffiliateDraft] = useState<AffiliateDraft | null>(null);
  const [isLoadingAffiliateConfig, setIsLoadingAffiliateConfig] = useState(false);
  const [isSavingAffiliateConfig, setIsSavingAffiliateConfig] = useState(false);

  const [holdDays, setHoldDays] = useState<number | null>(null);
  const [holdDaysDraft, setHoldDaysDraft] = useState("");
  const [isSavingHoldDays, setIsSavingHoldDays] = useState(false);

  const [reviewQueue, setReviewQueue] = useState<ReviewCredit[]>([]);
  const [isLoadingReviewQueue, setIsLoadingReviewQueue] = useState(false);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  async function loadPartners(nextToken = token, status = statusFilter) {
    if (!nextToken) return;
    setIsLoadingPartners(true);
    setError("");
    try {
      const query = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
      const response = await fetch(`/bff/admin/partners${query}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as PartnersListPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load partners");
      }
      setPartners(payload.data?.partners ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load partners");
      setPartners([]);
    } finally {
      setIsLoadingPartners(false);
    }
  }

  async function loadPackages(nextToken = token) {
    if (!nextToken) return;
    try {
      const response = await fetch("/bff/admin/packages/pricing", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as PackagesListPayload;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load packages");
      }
      setPackages(payload.data?.packages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load packages");
    }
  }

  async function loadAffiliateConfig(packageId: string, nextToken = token) {
    if (!nextToken || !packageId) return;
    setIsLoadingAffiliateConfig(true);
    setError("");
    try {
      const response = await fetch(
        `/bff/admin/partners/packages/${encodeURIComponent(packageId)}/affiliate-config`,
        { headers: { Authorization: `Bearer ${nextToken}` }, cache: "no-store" }
      );
      const payload = (await response.json()) as AffiliateConfigPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not load affiliate config");
      }
      setAffiliateBase(payload.data);
      setAffiliateDraft(toAffiliateDraft(payload.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load affiliate config");
      setAffiliateBase(null);
      setAffiliateDraft(null);
    } finally {
      setIsLoadingAffiliateConfig(false);
    }
  }

  async function loadHoldPeriod(nextToken = token) {
    if (!nextToken) return;
    try {
      const response = await fetch("/bff/admin/partners/hold-period", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as HoldPeriodPayload;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success" || typeof payload.data?.holdDays !== "number") {
        throw new Error(payload.message ?? "Could not load the hold period");
      }
      setHoldDays(payload.data.holdDays);
      setHoldDaysDraft(String(payload.data.holdDays));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the hold period");
    }
  }

  async function loadReviewQueue(nextToken = token) {
    if (!nextToken) return;
    setIsLoadingReviewQueue(true);
    try {
      const response = await fetch("/bff/admin/partners/review-queue", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as ReviewQueuePayload;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load review queue");
      }
      setReviewQueue(payload.data?.reviewQueue ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load review queue");
    } finally {
      setIsLoadingReviewQueue(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadPartners(token);
      void loadPackages(token);
      void loadHoldPeriod(token);
      void loadReviewQueue(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) void loadPartners(token, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (token && selectedPackageId) void loadAffiliateConfig(selectedPackageId, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageId]);

  const filteredPackages = useMemo(() => {
    const q = packageSearch.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        (row.country ?? "").toLowerCase().includes(q) ||
        row.packageId.toLowerCase().includes(q)
    );
  }, [packages, packageSearch]);

  async function runPartnerAction(email: string, action: "approve" | "suspend" | "cancel" | "verify") {
    setPartnerActionEmail(email);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/partners/${encodeURIComponent(email)}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as PartnerActionPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? `Could not ${action} partner`);
      }
      setNotice(`${email}: ${action}d.`);
      await loadPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} partner`);
    } finally {
      setPartnerActionEmail(null);
    }
  }

  const draftPreview = useMemo(() => {
    if (!affiliateBase || !affiliateDraft) return null;
    const normalPriceCents = affiliateBase.preview.worstCase.normalPriceCents;
    const supplierCostCents = affiliateBase.preview.worstCase.supplierCostCents;
    const commissionPct = Number(affiliateDraft.affiliateCommissionPct);
    const minimumProfitCents = Number(affiliateDraft.minimumProfitCents);
    if (!Number.isFinite(commissionPct) || !Number.isFinite(minimumProfitCents)) {
      return null;
    }
    const worstCase = previewScenario(normalPriceCents, supplierCostCents, WORST_CASE_DISCOUNT_PCT, commissionPct);
    const allowed = !affiliateDraft.affiliateEnabled || isDraftAllowed(worstCase, minimumProfitCents);
    return { worstCase, allowed, minimumProfitCents };
  }, [affiliateBase, affiliateDraft]);

  async function saveAffiliateConfig() {
    if (!affiliateDraft || !selectedPackageId) return;

    const affiliateCommissionPct = Number(affiliateDraft.affiliateCommissionPct);
    const partnerBuyDiscountPct = Number(affiliateDraft.partnerBuyDiscountPct);
    const minimumProfitCents = Number(affiliateDraft.minimumProfitCents);
    if (
      !Number.isFinite(affiliateCommissionPct) ||
      !Number.isFinite(partnerBuyDiscountPct) ||
      !Number.isFinite(minimumProfitCents)
    ) {
      setError("All affiliate-config fields must be numbers.");
      return;
    }

    setIsSavingAffiliateConfig(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/bff/admin/partners/packages/${encodeURIComponent(selectedPackageId)}/affiliate-config`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateEnabled: affiliateDraft.affiliateEnabled,
            affiliateCommissionPct,
            partnerBuyDiscountPct,
            minimumProfitCents
          })
        }
      );
      const payload = (await response.json()) as AffiliateConfigPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        if (payload.message === "configuration_not_allowed") {
          throw new Error(
            "This configuration would push the remaining margin below the minimum profit — not saved."
          );
        }
        throw new Error(payload.message ?? "Could not save affiliate config");
      }
      setAffiliateBase(payload.data);
      setAffiliateDraft(toAffiliateDraft(payload.data));
      setNotice("Affiliate config saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save affiliate config");
    } finally {
      setIsSavingAffiliateConfig(false);
    }
  }

  async function saveHoldDays() {
    const parsed = Number(holdDaysDraft);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError("Hold period must be a positive whole number of days.");
      return;
    }
    setIsSavingHoldDays(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/bff/admin/partners/hold-period", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ holdDays: parsed })
      });
      const payload = (await response.json()) as HoldPeriodPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || typeof payload.data?.holdDays !== "number") {
        throw new Error(payload.message ?? "Could not save the hold period");
      }
      setHoldDays(payload.data.holdDays);
      setNotice(`Commission hold period set to ${payload.data.holdDays} day(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the hold period");
    } finally {
      setIsSavingHoldDays(false);
    }
  }

  async function runReviewAction(id: string, action: "clear" | "cancel") {
    setReviewActionId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/partners/order-credits/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { status?: string; message?: string };
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? `Could not ${action} order credit`);
      }
      setNotice(`Order credit ${action}ed.`);
      await loadReviewQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} order credit`);
    } finally {
      setReviewActionId(null);
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
              Partner program
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Manage affiliate/partner accounts, per-package affiliate pricing and margin, the commission hold
              period, and orders flagged for manual review.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoadingPartners}
                onClick={() => void loadPartners()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                Refresh
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

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {notice}
          </div>
        ) : null}

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={async (event) => {
              const nextToken = await session.login(event);
              if (nextToken) {
                void loadPartners(nextToken);
                void loadPackages(nextToken);
                void loadHoldPeriod(nextToken);
                void loadReviewQueue(nextToken);
              }
            }}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <div className="grid gap-6">
            {/* Partner list */}
            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3.5">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Partners</h2>
                <label className="text-xs font-bold text-muted">
                  Status
                  <select
                    className="ml-2 h-9 rounded-lg border border-line px-2 text-sm font-normal text-midnight"
                    onChange={(event) => setStatusFilter(event.target.value)}
                    value={statusFilter}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8fdfe]">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Email
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Status
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Type / Country
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Promo code
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Valid customers
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Commission bal.
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Wallet bal.
                      </th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr className="border-t border-line/60 align-top hover:bg-[#fbfeff]" key={partner.userEmail}>
                        <td className="px-5 py-3 font-bold text-midnight">{partner.userEmail}</td>
                        <td className="px-3 py-3 text-midnight">{partner.status}</td>
                        <td className="px-3 py-3 text-muted">
                          {partner.partnerType} · {partner.country}
                        </td>
                        <td className="px-3 py-3 text-muted">{partner.promoCode ?? "—"}</td>
                        <td className="px-3 py-3 text-midnight">{partner.validCustomerCount}</td>
                        <td className="px-3 py-3 text-midnight">{formatMoney(partner.commissionBalanceCents)}</td>
                        <td className="px-3 py-3 text-midnight">{formatMoney(partner.walletBalanceCents)}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {partner.status === "Active" ? (
                              <button
                                className="h-8 rounded-lg border border-amber-300 px-2.5 text-[11px] font-bold text-amber-700 transition hover:border-amber-500 disabled:opacity-50"
                                disabled={partnerActionEmail === partner.userEmail}
                                onClick={() => {
                                  if (window.confirm(`Suspend partner ${partner.userEmail}?`)) {
                                    void runPartnerAction(partner.userEmail, "suspend");
                                  }
                                }}
                                type="button"
                              >
                                Suspend
                              </button>
                            ) : (
                              <>
                                <button
                                  className="h-8 rounded-lg bg-gradient-to-r from-midnight to-ink px-2.5 text-[11px] font-black text-aqua shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                  disabled={partnerActionEmail === partner.userEmail}
                                  onClick={() => void runPartnerAction(partner.userEmail, "approve")}
                                  type="button"
                                >
                                  Approve
                                </button>
                                <button
                                  className="h-8 rounded-lg border border-line px-2.5 text-[11px] font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
                                  disabled={partnerActionEmail === partner.userEmail}
                                  onClick={() => void runPartnerAction(partner.userEmail, "verify")}
                                  type="button"
                                >
                                  Verify
                                </button>
                                <button
                                  className="h-8 rounded-lg border border-red-200 px-2.5 text-[11px] font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                                  disabled={partnerActionEmail === partner.userEmail}
                                  onClick={() => {
                                    if (window.confirm(`Cancel partner ${partner.userEmail}? This cannot be undone.`)) {
                                      void runPartnerAction(partner.userEmail, "cancel");
                                    }
                                  }}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {partners.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-center font-bold text-muted" colSpan={8}>
                          {isLoadingPartners ? "Loading partners..." : "No partners found"}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Affiliate config panel */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">
                Package affiliate config
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-xs font-bold text-muted" htmlFor="package-search">
                  Search packages
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal outline-none focus:border-cyan"
                    id="package-search"
                    onChange={(event) => setPackageSearch(event.target.value)}
                    placeholder="Search packages by title, country, or id"
                    value={packageSearch}
                  />
                </label>
                <label className="text-xs font-bold text-muted" htmlFor="package-select">
                  Package
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight"
                    id="package-select"
                    onChange={(event) => setSelectedPackageId(event.target.value)}
                    value={selectedPackageId}
                  >
                    <option value="">Select a package…</option>
                    {filteredPackages.map((row) => (
                      <option key={row.packageId} value={row.packageId}>
                        {row.title} {row.country ? `(${row.country})` : ""} — {row.packageId}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isLoadingAffiliateConfig ? (
                <p className="mt-4 text-sm font-semibold text-muted">Loading affiliate config...</p>
              ) : null}

              {affiliateDraft && affiliateBase ? (
                <div className="mt-4 grid gap-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-midnight">
                      <input
                        checked={affiliateDraft.affiliateEnabled}
                        onChange={(event) =>
                          setAffiliateDraft((current) =>
                            current ? { ...current, affiliateEnabled: event.target.checked } : current
                          )
                        }
                        type="checkbox"
                      />
                      Affiliate enabled
                    </label>
                    <label className="text-xs font-bold text-muted">
                      Affiliate commission %
                      <input
                        className="mt-1 h-9 w-28 rounded-lg border border-line px-2 text-sm font-normal text-midnight"
                        inputMode="decimal"
                        onChange={(event) =>
                          setAffiliateDraft((current) =>
                            current ? { ...current, affiliateCommissionPct: event.target.value } : current
                          )
                        }
                        value={affiliateDraft.affiliateCommissionPct}
                      />
                    </label>
                    <label className="text-xs font-bold text-muted">
                      Partner buy discount %
                      <input
                        className="mt-1 h-9 w-28 rounded-lg border border-line px-2 text-sm font-normal text-midnight"
                        inputMode="decimal"
                        onChange={(event) =>
                          setAffiliateDraft((current) =>
                            current ? { ...current, partnerBuyDiscountPct: event.target.value } : current
                          )
                        }
                        value={affiliateDraft.partnerBuyDiscountPct}
                      />
                    </label>
                    <label className="text-xs font-bold text-muted">
                      Minimum profit (cents)
                      <input
                        className="mt-1 h-9 w-32 rounded-lg border border-line px-2 text-sm font-normal text-midnight"
                        inputMode="numeric"
                        onChange={(event) =>
                          setAffiliateDraft((current) =>
                            current ? { ...current, minimumProfitCents: event.target.value } : current
                          )
                        }
                        value={affiliateDraft.minimumProfitCents}
                      />
                    </label>
                  </div>

                  {draftPreview ? (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-[#f8fdfe]">
                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-muted">
                              Metric
                            </th>
                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-muted">
                              Worst case ({WORST_CASE_DISCOUNT_PCT}% discount)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-line/60">
                            <td className="px-3 py-2 font-bold text-midnight">Normal Price</td>
                            <td className="px-3 py-2 text-midnight">
                              {formatMoney(draftPreview.worstCase.normalPriceCents)}
                            </td>
                          </tr>
                          <tr className="border-t border-line/60">
                            <td className="px-3 py-2 font-bold text-midnight">Supplier Cost</td>
                            <td className="px-3 py-2 text-midnight">
                              {formatMoney(draftPreview.worstCase.supplierCostCents)}
                            </td>
                          </tr>
                          <tr className="border-t border-line/60">
                            <td className="px-3 py-2 font-bold text-midnight">Customer Discount</td>
                            <td className="px-3 py-2 text-midnight">
                              {formatMoney(draftPreview.worstCase.customerDiscountCents)}
                            </td>
                          </tr>
                          <tr className="border-t border-line/60">
                            <td className="px-3 py-2 font-bold text-midnight">Customer Pays</td>
                            <td className="px-3 py-2 text-midnight">
                              {formatMoney(draftPreview.worstCase.customerPaysCents)}
                            </td>
                          </tr>
                          <tr className="border-t border-line/60">
                            <td className="px-3 py-2 font-bold text-midnight">Affiliate Commission</td>
                            <td className="px-3 py-2 text-midnight">
                              {formatMoney(draftPreview.worstCase.affiliateCommissionCents)}
                            </td>
                          </tr>
                          <tr className="border-t border-line/60">
                            <td className="px-3 py-2 font-bold text-midnight">Remaining Margin</td>
                            <td
                              className={`px-3 py-2 font-black ${
                                draftPreview.worstCase.remainingMarginCents < draftPreview.minimumProfitCents
                                  ? "text-red-700"
                                  : "text-midnight"
                              }`}
                            >
                              {formatMoney(draftPreview.worstCase.remainingMarginCents)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {draftPreview && !draftPreview.allowed ? (
                    <p className="text-xs font-bold text-red-700">
                      configuration_not_allowed — remaining margin would fall below the minimum profit. Save is
                      disabled until the numbers are adjusted.
                    </p>
                  ) : null}

                  <div>
                    <button
                      className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSavingAffiliateConfig || (draftPreview ? !draftPreview.allowed : false)}
                      onClick={() => void saveAffiliateConfig()}
                      type="button"
                    >
                      {isSavingAffiliateConfig ? "Saving..." : "Save affiliate config"}
                    </button>
                  </div>
                </div>
              ) : (
                !isLoadingAffiliateConfig && (
                  <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted">
                    <Handshake aria-hidden="true" size={16} />
                    Select a package to view and edit its affiliate config.
                  </p>
                )
              )}
            </section>

            {/* Hold period */}
            <section className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              <div>
                <label className="block text-sm font-bold text-midnight" htmlFor="hold-days">
                  Commission hold period
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    className="h-11 w-24 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                    id="hold-days"
                    inputMode="numeric"
                    onChange={(event) => setHoldDaysDraft(event.target.value)}
                    value={holdDaysDraft}
                  />
                  <span className="text-sm font-semibold text-muted">days</span>
                </div>
                {holdDays !== null ? (
                  <p className="mt-1 text-xs font-semibold text-muted">Currently {holdDays} day(s).</p>
                ) : null}
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingHoldDays}
                onClick={() => void saveHoldDays()}
                type="button"
              >
                {isSavingHoldDays ? "Saving..." : "Save"}
              </button>
            </section>

            {/* Review queue */}
            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3.5">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">
                  Review queue ({reviewQueue.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8fdfe]">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Partner
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Promo code
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Package price
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Discount
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Customer paid
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Commission
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Created
                      </th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQueue.map((credit) => (
                      <tr className="border-t border-line/60 align-top hover:bg-[#fbfeff]" key={credit.id}>
                        <td className="px-5 py-3 font-bold text-midnight">{credit.partnerEmail}</td>
                        <td className="px-3 py-3 text-muted">{credit.promoCodeUsed}</td>
                        <td className="px-3 py-3 text-midnight">{formatMoney(credit.packagePriceCents)}</td>
                        <td className="px-3 py-3 text-midnight">{formatMoney(credit.discountAmountCents)}</td>
                        <td className="px-3 py-3 text-midnight">{formatMoney(credit.finalCustomerPriceCents)}</td>
                        <td className="px-3 py-3 text-midnight">{formatMoney(credit.commissionAmountCents)}</td>
                        <td className="px-3 py-3 text-muted">{formatDate(credit.createdAt)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <button
                              className="h-8 rounded-lg bg-gradient-to-r from-midnight to-ink px-2.5 text-[11px] font-black text-aqua shadow-sm transition hover:opacity-90 disabled:opacity-50"
                              disabled={reviewActionId === credit.id}
                              onClick={() => void runReviewAction(credit.id, "clear")}
                              type="button"
                            >
                              Clear
                            </button>
                            <button
                              className="h-8 rounded-lg border border-red-200 px-2.5 text-[11px] font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                              disabled={reviewActionId === credit.id}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Cancel the ${formatMoney(credit.commissionAmountCents)} commission credit for ${credit.partnerEmail}? This cannot be undone.`
                                  )
                                ) {
                                  void runReviewAction(credit.id, "cancel");
                                }
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reviewQueue.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-center font-bold text-muted" colSpan={8}>
                          {isLoadingReviewQueue ? "Loading review queue..." : "Nothing needs review"}
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
