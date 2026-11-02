/**
 * A card payment that went through but whose eSIM setup has not been confirmed yet.
 * Kept in sessionStorage so a reload or a return to /checkout never creates a second
 * intent (and a second charge) for a payment that is already paid.
 */
export const CHARGED_PAYMENT_KEY = "esim2you.chargedPayment";
export const CHARGED_PAYMENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type ChargedPayment = { paymentId: string; packageId: string; at: number };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveChargedPayment(
  payment: ChargedPayment,
  storage: StorageLike | null = defaultStorage()
): void {
  try {
    storage?.setItem(CHARGED_PAYMENT_KEY, JSON.stringify(payment));
  } catch {
    // Private mode / blocked storage: recovery just won't survive a reload.
  }
}

export function clearChargedPayment(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(CHARGED_PAYMENT_KEY);
  } catch {
    // ignore
  }
}

/** The stored payment for this package if it is younger than 24h; otherwise null. */
export function readChargedPayment(
  packageId: string,
  now: number = Date.now(),
  storage: StorageLike | null = defaultStorage()
): ChargedPayment | null {
  try {
    const raw = storage?.getItem(CHARGED_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChargedPayment>;
    if (
      typeof parsed.paymentId !== "string" ||
      !parsed.paymentId ||
      parsed.packageId !== packageId ||
      typeof parsed.at !== "number" ||
      now - parsed.at > CHARGED_PAYMENT_MAX_AGE_MS ||
      parsed.at > now + 60_000
    ) {
      return null;
    }
    return { paymentId: parsed.paymentId, packageId: parsed.packageId, at: parsed.at };
  } catch {
    return null;
  }
}
