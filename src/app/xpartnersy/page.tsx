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

type PartnerStatus =
  | "PendingApproval"
  | "Pending"
  | "Active"
  | "Suspended"
  | "Cancelled"
  | "Rejected"
  | string;

type Partner = {
  userEmail: string;
  status: PartnerStatus;
  partnerType: string;
  country: string;
  businessName: string | null;
  promoCode: string | null;
  partnerProfitCents?: number;
  discountPct?: number;
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
  partnerBuyDiscountPct: number;
  /** The program-wide margin floor, not a per-package value. */
  minimumProfitCents: number;
  partnerProfitCents?: number;
  globalMaxDiscountPct?: number;
  preview: { worstCase: MarginScenario };
};

type AffiliateConfigPayload = { status?: string; data?: AffiliateConfig; message?: string };

type AffiliateDraft = {
  affiliateEnabled: boolean;
  partnerBuyDiscountPct: string;
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
    partnerBuyDiscountPct: String(config.partnerBuyDiscountPct)
  };
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

/**
 * Mirrors backend partnerCommission.calc fixed-profit + clamp math for draft preview.
 * affiliateCommissionCents here means the fixed EUR-cent partner profit snapshot.
 */
function previewScenario(
  normalPriceCents: number,
  supplierCostCents: number,
  discountPct: number,
  partnerProfitCents: number
): MarginScenario {
  const raw = normalPriceCents - normalPriceCents * (discountPct / 100);
  const customerPaysCents = Math.max(0, Math.round(raw));
  const customerDiscountCents = normalPriceCents - customerPaysCents;
  const affiliateCommissionCents = Math.max(0, Math.round(partnerProfitCents));
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

function computeEffectiveDiscountPctClient(input: {
  retailCents: number;
  costCents: number;
  partnerProfitCents: number;
  floorCents: number;
  partnerPct: number;
  globalMaxPct: number;
}): number {
  if (input.retailCents <= 0) return 0;
  const minPayable = input.costCents + input.partnerProfitCents + input.floorCents;
  const roomPct = Math.max(0, ((input.retailCents - minPayable) / input.retailCents) * 100);
  let pct = Math.floor(Math.min(Math.max(0, input.partnerPct), Math.max(0, input.globalMaxPct), roomPct));
  while (pct > 0) {
    const paid = Math.max(0, Math.round(input.retailCents - input.retailCents * (pct / 100)));
    if (paid - input.costCents - input.partnerProfitCents >= input.floorCents) return pct;
    pct -= 1;
  }
  return 0;
}

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

  const [maxDiscountPctDraft, setMaxDiscountPctDraft] = useState("15");
  const [companyFloorCentsDraft, setCompanyFloorCentsDraft] = useState("150");
  const [isSavingProgramSettings, setIsSavingProgramSettings] = useState(false);

  const [selectedPartnerEmail, setSelectedPartnerEmail] = useState<string | null>(null);
  const [promoCodeDraft, setPromoCodeDraft] = useState("");
  const [profitCentsDraft, setProfitCentsDraft] = useState("100");
  const [isSavingPartnerDetail, setIsSavingPartnerDetail] = useState(false);
  const [packageProfits, setPackageProfits] = useState<Array<{ packageId: string; profitCents: number }>>([]);
  const [overridePackageId, setOverridePackageId] = useState("");
  const [overrideProfitCents, setOverrideProfitCents] = useState("100");
  const [isSavingPackageOverride, setIsSavingPackageOverride] = useState(false);

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

  async function loadProgramSettings(nextToken = token) {
    if (!nextToken) return;
    try {
      const response = await fetch("/bff/admin/partners/program-settings", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        status?: string;
        data?: { maxDiscountPct?: number; companyFloorCents?: number };
        message?: string;
      };
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not load program settings");
      }
      setMaxDiscountPctDraft(String(payload.data.maxDiscountPct ?? 15));
      setCompanyFloorCentsDraft(String(payload.data.companyFloorCents ?? 150));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load program settings");
    }
  }

  async function saveProgramSettings() {
    const maxDiscountPct = Number(maxDiscountPctDraft);
    const companyFloorCents = Number(companyFloorCentsDraft);
    if (!Number.isInteger(maxDiscountPct) || maxDiscountPct < 0 || maxDiscountPct > 100) {
      setError("Max discount % must be an integer 0–100.");
      return;
    }
    if (!Number.isInteger(companyFloorCents) || companyFloorCents < 0) {
      setError("Company floor must be a non-negative integer (EUR cents).");
      return;
    }
    setIsSavingProgramSettings(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/bff/admin/partners/program-settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ maxDiscountPct, companyFloorCents })
      });
      const payload = (await response.json()) as {
        status?: string;
        data?: { maxDiscountPct?: number; companyFloorCents?: number };
        message?: string;
      };
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not save program settings");
      }
      setMaxDiscountPctDraft(String(payload.data.maxDiscountPct));
      setCompanyFloorCentsDraft(String(payload.data.companyFloorCents));
      setNotice(
        `Program settings saved: max ${payload.data.maxDiscountPct}% discount, floor €${((payload.data.companyFloorCents ?? 0) / 100).toFixed(2)}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save program settings");
    } finally {
      setIsSavingProgramSettings(false);
    }
  }

  async function loadPackageProfits(email: string, nextToken = token) {
    if (!nextToken) return;
    try {
      const response = await fetch(`/bff/admin/partners/${encodeURIComponent(email)}/package-profits`, {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        status?: string;
        data?: { packageProfits?: Array<{ packageId: string; profitCents: number }> };
        message?: string;
      };
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load package profits");
      }
      setPackageProfits(payload.data?.packageProfits ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load package profits");
      setPackageProfits([]);
    }
  }

  async function savePackageProfitOverride() {
    if (!selectedPartnerEmail) return;
    const packageId = overridePackageId.trim();
    const profitCents = Number(overrideProfitCents);
    if (!packageId) {
      setError("Package id is required for an override.");
      return;
    }
    if (!Number.isInteger(profitCents) || profitCents < 0) {
      setError("Override profit must be a non-negative integer (EUR cents).");
      return;
    }
    setIsSavingPackageOverride(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/bff/admin/partners/${encodeURIComponent(selectedPartnerEmail)}/package-profits/${encodeURIComponent(packageId)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ profitCents })
        }
      );
      const payload = (await response.json()) as { status?: string; message?: string };
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not save package profit override");
      }
      setNotice(`${selectedPartnerEmail}: override for ${packageId} saved.`);
      setOverridePackageId("");
      await loadPackageProfits(selectedPartnerEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save package profit override");
    } finally {
      setIsSavingPackageOverride(false);
    }
  }

  async function deletePackageProfitOverride(packageId: string) {
    if (!selectedPartnerEmail) return;
    setIsSavingPackageOverride(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/bff/admin/partners/${encodeURIComponent(selectedPartnerEmail)}/package-profits/${encodeURIComponent(packageId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const payload = (await response.json()) as { status?: string; message?: string };
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not delete package profit override");
      }
      setNotice(`${selectedPartnerEmail}: override for ${packageId} removed.`);
      await loadPackageProfits(selectedPartnerEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete package profit override");
    } finally {
      setIsSavingPackageOverride(false);
    }
  }

  async function saveSelectedPartnerDetail() {
    if (!selectedPartnerEmail) return;
    setIsSavingPartnerDetail(true);
    setError("");
    setNotice("");
    try {
      const promoCode = promoCodeDraft.trim().toUpperCase();
      const partnerProfitCents = Number(profitCentsDraft);
      if (!promoCode) throw new Error("Promo code is required.");
      if (!Number.isInteger(partnerProfitCents) || partnerProfitCents < 0) {
        throw new Error("Partner profit must be a non-negative integer (EUR cents).");
      }

      const promoResponse = await fetch(
        `/bff/admin/partners/${encodeURIComponent(selectedPartnerEmail)}/promo-code`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ promoCode })
        }
      );
      const promoPayload = (await promoResponse.json()) as PartnerActionPayload;
      if (promoResponse.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!promoResponse.ok || promoPayload.status !== "success") {
        throw new Error(promoPayload.message ?? "Could not update promo code");
      }

      const profitResponse = await fetch(
        `/bff/admin/partners/${encodeURIComponent(selectedPartnerEmail)}/profit`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ partnerProfitCents })
        }
      );
      const profitPayload = (await profitResponse.json()) as PartnerActionPayload;
      if (!profitResponse.ok || profitPayload.status !== "success") {
        throw new Error(profitPayload.message ?? "Could not update partner profit");
      }

      setNotice(`${selectedPartnerEmail}: promo code and profit updated.`);
      await loadPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save partner detail");
    } finally {
      setIsSavingPartnerDetail(false);
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

  async function runPartnerAction(email: string, action: "approve" | "suspend" | "cancel" | "verify" | "reject") {
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
    const partnerBuyDiscountPct = Number(affiliateDraft.partnerBuyDiscountPct);
    if (!Number.isFinite(partnerBuyDiscountPct)) return null;

    const partnerProfitCents = affiliateBase.partnerProfitCents ?? 100;
    const floorCents = Number(companyFloorCentsDraft);
    const globalMaxPct = Number(maxDiscountPctDraft);
    const safeFloor = Number.isFinite(floorCents) ? floorCents : affiliateBase.minimumProfitCents;
    const safeMax = Number.isFinite(globalMaxPct)
      ? globalMaxPct
      : (affiliateBase.globalMaxDiscountPct ?? 15);

    const effectivePct = computeEffectiveDiscountPctClient({
      retailCents: normalPriceCents,
      costCents: supplierCostCents,
      partnerProfitCents,
      floorCents: safeFloor,
      partnerPct: safeMax,
      globalMaxPct: safeMax
    });
    const worstCase = previewScenario(normalPriceCents, supplierCostCents, effectivePct, partnerProfitCents);
    const allowed = !affiliateDraft.affiliateEnabled || isDraftAllowed(worstCase, safeFloor);
    return { worstCase, allowed, minimumProfitCents: safeFloor, effectivePct };
  }, [affiliateBase, affiliateDraft, companyFloorCentsDraft, maxDiscountPctDraft]);

  async function saveAffiliateConfig() {
    if (!affiliateDraft || !selectedPackageId) return;

    const partnerBuyDiscountPct = Number(affiliateDraft.partnerBuyDiscountPct);
    if (!Number.isFinite(partnerBuyDiscountPct)) {
      setError("Partner buy discount % must be a number.");
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
            partnerBuyDiscountPct
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
                void loadProgramSettings(nextToken);
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
                        <td className="px-5 py-3 font-bold text-midnight">
                          <button
                            className="text-left underline-offset-2 hover:underline"
                            onClick={() => {
                              setSelectedPartnerEmail(partner.userEmail);
                              setPromoCodeDraft(partner.promoCode ?? "");
                              setProfitCentsDraft(String(partner.partnerProfitCents ?? 100));
                              void loadPackageProfits(partner.userEmail);
                            }}
                            type="button"
                          >
                            {partner.userEmail}
                          </button>
                        </td>
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
                            {partner.status === "PendingApproval" ? (
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
                                  className="h-8 rounded-lg border border-rose-300 px-2.5 text-[11px] font-bold text-rose-700 transition hover:border-rose-500 disabled:opacity-50"
                                  disabled={partnerActionEmail === partner.userEmail}
                                  onClick={() => {
                                    if (window.confirm(`Reject partner request from ${partner.userEmail}?`)) {
                                      void runPartnerAction(partner.userEmail, "reject");
                                    }
                                  }}
                                  type="button"
                                >
                                  Reject
                                </button>
                              </>
                            ) : partner.status === "Active" ? (
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
                  </div>

                  <p className="text-xs text-muted">
                    The margin floor and max discount applied to this package come from the
                    program settings, not from per-package values.
                  </p>

                  {draftPreview ? (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-[#f8fdfe]">
                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-muted">
                              Metric
                            </th>
                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-muted">
                              Worst case ({draftPreview.effectivePct}% effective discount)
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
                            <td className="px-3 py-2 font-bold text-midnight">Partner profit (fixed)</td>
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

            {/* Program settings + hold period */}
            <section className="flex flex-wrap items-end gap-6 rounded-2xl border border-line bg-white p-5 shadow-card">
              <div>
                <label className="block text-sm font-bold text-midnight" htmlFor="max-discount-pct">
                  Max partner discount %
                </label>
                <input
                  className="mt-1.5 h-11 w-24 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                  id="max-discount-pct"
                  inputMode="numeric"
                  onChange={(event) => setMaxDiscountPctDraft(event.target.value)}
                  value={maxDiscountPctDraft}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-midnight" htmlFor="company-floor-cents">
                  Company floor (EUR cents)
                </label>
                <input
                  className="mt-1.5 h-11 w-28 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                  id="company-floor-cents"
                  inputMode="numeric"
                  onChange={(event) => setCompanyFloorCentsDraft(event.target.value)}
                  value={companyFloorCentsDraft}
                />
                <p className="mt-1 text-xs font-semibold text-muted">
                  paid − cost − partnerProfit ≥ this amount
                </p>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingProgramSettings}
                onClick={() => void saveProgramSettings()}
                type="button"
              >
                {isSavingProgramSettings ? "Saving..." : "Save program settings"}
              </button>
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
                {isSavingHoldDays ? "Saving..." : "Save hold"}
              </button>
            </section>

            {selectedPartnerEmail ? (
              <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">
                  Partner detail — {selectedPartnerEmail}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Admin-only promo code and fixed EUR profit (cents). Changing the code invalidates the old one
                  immediately.
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm font-bold text-midnight" htmlFor="partner-promo-code">
                      Promo code
                    </label>
                    <input
                      className="mt-1.5 h-11 w-48 rounded-xl border border-line px-3 text-sm uppercase outline-none focus:border-cyan"
                      id="partner-promo-code"
                      onChange={(event) => setPromoCodeDraft(event.target.value)}
                      value={promoCodeDraft}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-midnight" htmlFor="partner-profit-cents">
                      Profit (EUR cents)
                    </label>
                    <input
                      className="mt-1.5 h-11 w-32 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan"
                      id="partner-profit-cents"
                      inputMode="numeric"
                      onChange={(event) => setProfitCentsDraft(event.target.value)}
                      value={profitCentsDraft}
                    />
                  </div>
                  <button
                    className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua disabled:opacity-60"
                    disabled={isSavingPartnerDetail}
                    onClick={() => void saveSelectedPartnerDetail()}
                    type="button"
                  >
                    {isSavingPartnerDetail ? "Saving..." : "Save code & profit"}
                  </button>
                  <button
                    className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-xs font-bold text-midnight"
                    onClick={() => {
                      setSelectedPartnerEmail(null);
                      setPackageProfits([]);
                    }}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 border-t border-line/70 pt-4">
                  <h3 className="text-[11px] font-black uppercase tracking-wide text-muted">
                    Per-package profit overrides
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Optional. Default profit above applies unless a package id is listed here.
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs font-bold text-midnight" htmlFor="override-package-id">
                        Package id
                      </label>
                      <input
                        className="mt-1 h-10 w-56 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan"
                        id="override-package-id"
                        list="partner-package-ids"
                        onChange={(event) => setOverridePackageId(event.target.value)}
                        placeholder="e.g. albania-1gb-7days"
                        value={overridePackageId}
                      />
                      <datalist id="partner-package-ids">
                        {packages.map((row) => (
                          <option key={row.packageId} value={row.packageId}>
                            {row.title}
                          </option>
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-midnight" htmlFor="override-profit-cents">
                        Profit (EUR cents)
                      </label>
                      <input
                        className="mt-1 h-10 w-28 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan"
                        id="override-profit-cents"
                        inputMode="numeric"
                        onChange={(event) => setOverrideProfitCents(event.target.value)}
                        value={overrideProfitCents}
                      />
                    </div>
                    <button
                      className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua disabled:opacity-60"
                      disabled={isSavingPackageOverride}
                      onClick={() => void savePackageProfitOverride()}
                      type="button"
                    >
                      {isSavingPackageOverride ? "Saving..." : "Add / update override"}
                    </button>
                  </div>
                  {packageProfits.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {packageProfits.map((row) => (
                        <li className="flex flex-wrap items-center gap-3" key={row.packageId}>
                          <span className="font-bold text-midnight">{row.packageId}</span>
                          <span className="text-muted">{formatMoney(row.profitCents)}</span>
                          <button
                            className="text-xs font-bold text-rose-700 underline-offset-2 hover:underline disabled:opacity-50"
                            disabled={isSavingPackageOverride}
                            onClick={() => void deletePackageProfitOverride(row.packageId)}
                            type="button"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs font-semibold text-muted">No overrides yet.</p>
                  )}
                </div>
              </section>
            ) : null}

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
