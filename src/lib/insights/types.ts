export type Cents = Record<string, number>; // lower-case currency → cents. Never summed across currencies.
export type Money = { byCurrency: Cents; unknownCount: number };
export type Profit = Money & { estimatedCount: number; recordedCount: number };
export type Rate = number | null; // 0..1, null when the denominator is 0

export type ReportResponse<T> = {
  report: ReportName;
  range: { from: string; to: string; tz: string };
  previousRange: { from: string; to: string } | null;
  generatedAt: string;
  /** Labels the screen must show, e.g. 'network_location', 'deleted_accounts_excluded', 'consented_web_only'. */
  notes: string[];
  data: T;
  previous: T | null;
};

export type ReportName =
  | 'overview' | 'locations' | 'audience' | 'screens' | 'destinations'
  | 'searches' | 'peak-times' | 'funnel' | 'first-source' | 'data-health';

export type OverviewData = {
  activeVisitors: number; newVisitors: number; returningVisitors: number; sessions: number;
  orders: number; topups: number; buyers: number;
  /** buyers / activeVisitors */
  conversion: Rate;
  revenue: Money; profit: Profit;
};

export type LocationRow = {
  /** `US`, `US-CA` or `US-CA-Los Angeles`. */
  key: string;
  country: string | null; regionCode: string | null; region: string | null; city: string | null;
  visitors: number; buyers: number; orders: number; conversion: Rate;
  revenue: Money; profit: Profit;
};
export type LocationsData = { level: 'country' | 'region' | 'city'; basis: 'network' | 'billing'; rows: LocationRow[]; unknownVisitors: number };

export type CountRow = { key: string; visitors: number; sessions: number };
export type AudienceData = { locales: CountRow[]; deviceTypes: CountRow[]; platforms: CountRow[]; appVersions: CountRow[] };

export type ScreensData = { rows: { screen: string; platform: 'app' | 'web'; views: number; visitors: number }[] };

export type DestinationRow = {
  destination: string; views: number; visitors: number;
  checkoutBegins: number; orders: number; buyers: number;
  /** buyers / visitors */
  conversion: Rate;
  favourites: number; tripPlans: number;
};
export type DestinationsData = { rows: DestinationRow[]; averageConversion: Rate };

export type SearchesData = {
  top: { term: string; count: number; visitors: number; zeroResultCount: number }[];
  zeroResults: { term: string; count: number; visitors: number }[];
  flightAirports: { airport: string; count: number }[];
};

export type PeakCell = { weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; /* 0 = Monday */ hour: number; events: number; visitors: number; orders: number };
export type PeakTimesData = { tz: string; cells: PeakCell[] };

export const FUNNEL_STEPS = ['marketplace', 'destination', 'begin', 'billing', 'payment_method', 'pay_submit', 'paid'] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];
export type FunnelData = {
  steps: { step: FunnelStep; visitors: number }[];
  byPlatform: { platform: string; steps: { step: FunnelStep; visitors: number }[] }[];
  failures: { paymentMethod: string; failureCode: string; count: number }[];
};

export type FirstSourceRow = { source: string; medium: string | null; campaign: string | null; visitors: number; buyers: number; orders: number; revenue: Money };
export type FirstSourceData = { rows: FirstSourceRow[]; direct: { visitors: number; buyers: number } };

export type DataHealthData = {
  collectionEnabled: boolean;
  latestEventAt: Record<'ios' | 'android' | 'web', string | null>;
  eventsLast24h: number;
  /** 0..1 over the selected range */
  noLocationShare: Rate;
  unknownCostSaleShare: Rate;
  salesWithoutSnapshot: number;
};

// ── Wave 2 / 3 additions (plan 2026-11-27) ──
export type ReportNameW2 =
  | 'daily' | 'campaign-return' | 'promotions' | 'customers' | 'seasons' | 'acquisition' | 'opportunities';

export type DailyData = { days: { date: string; visitors: number; sessions: number; orders: number; revenue: Money }[] };

export type CampaignReturnRow = {
  source: string; medium: string | null; campaign: string | null;
  /** Spend entered for this source+campaign, overlapping the range, prorated by days. Per currency. */
  spend: Cents; spendEntries: number;
  visitors: number; buyers: number; revenue: Money; profit: Profit;
  /** Only filled for a currency where both spend and buyers exist. Otherwise empty: never 0. */
  costPerBuyer: Cents;
  /** Revenue divided by spend, only when both are in exactly one and the same currency; else null. */
  revenuePerSpend: number | null;
  /** profit − spend, per currency, only for currencies present in both; else empty. */
  profitAfterAds: Cents;
};
export type CampaignReturnData = { rows: CampaignReturnRow[]; unmatchedSpend: { source: string; campaign: string; spend: Cents }[] };

export type PromotionRow = {
  promoKind: 'event_modal' | 'promo_code' | 'notification' | 'game_reward';
  promoId: string; label: string | null;
  views: number; viewers: number; taps: number; tappers: number; tapRate: Rate;
  /** Buyers who tapped and then paid within 7 days of their first tap (same visitor or email). */
  buyersWithin7d: number; revenueWithin7d: Money;
  /** promo_code only: paid sales whose salePromoCode equals promoId. */
  salesWithCode: number; revenueWithCode: Money;
};
export type PromotionsData = { rows: PromotionRow[] };

export type CustomersData = {
  buyers: number; repeatBuyers: number; repeatRate: Rate; topupBuyers: number;
  medianDaysBetweenPurchases: number | null;
  /** Grouped by the month of each buyer's first ever purchase (not only in range). */
  cohorts: { month: string; buyers: number; repeatBuyers: number; spend: Money }[];
};

export type SeasonsData = { months: { month: string; orders: number; buyers: number; revenue: Money; topDestinations: { destination: string; orders: number }[] }[] };

export const ACQUISITION_ANSWERS = ['search', 'social', 'friend', 'ad', 'app_store', 'blog', 'partner', 'other'] as const;
export type AcquisitionAnswer = (typeof ACQUISITION_ANSWERS)[number];
export type AcquisitionData = {
  rows: { answer: AcquisitionAnswer; count: number; share: Rate }[];
  /** "other" free texts given by ≥ 3 different people, lower-cased. */
  otherTexts: { text: string; count: number }[];
  total: number;
};

export const OPPORTUNITY_RULES = [
  'destination_low_conversion', 'region_high_conversion_low_traffic', 'zero_result_search',
  'payment_method_failing', 'campaign_unprofitable', 'best_hours',
] as const;
export type OpportunityRule = (typeof OPPORTUNITY_RULES)[number];
export type OpportunityCard = {
  rule: OpportunityRule;
  /** Stable key, e.g. `destination_low_conversion:turkey`. */
  key: string;
  /** Plain text built by the backend, e.g. "Turkey: many views, few sales". */
  title: string;
  suggestion: string;
  /** The numbers behind the card, shown as a small table. */
  numbers: { label: string; value: string }[];
};
export type OpportunitiesData = { minSample: number; cards: OpportunityCard[]; belowSample: boolean };

// Admin CRUD shapes
export type AdSpendEntry = { id: string; source: string; medium: string | null; campaign: string; from: string; to: string; amountCents: number; currency: string; note: string | null };
export const CHART_NOTE_KINDS = ['ad', 'promotion', 'release', 'holiday', 'other'] as const;
export type ChartNoteKind = (typeof CHART_NOTE_KINDS)[number];
export type ChartNote = {
  id: string;
  date: string;
  kind: ChartNoteKind;
  title: string;
  readOnly: boolean;
  /** Built-in holidays only: country names to plan a discount for. Empty means worldwide. */
  markets?: string[];
};
