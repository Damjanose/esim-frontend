/** Keep in sync with backend marketplaceOpenAction + mobile MarketplaceAdvancedFilters. */

export type MarketplaceSortMode =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "data_desc"
  | "duration_desc"
  | "name_asc"
  | "name_desc";

export type MarketplaceOpenFilters = {
  destination?: string | string[] | "all";
  priceFrom?: number | null;
  priceTo?: number | null;
  durationFrom?: number | null;
  durationTo?: number | null;
  dataFrom?: number | null;
  dataTo?: number | null;
  includeUnlimited?: boolean;
  sort?: MarketplaceSortMode;
};

export type NotificationOpenAction = {
  type: "marketplace";
  passId?: string;
  filters?: MarketplaceOpenFilters;
} | null;

export type OpenActionDraft = {
  passId: string;
  destinations: string[];
  priceFrom: string;
  priceTo: string;
  durationFrom: string;
  durationTo: string;
  dataFrom: string;
  dataTo: string;
  includeUnlimited: boolean;
  sort: MarketplaceSortMode;
};

export const EMPTY_OPEN_ACTION_DRAFT: OpenActionDraft = {
  passId: "",
  destinations: [],
  priceFrom: "",
  priceTo: "",
  durationFrom: "",
  durationTo: "",
  dataFrom: "",
  dataTo: "",
  includeUnlimited: true,
  sort: "name_asc",
};

export const SORT_OPTIONS: { id: MarketplaceSortMode; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "data_desc", label: "Most Data" },
  { id: "duration_desc", label: "Longest Validity" },
  { id: "name_asc", label: "Name: A → Z" },
  { id: "name_desc", label: "Name: Z → A" },
];

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function draftToOpenAction(draft: OpenActionDraft): NotificationOpenAction {
  const filters: MarketplaceOpenFilters = {};
  if (draft.destinations.length > 0) filters.destination = [...draft.destinations];
  const priceFrom = parseOptionalNumber(draft.priceFrom);
  const priceTo = parseOptionalNumber(draft.priceTo);
  const durationFrom = parseOptionalNumber(draft.durationFrom);
  const durationTo = parseOptionalNumber(draft.durationTo);
  const dataFrom = parseOptionalNumber(draft.dataFrom);
  const dataTo = parseOptionalNumber(draft.dataTo);
  if (priceFrom != null) filters.priceFrom = priceFrom;
  if (priceTo != null) filters.priceTo = priceTo;
  if (durationFrom != null) filters.durationFrom = durationFrom;
  if (durationTo != null) filters.durationTo = durationTo;
  if (dataFrom != null) filters.dataFrom = dataFrom;
  if (dataTo != null) filters.dataTo = dataTo;
  if (!draft.includeUnlimited) filters.includeUnlimited = false;
  if (draft.sort !== "name_asc") filters.sort = draft.sort;

  const hasFilters = Object.keys(filters).length > 0;
  if (!draft.passId && !hasFilters) return null;

  const action: Exclude<NotificationOpenAction, null> = { type: "marketplace" };
  if (draft.passId) action.passId = draft.passId;
  if (hasFilters) action.filters = filters;
  return action;
}

export function openActionToDraft(action: NotificationOpenAction | undefined): OpenActionDraft {
  if (!action) return { ...EMPTY_OPEN_ACTION_DRAFT };
  const filters = action.filters ?? {};
  let destinations: string[] = [];
  if (Array.isArray(filters.destination)) destinations = [...filters.destination];
  else if (typeof filters.destination === "string" && filters.destination !== "all") {
    destinations = [filters.destination];
  }
  return {
    passId: action.passId ?? "",
    destinations,
    priceFrom: filters.priceFrom != null ? String(filters.priceFrom) : "",
    priceTo: filters.priceTo != null ? String(filters.priceTo) : "",
    durationFrom: filters.durationFrom != null ? String(filters.durationFrom) : "",
    durationTo: filters.durationTo != null ? String(filters.durationTo) : "",
    dataFrom: filters.dataFrom != null ? String(filters.dataFrom) : "",
    dataTo: filters.dataTo != null ? String(filters.dataTo) : "",
    includeUnlimited: filters.includeUnlimited !== false,
    sort: filters.sort ?? "name_asc",
  };
}

export function summarizeOpenAction(action: NotificationOpenAction | undefined): string {
  if (!action) return "None";
  const parts: string[] = [];
  if (action.passId) parts.push(`Pass: ${action.passId}`);
  const f = action.filters;
  if (f) {
    if (Array.isArray(f.destination) && f.destination.length) {
      parts.push(`Countries: ${f.destination.join(", ")}`);
    } else if (typeof f.destination === "string" && f.destination !== "all") {
      parts.push(`Country: ${f.destination}`);
    }
    if (f.durationFrom != null || f.durationTo != null) {
      parts.push(`Duration: ${f.durationFrom ?? "…"}–${f.durationTo ?? "…"}d`);
    }
    if (f.priceFrom != null || f.priceTo != null) {
      parts.push(`Price: €${f.priceFrom ?? "…"}–€${f.priceTo ?? "…"}`);
    }
    if (f.dataFrom != null || f.dataTo != null) {
      parts.push(`Data: ${f.dataFrom ?? "…"}–${f.dataTo ?? "…"} GB`);
    }
    if (f.includeUnlimited === false) parts.push("No unlimited");
    if (f.sort) parts.push(`Sort: ${f.sort}`);
  }
  return parts.length ? parts.join(" · ") : "None";
}

/** Body field for create/update/notify: prefer full openAction over legacy passId. */
export function openActionRequestBody(draft: OpenActionDraft): { openAction: NotificationOpenAction } {
  return { openAction: draftToOpenAction(draft) };
}
