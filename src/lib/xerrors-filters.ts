/**
 * /xerrors filter state <-> URL query <-> backend query. Pure so the shareable
 * URL contract is unit tested; the page only wires these to the router.
 */

export const KINDS = ["http_error", "handled_failure", "client_error", "crash", "unhandled_500", "parse_error"] as const;
export const SOURCES = ["server", "client-mobile", "client-web"] as const;
export const SEVERITIES = ["critical", "warning", "info"] as const;
export const AREAS = ["payments", "auth", "packages", "orders", "user", "admin", "airalo", "esim", "unknown"] as const;
export const STATUS_CLASSES = ["4xx", "5xx"] as const;
export const PLATFORMS = ["ios", "android", "web", "unknown"] as const;
export const NO_EMAIL_REASONS = [
  "no_auth_header",
  "token_invalid",
  "token_expired",
  "session_revoked",
  "pre_login_endpoint",
  "public_endpoint",
  "admin_endpoint",
  "parse_error",
  "unknown"
] as const;
export const PAGE_SIZES = ["25", "50", "100"] as const;
export const RESOLVED_VALUES = ["false", "true", "all"] as const;
export const TRI_VALUES = ["true", "false"] as const;
export const SORTS = ["newest", "oldest"] as const;

export type ErrorFilters = {
  q: string;
  kind: string;
  source: string;
  severity: string;
  area: string;
  statusCode: string;
  statusClass: string;
  appVersion: string;
  platform: string;
  scenario: string;
  /** "false" = open only (default), "true" = resolved only, "all" = no filter. */
  resolved: string;
  hasEmail: string;
  noEmailReason: string;
  ip: string;
  from: string;
  to: string;
  sort: string;
  limit: string;
  /** "true" = include ordinary 4xx / minor rows (backend realFailuresOnly=false). */
  includeMinor: string;
};

export const DEFAULT_FILTERS: ErrorFilters = {
  q: "",
  kind: "",
  source: "",
  severity: "",
  area: "",
  statusCode: "",
  statusClass: "",
  appVersion: "",
  platform: "",
  scenario: "",
  resolved: "false",
  hasEmail: "",
  noEmailReason: "",
  ip: "",
  from: "",
  to: "",
  sort: "newest",
  limit: "25",
  includeMinor: ""
};

const FILTER_KEYS = Object.keys(DEFAULT_FILTERS) as Array<keyof ErrorFilters>;

/** Free-text keys accept anything; the rest must match their allowlist. */
const ALLOWED: Partial<Record<keyof ErrorFilters, readonly string[]>> = {
  kind: KINDS,
  source: SOURCES,
  severity: SEVERITIES,
  area: AREAS,
  statusClass: STATUS_CLASSES,
  platform: PLATFORMS,
  resolved: RESOLVED_VALUES,
  hasEmail: TRI_VALUES,
  noEmailReason: NO_EMAIL_REASONS,
  sort: SORTS,
  limit: PAGE_SIZES,
  includeMinor: ["true"]
};

const NARROWING_KEYS: Array<keyof ErrorFilters> = [
  "statusCode",
  "statusClass",
  "severity",
  "noEmailReason",
  "area",
  "kind",
  "source",
  "appVersion",
  "platform",
  "scenario",
  "q",
  "ip",
  "hasEmail"
];

export function filtersFromSearchParams(params: URLSearchParams): ErrorFilters {
  const next: ErrorFilters = { ...DEFAULT_FILTERS };
  for (const key of FILTER_KEYS) {
    const raw = (params.get(key) ?? "").trim();
    if (!raw) continue;
    const allowed = ALLOWED[key];
    if (allowed && !allowed.includes(raw)) continue;
    next[key] = raw;
  }
  return next;
}

/** Only non-default values, so the default view has a clean URL. */
export function filtersToUrlParams(filters: ErrorFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key].trim();
    if (value && value !== DEFAULT_FILTERS[key]) params.set(key, value);
  }
  return params;
}

export function hasActiveFilters(filters: ErrorFilters): boolean {
  return FILTER_KEYS.some((key) => key !== "limit" && filters[key].trim() !== DEFAULT_FILTERS[key]);
}

/** Query for GET /bff/admin/errors (and /stats with `forStats`, which drops paging and sort). */
export function filtersToBackendParams(
  filters: ErrorFilters,
  cursor?: string,
  options: { forStats?: boolean } = {}
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (key === "limit" || key === "sort" || key === "resolved" || key === "includeMinor") continue;
    const value = filters[key].trim();
    if (value) params.set(key, value);
  }
  // The backend defaults to real failures only (404, 5xx, critical, non-http kinds). Any
  // narrowing filter must lift that, or 401/409/429 rows silently vanish from the results.
  if (filters.includeMinor === "true" || NARROWING_KEYS.some((key) => filters[key].trim())) {
    params.set("realFailuresOnly", "false");
  }
  if (filters.resolved !== "all") params.set("resolved", filters.resolved);
  if (!options.forStats) {
    params.set("limit", filters.limit);
    params.set("sort", filters.sort);
    if (cursor) params.set("cursor", cursor);
  }
  return params;
}
