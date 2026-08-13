export const ACCESS_COOKIE = "esim_at";
export const REFRESH_COOKIE = "esim_rt";
export const PENDING_PAYMENT_COOKIE = "esim_pending_payment";
export const PENDING_TOPUP_COOKIE = "esim_pending_topup";

/** Pokpay checkout is short-lived; the pending reference should not outlive it by much. */
export const PENDING_PAYMENT_MAX_AGE_SECONDS = 10 * 60;

export type SessionPair = {
  token: string;
  refreshToken: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
};

export type CookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export type CookieSpec = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Secure cookies are dropped by browsers over plain http, which would silently
 * break local and LAN development (e.g. http://192.168.1.4:3000).
 */
function isSecureContext(): boolean {
  return process.env.NODE_ENV === "production";
}

function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureContext(),
    path: "/",
    maxAge
  };
}

export function buildSessionCookies(pair: SessionPair): CookieSpec[] {
  return [
    {
      name: ACCESS_COOKIE,
      value: pair.token,
      options: cookieOptions(pair.expiresInSeconds)
    },
    {
      name: REFRESH_COOKIE,
      value: pair.refreshToken,
      options: cookieOptions(pair.refreshExpiresInSeconds)
    }
  ];
}

export function buildPendingPaymentCookie(paymentId: string): CookieSpec {
  return {
    name: PENDING_PAYMENT_COOKIE,
    value: paymentId,
    options: cookieOptions(PENDING_PAYMENT_MAX_AGE_SECONDS)
  };
}

export function buildClearedSessionCookies(): CookieSpec[] {
  return [ACCESS_COOKIE, REFRESH_COOKIE, PENDING_PAYMENT_COOKIE, PENDING_TOPUP_COOKIE].map(
    (name) => ({
      name,
      value: "",
      options: cookieOptions(0)
    })
  );
}

export function buildClearedPendingPaymentCookie(): CookieSpec {
  return {
    name: PENDING_PAYMENT_COOKIE,
    value: "",
    options: cookieOptions(0)
  };
}

/**
 * A top-up needs one thing a plain purchase does not: the eSIM it belongs to.
 *
 * The backend's provisioning response carries the provider's top-up record, not
 * our order id, and the payment reference it parses only yields the ICCID. So
 * the order id is remembered here, next to the payment id, and the return
 * handler uses it to put the buyer back on the eSIM they topped up.
 */
export function buildPendingTopupCookie(orderId: string, paymentId: string): CookieSpec {
  return {
    name: PENDING_TOPUP_COOKIE,
    value: `${orderId}:${paymentId}`,
    options: cookieOptions(PENDING_PAYMENT_MAX_AGE_SECONDS)
  };
}

export function buildClearedPendingTopupCookie(): CookieSpec {
  return {
    name: PENDING_TOPUP_COOKIE,
    value: "",
    options: cookieOptions(0)
  };
}

export function parsePendingTopupCookie(value: string | undefined | null): {
  orderId: string | null;
  paymentId: string | null;
} {
  const raw = value?.trim();
  if (!raw) {
    return { orderId: null, paymentId: null };
  }

  const separator = raw.indexOf(":");
  if (separator === -1) {
    return { orderId: raw, paymentId: null };
  }

  return {
    orderId: raw.slice(0, separator) || null,
    paymentId: raw.slice(separator + 1) || null
  };
}
