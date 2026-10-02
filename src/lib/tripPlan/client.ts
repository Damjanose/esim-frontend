import type {
  CheckoutResult,
  ItineraryConfig,
  ItineraryListItem,
  ItineraryVersion,
  TripPlanInput
} from "./types";

/**
 * Browser-side calls to the trip-plan BFF (/bff/itineraries/**). Every call
 * resolves to a result instead of throwing, so components only branch on it.
 */
export type TripPlanResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; code?: string };

const NETWORK_MESSAGE = "We could not reach eSim2you. Check your connection and try again.";

async function call<T>(path: string, init: RequestInit = {}): Promise<TripPlanResult<T>> {
  let response: Response;
  try {
    response = await fetch(`/bff/itineraries${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      cache: "no-store"
    });
  } catch {
    // Status 0: the request never got an answer (offline, or a proxy dropped a long generation).
    return { ok: false, status: 0, message: NETWORK_MESSAGE };
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    error?: string;
    message?: string;
    code?: string;
  } | null;

  if (!response.ok || !payload) {
    return {
      ok: false,
      status: response.ok ? 502 : response.status,
      message: payload?.error ?? payload?.message ?? "Something went wrong. Please try again.",
      ...(payload?.code ? { code: payload.code } : {})
    };
  }

  return { ok: true, data: payload.data as T };
}

export function fetchTripPlanConfig() {
  return call<ItineraryConfig>("/config");
}

export async function fetchTripPlans(): Promise<TripPlanResult<ItineraryListItem[]>> {
  const result = await call<{ plans: ItineraryListItem[] }>("");
  return result.ok ? { ok: true, data: result.data.plans ?? [] } : result;
}

export function createTripPlan(input: TripPlanInput) {
  return call<ItineraryListItem & { remaining: number }>("", { method: "POST", body: JSON.stringify(input) });
}

export function fetchTripPlan(id: string) {
  return call<ItineraryListItem>(`/${encodeURIComponent(id)}`);
}

export function deleteTripPlan(id: string) {
  return call<unknown>(`/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function editTripPlan(id: string, prompt: string) {
  return call<ItineraryListItem>(`/${encodeURIComponent(id)}/edit`, {
    method: "POST",
    body: JSON.stringify({ prompt })
  });
}

export function fetchTripPlanVersion(id: string, n: number) {
  return call<ItineraryVersion>(`/${encodeURIComponent(id)}/versions/${n}`);
}

export function startTripPlanCheckout(id: string) {
  return call<CheckoutResult>(`/${encodeURIComponent(id)}/checkout`, { method: "POST" });
}

export function confirmTripPlanPayment(id: string, paymentId: string) {
  return call<{ purchased: boolean }>(`/${encodeURIComponent(id)}/provision`, {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId })
  });
}

export function tripPlanPdfUrl(id: string, version: number | null): string {
  const base = `/bff/itineraries/${encodeURIComponent(id)}/pdf`;
  return version === null ? base : `${base}?version=${version}`;
}

/** Sends a signed-out (or expired) visitor to sign-in, returning to where they were. */
export function redirectToSignIn(): void {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/signin?next=${encodeURIComponent(next)}`);
}
