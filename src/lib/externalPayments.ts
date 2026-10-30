/**
 * PayPal + crypto checkout (alongside Pokpay card). Shapes mirror the backend's
 * /payments/methods, /payments/paypal/*, /payments/crypto/* and /payments/external/:id.
 */

export type PaymentMethod = "card" | "paypal" | "crypto";
export type CryptoNetwork = "tron-usdt" | "bsc-usdt";

export type PaymentMethods = {
  card: true;
  paypal: boolean;
  crypto: boolean;
  cryptoNetworks: Array<{ id: CryptoNetwork; label: string }>;
};

export const CARD_ONLY: PaymentMethods = { card: true, paypal: false, crypto: false, cryptoNetworks: [] };

export type ExternalPaymentStatus =
  | "pending"
  | "completed"
  | "expired"
  | "underpaid"
  | "review"
  | "failed"
  | "refunded";

export type ExternalPayment = {
  paymentId: string;
  provider: "paypal" | "crypto";
  status: ExternalPaymentStatus;
  amountCents: number;
  currency: string;
  kind: "package" | "topup";
  crypto?: {
    network: CryptoNetwork;
    token: string;
    address: string;
    payAmount: string;
    expiresAt: string;
    qrUri: string;
    txHash: string | null;
  };
  order?: { id: number | string } | null;
  topup?: unknown;
  provisioningError?: string | null;
};

/** What the picker offers, in display order. Card is always there. */
export function availableMethods(methods: PaymentMethods): PaymentMethod[] {
  return [
    "card",
    ...(methods.paypal ? (["paypal"] as const) : []),
    ...(methods.crypto && methods.cryptoNetworks.length > 0 ? (["crypto"] as const) : [])
  ];
}

/** Our payment ids for PayPal/crypto; anything else is never forwarded to the backend. */
export function isExternalPaymentId(value: string | null | undefined): value is string {
  return typeof value === "string" && /^(pp|cx)_[A-Za-z0-9_-]{1,64}$/.test(value);
}

export const NETWORK_COPY: Record<CryptoNetwork, { chain: string; standard: string; explorerTx: string }> = {
  "tron-usdt": { chain: "Tron", standard: "TRC-20", explorerTx: "https://tronscan.org/#/transaction/" },
  "bsc-usdt": { chain: "BNB Smart Chain", standard: "BEP-20", explorerTx: "https://bscscan.com/tx/" }
};

/** "mm:ss" left until `expiresAt`, or null once it has passed. */
export function formatCountdown(expiresAt: string, nowMs: number): string | null {
  const left = Math.floor((Date.parse(expiresAt) - nowMs) / 1000);
  if (!Number.isFinite(left) || left <= 0) return null;
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Where to land once a PayPal/crypto payment has been provisioned. */
export function successPath(
  payment: Pick<ExternalPayment, "paymentId" | "kind" | "order">,
  topupOrderId?: number | string | null
): string | null {
  if (payment.kind === "topup") {
    if (topupOrderId == null) return "/account";
    return `/account/${encodeURIComponent(String(topupOrderId))}?topup=1&payment=${encodeURIComponent(payment.paymentId)}`;
  }
  const orderId = payment.order?.id;
  return orderId == null ? null : `/account/${encodeURIComponent(String(orderId))}?new=1`;
}

/**
 * Whether polling should continue. Pending payments are watched until they settle; a
 * completed one whose eSIM isn't ready yet (the sweep is still buying it, or a transient
 * error) is retried for `maxSetupPolls` more polls before telling the buyer support will finish it.
 */
export function shouldKeepPolling(
  payment: Pick<ExternalPayment, "status" | "order" | "topup">,
  setupPolls: number,
  maxSetupPolls = 24
): boolean {
  if (payment.status === "pending") return true;
  if (payment.status !== "completed") return false;
  const ready = payment.order != null || payment.topup != null;
  return !ready && setupPolls < maxSetupPolls;
}

/** A plan purchase or a top-up of an existing eSIM; same body shape the BFF routes take. */
export type ExternalCheckoutTarget =
  | { kind: "package"; packageId: string; promoCode?: string | null }
  | { kind: "topup"; orderId: number; packageId: string };

export function targetBody(target: ExternalCheckoutTarget): Record<string, unknown> {
  return target.kind === "topup"
    ? { order_id: target.orderId, package_id: target.packageId }
    : { package_id: target.packageId, ...(target.promoCode ? { promo_code: target.promoCode } : {}) };
}

/**
 * Backend capture failure -> /checkout/failed reason. Only 402 means no money moved;
 * a PayPal outage (502 paypal_error) or anything unrecognised is "unconfirmed", never
 * "it went through" and never "you weren't charged".
 */
export function paypalFailureReason(status: number, code: string | undefined): string {
  if (status === 402) return "unpaid";
  if (code === "payment_not_settled") return "pending";
  if (code === "provisioning_in_progress") return "setting_up";
  if (code === "payment_in_review") return "review";
  if (code === "payment_refunded") return "refunded";
  if (code === "paypal_error" || status === 0 || status >= 500) return "unconfirmed";
  return "provisioning";
}
