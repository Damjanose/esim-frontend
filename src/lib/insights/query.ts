export type InsightsPlatform = "all" | "ios" | "android" | "web";

export type InsightsFilters = {
  from: string;
  to: string;
  platform: InsightsPlatform;
  /** ISO-2 upper case, or "all". */
  country: string;
  compare: boolean;
};

export type InsightsPreset = "7" | "28" | "90" | "this-month" | "last-month";

/** Optional report parameters that only some reports use. */
export type InsightsExtra = { tz?: string; level?: string; basis?: string };

const PLATFORMS: InsightsPlatform[] = ["all", "ios", "android", "web"];
const MAX_RANGE_DAYS = 400;
const DAY_MS = 86400000;

const isYmd = (value: string | null | undefined): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
};

function ymdFromTime(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function shiftDays(ymd: string, days: number): string {
  return ymdFromTime(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS);
}

/** Days in a range, counting both ends. */
export function dayCount(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

export function presetRange(preset: InsightsPreset, today: string): { from: string; to: string } {
  if (preset === "this-month") return { from: `${today.slice(0, 8)}01`, to: today };
  if (preset === "last-month") {
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));
    const firstOfPrevious = Date.UTC(year, month - 2, 1);
    const lastOfPrevious = Date.UTC(year, month - 1, 0);
    return { from: ymdFromTime(firstOfPrevious), to: ymdFromTime(lastOfPrevious) };
  }
  const days = Number(preset);
  return { from: shiftDays(today, -(days - 1)), to: today };
}

export function defaultFilters(today: string): InsightsFilters {
  return { ...presetRange("28", today), platform: "all", country: "all", compare: false };
}

export function parseFilters(params: URLSearchParams, today: string): InsightsFilters {
  const defaults = defaultFilters(today);
  const from = params.get("from");
  const to = params.get("to");
  if (!isYmd(from) || !isYmd(to) || from > to || dayCount(from, to) > MAX_RANGE_DAYS) {
    // Keep only the valid parts of the rest of the query.
    return { ...defaults, ...pickValid(params) };
  }
  return { ...pickValid(params), from, to };
}

function pickValid(params: URLSearchParams): Pick<InsightsFilters, "platform" | "country" | "compare"> {
  const platform = params.get("platform") as InsightsPlatform | null;
  const country = (params.get("country") ?? "all").toUpperCase();
  return {
    platform: platform && PLATFORMS.includes(platform) ? platform : "all",
    country: /^[A-Z]{2}$/.test(country) ? country : "all",
    compare: params.get("compare") === "1"
  };
}

export function serializeFilters(filters: InsightsFilters): URLSearchParams {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    platform: filters.platform,
    country: filters.country
  });
  if (filters.compare) params.set("compare", "1");
  return params;
}

/** The web BFF URL for one report. */
export function insightsReportUrl(report: string, filters: InsightsFilters, extra: InsightsExtra = {}): string {
  const params = serializeFilters(filters);
  if (extra.tz) params.set("tz", extra.tz);
  if (extra.level) params.set("level", extra.level);
  if (extra.basis) params.set("basis", extra.basis);
  return `/bff/admin/insights/${report}?${params.toString()}`;
}
