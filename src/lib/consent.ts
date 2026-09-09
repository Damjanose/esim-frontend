export const CONSENT_COOKIE_NAME = "esim2you_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type ConsentState = {
  version: number;
  analytics: boolean;
  marketing: boolean;
};

export const defaultConsent: ConsentState = {
  version: CONSENT_VERSION,
  analytics: false,
  marketing: false
};

export function serializeConsentCookie(consent: ConsentState) {
  return encodeURIComponent(
    JSON.stringify({
      version: CONSENT_VERSION,
      analytics: consent.analytics === true,
      marketing: consent.marketing === true
    })
  );
}

export function parseConsentCookie(value: string | undefined | null): ConsentState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<ConsentState>;
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    ) {
      return null;
    }

    return {
      version: CONSENT_VERSION,
      analytics: parsed.analytics,
      marketing: parsed.marketing
    };
  } catch {
    return null;
  }
}

export function readConsentFromDocument(): ConsentState | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));
  return parseConsentCookie(cookie?.slice(CONSENT_COOKIE_NAME.length + 1));
}

export function writeConsentToDocument(consent: ConsentState) {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(consent)}`,
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax"
  ].join("; ");
}
