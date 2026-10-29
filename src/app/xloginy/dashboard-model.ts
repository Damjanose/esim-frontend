export type Amounts = Record<string, number>;
export type Pagination = { page: number; pageSize: number; total: number };
export type Earnings = {
  date: string;
  purchases: number;
  revenueByCurrency: Amounts;
  costByCurrency: Amounts;
  profitByCurrency: Amounts;
  missingCostCount: number;
};
export type Purchase = {
  id: string;
  airaloId: number;
  userEmail: string;
  packageId: string;
  packageTitle: string | null;
  destination: string | null;
  dataLabel: string | null;
  durationDays: number | null;
  network: string | null;
  iccids: string[];
  paymentAmountCents: number | null;
  paymentCurrency: string | null;
  paymentStatus: string | null;
  costCents: number | null;
  costCurrency: string | null;
  providerCreatedAt: string;
  createdAt: string;
};
export type DashboardUser = {
  email: string;
  createdAt: string;
  updatedAt: string;
  otpRequestCount: number;
  lastOtpRequestedAt: string | null;
};
export type OtpRequest = {
  id: string;
  email: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};
export type Dashboard = {
  reportingTimezone?: string;
  today?: Earnings;
  dailyEarnings?: Earnings[];
  summary: {
    purchaseCount: number;
    month?: string | null;
    userCount: number;
    revenueByCurrency: Amounts;
    costByCurrency: Amounts;
    profitByCurrency: Amounts;
    missingCostCount?: number;
    latestPurchaseAt: string | null;
  };
  purchases: Purchase[];
  purchasesPagination: Pagination;
  users: DashboardUser[];
  usersPagination: Pagination;
  recentOtpRequests: OtpRequest[];
  otpPagination: Pagination;
};
export type ProviderSim = {
  iccid: string;
  status: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  remainingMb: number | null;
  totalMb: number | null;
  isUnlimited: boolean | null;
  remainingVoice: number | null;
  totalVoice: number | null;
  remainingText: number | null;
  totalText: number | null;
  error: string | null;
};
export type ProviderDetails = { checkedAt: string; sims: ProviderSim[] };
export type ProviderState = {
  data?: ProviderDetails;
  error?: string;
  loading?: boolean;
};

export function currentUtcMonth() {
  return new Date().toISOString().slice(0, 7);
}
export function formatMoney(
  cents: number | null | undefined,
  currency: string | null | undefined,
) {
  if (cents == null || !Number.isFinite(cents) || !currency) return "—";
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return "—";
  }
}
export function formatAmounts(amounts: Amounts = {}) {
  const entries = Object.entries(amounts).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return entries.length
    ? entries
        .map(([currency, cents]) => formatMoney(cents, currency))
        .join(" · ")
    : "—";
}
export function profitLabel(earnings: {
  profitByCurrency: Amounts;
  missingCostCount?: number;
}) {
  return (earnings.missingCostCount ?? 0) > 0
    ? "Incomplete"
    : formatAmounts(earnings.profitByCurrency);
}
export function formatDate(value: string | null | undefined, dateOnly = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    ...(dateOnly ? {} : { timeStyle: "short" as const }),
    timeZone: "UTC",
  }).format(date);
}
export function formatData(mb: number | null, unlimited: boolean | null) {
  if (unlimited) return "Unlimited";
  if (mb == null || !Number.isFinite(mb) || mb < 0) return "Unavailable";
  return mb >= 1024
    ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(mb / 1024)} GB`
    : `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(mb)} MB`;
}
const STATUS: Record<
  string,
  { label: string; tone: "green" | "blue" | "gray" | "amber" }
> = {
  ACTIVE: { label: "Active", tone: "green" },
  NOT_ACTIVE: { label: "Not active", tone: "blue" },
  FINISHED: { label: "Finished", tone: "gray" },
  EXPIRED: { label: "Expired", tone: "gray" },
  UNKNOWN: { label: "Unknown", tone: "amber" },
};
export function simStatus(status: string | null) {
  return STATUS[status?.toUpperCase() ?? "UNKNOWN"] ?? STATUS.UNKNOWN;
}
export function providerSummary(state?: ProviderState) {
  if (!state || (state.loading && !state.data))
    return { label: "Checking Airalo", tone: "gray" as const };
  if (state.error && !state.data)
    return { label: "Check failed", tone: "amber" as const };
  const sims = state.data?.sims ?? [];
  if (!sims.length || sims.every((sim) => !sim.status))
    return { label: "Unavailable", tone: "amber" as const };
  const statuses = new Set(
    sims.map((sim) => sim.status?.toUpperCase() ?? "UNKNOWN"),
  );
  if (statuses.size > 1)
    return { label: "Mixed status", tone: "amber" as const };
  return simStatus(sims[0].status);
}
