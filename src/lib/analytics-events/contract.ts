/** Frozen analytics contract. Identical copies in backend, web and mobile. See docs/superpowers/plans/2026-11-26-user-analytics.md §3. */

export const ANALYTICS_CONTRACT_VERSION = 1;

/** Event types a client may send. `app_open` is recorded only by the server (from /activity/ping). */
export const CLIENT_EVENT_TYPES = [
  'screen_view',
  'search',
  'flight_search',
  'checkout_step',
  'payment_failed',
  'promo_view',
  'promo_tap',
  'notification_open',
] as const;
export type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number];
export type AnalyticsEventType = ClientEventType | 'app_open';

export const PLATFORMS = ['ios', 'android', 'web'] as const;
export type AnalyticsPlatform = (typeof PLATFORMS)[number];

export const DEVICE_TYPES = ['phone', 'tablet', 'computer'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

/** Same on every platform. `begin` = checkout opened for a plan, `pay_submit` = the pay button was pressed. */
export const CHECKOUT_STEPS = ['begin', 'billing', 'payment_method', 'pay_submit'] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

export const PAYMENT_METHODS = ['card', 'pok', 'apple_pay', 'google_pay', 'paypal', 'crypto', 'wallet', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Our own codes. Never a provider message. */
export const FAILURE_CODES = ['declined', 'cancelled', 'timeout', 'auth_failed', 'provider_error', 'network', 'validation', 'other'] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

export const PROMO_KINDS = ['event_modal', 'promo_code', 'notification', 'game_reward'] as const;
export type PromoKind = (typeof PROMO_KINDS)[number];

export const MAX_EVENTS_PER_BATCH = 20;
export const MAX_SEARCH_TERM_LENGTH = 60;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const FLUSH_INTERVAL_MS = 30 * 1000;
/** A client keeps at most this many unsent events; the oldest are dropped first. */
export const MAX_QUEUED_EVENTS = 200;

/** `visitorId`, `sessionId` and `promoId` all match this. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
/** Route template, e.g. `country/[slug]` (app) or `/esim/[slug]` (web). No query, hash or `@`. */
export const SCREEN_PATTERN = /^\/?[a-z0-9_\-[\]]+(\/[a-z0-9_\-[\]]+)*\/?$|^\/$/;
/** Backend package `countryCode` slug, e.g. `united-states`, `europe`. */
export const DESTINATION_PATTERN = /^[a-z][a-z0-9-]{1,60}$/;
/** IATA airport code, upper case. Used only by `flight_search`. */
export const AIRPORT_PATTERN = /^[A-Z]{3}$/;
/** Promo codes are stored upper case. */
export const PROMO_CODE_PATTERN = /^[A-Z0-9_-]{2,40}$/;

type Base = { /** Client time, ISO 8601 with offset. */ at: string };

export type ClientEvent =
  | (Base & { type: 'screen_view'; screen: string; destination?: string | null })
  | (Base & { type: 'search'; screen: string; searchTerm: string; resultCount: number })
  | (Base & { type: 'flight_search'; airport: string })
  | (Base & { type: 'checkout_step'; step: CheckoutStep; paymentMethod?: PaymentMethod | null; destination?: string | null; packageId?: string | null })
  | (Base & { type: 'payment_failed'; paymentMethod: PaymentMethod; failureCode: FailureCode })
  | (Base & { type: 'promo_view' | 'promo_tap'; promoKind: PromoKind; promoId: string })
  | (Base & { type: 'notification_open'; promoId: string });

export type EventBatch = {
  contractVersion: number;
  visitorId: string;
  sessionId: string;
  platform: AnalyticsPlatform;
  appVersion?: string | null;
  /** BCP 47, e.g. `en-US`. */
  locale?: string | null;
  /** Minutes to add to UTC to get the visitor's local time (New York in winter = -300). */
  utcOffsetMinutes?: number | null;
  deviceType?: DeviceType | null;
  /** Only the campaign that opened this session, if any. */
  campaign?: { source: string; medium?: string | null; campaign?: string | null } | null;
  /** Web only: the referrer's host name, e.g. `www.google.com`. Never a path. */
  referrerDomain?: string | null;
  events: ClientEvent[];
};

export type EventBatchResult = { accepted: number; dropped: number };
