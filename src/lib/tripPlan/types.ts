/**
 * Shapes of the backend `/itineraries` API, as the BFF passes them through.
 * Mirrors velocity-eSim/src/services/itineraries.ts — keep the two in step.
 */

export type ItineraryDaySummary = {
  date?: string;
  weekday?: string;
  title: string;
};

export type ItinerarySummary = {
  title: string;
  base?: string;
  accommodation?: string;
  style?: string;
  days: ItineraryDaySummary[];
};

export type ItineraryPrice = {
  amount: number;
  currency: string;
  quoteAmount: number;
  quoteCurrency: string;
  free: boolean;
  purchased?: boolean;
};

/** Prompt edits for one plan. Editable while inside the quota window with edits left. */
export type ItineraryEdits = {
  used: number;
  limit: number;
  remaining: number;
  editableUntil: string;
  canEdit: boolean;
};

export type PlanDocumentBlock = {
  start?: string;
  end?: string;
  place: string;
  details: string;
  highlight?: boolean;
};

export type PlanDocumentDay = {
  date?: string;
  weekday?: string;
  title: string;
  theme?: string;
  highlight?: string;
  occasion?: string;
  blocks: PlanDocumentBlock[];
};

/** The plan in the PDF's section order (backend itineraryDocument.ts). */
export type PlanDocument = {
  title: string;
  subtitle?: string;
  base?: string;
  accommodation?: string;
  style?: string;
  occasion?: string;
  logistics?: { arrival?: string; departure?: string; base?: string; nearestTransit?: string };
  transportTips: string[];
  notes: Array<{ label: string; text: string }>;
  days: PlanDocumentDay[];
  /** Pre-purchase cut: only the first half of day 1 is included. */
  locked?: boolean;
};

/** One saved state of a plan: n=0 is the original, each edit adds the next n. */
export type ItineraryVersionInfo = {
  n: number;
  prompt: string | null;
  title: string;
  createdAt: string;
};

export type ItineraryVersion = ItineraryVersionInfo & { document: PlanDocument };

export type ItineraryListItem = {
  id: string;
  title: string;
  summary: ItinerarySummary;
  createdAt: string;
  /** Aged out of the quota window: listed under "Older plans" and no longer counts. */
  archived?: boolean;
  price: ItineraryPrice;
  edits?: ItineraryEdits;
  /** Only on GET /itineraries/:id, create and edit: locked cut before purchase, full latest after. */
  document?: PlanDocument;
  /** Only once purchased, ascending by n. */
  versions?: ItineraryVersionInfo[];
};

export type ItineraryConfig = {
  generationLimit: number;
  windowDays: number;
  used: number;
  remaining: number;
  /** Present when remaining is 0: days until the oldest plan ages out of the window. */
  resetsInDays: number | null;
  price: ItineraryPrice;
};

export type Transport = "public" | "taxi" | "car";

export type TripPlanInput = {
  country: string;
  durationDays: number;
  lang?: string;
  people?: number;
  cities?: string[];
  mustSee?: string;
  custom?: string;
  transport?: Transport;
  pets?: boolean;
  startDate?: string;
  accommodation?: string;
};

export type CheckoutResult = {
  free?: boolean;
  alreadyPurchased?: boolean;
  purchasedAt?: string | null;
  paymentId?: string;
  checkoutUrl?: string;
  environment?: string;
  amount?: number;
  currency?: string;
};
