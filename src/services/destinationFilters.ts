import type { HeroPackageOption } from "./packages";
import type { WizardResult } from "../app/destinations/HelpMeChooseWizard";

export type DestinationBrowseFilters = {
  daysFrom: number | null;
  daysTo: number | null;
  dataFromGb: number | null;
  dataToGb: number | null;
  includeUnlimited: boolean;
};

export const DEFAULT_DESTINATION_FILTERS: DestinationBrowseFilters = {
  daysFrom: null,
  daysTo: null,
  dataFromGb: null,
  dataToGb: null,
  includeUnlimited: true,
};

function isWithinRange(value: number, from: number | null, to: number | null) {
  if (from != null && value < from) return false;
  if (to != null && value > to) return false;
  return true;
}

/** Same 999GB sentinel `toESIMPackage` (backend) uses for unlimited data. */
function isUnlimited(plan: HeroPackageOption) {
  return plan.dataNumericGb >= 999;
}

export function matchesDestinationFilters(
  plan: HeroPackageOption,
  filters: DestinationBrowseFilters,
): boolean {
  if (!isWithinRange(plan.durationDays, filters.daysFrom, filters.daysTo)) {
    return false;
  }

  if (isUnlimited(plan)) {
    return filters.includeUnlimited;
  }

  return isWithinRange(plan.dataNumericGb, filters.dataFromGb, filters.dataToGb);
}

export function isDestinationFiltersActive(filters: DestinationBrowseFilters): boolean {
  return (
    filters.daysFrom != null ||
    filters.daysTo != null ||
    filters.dataFromGb != null ||
    filters.dataToGb != null ||
    filters.includeUnlimited !== DEFAULT_DESTINATION_FILTERS.includeUnlimited
  );
}

/**
 * Parses the wizard's URL query params (`days`, `dataMin`, `dataMax`,
 * `unlimited`) into filter state. Malformed/missing values fall back to "no
 * constraint" rather than throwing, since this reads untrusted query params.
 */
export function parseDestinationFiltersFromParams(
  params: Record<string, string | undefined>,
): DestinationBrowseFilters {
  const parseNum = (value: string | undefined): number | null => {
    if (!value) return null;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    daysFrom: parseNum(params.daysMin),
    daysTo: parseNum(params.daysMax),
    dataFromGb: parseNum(params.dataMin),
    dataToGb: parseNum(params.dataMax),
    includeUnlimited: params.unlimited !== "false",
  };
}

/**
 * Maps a "filters" wizard result onto the `/destinations` query params
 * `parseDestinationFiltersFromParams` reads back. A "country" result is
 * handled separately by the caller (it navigates via `?country=` instead).
 */
export function wizardFiltersToQueryParams(
  result: Extract<WizardResult, { kind: "filters" }>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (result.days.kind === "preset" || result.days.kind === "custom") {
    params.set("daysMin", String(result.days.days));
    params.set("daysMax", String(result.days.days));
  }

  if (result.data.kind === "range") {
    params.set("dataMin", String(result.data.fromGb));
    if (result.data.toGb != null) {
      params.set("dataMax", String(result.data.toGb));
    }
    params.set("unlimited", "false");
  } else if (result.data.kind === "unlimited") {
    params.set("unlimited", "true");
    params.set("dataMin", "999");
  }

  return params;
}
