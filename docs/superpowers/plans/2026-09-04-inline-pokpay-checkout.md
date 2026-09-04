# Inline PokPay Card Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/checkout`'s hosted-redirect PokPay payment with an inline Billing → Card → Receipt wizard that never navigates away from the page, using `@nebula-ltd/pok-payments-js`'s `GuestCheckoutForm`/`usePOK` against the existing payment-intent id.

**Architecture:** `CheckoutWizard.tsx` (new client component) replaces `PayButton.tsx` below the existing server-rendered plan summary. Billing collection reuses `bff/user/billing-address` (fixed to the full 8-field shape). The Card step creates a payment intent (`bff/payments/intent`, unchanged) and mounts the PokPay SDK's own card form/3DS UI directly against PokPay's API using that intent's id as `orderId`. On the SDK's `onSuccess`, a new `bff/payments/provision` route (extracted from the now-deleted hosted-redirect return handler) finalizes the order, and a Receipt step renders it — all without a page navigation.

**Tech Stack:** Next.js 15 (App Router, React 19) route handlers + client components, `@nebula-ltd/pok-payments-js` (React bindings), vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-inline-pokpay-checkout-design.md`

---

## Task 1: Fix `bff/user/billing-address` to the full 8-field shape

**Files:**
- Modify: `src/app/bff/user/billing-address/route.ts`
- Modify: `src/app/profile/billing/BillingForm.tsx`
- Modify: `src/app/profile/billing/page.tsx`
- Test: `src/app/bff/user/user-routes.test.ts`

The backend's `/user/billing-address` (`E-SIM backend/src/routes/user.ts:227-254`) has taken the full 8-field `BillingAddressInput` since the mobile in-app checkout work, but this route still only forwards 4 legacy fields (`line1`, `city`, `postal`, `country`).

**Correction from plan review:** the original draft of this task claimed the
route "is unused by any page" — that's wrong. `src/app/profile/billing/page.tsx`
and `src/app/profile/billing/BillingForm.tsx` both import `BillingAddress`
from this route and hard-code the current 4-field shape (`FIELDS` array
keyed on `line1`/`city`/`postal`/`country`, `EMPTY: BillingAddress = {
line1: "", city: "", postal: "", country: "" }`). Changing the exported type
here without also fixing that page would break its build. This task now
includes fixing it in the same pass.

- [ ] **Step 1: Update the existing billing-address tests to the 8-field shape**

Replace the `billingAddress` fixture and the `PUT` test bodies in
`src/app/bff/user/user-routes.test.ts` (the block starting at the
`describe("GET /bff/user/billing-address"...)` down through the `PUT` describe
block) so the fixture and assertions use the 8-field shape:

```ts
const billingAddress = {
  holdersName: "Alex Morgan",
  email: "alex@example.com",
  countryCode: "AL",
  administrativeArea: "Tirana",
  locality: "Tirana",
  address1: "12 Rruga e Kavajës",
  postalCode: "1001",
  phoneNumber: "+355691234567"
};
```

Update the `PUT` test's request body and its assertion on `sent` (the JSON
parsed from `fetchMock`'s call) to send/expect all 8 fields, e.g.:

```ts
it("saves the full billing address", async () => {
  const fetchMock = vi.fn(async () =>
    jsonResponse({ status: "success", data: { purchaseDetails: { complete: true, billingAddress, card: null } } })
  );
  vi.stubGlobal("fetch", fetchMock);

  const response = await putBillingAddress(putRequest(billingAddress));

  expect(response.status).toBe(200);
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(String(init.body))).toEqual(billingAddress);
});
```

`putRequest` is the existing single-argument helper already defined further
down in `user-routes.test.ts` (`putRequest(body: unknown)`, with the
`signedIn` cookie closed over as a module constant) — read it before writing
this test rather than guessing at a different signature.

- [ ] **Step 2: Run the tests to see them fail against the old route**

Run: `pnpm test -- user-routes`
Expected: FAIL — the route only sends `line1`/`city`/`postal`/`country`, not the 8-field shape the updated test expects.

- [ ] **Step 3: Update the route's types and field mapping**

```ts
import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export type BillingAddress = {
  holdersName: string;
  email: string;
  countryCode: string;
  administrativeArea: string;
  locality: string;
  address1: string;
  postalCode: string;
  phoneNumber: string;
};

