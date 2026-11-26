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
