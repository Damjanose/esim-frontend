import type { HeroPackageOption } from "./packages";
import type { DaysAnswer, DataAnswer } from "../app/destinations/HelpMeChooseWizard";

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
 * Maps the wizard's trip-length/data-need answers onto the `/destinations`
 * query params `parseDestinationFiltersFromParams` reads back. Used both for
 * a "filters" wizard result (no country chosen) and alongside `?country=`
 * when the user did pick a destination, so the country page can narrow to
 * plans matching what the wizard asked for instead of showing everything.
 */
export function wizardFiltersToQueryParams({
  days,
  data,
}: {
  days: DaysAnswer;
  data: DataAnswer;
}): URLSearchParams {
  const params = new URLSearchParams();

  if (days.kind === "preset" || days.kind === "custom") {
    params.set("daysMin", String(days.days));
    params.set("daysMax", String(days.days));
  }

  if (data.kind === "range") {
    params.set("dataMin", String(data.fromGb));
    if (data.toGb != null) {
      params.set("dataMax", String(data.toGb));
    }
    params.set("unlimited", "false");
  } else if (data.kind === "unlimited") {
    params.set("unlimited", "true");
    params.set("dataMin", "999");
  }

  return params;
}