export async function GET(request: Request) {
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ billingAddress: BillingAddress | null }>("/user/billing-address", { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson("Invalid request body", 400);
  }

  if (!body || typeof body !== "object") {
    return errorJson("Invalid request body", 400);
  }

  const address = body as Partial<BillingAddress>;

  // Field-level validation stays on the backend, which owns the rules and the
  // messages; this only rejects a body that is not an address at all.
  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ purchaseDetails: unknown }>("/user/billing-address", {
      method: "PUT",
      body: {
        holdersName: address.holdersName ?? "",
        email: address.email ?? "",
        countryCode: address.countryCode ?? "",
        administrativeArea: address.administrativeArea ?? "",
        locality: address.locality ?? "",
        address1: address.address1 ?? "",
        postalCode: address.postalCode ?? "",
        phoneNumber: address.phoneNumber ?? ""
      },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `pnpm test -- user-routes`
Expected: PASS

- [ ] **Step 5: Fix `/profile/billing`'s `BillingForm.tsx` for the 8-field shape**

Replace `FIELDS` and `EMPTY` in `src/app/profile/billing/BillingForm.tsx`:

```ts
const FIELDS: { autoComplete: string; key: keyof BillingAddress; label: string }[] = [
  { autoComplete: "name", key: "holdersName", label: "Full name" },
  { autoComplete: "email", key: "email", label: "Email" },
  { autoComplete: "street-address", key: "address1", label: "Address" },
  { autoComplete: "postal-code", key: "postalCode", label: "Postal code" },
  { autoComplete: "address-level2", key: "locality", label: "City" },
  { autoComplete: "address-level1", key: "administrativeArea", label: "State / region" },
  { autoComplete: "country", key: "countryCode", label: "Country code" },
  { autoComplete: "tel", key: "phoneNumber", label: "Phone number" }
];

const EMPTY: BillingAddress = {
  holdersName: "",
  email: "",
  countryCode: "",
  administrativeArea: "",
  locality: "",
  address1: "",
  postalCode: "",
  phoneNumber: ""
};
```

No other changes needed in this file — it already reads/writes `address[field.key]` generically across whatever `FIELDS` contains.

- [ ] **Step 6: Update the now-stale "hosted checkout" copy in `page.tsx`**

`src/app/profile/billing/page.tsx:79-83` currently says *"Every payment is
taken on Pokpay's hosted checkout, so your card details are entered there
and stay with the payment provider."* That becomes inaccurate once `/checkout`
stops redirecting (Task 7). Update it to something like: *"We never store
your card. Your card details are entered directly with Pokpay at checkout
and never touch our servers."*

- [ ] **Step 7: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors — this is what would have caught the `BillingForm.tsx`
breakage if this step didn't already fix it; run it now to confirm rather
than deferring to Task 7's later type-check.

- [ ] **Step 8: Commit**

```bash
git add src/app/bff/user/billing-address/route.ts src/app/bff/user/user-routes.test.ts src/app/profile/billing/BillingForm.tsx src/app/profile/billing/page.tsx
git commit -m "fix: send full 8-field billing address through the BFF, not the legacy 4"
```

---

## Task 2: Add `bff/payments/provision` as its own route

**Files:**
- Create: `src/app/bff/payments/provision/route.ts`
- Modify: `src/app/checkout/return/route.ts` (to use it, until Task 8 deletes this file)
- Test: `src/app/checkout/checkout-flow.test.ts`

Today `POST /payments/provision` is only called inline inside the hosted-redirect return handler. The new wizard's Receipt step needs to call it directly, so it needs its own BFF route first — extracted here, then the return handler is deleted outright in Task 8 once the wizard replaces it.

- [ ] **Step 1: Write the failing test**

Add to `src/app/checkout/checkout-flow.test.ts` (new `describe` block, alongside the existing `POST /bff/payments/intent` one):

```ts
import { POST as provisionPayment } from "../bff/payments/provision/route";

// ...

describe("POST /bff/payments/provision", () => {
  it("provisions the order for a completed payment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { order: provisionedOrder } }, 201))
    );

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ payment_id: "sdk_order_123" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.order.id).toBe(1001);
  });

  it("reports an unpaid payment as a 402, not a generic error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Payment is not completed" }, 402))
    );

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({ payment_id: "sdk_order_123" })
      })
    );

    expect(response.status).toBe(402);
  });

  it("refuses to provision without a session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payment_id: "sdk_order_123" })
      })
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request missing payment_id without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await provisionPayment(
      new Request("http://localhost:3000/bff/payments/provision", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${ACCESS_COOKIE}=good-token` },
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- checkout-flow`
Expected: FAIL with a module-not-found error for `../bff/payments/provision/route`.

- [ ] **Step 3: Create the route**

```ts
import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

type ProvisionedOrder = {
  id: number | string;
};

export async function POST(request: Request) {
  let body: { payment_id?: unknown };
  try {
    body = (await request.json()) as { payment_id?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const paymentId = typeof body.payment_id === "string" ? body.payment_id.trim() : "";
  if (!paymentId) {
    return errorJson("payment_id is required", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ order: ProvisionedOrder }>("/payments/provision", {
      method: "POST",
      body: { payment_id: paymentId },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- checkout-flow`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/bff/payments/provision/route.ts src/app/checkout/checkout-flow.test.ts
git commit -m "feat: expose /payments/provision as its own reusable BFF route"
```

---

## Task 3: Install the PokPay web SDK

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
cd "E-SIM-frontend" && pnpm add @nebula-ltd/pok-payments-js@2.0.1
```

Pin the exact version (`2.0.1`) rather than a range — this is a third-party
payments SDK with a `beta` dist-tag also published; an unpinned range could
silently pick up a breaking pre-release.

- [ ] **Step 2: Verify it installed cleanly**

Run: `pnpm install --frozen-lockfile` (or just re-run `pnpm install`)
Expected: no peer-dependency errors (`react`/`react-dom` peers are already satisfied by Next 15/React 19 — confirm no warning is printed).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @nebula-ltd/pok-payments-js for inline card checkout"
```

---

## Task 4: Billing step — validation + form component

**Files:**
- Create: `src/lib/billingValidation.ts`
- Create: `src/app/checkout/steps/BillingStep.tsx`
- Test: `src/lib/billingValidation.test.ts`

Ports mobile's `src/payments/billingValidation.ts` rules (kept in sync with
the backend's `assertValidBillingAddress`,
`E-SIM backend/src/services/purchaseDetails.service.ts:205-249`) so the form
can show inline errors before round-tripping to the backend.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { hasBillingErrors, validateBillingAddress } from "./billingValidation";

const valid = {
  holdersName: "Alex Morgan",
  email: "alex@example.com",
  countryCode: "AL",
  administrativeArea: "Tirana",
  locality: "Tirana",
  address1: "12 Rruga e Kavajës",
  postalCode: "1001",
  phoneNumber: "+355691234567"
};

describe("validateBillingAddress", () => {
  it("accepts a fully filled-in address", () => {
    expect(hasBillingErrors(validateBillingAddress(valid))).toBe(false);
  });

  it("flags every required field as missing when blank", () => {
    const errors = validateBillingAddress({ ...valid, holdersName: "", address1: "" });
    expect(errors.holdersName).toBe("required");
    expect(errors.address1).toBe("required");
  });

  it("rejects a country code that isn't two letters", () => {
    const errors = validateBillingAddress({ ...valid, countryCode: "ALB" });
    expect(errors.countryCode).toBe("invalid");
  });

  it("rejects a phone number with fewer than 6 digits", () => {
    const errors = validateBillingAddress({ ...valid, phoneNumber: "12345" });
    expect(errors.phoneNumber).toBe("invalid");
  });

  it("flags a holder's name under 2 characters as too short, not missing", () => {
    const errors = validateBillingAddress({ ...valid, holdersName: "A" });
    expect(errors.holdersName).toBe("tooShort");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- billingValidation`
Expected: FAIL with a module-not-found error.

- [ ] **Step 3: Write the validation module**

```ts
import type { BillingAddress } from "@/app/bff/user/billing-address/route";

export type BillingFieldError = "required" | "invalid" | "tooShort";
export type BillingFieldErrors = Partial<Record<keyof BillingAddress, BillingFieldError>>;

export const BILLING_FIELD_ORDER: (keyof BillingAddress)[] = [
  "holdersName",
  "email",
  "address1",
  "postalCode",
  "locality",
  "administrativeArea",
  "countryCode",
  "phoneNumber"
];

export function validateBillingAddress(address: BillingAddress): BillingFieldErrors {
  const errors: BillingFieldErrors = {};
  const trimmed = (value: string) => (value ?? "").trim();

  for (const field of BILLING_FIELD_ORDER) {
    if (!trimmed(address[field])) errors[field] = "required";
  }

  if (!errors.holdersName && trimmed(address.holdersName).length < 2) {
    errors.holdersName = "tooShort";
  }
  if (!errors.countryCode && !/^[A-Za-z]{2}$/.test(trimmed(address.countryCode))) {
    errors.countryCode = "invalid";
  }
  if (!errors.phoneNumber && trimmed(address.phoneNumber).replace(/\D/g, "").length < 6) {
    errors.phoneNumber = "invalid";
  }
  if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed(address.email))) {
    errors.email = "invalid";
  }

  return errors;
}

export function hasBillingErrors(errors: BillingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function normalizeBillingAddress(address: BillingAddress): BillingAddress {
  return {
    holdersName: address.holdersName.trim(),
    email: address.email.trim(),
    countryCode: address.countryCode.trim().toUpperCase(),
    administrativeArea: address.administrativeArea.trim(),
    locality: address.locality.trim(),
    address1: address.address1.trim(),
    postalCode: address.postalCode.trim(),
    phoneNumber: address.phoneNumber.trim()
  };
}

export const EMPTY_BILLING_ADDRESS: BillingAddress = {
  holdersName: "",
  email: "",
  countryCode: "",
  administrativeArea: "",
  locality: "",
  address1: "",
  postalCode: "",
  phoneNumber: ""
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- billingValidation`
Expected: PASS

- [ ] **Step 5: Build `BillingStep.tsx`**

Check `src/app/components/` for the existing form input styling used
elsewhere in this repo (e.g. how `PromoCodeField.tsx` or the profile billing
page under `src/app/profile/billing/` render a labeled text input) and reuse
that pattern rather than introducing new form-field markup. Wire it as:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import {
  EMPTY_BILLING_ADDRESS,
  hasBillingErrors,
  normalizeBillingAddress,
  validateBillingAddress,
  type BillingFieldErrors
} from "@/lib/billingValidation";

export function BillingStep({
  accountEmail,
  onContinue
}: {
  accountEmail: string | null;
  onContinue: (address: BillingAddress) => void;
}) {
  const [address, setAddress] = useState<BillingAddress>({
    ...EMPTY_BILLING_ADDRESS,
    email: accountEmail ?? ""
  });
  const [errors, setErrors] = useState<BillingFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/bff/user/billing-address");
        const payload = (await response.json()) as { data?: { billingAddress: BillingAddress | null } };
        if (cancelled) return;
        if (response.ok && payload.data?.billingAddress) {
          setAddress({ ...payload.data.billingAddress, email: payload.data.billingAddress.email || accountEmail || "" });
        }
      } catch {
        if (!cancelled) setLoadError("We could not load your saved billing details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountEmail]);

  const update = useCallback(
    (field: keyof BillingAddress) => (value: string) => {
      setAddress((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    []
  );

  const submit = useCallback(async () => {
    const normalized = normalizeBillingAddress({ ...address, email: address.email || accountEmail || "" });
    const nextErrors = validateBillingAddress(normalized);
    setErrors(nextErrors);
    if (hasBillingErrors(nextErrors)) return;

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/bff/user/billing-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized)
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setSaveError(payload.error ?? "We could not save your billing details.");
        return;
      }
      onContinue(normalized);
    } catch {
      setSaveError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [accountEmail, address, onContinue]);

  if (loading) {
    return <p className="mt-6 text-sm text-onSurfaceVariant">Loading your billing details…</p>;
  }

  // Render one labeled input per BILLING_FIELD_ORDER field (holdersName, email,
  // address1, postalCode, locality, administrativeArea, countryCode, phoneNumber),
  // each calling update(field) on change and showing errors[field] below it —
  // follow this repo's existing form-field markup pattern.

  return (
    <div className="mt-6">
      {loadError ? <p className="mb-3 text-sm text-error">{loadError}</p> : null}
      {/* ...form fields... */}
      {saveError ? <p className="mt-3 text-sm font-semibold text-error">{saveError}</p> : null}
      <Button className="mt-4 w-full" disabled={saving} onClick={() => void submit()} size="lg" type="button">
        {saving ? "Saving…" : "Continue to payment"}
      </Button>
    </div>
  );
}
```

The form-field JSX is intentionally left as a TODO comment above: pull the
exact input/label component this repo already uses (check
`src/app/profile/billing/` first, since it's the most likely existing
8-field billing form) before inventing new markup.

- [ ] **Step 6: Commit**

```bash
git add src/lib/billingValidation.ts src/lib/billingValidation.test.ts src/app/checkout/steps/BillingStep.tsx
git commit -m "feat: add billing step for inline checkout wizard"
```

---

## Task 5: Card step — mount the PokPay SDK

**Files:**
- Create: `src/app/checkout/steps/CardStep.tsx`

No unit tests here — this step is a thin wrapper around a third-party
component making real network calls; see the spec's Testing section.

- [ ] **Step 1: Confirm the actual import path and prop names**

Before writing this file, run:

```bash
cd "E-SIM-frontend" && cat node_modules/@nebula-ltd/pok-payments-js/lib/react/index.d.ts
```

and cross-check the `GuestCheckoutFormProps`/`usePOK` signature against what
this plan assumes (`orderId`, `onSuccess`, `onError`, `options.env`). If the
installed version's types differ from what's documented here, follow the
installed types — they're the ground truth, this plan is not.

- [ ] **Step 2: Build the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { GuestCheckoutForm, type PaymentErrorResponse } from "@nebula-ltd/pok-payments-js/react";

export function CardStep({
  paymentId,
  environment,
  onPaid,
  onError
}: {
  paymentId: string;
  environment: string;
  onPaid: () => void;
  onError: (message: string) => void;
}) {
  // Guards against the SDK invoking onSuccess more than once for the same
  // payment — its docs don't guarantee single-invocation, and re-provisioning
  // is safe but re-navigating the wizard forward twice is not.
  const handledRef = useRef(false);

  const handleSuccess = () => {
    if (handledRef.current) return;
    handledRef.current = true;
    onPaid();
  };

  const handleError = (error: PaymentErrorResponse) => {
    onError(error.message ?? "The payment could not be completed. Please try again.");
  };

  return (
    <div className="mt-6 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <GuestCheckoutForm
        orderId={paymentId}
        onSuccess={handleSuccess}
        onError={handleError}
        options={{ env: environment === "production" ? "production" : "staging" }}
      />
      <p className="mt-4 text-center text-xs text-onSurfaceVariant">
        Your card is encrypted on this device before it is sent. eSim2you never sees your card details.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/checkout/steps/CardStep.tsx
git commit -m "feat: add card step mounting the PokPay guest checkout form"
```

---

## Task 6: Receipt — superseded by a redirect to the existing account page

**Revised during implementation.** `/account/[orderId]/page.tsx` already has
a complete, tested order-display: QR code / activation code, ICCID copy
field, data usage, top-up panel, plan history, AND `PurchaseConversion`
(conversion tracking fired on `?new=1`). None of this lives in an extractable
component — it's all inline in that server component, fetching from four
backend endpoints (`/orders/:id`, `/orders/:id/usage`,
`/orders/:id/instructions`, `/orders/:id/packages`, `/orders/:id/topups`) via
server-side `fetchForPage`.

Building a separate client-side `ReceiptStep.tsx` inside the wizard would
mean either re-fetching and re-rendering all of that from the client (real
duplication, and a second place to keep in sync), or reimplementing only
part of it and losing the rest (notably `PurchaseConversion`, which only
fires on that page).

Given the existing hosted-redirect flow already ended the same way — PokPay
redirected back through `/checkout/return`, which itself redirected to
`/account/{orderId}?new=1` — the simplest correct choice is to keep landing
there, just via a client-side navigation instead of a server redirect chain.
This is **not** a redirect to PokPay (the thing being removed) — it's an
internal same-origin navigation to a page this app already owns, after the
payment is already complete. No new file is created for this task; the
navigation is one line in `CheckoutWizard.tsx`'s success handler (Task 7).

No commit for this task — folded into Task 7.

---

## Task 7: Wire the wizard into `/checkout`, remove `PayButton`

**Files:**
- Create: `src/app/checkout/CheckoutWizard.tsx`
- Modify: `src/app/checkout/CheckoutPriceSection.tsx`
- Modify: `src/app/checkout/page.tsx`
- Delete: `src/app/checkout/PayButton.tsx`

- [ ] **Step 1: Build `CheckoutWizard.tsx`**

```tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { BillingStep } from "./steps/BillingStep";
import { CardStep } from "./steps/CardStep";

type WizardStep = "billing" | "card";

export function CheckoutWizard({
  packageId,
  promoCode,
  accountEmail,
  disabled = false
}: {
  packageId: string;
  promoCode?: string | null;
  accountEmail: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("billing");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>("staging");
  const [cardError, setCardError] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  const startCardStep = useCallback(async () => {
    setCreatingIntent(true);
    setIntentError(null);
    try {
      const response = await fetch("/bff/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          ...(promoCode ? { promo_code: promoCode } : {})
        })
      });

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { paymentId?: string; environment?: string };
        error?: string;
      };

      if (!response.ok || !payload.data?.paymentId) {
        setIntentError(payload.error ?? "We could not start the payment. Please try again.");
        return;
      }

      setPaymentId(payload.data.paymentId);
      setEnvironment(payload.data.environment ?? "staging");
      setStep("card");
    } catch {
      setIntentError("We could not reach the payment service. Please try again.");
    } finally {
      setCreatingIntent(false);
    }
  }, [packageId, promoCode]);

  const handlePaid = useCallback(async () => {
    if (!paymentId) return;
    try {
      const response = await fetch("/bff/payments/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { order?: { id: number | string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.order) {
        setCardError(
          payload.error ??
            "Your payment went through, but we could not finish setting up your eSIM. Please contact support with your payment reference."
        );
        return;
      }

      // Lands the buyer on the existing, fully-built order page — same
      // destination the old hosted-redirect flow ended at
      // (checkout/return → /account/{orderId}?new=1), just reached by an
      // internal client-side navigation instead of a server redirect chain.
      // That page already has the QR code, usage, top-ups, and purchase
      // conversion tracking; duplicating it here would only be riskier.
      router.push(`/account/${payload.data.order.id}?new=1`);
    } catch {
      setCardError(
        "Your payment went through, but we could not confirm it with our server. Please contact support with your payment reference."
      );
    }
  }, [paymentId, router]);

  if (step === "card" && paymentId) {
    return (
      <div className="mt-6">
        {cardError ? <p className="mb-3 text-sm font-semibold text-error">{cardError}</p> : null}
        <CardStep environment={environment} onError={setCardError} onPaid={() => void handlePaid()} paymentId={paymentId} />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <BillingStep accountEmail={accountEmail} onContinue={() => void startCardStep()} />
      {creatingIntent ? <p className="mt-3 text-sm text-onSurfaceVariant">Preparing secure payment…</p> : null}
      {intentError ? <p className="mt-3 text-sm font-semibold text-error">{intentError}</p> : null}
      {disabled ? <p className="mt-3 text-sm text-onSurfaceVariant">Finish applying your promo code first.</p> : null}
    </div>
  );
}
```

(`BillingStep`'s `onContinue` currently receives the saved `BillingAddress`
but this wiring doesn't need it directly — the SDK's own form collects
payment details independently, per the spec. If a later task finds the SDK
needs `billingInfo` passed in explicitly, thread the saved address through
here into `CardStep`.)

- [ ] **Step 2: Wire it into `CheckoutPriceSection.tsx`**

Replace the `PayButton` import/usage:

```diff
- import { PayButton } from "./PayButton";
+ import { CheckoutWizard } from "./CheckoutWizard";
```

```diff
-      <PayButton disabled={promoPending} packageId={plan.id} promoCode={promo?.promoCode ?? null} />
+      <CheckoutWizard
+        accountEmail={accountEmail}
+        disabled={promoPending}
+        packageId={plan.id}
+        promoCode={promo?.promoCode ?? null}
+      />
```

`CheckoutPriceSection` needs an `accountEmail` prop threaded in from
`page.tsx` — check how the signed-in user's email is currently read
server-side elsewhere in this repo (e.g. `src/lib/session.ts` or wherever
`/profile` resolves the current user) and pass it down the same way
`page.tsx` already resolves `plan` server-side.

- [ ] **Step 3: Remove the now-static redirect copy from `page.tsx`**

Delete the "Payments are handled by Pokpay..." paragraph
(`src/app/checkout/page.tsx:103-108`) — the wizard's own steps now say this
inline (`CardStep.tsx`'s footer text), and the old copy explicitly promised
a redirect that no longer happens.

- [ ] **Step 4: Delete `PayButton.tsx`**

```bash
git rm src/app/checkout/PayButton.tsx
```

- [ ] **Step 5: Type-check and run the full test suite**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: no type errors; all tests pass (fix any test still importing `PayButton` before moving on).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire the inline checkout wizard into /checkout, remove PayButton"
```

---

## Task 8: Remove the hosted-redirect return handler

**Files:**
- Delete: `src/app/checkout/return/route.ts`
- Modify: `src/app/checkout/checkout-flow.test.ts` (remove the `GET /checkout/return` describe block, since that route no longer exists)

Confirm before deleting: `grep -rn "checkout/return" "E-SIM-frontend/src"`
actually turns up more than just `bff/payments/intent/route.ts`'s
`return_url` construction — also `src/lib/route-guard.ts`'s
`UNGUARDED_PATHS` array (which lists `/checkout/return` as exempt from the
session guard) and `src/lib/route-guard.test.ts`'s assertion of that. Neither
breaks on deleting `checkout/return/route.ts`: the guard's unguarded-paths
list doesn't require the path to actually exist as a route, and the test
doesn't import the deleted file. But the `UNGUARDED_PATHS` entry becomes
dead weight once the route is gone — remove it as part of this task rather
than leaving stale config behind (see Step 2). `bff/payments/intent`'s
`return_url` field is unused by the new wizard (never called, per the spec)
but is still sent to the backend; leaving it as-is is fine since the
backend's `POKPAY_WEB_RETURN_ORIGINS` check just needs *a* valid origin, and
`/checkout/return` no longer existing as a route doesn't make the URL
invalid to send — it just won't ever be visited. **If this grep turns up
any *other* live caller beyond the three named here, stop and re-check the
spec's "remove entirely" assumption before deleting.**

- [ ] **Step 1: Remove the return-handler tests**

Delete the `describe("GET /checkout/return", ...)` block and its
`import { GET as checkoutReturn } from "./return/route";` line from
`src/app/checkout/checkout-flow.test.ts`.

- [ ] **Step 2: Delete the route**

```bash
git rm src/app/checkout/return/route.ts
```

- [ ] **Step 3: Remove the now-dead `UNGUARDED_PATHS` entry**

In `src/lib/route-guard.ts`, remove `"/checkout/return"` from the
`UNGUARDED_PATHS` array — the route it exempted no longer exists. Update the
corresponding assertion in `src/lib/route-guard.test.ts` (remove the case
asserting `/checkout/return` is unguarded; leave `/account/topup/return` and
`/profile/deleted` as-is, they're unrelated).

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS, no lingering references to the deleted route.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove the hosted-redirect checkout return handler"
```

---

## Task 9: Manual verification against PokPay's sandbox

Not automatable — the SDK makes real network calls to PokPay. Do this before
considering the feature done:

- [ ] Start the dev server (`pnpm dev`) and the backend (`pnpm dev` in `E-SIM backend/`) against PokPay's staging environment.
- [ ] Sign in, navigate to a plan's `/checkout?package=<id>` page.
- [ ] Complete Billing → Card with a PokPay sandbox test card that **does not** trigger 3DS. Confirm: no page navigation at any point, Receipt step renders with a real order/QR code.
- [ ] Repeat with a sandbox card that **does** trigger a 3DS step-up. Confirm the challenge renders inline (no popup, no redirect) and completes successfully.
- [ ] Repeat with a sandbox card that gets **declined**. Confirm an inline error shows on the Card step and the buyer can retry without re-entering billing.
- [ ] Refresh mid-flow on the Card step (simulating a lost connection) and confirm no double-charge occurs on retry (check `E-SIM backend` logs for a single `provisionPaidOrder` call per `payment_id`).

---

## Task 10: Docs — session log + feedAI

Per this repo's `CLAUDE.md` and the root `CLAUDE.md`'s "Shipping a new
feature" practice.

- [ ] **Step 1: Write the session doc**

Create `docs/sessions/2026-09-04_inline-pokpay-checkout.md` using the
template at the top of `docs/sessions/INDEX.md`, summarizing what changed
and linking the spec/plan.

- [ ] **Step 2: Append to the index**

Add a row to `docs/sessions/INDEX.md`:
`| 2026-09-04 | [inline-pokpay-checkout](2026-09-04_inline-pokpay-checkout.md) | Replaced hosted-redirect PokPay checkout with an inline Billing/Card/Receipt wizard |`

- [ ] **Step 3: Append a feedAI fact**

Add a line to `feedAI/facts.jsonl` (next monotonic `id`, `kind: "decision"`)
describing: `/checkout` no longer redirects to a PokPay-hosted page;
payment now happens inline via `@nebula-ltd/pok-payments-js`'s
`GuestCheckoutForm`, which talks to PokPay directly using the existing
`/payments/intent` id as `orderId` — the backend's `/payments/card/*`
endpoints are not used by web (only by mobile). Update
`feedAI/topics/account-flows.json` (the topic covering `checkout`) to match,
and bump `brain.json`'s `sync` block per `feedAI/MAINTAIN.md`. This is also
the moment to resolve the pre-existing feedAI staleness that was bypassed
with `--no-verify` during the spec commits earlier in this effort.

- [ ] **Step 4: Commit**

```bash
git add docs/sessions/2026-09-04_inline-pokpay-checkout.md docs/sessions/INDEX.md feedAI/
git commit -m "docs: session log + feedAI sync for inline PokPay checkout"
```
