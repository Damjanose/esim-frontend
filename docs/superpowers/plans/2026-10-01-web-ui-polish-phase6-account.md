# Web UI Polish, Phase 6: Account (desktop sidebar dashboard, phone My eSIMs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** implementers **never** run `git commit`. Each "Commit (controller)" step is done by the controller, who stages the files, shows the message, and asks the user before every commit. Stay on the current branch, with no new branches, worktrees or stashes.
>
> **Account safety (overrides everything):** never sign in with a real account, never put a real token in a cookie, and never click Top up, Unlink, Sign out, Delete account, Save address or Copy against a real backend. The browser checks below run against a local, read-only mock backend (Task 9) that refuses every non-GET request.

**Goal:** Give the signed-in pages the spec's section 6: desktop option B (an `AccountShell` sidebar dashboard with a usage ring) and phone/tablet option A (the app's My eSIMs and grouped settings).
- **`/account`, lg+:** `AccountShell` sidebar (My eSIMs, Account, Sign-in methods, Payments, Support, Legal, Sign out). Title + "N active · M total". The active plan is a **usage ring card** (teal ring of data left, data left / total, days left, Top up + Details). Ready plans are tiles with Install. History rows are muted with **Buy again**.
- **`/account`, phones/tablets:** light title + count line, the app's **blue ActiveEsimCard** (data left in large type, bar, days left, Top up / Details), then section cards of compact rows (Ready → Install, History → muted + Buy again). Status badges come from `lifecycle_status` only.
- **`/account/[orderId]`:** lg+ ring card and install card (QR + `CopyField`s) side by side; phones: blue usage card, install card, then the top-up list as `PlanRow`-style rows. Plan history table restyled with the same data. Both banners and `PurchaseConversion` are untouched.
- **`/profile`:** lg+ the sidebar selects one section (`?tab=`); phones get the grouped settings list (Account, Sign-in methods, Payments, Support, Legal, Sign out, Delete account as `flat/danger`). `/profile/billing` and `/profile/deleted` restyled.
- **One bug fix found while planning:** the usage summary read field names the backend stopped sending, so every live plan showed **"0 MB of 0 MB remaining"**. Task 1 fixes it (the ring would otherwise always be empty).

Copy, links, data, flows, fetch order (f048), the top-up Pokpay redirect (f019), unlink/delete/sign-out calls and the route guard stay the same.

**Architecture:** pure rules in `lib/`, presentational pieces in `components/`, **one data fetch and one React tree per page**.
- `src/lib/accountEsims.ts`: `describePackage`/`formatDate` (moved from `PlanCard.tsx`), `daysLeft`, `lifecycleBadge`, `esimStatusLine`, `esimCountLine`, `buyAgainHref`, `accountPrimaryAction`, `usageMeter`, `topupPlanRowPlan`.
- `src/lib/accountNav.ts`: the sidebar entries, `profileTabFromParam`, `profileGroupClass`.
- `src/app/components/AccountShell.tsx`: lg+ sidebar frame, plain props (reused by `/partners/*` in phase 9). `src/app/account/accountShellItems.ts` adds the account icons.
- `src/app/components/{UsageRing,ActiveEsimCard,StatusBadge,EsimFlag,SettingsGroup}.tsx`, `src/app/account/EsimListRow.tsx`.
- Only the active plan has two presentations (blue card `lg:hidden`, ring card `hidden lg:block`), rendered from the same props. Ready rows become lg tiles through responsive classes on the same list. Profile renders every group once and hides the unselected ones at lg (`lg:hidden`), so `LinkedProviders`, `SignOutButton` and `DeleteAccountCard` each mount once.

**Tech Stack:** Next.js 15.5 App Router, React 19, Tailwind 3.4.19, lucide-react 0.475, vitest in a node env (pure-logic and source-string tests; no RTL/jsdom).
- **Tailwind:** `min-h-11` (44px), `min-h-14` (56px), `text-label-caps` (repo token), `stroke-brandTeal` / `stroke-mist` (the stroke plugin reads theme colours), `divide-y`, `after:absolute after:inset-0` (the `after:` variant adds `content` itself), `motion-safe:`, `overflow-x-clip`, `lg:self-stretch` are all built in or already configured.
- **lucide-react icons used:** `Globe2`, `UserRound`, `KeyRound`, `Wallet`, `LifeBuoy`, `FileText`, `ShieldCheck`, `LogOut`, `ChevronRight`, `ArrowLeft`, `ArrowRight`, `Inbox`, `WifiOff`, `CheckCircle2`, `Clock3`, `History`, `Info`, `QrCode`, `Smartphone`, `Plus`, `CreditCard`, `Loader2`, `Lock`. All exist under `node_modules/lucide-react/dist/esm/icons/`.

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md`: "Constraints carried over", "Breakpoints", "### 6. Account (desktop option B, phone/tablet option A)" and "### 9. Partner pages" (why `AccountShell` takes everything as props).

**Scope:** spec build-order step 7 ("Account (desktop B / phone A) + order detail"). The phase-5 session calls it phase 6. The dock already lights up My eSIMs on `/account*` and Profile on `/profile*` (`dockNav.ts`, pinned by `dockNav.test.ts`) and is hidden on `/profile/deleted`; this phase only verifies that.

**Baseline (2026-10-01, after phase 5, `HEAD = 30ae056`):**
- `pnpm test` → **84 files, 651 tests passing**; `tsc` clean.
- `pnpm build`: `ƒ /account 3.27 kB 118 kB`, `ƒ /account/[orderId] 4.95 kB 119 kB`, `ƒ /profile 6.01 kB 120 kB`, `ƒ /profile/billing 4.74 kB 119 kB`, `○ /profile/deleted 136 B 118 kB`.
- **Mock-backed matrix on the old pages (Task 9 script, 320–1440px):** no horizontal scroll, CLS 0 everywhere. Below-44px controls in `main`: `/account` "Profile" 40px; order page "All eSIMs" 16px and "Copy ICCID" 32px; `/profile` the five tab buttons 40px and "Want to leave? Delete account" 16px; `/profile/billing` "Profile" 16px. The active plan read **"0 MB of 0 MB remaining"** (see Decisions). `/profile` carried a gradient Sign out; `/account` with plans had no gradient.

**Dry run:** every code block below was applied in task order to a scratch copy of this repo. Each task's `pnpm test` count and a clean `tsc` were recorded at that point; then `pnpm build`, the mock-backed Playwright matrix (44 page/width checks) and Lighthouse on `/account` ran on the result. See "Verification numbers from the dry run" at the end.

---

## Decisions

### The usage bug (fixed first, Task 1)

`GET /orders/:id/usage` answers with the backend's `normalizeSimUsage` shape: `{ available, data_total_mb, data_remaining_mb, data_used_mb, is_unlimited, last_synced_at }` (`E-SIM backend/src/services/airalo.service.ts`, since 2026-06-25). The web's `summariseUsage` only read `total` / `remaining`, which that route never sends, so `/account` and the order page always showed `0 MB of 0 MB remaining` and an empty bar (reproduced on the baseline build with the mock). Task 1 reads both shapes, reports `is_unlimited` as unlimited (`normalizeSimUsage` zeroes both totals for those), and clamps the used share to 0–100. No API change. **Days left come from `order.expires_at`**, because the usage payload has no expiry.

### One gradient primary per view: "the first unfinished step"

`accountPrimaryAction(sections)` decides, and is unit-tested:
1. **A ready plan exists → the newest ready plan's Install** is the gradient. A paid, uninstalled eSIM is the one thing that blocks the trip; Top up is an upsell.
2. **Else an active plan → its Top up** is the gradient (on the lg ring card).
3. **Else none.** Buy again, Details and the other Installs are flat. The empty state keeps its gradient "Browse plans".

Below lg the active plan is the **blue card, which never carries a gradient**: a gradient on `brandBlue` loses its left half, and the app uses a solid white pill there. Top up is `LinkButton variant="flat"` (white, brandBlue text: the app's pill), Details an outline on blue. So a phone with only an active plan has no gradient at all, which is within "at most one".
- **Order page:** the ring card's Top up (it jumps to `#top-up`) is the gradient at lg; every top-up row is flat; "Install on this iPhone" and "Need help?" are flat. Phones: none.
- **Profile:** none (Sign out is a row, Delete account is `flat/danger`). The old full-width gradient Sign out goes.
- **Billing:** Save address. **Goodbye page:** Back to eSim2you.
- The spec mockup put the gradient on Top up. The rule keeps that whenever nothing is waiting to be installed. **Flagged for the owner** (Risks 1).

### Profile tabs → sidebar entries: `?tab=` on the server

| Sidebar entry | Link | lg content | Phones/tablets |
|---|---|---|---|
| My eSIMs | `/account` | – | dock tab |
| Account | `/profile` (`tab` missing or unknown) | Signed in as + My eSIMs row + Delete account | every group stacked, in this order |
| Sign-in methods | `/profile?tab=signin` | `LinkedProviders` | ″ |
| Payments | `/profile?tab=payments` | "Payments and billing" → `/profile/billing` | ″ |
| Support | `/profile?tab=support` | "Help and support" → `/support` | ″ |
| Legal | `/profile?tab=legal` | Terms, Privacy | ″ |
| Sign out | button (shell footer) | – | its own row card, then Delete account |

Why `?tab=` and not anchors or sub-routes:
- **Anchors** can't mark the current entry without a client scroll-spy, and the desktop would show every section in one long scroll instead of a dashboard pane.
- **Sub-routes** (`/profile/signin` …) would add four pages and four more guarded routes for four short lists.
- **`?tab=`** is a real URL (deep links, back button), is read on the server (`/profile` is already `ƒ`: it reads cookies), lets `ProfileTabs` drop `"use client"` and `useState`, and keeps `/profile`, `/profile/billing` and `/profile/deleted` where they are. Unknown or repeated values fall back to the first known value or Account (`profileTabFromParam`). On phones `?tab=` is ignored: every group shows. `/profile/billing` marks **Payments** current.

### `AccountShell` is built for phase 9

Props only: `label` (landmark name), `items: { href, label, icon, current? }[]`, optional `footer` (Sign out here), `children`. No hooks, no fetching, no route knowledge, no `"use client"`. The partner pages will pass Dashboard / Buy for a customer / Withdraw / Materials / Status. The account icons live in `src/app/account/accountShellItems.ts`, not in the shell. The sidebar is `hidden lg:block lg:self-stretch` with a `sticky top-6` card. Every page using it has `<main className="… overflow-x-clip …">` (f215: `-hidden` would stop the sticky).

### "Buy again" from existing data only

`/account` already loads the public catalog (`getPackageOptions`, 60s server cache) to name plans. `buyAgainHref(packageId, catalog)` returns `destinationBrowseHref(option.countryCode)` (→ `/esim/usa`, or `/destinations?country=…` when no content page exists) **only while the order's package is still in the catalog**, else `null` and no link. An order row has no country of its own, so a retired package can't fall back to "same country, other plans" as the app does (Risks 3).

### Order page names the plan from the catalog

The blue card / ring card show the country and flag (`describePackage`), so the order page adds `getPackageOptions()` to its existing `Promise.all`: a public, server-cached read the list page already makes, not a new API. **The H1 stays `order.package_id`** (content unchanged; Risks 4).

### Layout numbers (verified)

- Gutters `px-4 sm:px-6 lg:px-10`, `max-w-[1200px]`, top `pt-[92px] lg:pt-[108px]` (the capsule ends at 68 / 76px, as in phase 5). Background `bg-surfaceBright`, cards `bg-surface`.
- Shell: `lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10`. Sidebar 240px; its card's `top` is **24px after `scrollTo(0,400)`** at 1024 and 1440.
- Targets: sidebar entries and Sign out `min-h-11`; settings rows `min-h-14`; list rows `min-h-[76px]` with a stretched link; Install / Top up / Details / Unlink / Need help? are 46px `md` buttons; Buy again and back links `min-h-11`; CopyField's copy button `h-11 w-11`.
- The ring card wraps (`flex-wrap`, text `min-w-[220px]`): in the order page's half column it puts the text under the ring instead of truncating "United States" to "Uni…" (seen in the dry run before the fix).

### How the signed-in pages are verified without signing in

Unlike `/checkout`, these pages fetch **on the server** with the session. Middleware only checks that an `esim_at` or `esim_rt` cookie exists (`route-guard.ts`); `fetchForPage` forwards `esim_at` as a Bearer token to `getBackendApiUrl()`, which reads `process.env.BACKEND_API_URL` **at runtime** (process env beats `.env.production`). So Task 9:
1. starts `mock-backend.cjs`, a ~150-line `node:http` server on `127.0.0.1:4599` that answers the GET endpoints these pages call with obviously fake data and returns **405 to every non-GET** (logged);
2. runs the normal production build with `BACKEND_API_URL=http://127.0.0.1:4599/api pnpm exec next start -p 3106`;
3. sets an **unsigned, display-only** `esim_at=dev-auth.<base64url {"email":"<variant>@layout-check.test","kind":"access","exp":…}>.not-a-signature`. The mock decodes the email to pick the fixture (`empty`, `full`, `unlimited`), and `readEmailFromAccessToken` shows it on `/profile` (still display-only);
4. aborts every browser request that isn't the local app, and every `/bff/**` call (the pages make none on load). It never clicks anything.

Endpoints covered: `/packages`, `/esim/countries`, `/testimonials`, `/orders/active`, `/orders`, `/orders/:id`, `/orders/:id/usage`, `/orders/:id/instructions`, `/orders/:id/packages`, `/orders/:id/topups`, `/auth/identities`, `/user/billing-address`, `/user/card-details`. Fixtures: **empty**; **full** = 1 active US 10 GB with 4 GB left (60% used, 12 days left) + 2 ready (Japan unlimited on a discounted package, UK 5 GB) + 2 expired (US 1 GB still sold → Buy again; `retired-pkg-30days-5gb` not sold → no link); **unlimited** = an active unlimited plan on the discounted package + 1 expired. Flags and the QR are inline `data:` SVGs, so nothing loads from a CDN.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/esim-install.ts` (+ `.test.ts`) | modify | read the backend's usage shape; `unlimited`; +3 tests |
| `src/app/account/PlanCard.tsx` | modify (T1, T2) → delete (T5) | interim: unlimited caption, then imports from lib |
| `src/lib/accountEsims.ts` (+ `.test.ts`) | create | My eSIMs rules; 10 tests |
| `src/lib/accountNav.ts` (+ `.test.ts`) | create | sidebar entries, `?tab=` rules; 3 tests |
| `src/app/components/AccountShell.tsx` | create | lg+ sidebar frame (props only) |
| `src/app/account/accountShellItems.ts` | create | account sidebar items with icons |
| `src/app/components/SettingsGroup.tsx` | create | grouped card + `SettingsLinkRow` (replaces `SettingsSection.tsx`) |
| `src/app/components/SignOutButton.tsx` | modify (T3, T7) | `nav` / `row` appearances; T7 drops the gradient |
| `src/app/components/account-shell.test.ts` | create | 5 tests |
| `src/app/components/{StatusBadge,EsimFlag,UsageRing,ActiveEsimCard}.tsx` | create | badge, flag tile, ring + ring card, blue card |
| `src/app/components/usage-cards.test.ts` | create | 5 tests |
| `src/app/account/EsimListRow.tsx` | create | compact row: Install / Buy again |
| `src/app/account/page.tsx` | rewrite render (fetch block verbatim) | shell, count line, active plan ×2 presentations, sections |
| `src/app/account/loading.tsx` | rewrite | skeleton in the new shape |
| `src/app/account/account-layout.test.ts` | create | 6 tests |
| `src/app/profile/profile-page.test.ts` | modify | 1 assertion (see below) |
| `src/app/account/[orderId]/page.tsx` | rewrite render | shell, usage card ×2 + install card, top-ups, history |
| `src/app/account/[orderId]/TopUpPanel.tsx` | modify | `PlanRow`-style rows; payment code verbatim |
| `src/app/account/[orderId]/CopyField.tsx` | modify | 44px copy button, tokens |
| `src/app/account/[orderId]/order-detail-layout.test.ts` | create | 4 tests |
| `src/app/profile/page.tsx`, `ProfileTabs.tsx` | rewrite | `?tab=` + shell; grouped list, one tree |
| `src/app/profile/LinkedProviders.tsx`, `DeleteAccountCard.tsx` | modify | rows in the card; flat danger trigger |
| `src/app/components/SettingsSection.tsx` | delete | only `ProfileTabs` used it (f106) |
| `src/app/profile/profile-layout.test.ts` | create | 4 tests |
| `src/app/profile/billing/page.tsx`, `BillingForm.tsx`, `deleted/page.tsx` | modify/rewrite | shell, shared fields, status card |
| `src/app/profile/billing-pages.test.ts` | create | 3 tests |
| `feedAI/*`, `docs/sessions/*` | modify/create | Task 10 |

**Not changed:** the data-fetch block of `account/page.tsx` (copied verbatim: f048 order, `activeOrder\n      ?`), `lib/order-groups.ts`, `PurchaseConversion.tsx`, `account/topup/return/route.ts`, every `bff/*` route, `route-guard.ts`, `middleware.ts`, `session-identity.ts`, `dockNav.ts`, `BottomDock.tsx`, `Navbar.tsx`, `PlanRow.tsx`, `planRow.ts`, `fieldClasses.ts`. These tests keep every assertion: `account-sections.test.ts`, `topup-flow.test.ts`, `order-groups.test.ts`, `esim-install.test.ts` (only additions), `dockNav.test.ts`, `route-guard.test.ts`, `middleware.test.ts`, `user-routes.test.ts`, and `profile-page.test.ts` except the one below.

### Changed assertions (deliberate)

| File | Old | New | Why |
|---|---|---|---|
| `src/app/profile/profile-page.test.ts`, "is reachable from the eSIM list" | `expect(accountPage).toContain('href="/profile"')` | `expect(accountPage).toContain('items={accountShellItems("esims")}')` and `src/lib/accountNav.ts` contains `{ id: "account", label: "Account", href: "/profile" }` | the 40px "Profile" button on `/account` goes: lg+ reaches the profile through the sidebar's Account entry, below lg through the dock's Profile tab (already pinned by `dockNav.test.ts`). Same guarantee, new place. |

No other existing assertion changes.

---

### Task 1: Usage summary reads the backend's real shape (bug fix, TDD)

**Files:**
- Modify: `src/lib/esim-install.ts`, `src/lib/esim-install.test.ts`
- Modify (one line each): `src/app/account/PlanCard.tsx`, `src/app/account/[orderId]/page.tsx`

- [ ] **Step 1: Write the failing tests**

In `src/lib/esim-install.test.ts`, inside `describe("summariseUsage", …)`, insert these three tests **before** `it("handles a fully used plan without dividing by zero", …)`:

```ts
  it("reads the backend's usage shape (data_total_mb / data_remaining_mb)", () => {
    const summary = summariseUsage({
      available: true,
      data_total_mb: 10240,
      data_remaining_mb: 4096,
      is_unlimited: false
    });

    expect(summary).toEqual({
      available: true,
      unlimited: false,
      usedPercent: 60,
      remainingLabel: "4 GB",
      totalLabel: "10 GB",
      expiresAt: undefined
    });
  });

  it("reports an unlimited plan as unlimited, not as 0 MB of 0 MB", () => {
    // normalizeSimUsage zeroes both totals for an unlimited plan.
    const summary = summariseUsage({
      available: true,
      data_total_mb: 0,
      data_remaining_mb: 0,
      is_unlimited: true
    });

    expect(summary).toMatchObject({ available: true, unlimited: true, usedPercent: 0, remainingLabel: "Unlimited" });
  });

  it("keeps the used share between 0 and 100 when the provider over-reports what is left", () => {
    expect(summariseUsage({ available: true, data_total_mb: 1024, data_remaining_mb: 2048 })).toMatchObject({
      usedPercent: 0
    });
  });
```

- [ ] **Step 2: Watch them fail**

Run: `pnpm exec vitest run src/lib/esim-install.test.ts`
Expected: FAIL, 3 tests (the first sees `usedPercent: 0`, `"0 MB"`; the second has no `unlimited`).

- [ ] **Step 3: Implement**

In `src/lib/esim-install.ts`, replace everything from `export type UsagePayload = {` to the end of the file with:

```ts
export type UsagePayload = {
  available?: boolean;
  reason?: string;
  message?: string;
  /** What GET /orders/:id/usage sends today (backend normalizeSimUsage), in MB. */
  data_total_mb?: number;
  data_remaining_mb?: number;
  is_unlimited?: boolean;
  /** Older field names. Still read, so a payload in either shape summarises the same. */
  remaining?: number;
  total?: number;
  expiredAt?: string;
};

export type UsageSummary =
  | {
      available: true;
      /** Uncapped plan: there is no meaningful remaining/total pair. */
      unlimited: boolean;
      usedPercent: number;
      remainingLabel: string;
      totalLabel: string;
      expiresAt?: string;
    }
  | { available: false; message: string };

const UNAVAILABLE_MESSAGES: Record<string, string> = {
  no_iccid: "Usage will appear once your eSIM finishes provisioning.",
  provider_error: "Usage is unavailable from the provider right now. Please check back shortly."
};

/** Shared so usage summaries and the per-eSIM plan history read identically. */
export function formatMegabytes(value: number): string {
  if (value >= 1024) {
    const gb = value / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${Math.round(value)} MB`;
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

/**
 * The backend's usage route answers with `data_total_mb` / `data_remaining_mb` /
 * `is_unlimited` (normalizeSimUsage). This used to read only `total` / `remaining`,
 * so every live plan showed "0 MB of 0 MB remaining".
 *
 * Unavailable usage is reported as an explanation rather than zeroes, because
 * "0 GB used" would be a lie for an eSIM that is not provisioned yet.
 */
export function summariseUsage(usage: UsagePayload | null | undefined): UsageSummary {
  if (!usage || usage.available !== true) {
    return {
      available: false,
      message:
        usage?.message ??
        UNAVAILABLE_MESSAGES[usage?.reason ?? ""] ??
        "Usage is unavailable right now."
    };
  }

  if (usage.is_unlimited === true) {
    return {
      available: true,
      unlimited: true,
      usedPercent: 0,
      remainingLabel: "Unlimited",
      totalLabel: "Unlimited",
      expiresAt: usage.expiredAt
    };
  }

  const total = firstNumber(usage.data_total_mb, usage.total);
  const remaining = firstNumber(usage.data_remaining_mb, usage.remaining);
  const usedPercent =
    total > 0 ? Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100))) : 0;

  return {
    available: true,
    unlimited: false,
    usedPercent,
    remainingLabel: formatMegabytes(remaining),
    totalLabel: formatMegabytes(total),
    expiresAt: usage.expiredAt
  };
}
```

- [ ] **Step 4: Keep the old pages honest for an unlimited plan until Tasks 5–6 replace them**

`UsageSummary` now has `unlimited`. Change the caption line in both places (this is the whole diff):

```diff
diff --git a/src/app/account/PlanCard.tsx b/src/app/account/PlanCard.tsx
index 69634f8..66b8ba8 100644
--- a/src/app/account/PlanCard.tsx
+++ b/src/app/account/PlanCard.tsx
@@ -72,7 +72,7 @@ export function UsageBar({ usage }: { usage: UsageSummary }) {
         <p className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
           {usage.remainingLabel}
         </p>
-        <p className="text-xs text-onSurfaceVariant">of {usage.totalLabel} remaining</p>
+        <p className="text-xs text-onSurfaceVariant">{usage.unlimited ? "No data cap" : `of ${usage.totalLabel} remaining`}</p>
       </div>
 
       <div
diff --git a/src/app/account/[orderId]/page.tsx b/src/app/account/[orderId]/page.tsx
index a2b6743..f2cb3de 100644
--- a/src/app/account/[orderId]/page.tsx
+++ b/src/app/account/[orderId]/page.tsx
@@ -257,7 +257,7 @@ export default async function OrderDetailPage({
                 <p className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
                   {usage.remainingLabel}
                 </p>
-                <p className="mt-1 text-xs text-onSurfaceVariant">of {usage.totalLabel} remaining</p>
+                <p className="mt-1 text-xs text-onSurfaceVariant">{usage.unlimited ? "No data cap" : `of ${usage.totalLabel} remaining`}</p>
 
                 <div
                   aria-label={`${usage.usedPercent}% of data used`}
```

- [ ] **Step 5: Tests + types**

Run: `pnpm exec vitest run src/lib/esim-install.test.ts` → PASS, 12 tests.
Run: `pnpm test && pnpm exec tsc --noEmit` → **84 files, 654 tests**; tsc prints nothing.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/lib/esim-install.ts src/lib/esim-install.test.ts src/app/account/PlanCard.tsx "src/app/account/[orderId]/page.tsx"
git commit -m "fix(account): read the backend's usage shape (data_total_mb/data_remaining_mb/is_unlimited)"
```

---

### Task 2: Pure My eSIMs rules (TDD)

**Files:**
- Create: `src/lib/accountEsims.ts`, `src/lib/accountEsims.test.ts`
- Modify: `src/app/account/PlanCard.tsx` (imports the moved helpers)

- [ ] **Step 1: Write the failing test**

Create `src/lib/accountEsims.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import {
  accountPrimaryAction,
  buyAgainHref,
  daysLeft,
  describePackage,
  esimCountLine,
  esimStatusLine,
  lifecycleBadge,
  topupPlanRowPlan,
  usageMeter
} from "./accountEsims";
import type { OrderGroups, OrderSummary } from "./order-groups";
import { planDataDisc, planRowTags } from "./planRow";

const NOW = Date.parse("2026-10-01T12:00:00.000Z");

function order(overrides: Partial<OrderSummary> & { id: number }): OrderSummary {
  return {
    code: `ORD-${overrides.id}`,
    status: "completed",
    lifecycle_status: "ready",
    package_id: "mock-us-7days-1gb",
    created_at: "2026-09-01T10:00:00.000Z",
    expires_at: null,
    ...overrides
  };
}

const catalog = new Map<string, HeroPackageOption>([
  [
    "mock-us-7days-1gb",
    {
      kind: "standard",
      id: "mock-us-7days-1gb",
      country: "United States",
      countryCode: "united-states",
      flagUri: "https://flags.example/us.png",
      dataLabel: "1 GB",
      durationLabel: "7 days",
      title: "1 GB - 7 days",
      price: "€4.00",
      priceNumeric: 4,
      dataNumericGb: 1,
      durationDays: 7,
      filters: ["local"],
      query: ""
    }
  ],
  [
    "mock-xk-7days-1gb",
    {
      kind: "standard",
      id: "mock-xk-7days-1gb",
      country: "Kosovo",
      countryCode: "kosovo",
      flagUri: "",
      dataLabel: "1 GB",
      durationLabel: "7 days",
      title: "1 GB - 7 days",
      price: "€3.00",
      priceNumeric: 3,
      dataNumericGb: 1,
      durationDays: 7,
      filters: ["local"],
      query: ""
    }
  ]
]);

describe("describePackage", () => {
  it("names a plan from the catalog, else reads figures out of the package id", () => {
    expect(describePackage("mock-us-7days-1gb", catalog)).toEqual({
      title: "United States",
      details: "1 GB · 7 days",
      flagUri: "https://flags.example/us.png"
    });
    expect(describePackage("mock-xk-7days-1gb", catalog).flagUri).toBeNull();
    expect(describePackage("retired-pkg-30days-5gb", catalog)).toEqual({
      title: "eSIM plan",
      details: "5GB / 30 days",
      flagUri: null
    });
  });
});

describe("daysLeft / esimStatusLine", () => {
  it("rounds part days up and never goes below zero", () => {
    expect(daysLeft("2026-10-01T15:00:00.000Z", NOW)).toBe(1);
    expect(daysLeft("2026-10-13T12:00:00.000Z", NOW)).toBe(12);
    expect(daysLeft("2026-09-20T12:00:00.000Z", NOW)).toBe(0);
    expect(daysLeft(null, NOW)).toBeNull();
    expect(daysLeft("not-a-date", NOW)).toBeNull();
  });

  it("says how long an active plan has left, and what a ready or expired one needs", () => {
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: "2026-10-13T12:00:00.000Z" }, NOW)).toBe(
      "Active · 12 days left"
    );
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: "2026-10-02T11:00:00.000Z" }, NOW)).toBe(
      "Active · 1 day left"
    );
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: "2026-09-30T00:00:00.000Z" }, NOW)).toBe(
      "Active · Expires today"
    );
    expect(esimStatusLine({ lifecycle_status: "active", expires_at: null }, NOW)).toBe("Active");
    expect(esimStatusLine({ lifecycle_status: "ready", expires_at: null }, NOW)).toBe("Ready to install");
    expect(esimStatusLine({ lifecycle_status: "expired", expires_at: null }, NOW)).toBe("Expired");
  });
});

describe("lifecycleBadge", () => {
  it("comes straight from lifecycle_status, with no invented states", () => {
    expect(lifecycleBadge("active")).toEqual({ label: "Active", tone: "active" });
    expect(lifecycleBadge("ready")).toEqual({ label: "Ready", tone: "ready" });
    expect(lifecycleBadge("expired")).toEqual({ label: "Expired", tone: "expired" });
    // Same rule as groupOrdersByLifecycle: a new backend status never hides a paid plan.
    expect(lifecycleBadge("something-new")).toEqual({ label: "Ready", tone: "ready" });
  });
});

describe("esimCountLine", () => {
  it("counts the live plan and every plan", () => {
    const sections: OrderGroups = {
      active: order({ id: 1, lifecycle_status: "active" }),
      ready: [order({ id: 2 }), order({ id: 3 })],
      history: [order({ id: 4, lifecycle_status: "expired" }), order({ id: 5, lifecycle_status: "expired" })]
    };
    expect(esimCountLine(sections)).toBe("1 active · 5 total");
    expect(esimCountLine({ active: null, ready: [], history: [] })).toBe("0 active · 0 total");
    expect(esimCountLine(null)).toBeNull();
  });
});

describe("buyAgainHref", () => {
  it("links the destination page only while the package is still sold", () => {
    expect(buyAgainHref("mock-us-7days-1gb", catalog)).toBe("/esim/usa");
    // Sold, but no content page: the browse fallback, as every browse link does.
    expect(buyAgainHref("mock-xk-7days-1gb", catalog)).toBe("/destinations?country=kosovo");
    expect(buyAgainHref("retired-pkg-30days-5gb", catalog)).toBeNull();
  });
});

describe("accountPrimaryAction", () => {
  const active = order({ id: 1, lifecycle_status: "active" });

  it("gives the gradient to the newest ready plan's Install, else the active plan's Top up", () => {
    expect(accountPrimaryAction({ active, ready: [order({ id: 3 }), order({ id: 2 })], history: [] })).toEqual({
      kind: "install",
      orderId: 3
    });
    expect(accountPrimaryAction({ active, ready: [], history: [] })).toEqual({ kind: "topup", orderId: 1 });
    expect(
      accountPrimaryAction({ active: null, ready: [], history: [order({ id: 4, lifecycle_status: "expired" })] })
    ).toBeNull();
  });
});

describe("usageMeter", () => {
  it("fills with the share of data left, like the app", () => {
    expect(
      usageMeter({ available: true, unlimited: false, usedPercent: 60, remainingLabel: "4 GB", totalLabel: "10 GB" })
    ).toEqual({
      state: "metered",
      leftPercent: 40,
      headline: "4 GB",
      caption: "of 10 GB remaining",
      note: null,
      label: "40% of data left: 4 GB of 10 GB"
    });
  });

  it("shows unlimited as a full ring with no cap, and unavailable usage as a note", () => {
    expect(
      usageMeter({ available: true, unlimited: true, usedPercent: 0, remainingLabel: "Unlimited", totalLabel: "Unlimited" })
    ).toMatchObject({ state: "unlimited", leftPercent: 100, headline: "Unlimited", caption: "No data cap" });
    expect(usageMeter({ available: false, message: "Usage will appear once your eSIM finishes provisioning." })).toEqual({
      state: "unavailable",
      leftPercent: null,
      headline: null,
      caption: null,
      note: "Usage will appear once your eSIM finishes provisioning.",
      label: "Usage will appear once your eSIM finishes provisioning."
    });
  });
});

describe("topupPlanRowPlan", () => {
  it("shapes a top-up offer for the plan-row disc, tags and price", () => {
    const plan = topupPlanRowPlan({
      id: "mock-topup-3gb-30days",
      title: "3 GB - 30 days",
      priceDisplay: "€9.00",
      priceNumeric: 9,
      retailPrice: 11,
      hasDiscount: true,
      amount: 3072,
      day: 30
    });
    expect(plan).toMatchObject({ dataLabel: "3 GB", durationDays: 30, price: "€9.00" });
    expect(planDataDisc(plan)).toEqual({ unlimited: false, value: "3", unit: "GB" });
    expect(planRowTags(plan, { position: null })).toEqual([{ kind: "discount", label: "-18%" }]);

    const unlimited = topupPlanRowPlan({ id: "unl", amount: 999999, day: 7, is_unlimited: true });
    expect(planDataDisc(unlimited).unlimited).toBe(true);
    expect(unlimited.title).toBe("unl");
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/lib/accountEsims.test.ts` → FAIL: `./accountEsims` can't be resolved.

- [ ] **Step 3: Implement**

Create `src/lib/accountEsims.ts`:

```ts
import type { HeroPackageOption } from "@/services/packages";
import { formatMegabytes, type UsageSummary } from "./esim-install";
import { destinationBrowseHref } from "./esim-routes";
import type { OrderGroups, OrderSummary } from "./order-groups";
import type { PlanRowPlan } from "./planRow";

/**
 * Pure rules behind the My eSIMs pages (/account, /account/[orderId]). The
 * components only render what these decide, so the rules are unit-tested here.
 */

type Catalog = ReadonlyMap<string, HeroPackageOption>;

export type PackageDescription = { title: string; details: string; flagUri: string | null };

/**
 * Provider package ids (e.g. "szia-in-7days-1gb") name an operator SKU, not the
 * destination — never fit for display. When the catalog lookup misses (a
 * discontinued or rotated package), fall back to whatever duration/data figures
 * can be read out of the id rather than showing the raw slug.
 */
function detailsFromPackageId(packageId: string): string {
  const data = packageId.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
  const days = packageId.match(/(\d+)\s*days?/i);
  const parts = [
    data ? `${data[1]}${data[2]!.toUpperCase()}` : null,
    days ? `${days[1]} ${days[1] === "1" ? "day" : "days"}` : null
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Data plan";
}

export function describePackage(packageId: string, catalog: Catalog): PackageDescription {
  const option = catalog.get(packageId);
  if (option) {
    return {
      title: option.country,
      details: `${option.dataLabel} · ${option.durationLabel}`,
      flagUri: option.flagUri || null
    };
  }
  return { title: "eSIM plan", details: detailsFromPackageId(packageId), flagUri: null };
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days until `expiresAt`, rounded up so "expires in 3 hours" reads as 1 day
 * left (the app's esimTimeline.daysLeft). Null without a usable date; 0 once passed.
 */
export function daysLeft(expiresAt: string | null | undefined, now: number = Date.now()): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
}

export type LifecycleBadge = { label: "Active" | "Ready" | "Expired"; tone: "active" | "ready" | "expired" };

/** Straight from lifecycle_status. An unknown status reads as Ready, like groupOrdersByLifecycle. */
export function lifecycleBadge(status: string): LifecycleBadge {
  if (status === "active") return { label: "Active", tone: "active" };
  if (status === "expired") return { label: "Expired", tone: "expired" };
  return { label: "Ready", tone: "ready" };
}

/** "Active · 12 days left", "Active · Expires today", "Ready to install", "Expired". */
export function esimStatusLine(
  order: Pick<OrderSummary, "lifecycle_status" | "expires_at">,
  now: number = Date.now()
): string {
  const { label } = lifecycleBadge(order.lifecycle_status);
  if (label === "Ready") return "Ready to install";
  if (label === "Expired") return "Expired";

  const days = daysLeft(order.expires_at, now);
  if (days == null) return "Active";
  if (days === 0) return "Active · Expires today";
  return `Active · ${days} ${days === 1 ? "day" : "days"} left`;
}

/** The title's count line: "1 active · 5 total". Null when the list didn't load. */
export function esimCountLine(sections: OrderGroups | null): string | null {
  if (!sections) return null;
  const active = sections.active ? 1 : 0;
  return `${active} active · ${active + sections.ready.length + sections.history.length} total`;
}

/**
 * "Buy again" on a finished plan: the destination page of its package, but only
 * while that package is still in the catalog. No new API: the page already loads
 * the catalog to name the plans.
 */
export function buyAgainHref(packageId: string, catalog: Catalog): string | null {
  const option = catalog.get(packageId);
  return option ? destinationBrowseHref(option.countryCode) : null;
}

export type AccountPrimaryAction = { kind: "install" | "topup"; orderId: number } | null;

/**
 * The page's one gradient CTA. A paid plan that isn't installed yet blocks the
 * trip, so the newest ready plan's Install wins; with nothing to install, the
 * active plan's Top up; otherwise none (Buy again and Details stay flat).
 */
export function accountPrimaryAction(sections: OrderGroups): AccountPrimaryAction {
  const newestReady = sections.ready[0];
  if (newestReady) return { kind: "install", orderId: newestReady.id };
  if (sections.active) return { kind: "topup", orderId: sections.active.id };
  return null;
}

export type UsageMeter = {
  state: "metered" | "unlimited" | "unavailable";
  /** Share of data LEFT, 0–100: the ring / bar fill, as in the app. Null when unknown. */
  leftPercent: number | null;
  /** Large figure: "4 GB", "Unlimited". Null when usage is unavailable. */
  headline: string | null;
  /** Small line under it: "of 10 GB remaining", "No data cap". */
  caption: string | null;
  /** Why there is no figure (unavailable only). */
  note: string | null;
  /** Accessible description of the ring / bar. */
  label: string;
};

export function usageMeter(usage: UsageSummary): UsageMeter {
  if (!usage.available) {
    return { state: "unavailable", leftPercent: null, headline: null, caption: null, note: usage.message, label: usage.message };
  }
  if (usage.unlimited) {
    return { state: "unlimited", leftPercent: 100, headline: "Unlimited", caption: "No data cap", note: null, label: "Unlimited data" };
  }
  const leftPercent = Math.min(100, Math.max(0, 100 - usage.usedPercent));
  return {
    state: "metered",
    leftPercent,
    headline: usage.remainingLabel,
    caption: `of ${usage.totalLabel} remaining`,
    note: null,
    label: `${leftPercent}% of data left: ${usage.remainingLabel} of ${usage.totalLabel}`
  };
}

/** A top-up package as GET /orders/:id/topups sends it (backend toTopupPackageFromCatalog). */
export type TopupOffer = {
  id: string;
  title?: string;
  priceDisplay?: string;
  priceNumeric?: number;
  retailPrice?: number;
  hasDiscount?: boolean;
  /** Data allowance in MB. */
  amount?: number;
  /** Validity in days. */
  day?: number;
  is_unlimited?: boolean;
};

/** The catalog's unlimited sentinel (planRow UNLIMITED_DATA_GB). */
const UNLIMITED_DATA_GB = 999;

/** Shapes a top-up offer for the PlanRow pieces (data disc, tags, price). */
export function topupPlanRowPlan(offer: TopupOffer): PlanRowPlan {
  const hasAmount = typeof offer.amount === "number" && offer.amount > 0;
  return {
    id: offer.id,
    title: offer.title ?? offer.id,
    dataLabel: offer.is_unlimited ? "Unlimited" : hasAmount ? formatMegabytes(offer.amount!) : "Data top-up",
    dataNumericGb: offer.is_unlimited ? UNLIMITED_DATA_GB : hasAmount ? offer.amount! / 1024 : 0,
    durationDays: typeof offer.day === "number" ? offer.day : 0,
    durationLabel: typeof offer.day === "number" ? `${offer.day} days` : "Top-up",
    price: offer.priceDisplay ?? "",
    priceNumeric: offer.priceNumeric ?? 0,
    hasDiscount: offer.hasDiscount,
    retailPrice: offer.retailPrice
  };
}
```

- [ ] **Step 4: One implementation of `describePackage` / `formatDate`**

In `src/app/account/PlanCard.tsx` (deleted in Task 5, still used until then):
- delete the `detailsFromPackageId` function with its doc comment, the `PackageDescription` type, `describePackage`, and `formatDate`;
- add `import { describePackage, formatDate } from "@/lib/accountEsims";` above the `import type { UsageSummary }` line.

Nothing else imports them (`grep -rn "describePackage\|formatDate" src/app/account` shows only `PlanCard.tsx`).

- [ ] **Step 5: Tests + types**

Run: `pnpm exec vitest run src/lib/accountEsims.test.ts` → PASS, 10 tests.
Run: `pnpm test && pnpm exec tsc --noEmit` → **85 files, 664 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/lib/accountEsims.ts src/lib/accountEsims.test.ts src/app/account/PlanCard.tsx
git commit -m "feat(account): pure My eSIMs rules (status, count line, Buy again, primary action, usage meter)"
```

---

### Task 3: Account nav rules, `AccountShell`, `SettingsGroup`, sign-out appearances (not wired)

**Files:**
- Create: `src/lib/accountNav.ts`, `src/lib/accountNav.test.ts`, `src/app/components/AccountShell.tsx`, `src/app/account/accountShellItems.ts`, `src/app/components/SettingsGroup.tsx`, `src/app/components/account-shell.test.ts`
- Modify: `src/app/components/SignOutButton.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/accountNav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ACCOUNT_NAV, profileGroupClass, profileTabFromParam } from "./accountNav";

describe("ACCOUNT_NAV", () => {
  it("lists the spec's sidebar, with Profile's tabs as ?tab= links", () => {
    expect(ACCOUNT_NAV.map((entry) => [entry.label, entry.href])).toEqual([
      ["My eSIMs", "/account"],
      ["Account", "/profile"],
      ["Sign-in methods", "/profile?tab=signin"],
      ["Payments", "/profile?tab=payments"],
      ["Support", "/profile?tab=support"],
      ["Legal", "/profile?tab=legal"]
    ]);
  });
});

describe("profileTabFromParam", () => {
  it("accepts the known tabs and falls back to Account for anything else", () => {
    expect(profileTabFromParam(undefined)).toBe("account");
    expect(profileTabFromParam("signin")).toBe("signin");
    expect(profileTabFromParam(["legal", "support"])).toBe("legal");
    expect(profileTabFromParam("bogus")).toBe("account");
    expect(profileTabFromParam("")).toBe("account");
  });
});

describe("profileGroupClass", () => {
  it("shows every group below lg and only the selected one at lg", () => {
    expect(profileGroupClass("signin", "signin")).toBe("");
    expect(profileGroupClass("account", "signin")).toBe("lg:hidden");
  });
});
```

Create `src/app/components/account-shell.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { accountShellItems } from "../account/accountShellItems";

const shell = readFileSync("src/app/components/AccountShell.tsx", "utf8");
const group = readFileSync("src/app/components/SettingsGroup.tsx", "utf8");
const signOut = readFileSync("src/app/components/SignOutButton.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("AccountShell", () => {
  it("is a plain-props server component the partner pages can reuse", () => {
    expect(shell).not.toContain('"use client"');
    expect(shell).not.toMatch(/fetch\(|usePathname|cookies\(/);
    expect(shell).toContain("items: readonly AccountShellItem[]");
    expect(shell).not.toMatch(HEX);
  });

  it("shows the sidebar from lg only, sticky, and marks the current page", () => {
    expect(shell).toContain('className="hidden lg:block lg:self-stretch"');
    expect(shell).toContain("sticky top-6");
    expect(shell).toContain('aria-current={current ? "page" : undefined}');
    // 44px rows.
    expect(shell).toContain("min-h-11");
  });

  it("lists the account area's sidebar and flags exactly one current entry", () => {
    const items = accountShellItems("payments");
    expect(items.map((item) => item.label)).toEqual([
      "My eSIMs",
      "Account",
      "Sign-in methods",
      "Payments",
      "Support",
      "Legal"
    ]);
    expect(items.filter((item) => item.current).map((item) => item.href)).toEqual(["/profile?tab=payments"]);
    expect(accountShellItems(null).some((item) => item.current)).toBe(false);
  });
});

describe("SettingsGroup and SignOutButton", () => {
  it("groups rows in one hairline-split card with a caps label, rows at least 56px", () => {
    expect(group).toContain("divide-y divide-outline/60");
    expect(group).toContain("text-label-caps uppercase");
    expect(group).toContain("min-h-14");
    expect(group).not.toMatch(HEX);
  });

  it("signs out through the BFF in every appearance, with 44px+ targets", () => {
    expect(signOut).toContain('fetch("/bff/auth/signout", { method: "POST" })');
    expect(signOut).toContain("min-h-11");
    expect(signOut).toContain("min-h-14");
  });
});
```

- [ ] **Step 2: Watch them fail**

Run: `pnpm exec vitest run src/lib/accountNav.test.ts src/app/components/account-shell.test.ts` → FAIL (modules and files missing).

- [ ] **Step 3: Implement**

Create `src/lib/accountNav.ts`:

```ts
/**
 * Navigation rules for the signed-in account area (AccountShell's lg+ sidebar and
 * the /profile sections). Pure, so the tab mapping is unit-tested; the icons live
 * with the component (src/app/account/accountShellItems.ts).
 */
export type ProfileTabId = "account" | "signin" | "payments" | "support" | "legal";
export type AccountNavId = "esims" | ProfileTabId;

export type AccountNavEntry = { id: AccountNavId; label: string; href: string };

/**
 * The sidebar, top to bottom (Sign out is the shell's footer, not a link).
 * Profile's old in-page tabs became `?tab=` links: a server-rendered selection, so
 * a tab is a real URL (deep links, back button) and the page needs no client state.
 */
export const ACCOUNT_NAV: readonly AccountNavEntry[] = [
  { id: "esims", label: "My eSIMs", href: "/account" },
  { id: "account", label: "Account", href: "/profile" },
  { id: "signin", label: "Sign-in methods", href: "/profile?tab=signin" },
  { id: "payments", label: "Payments", href: "/profile?tab=payments" },
  { id: "support", label: "Support", href: "/profile?tab=support" },
  { id: "legal", label: "Legal", href: "/profile?tab=legal" }
];

const PROFILE_TABS: readonly ProfileTabId[] = ["account", "signin", "payments", "support", "legal"];

/** `?tab=` → a known tab. Missing, repeated (first wins) or unknown values fall back to Account. */
export function profileTabFromParam(value: string | string[] | undefined): ProfileTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  return PROFILE_TABS.find((tab) => tab === raw) ?? "account";
}

/**
 * One profile tree for every width: phones and tablets list every group (the app's
 * grouped settings); at lg+ only the group the sidebar selected is shown.
 */
export function profileGroupClass(group: ProfileTabId, selected: ProfileTabId): string {
  return group === selected ? "" : "lg:hidden";
}
```

Create `src/app/components/AccountShell.tsx`:

```tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AccountShellItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Marks the page the visitor is on (aria-current="page"). */
  current?: boolean;
};

/**
 * The lg+ dashboard frame of the signed-in areas: a sticky sidebar of links (plus an
 * optional footer slot, e.g. Sign out) beside the page content. Reused by /partners/*
 * (spec section 9), so everything comes in as props: no data fetching, no hooks, no
 * route knowledge. Below lg the sidebar is display:none and the content is
 * full-width: the dock and the page itself handle navigation.
 *
 * Sticky needs an ancestor that doesn't clip: pages put it in a `<main>` with
 * overflow-x-clip, never overflow-x-hidden (f215).
 */
export function AccountShell({
  label,
  items,
  footer,
  children
}: {
  /** Names the sidebar landmark, e.g. "Account". */
  label: string;
  items: readonly AccountShellItem[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <nav aria-label={label} className="hidden lg:block lg:self-stretch">
        <div className="sticky top-6 rounded-[20px] border border-outline/60 bg-surface p-2 shadow-brandCard">
          <ul className="space-y-0.5">
            {items.map(({ href, label: itemLabel, icon: Icon, current }) => (
              <li key={href}>
                <Link
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold transition ${
                    current
                      ? "bg-brandBlue/10 text-brandBlue"
                      : "text-onSurfaceVariant hover:bg-surfaceBright hover:text-brandInk"
                  }`}
                  href={href}
                >
                  <Icon aria-hidden="true" className="shrink-0" size={18} />
                  {itemLabel}
                </Link>
              </li>
            ))}
          </ul>

          {footer ? <div className="mt-2 border-t border-outline/60 pt-2">{footer}</div> : null}
        </div>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
```

Create `src/app/account/accountShellItems.ts`:

```ts
import { FileText, Globe2, KeyRound, LifeBuoy, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCOUNT_NAV, type AccountNavId } from "@/lib/accountNav";
import type { AccountShellItem } from "../components/AccountShell";

const ICONS: Record<AccountNavId, LucideIcon> = {
  esims: Globe2,
  account: UserRound,
  signin: KeyRound,
  payments: Wallet,
  support: LifeBuoy,
  legal: FileText
};

/** AccountShell's items for /account and /profile, with `current` on the page being viewed. */
export function accountShellItems(current: AccountNavId | null): AccountShellItem[] {
  return ACCOUNT_NAV.map((entry) => ({
    href: entry.href,
    label: entry.label,
    icon: ICONS[entry.id],
    current: entry.id === current
  }));
}
```

Create `src/app/components/SettingsGroup.tsx` (the old `SettingsSection.tsx` stays until Task 7, where `ProfileTabs` stops using it):

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The app's grouped settings list (velocity-eSim ProfileGroup): a small caps label,
 * then one white card whose rows are split by hairlines. Used by /profile now and the
 * partner pages on phones (spec section 9). Rows are the direct children.
 */
export function SettingsGroup({
  label,
  className = "",
  children
}: {
  /** Omit for a label-less card (e.g. Sign out on its own). */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const card = (
    <div className="divide-y divide-outline/60 overflow-hidden rounded-[18px] border border-outline/60 bg-surface shadow-brandCard">
      {children}
    </div>
  );

  if (!label) return <div className={className}>{card}</div>;

  return (
    <section className={className}>
      <h2 className="mb-2 px-1 text-label-caps uppercase text-onSurfaceVariant">{label}</h2>
      {card}
    </section>
  );
}

/** The leading icon tile every settings row shares. */
export const SETTINGS_ICON_TILE_CLASSES =
  "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brandBlue/10 text-brandBlue";

/** One tappable row: icon tile, label (+ description), chevron. At least 56px tall. */
export function SettingsLinkRow({
  description,
  href,
  icon: Icon,
  label
}: {
  description?: string;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link className="flex min-h-14 items-center gap-4 px-4 py-3 transition hover:bg-surfaceBright" href={href}>
      <span className={SETTINGS_ICON_TILE_CLASSES}>
        <Icon aria-hidden="true" size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brandInk">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-onSurfaceVariant">{description}</span> : null}
      </span>

      <ChevronRight aria-hidden="true" className="shrink-0 text-onSurfaceVariant/70" size={17} />
    </Link>
  );
}
```

Replace `src/app/components/SignOutButton.tsx` (default `"button"` keeps today's `/profile` look until Task 7):

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "./Button";
import { SETTINGS_ICON_TILE_CLASSES } from "./SettingsGroup";

/**
 * - "button": the old full-width CTA (until /profile moves to the grouped list).
 * - "nav": a sidebar entry, the footer of AccountShell at lg+.
 * - "row": a settings row inside a SettingsGroup card (phones/tablets).
 */
type Appearance = "button" | "nav" | "row";

const CLASSES: Record<Exclude<Appearance, "button">, string> = {
  nav:
    "flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-sm font-semibold text-onSurfaceVariant transition hover:bg-surfaceBright hover:text-brandInk disabled:cursor-not-allowed disabled:opacity-60",
  row:
    "flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-sm font-semibold text-brandInk transition hover:bg-surfaceBright disabled:cursor-not-allowed disabled:opacity-60"
};

export function SignOutButton({ appearance = "button" }: { appearance?: Appearance }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/bff/auth/signout", { method: "POST" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  if (appearance === "button") {
    return (
      <Button className="w-full" disabled={busy} onClick={() => void signOut()} type="button">
        <LogOut size={17} />
        Sign out
      </Button>
    );
  }

  return (
    <button className={CLASSES[appearance]} disabled={busy} onClick={() => void signOut()} type="button">
      {appearance === "row" ? (
        <span className={SETTINGS_ICON_TILE_CLASSES}>
          <LogOut aria-hidden="true" size={18} />
        </span>
      ) : (
        <LogOut aria-hidden="true" className="shrink-0" size={18} />
      )}
      Sign out
    </button>
  );
}
```

- [ ] **Step 4: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit` → **87 files, 672 tests**; tsc clean. Nothing renders the new pieces yet.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/lib/accountNav.ts src/lib/accountNav.test.ts src/app/components/AccountShell.tsx src/app/account/accountShellItems.ts src/app/components/SettingsGroup.tsx src/app/components/SignOutButton.tsx src/app/components/account-shell.test.ts
git commit -m "feat(account): AccountShell sidebar, account nav rules, SettingsGroup, sign-out appearances"
```

---

### Task 4: Usage ring card, blue active card, badge, flag tile (not wired)

**Files:**
- Create: `src/app/components/{StatusBadge,EsimFlag,UsageRing,ActiveEsimCard}.tsx`, `src/app/components/usage-cards.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/components/usage-cards.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ring = readFileSync("src/app/components/UsageRing.tsx", "utf8");
const blueCard = readFileSync("src/app/components/ActiveEsimCard.tsx", "utf8");
const badge = readFileSync("src/app/components/StatusBadge.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("UsageRing / UsageRingCard (lg+)", () => {
  it("draws the share of data left as a teal ring, in token classes only", () => {
    expect(ring).toContain('className="stroke-brandTeal"');
    expect(ring).toContain('className="stroke-mist"');
    expect(ring).toContain("pathLength={100}");
    expect(ring).toContain("strokeDasharray={`${meter.leftPercent} 100`}");
    expect(ring).toContain('aria-label={meter.label}');
    expect(ring).toContain("data-usage-ring");
    expect(ring).not.toMatch(HEX);
  });

  it("makes Top up the gradient only when the page says so; Details stays flat", () => {
    expect(ring).toContain('variant={primaryTopUp ? "primary" : "flat"}');
    expect(ring.match(/variant="flat"/g)).toHaveLength(1);
  });
});

describe("ActiveEsimCard (phones/tablets)", () => {
  it("is the app's blue card: data left in large type, a bar, Top up / Details", () => {
    expect(blueCard).toContain("bg-brandBlue");
    expect(blueCard).toContain("data-active-esim-card");
    expect(blueCard).toContain("text-[30px]");
    expect(blueCard).toContain("width: `${meter.leftPercent ?? 0}%`");
    expect(blueCard).toContain(">\n              Top up");
    expect(blueCard).toContain(">\n              Details");
  });

  it("never puts a gradient on the blue card, and uses tokens only", () => {
    expect(blueCard).not.toContain('variant="primary"');
    expect(blueCard).toContain('variant="flat"');
    expect(blueCard).not.toMatch(HEX);
  });
});

describe("StatusBadge", () => {
  it("only knows the three lifecycle states", () => {
    expect(badge).toContain("active:");
    expect(badge).toContain("ready:");
    expect(badge).toContain("expired:");
    expect(badge).not.toContain("Connected");
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/components/usage-cards.test.ts` → FAIL (files missing).

- [ ] **Step 3: Implement**

Create `src/app/components/StatusBadge.tsx`:

```tsx
import type { LifecycleBadge } from "@/lib/accountEsims";

const TONE_CLASSES: Record<LifecycleBadge["tone"], string> = {
  active: "bg-brandTeal/15 text-brandInk",
  ready: "bg-brandBlue/10 text-brandBlue",
  expired: "bg-outline/40 text-onSurfaceVariant"
};

/** Active / Ready / Expired, straight from lifecycle_status (lifecycleBadge). */
export function StatusBadge({ badge }: { badge: LifecycleBadge }) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-black uppercase tracking-[0.06em] ${TONE_CLASSES[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
}
```

Create `src/app/components/EsimFlag.tsx`:

```tsx
import { Globe2 } from "lucide-react";

/**
 * A plan's flag in a rounded tile, or a globe when the catalog has none. Decorative:
 * the country name is always printed next to it. Plain img: flag URIs come from the
 * catalog CDN, which the image optimiser isn't configured for.
 */
export function EsimFlag({ flagUri, className }: { flagUri: string | null; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden ${className}`}>
      {flagUri ? (
        <img alt="" className="h-full w-full object-cover" src={flagUri} />
      ) : (
        <Globe2 aria-hidden="true" size={20} />
      )}
    </span>
  );
}
```

Create `src/app/components/UsageRing.tsx`:

```tsx
import type { ReactNode } from "react";
import type { LifecycleBadge, UsageMeter } from "@/lib/accountEsims";
import { LinkButton } from "./Button";
import { EsimFlag } from "./EsimFlag";
import { StatusBadge } from "./StatusBadge";

/**
 * Teal ring of the data LEFT (lg+ account pages), with the figure in the middle.
 * SVG strokes take token classes (stroke-brandTeal / stroke-mist), so there are no
 * colour literals; pathLength=100 makes the dash the percentage.
 */
export function UsageRing({ meter }: { meter: UsageMeter }) {
  return (
    <div aria-label={meter.label} className="relative grid h-40 w-40 shrink-0 place-items-center" data-usage-ring role="img">
      <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle className="stroke-mist" cx="50" cy="50" fill="none" r="44" strokeWidth="8" />
        {meter.leftPercent ? (
          <circle
            className="stroke-brandTeal"
            cx="50"
            cy="50"
            fill="none"
            pathLength={100}
            r="44"
            strokeDasharray={`${meter.leftPercent} 100`}
            strokeLinecap="round"
            strokeWidth="8"
          />
        ) : null}
      </svg>

      <span aria-hidden="true" className="relative flex max-w-[112px] flex-col items-center text-center">
        <span className="font-display text-2xl font-black leading-tight tracking-[-0.03em] text-brandInk">
          {meter.headline ?? "—"}
        </span>
        {meter.caption ? <span className="mt-0.5 text-xs leading-4 text-onSurfaceVariant">{meter.caption}</span> : null}
      </span>
    </div>
  );
}

/**
 * The lg+ active-plan card: ring on the left; country, status, Top up + Details on
 * the right. `primaryTopUp` makes Top up the view's one gradient (accountPrimaryAction).
 */
export function UsageRingCard({
  title,
  flagUri,
  badge,
  statusLine,
  details,
  meter,
  topUpHref,
  detailsHref,
  primaryTopUp = false,
  children
}: {
  title: string;
  flagUri: string | null;
  badge: LifecycleBadge;
  statusLine: string;
  details?: string;
  meter: UsageMeter;
  topUpHref?: string;
  detailsHref?: string;
  primaryTopUp?: boolean;
  /** Extra actions after Top up / Details. */
  children?: ReactNode;
}) {
  return (
    // flex-wrap: in a half-width column (order page) the text drops under the ring
    // instead of truncating the country name.
    <article className="flex flex-wrap items-center gap-x-8 gap-y-5 rounded-[20px] border border-outline/60 bg-surface p-6 shadow-brandCard">
      <UsageRing meter={meter} />

      <div className="min-w-[220px] flex-1">
        <div className="flex items-center gap-3">
          <EsimFlag className="h-11 w-11 rounded-[12px] border border-outline/60 bg-surfaceBright text-brandBlue" flagUri={flagUri} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-xl font-black text-brandInk">{title}</h3>
            <p className="truncate text-sm text-onSurfaceVariant">{statusLine}</p>
          </div>
          <StatusBadge badge={badge} />
        </div>

        {details ? <p className="mt-4 text-sm text-onSurfaceVariant">{details}</p> : null}
        {meter.note ? <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">{meter.note}</p> : null}

        {topUpHref || detailsHref || children ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {topUpHref ? (
              <LinkButton href={topUpHref} variant={primaryTopUp ? "primary" : "flat"}>
                Top up
              </LinkButton>
            ) : null}
            {detailsHref ? (
              <LinkButton href={detailsHref} variant="flat">
                Details
              </LinkButton>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </article>
  );
}
```

Create `src/app/components/ActiveEsimCard.tsx`:

```tsx
import type { UsageMeter } from "@/lib/accountEsims";
import { LinkButton } from "./Button";
import { EsimFlag } from "./EsimFlag";

/**
 * The app's ActiveEsimCard (phones/tablets): a brandBlue card with the data left in
 * large type, a bar of what's left, the days left, then Top up / Details. The blue
 * card is the emphasis, so neither action is the gradient: Top up is the white flat
 * button (the app's solid white pill) and Details an outline on blue.
 */
export function ActiveEsimCard({
  title,
  flagUri,
  statusLine,
  meter,
  topUpHref,
  detailsHref
}: {
  title: string;
  flagUri: string | null;
  statusLine: string;
  meter: UsageMeter;
  topUpHref?: string;
  detailsHref?: string;
}) {
  return (
    <article className="rounded-[18px] bg-brandBlue p-5 text-surface shadow-brandGlow" data-active-esim-card>
      <div className="flex items-center gap-3">
        <EsimFlag className="h-10 w-10 rounded-[12px] bg-surface/20 text-surface" flagUri={flagUri} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-black">{title}</h3>
          <p className="truncate text-xs text-surface/80">{statusLine}</p>
        </div>
      </div>

      {meter.headline ? (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-[30px] font-black leading-9 tracking-[-0.03em]">{meter.headline}</span>
          {meter.caption ? <span className="text-xs text-surface/80">{meter.caption}</span> : null}
        </p>
      ) : null}
      {meter.note ? <p className="mt-4 text-sm leading-6 text-surface/80">{meter.note}</p> : null}

      <div aria-label={meter.label} className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface/25" role="img">
        <div className="h-full rounded-full bg-surface" style={{ width: `${meter.leftPercent ?? 0}%` }} />
      </div>

      {topUpHref || detailsHref ? (
        <div className="mt-5 flex gap-2">
          {topUpHref ? (
            <LinkButton className="flex-1" href={topUpHref} variant="flat">
              Top up
            </LinkButton>
          ) : null}
          {detailsHref ? (
            <a
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[12px] border border-surface/50 text-sm font-black text-surface transition hover:bg-surface/10"
              href={detailsHref}
            >
              Details
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 4: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit` → **88 files, 677 tests**; tsc clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/app/components/StatusBadge.tsx src/app/components/EsimFlag.tsx src/app/components/UsageRing.tsx src/app/components/ActiveEsimCard.tsx src/app/components/usage-cards.test.ts
git commit -m "feat(account): usage ring card (lg) and blue ActiveEsimCard (phones), status badge"
```

---

### Task 5: `/account`: sidebar dashboard (lg) and the app's My eSIMs (phones)

**Files:**
- Create: `src/app/account/EsimListRow.tsx`, `src/app/account/account-layout.test.ts`
- Rewrite: `src/app/account/page.tsx` (render only), `src/app/account/loading.tsx`
- Delete: `src/app/account/PlanCard.tsx`
- Modify: `src/app/profile/profile-page.test.ts` (one assertion)

- [ ] **Step 1: Write the failing test and change the one pinned assertion**

Create `src/app/account/account-layout.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/account/page.tsx", "utf8");
const row = readFileSync("src/app/account/EsimListRow.tsx", "utf8");
const loading = readFileSync("src/app/account/loading.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/account layout (desktop sidebar dashboard, phone My eSIMs)", () => {
  it("fetches once and switches only the active plan's presentation at lg", () => {
    expect(page.match(/fetchForPage</g)).toHaveLength(3);
    expect(page).toContain('<div className="lg:hidden">\n        <ActiveEsimCard');
    expect(page).toContain('<div className="hidden lg:block">\n        <UsageRingCard');
    expect(existsSync("src/app/account/PlanCard.tsx")).toBe(false);
  });

  it("sits in the AccountShell, sticky-safe, with the count line under the title", () => {
    expect(page).toContain('items={accountShellItems("esims")}');
    expect(page).toContain("overflow-x-clip");
    expect(page).not.toContain("overflow-x-hidden");
    expect(page).toContain("esimCountLine(sections)");
  });

  it("gives one gradient: accountPrimaryAction picks Install or Top up; Buy again only while sold", () => {
    expect(page).toContain("accountPrimaryAction(sections)");
    expect(page).toContain('primaryTopUp={primary?.kind === "topup"}');
    expect(page).toContain('primary: primary?.kind === "install" && primary.orderId === order.id');
    expect(page).toContain("buyAgainHref(order.package_id, catalog)");
    expect(page).toContain('again ? { kind: "buy-again", href: again } : null');
  });

  it("uses tokens only (no amber, no hex)", () => {
    expect(page).not.toContain("amber-");
    expect(page).not.toMatch(HEX);
    expect(row).not.toMatch(HEX);
  });
});

describe("EsimListRow", () => {
  it("makes the whole row open the eSIM without nesting the action in a link", () => {
    expect(row).toContain("after:absolute after:inset-0");
    expect(row).toContain("relative z-10 shrink-0");
    expect(row).toContain('variant={action.primary ? "primary" : "flat"}');
    // Buy again is a 44px text action, never a gradient.
    expect(row).toContain("min-h-11");
  });
});

describe("/account loading", () => {
  it("is shaped like the page and still under reduced motion", () => {
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("motion-safe:animate-pulse");
    expect(loading).toContain("lg:grid-cols-[240px_minmax(0,1fr)]");
  });
});
```

In `src/app/profile/profile-page.test.ts` replace the "is reachable from the eSIM list" test (see "Changed assertions"):

```ts
  it("is reachable from the eSIM list", () => {
    // lg+: the AccountShell sidebar (Account → /profile); below lg the dock's Profile tab.
    const accountNav = readFileSync("src/lib/accountNav.ts", "utf8");
    expect(accountPage).toContain('items={accountShellItems("esims")}');
    expect(accountNav).toContain('{ id: "account", label: "Account", href: "/profile" }');
  });
```

- [ ] **Step 2: Watch them fail**

Run: `pnpm exec vitest run src/app/account src/app/profile/profile-page.test.ts` → FAIL (layout tests, and the changed assertion).

- [ ] **Step 3: Implement**

Create `src/app/account/EsimListRow.tsx`:

```tsx
import Link from "next/link";
import type { LifecycleBadge, PackageDescription } from "@/lib/accountEsims";
import { LinkButton } from "../components/Button";
import { EsimFlag } from "../components/EsimFlag";
import { StatusBadge } from "../components/StatusBadge";

export type EsimRowAction =
  | { kind: "install"; href: string; primary: boolean }
  | { kind: "buy-again"; href: string }
  | null;

/**
 * One plan in a My eSIMs section (the app's EsimListRow): flag, country + status,
 * plan details, order line, and a trailing action: Install (ready) or Buy again
 * (history, muted). The country name is a stretched link to the eSIM page, so the
 * whole row is tappable without nesting the action inside a link.
 */
export function EsimListRow({
  orderId,
  description,
  badge,
  meta,
  action,
  muted = false
}: {
  orderId: number;
  description: PackageDescription;
  badge: LifecycleBadge;
  /** "Order LC-102 · Purchased 29 Sept 2026". */
  meta: string;
  action: EsimRowAction;
  muted?: boolean;
}) {
  return (
    <div className="relative flex min-h-[76px] items-center gap-3 px-4 py-3 transition hover:bg-surfaceBright lg:px-5">
      <EsimFlag
        className={`h-10 w-10 rounded-[12px] border border-outline/60 bg-surfaceBright text-brandBlue ${muted ? "opacity-50" : ""}`}
        flagUri={description.flagUri}
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className={`truncate font-display text-[15px] font-black ${muted ? "text-onSurfaceVariant" : "text-brandInk"}`}>
            <Link
              className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brandBlue"
              href={`/account/${orderId}`}
            >
              {description.title}
            </Link>
          </h3>
          <StatusBadge badge={badge} />
        </div>
        <p className="truncate text-xs text-onSurfaceVariant">{description.details}</p>
        <p className="truncate text-xs text-onSurfaceVariant">{meta}</p>
      </div>

      {action?.kind === "install" ? (
        <LinkButton
          aria-label={`Install ${description.title}`}
          className="relative z-10 shrink-0"
          href={action.href}
          variant={action.primary ? "primary" : "flat"}
        >
          Install
        </LinkButton>
      ) : null}

      {action?.kind === "buy-again" ? (
        <Link
          aria-label={`Buy again: ${description.title}`}
          className="relative z-10 inline-flex min-h-11 shrink-0 items-center rounded-[10px] px-2 text-sm font-black text-brandBlue transition hover:bg-brandBlue/5"
          href={action.href}
        >
          Buy again
        </Link>
      ) : null}
    </div>
  );
}
```

Replace `src/app/account/page.tsx`. **The block from `const activeResult` to `getPackageOptions()\n  ]);` is the existing code, unchanged** (f048 and `account-sections.test.ts` pin it):

```tsx
import type { Metadata } from "next";
import { ArrowRight, Inbox, WifiOff } from "lucide-react";
import {
  accountPrimaryAction,
  buyAgainHref,
  describePackage,
  esimCountLine,
  esimStatusLine,
  formatDate,
  lifecycleBadge,
  usageMeter
} from "@/lib/accountEsims";
import { summariseUsage, type UsagePayload, type UsageSummary } from "@/lib/esim-install";
import { resolveOrderSections, type OrderSummary } from "@/lib/order-groups";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import type { HeroPackageOption } from "@/services/packages";
import { getPackageOptions } from "@/services/server-packages";
import { AccountShell } from "../components/AccountShell";
import { ActiveEsimCard } from "../components/ActiveEsimCard";
import { LinkButton } from "../components/Button";
import { Navbar } from "../components/Navbar";
import { SignOutButton } from "../components/SignOutButton";
import { UsageRingCard } from "../components/UsageRing";
import { SiteFooter } from "../SiteFooter";
import { accountShellItems } from "./accountShellItems";
import { EsimListRow } from "./EsimListRow";

export const metadata: Metadata = createMetadata({
  path: "/account",
  title: "My eSIMs | eSim2you",
  description: "View your eSIM plans, data usage, and installation details.",
  indexable: false
});

function AccountSection({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="mt-8 lg:mt-10">
      <h2 className="px-1 text-label-caps uppercase text-onSurfaceVariant">{title}</h2>
      <p className="mt-1 px-1 text-sm text-onSurfaceVariant">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** The live plan: the app's blue card below lg, the usage ring at lg+ (display-switched). */
function ActivePlan({
  order,
  catalog,
  usage,
  primaryTopUp
}: {
  order: OrderSummary;
  catalog: ReadonlyMap<string, HeroPackageOption>;
  usage: UsageSummary;
  primaryTopUp: boolean;
}) {
  const { title, details, flagUri } = describePackage(order.package_id, catalog);
  const meter = usageMeter(usage);
  const statusLine = esimStatusLine(order);
  const topUpHref = `/account/${order.id}#top-up`;
  const detailsHref = `/account/${order.id}`;

  return (
    <>
      <div className="lg:hidden">
        <ActiveEsimCard
          detailsHref={detailsHref}
          flagUri={flagUri}
          meter={meter}
          statusLine={statusLine}
          title={title}
          topUpHref={topUpHref}
        />
      </div>
      <div className="hidden lg:block">
        <UsageRingCard
          badge={lifecycleBadge(order.lifecycle_status)}
          details={`${details} · Order ${order.code}`}
          detailsHref={detailsHref}
          flagUri={flagUri}
          meter={meter}
          primaryTopUp={primaryTopUp}
          statusLine={statusLine}
          title={title}
          topUpHref={topUpHref}
        />
      </div>
    </>
  );
}

/** Phones/tablets: one card of hairline-split rows. lg+: Ready becomes a grid of tiles. */
const ROW_CARD_CLASSES =
  "divide-y divide-outline/60 overflow-hidden rounded-[18px] border border-outline/60 bg-surface shadow-brandCard";
const READY_LIST_CLASSES = `${ROW_CARD_CLASSES} lg:grid lg:grid-cols-2 lg:gap-4 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none`;
const READY_TILE_CLASSES =
  "lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-outline/60 lg:bg-surface lg:shadow-brandCard";

export default async function AccountPage() {
  // Fetched first and on its own: this endpoint checks remaining data and
  // expires a depleted plan as a side effect, so asking it before the list means
  // the list already reflects that expiry.
  const activeResult = await fetchForPage<{ order: OrderSummary | null }>(
    "/orders/active",
    "/account"
  );
  const activeOrder = activeResult.ok ? activeResult.data.order : undefined;

  // Per-order usage is one upstream round-trip each, so only the live plan gets
  // one here. The rest load their usage on the detail page.
  const [ordersResult, usageResult, packageOptions] = await Promise.all([
    fetchForPage<{ orders: OrderSummary[] }>("/orders", "/account"),
    activeOrder
      ? fetchForPage<{ usage: UsagePayload }>(`/orders/${activeOrder.id}/usage`, "/account")
      : null,
    getPackageOptions()
  ]);

  const catalog = new Map(packageOptions.map((option) => [option.id, option]));
  const sections = ordersResult.ok
    ? resolveOrderSections(ordersResult.data.orders, activeOrder)
    : null;
  const usage = summariseUsage(usageResult?.ok ? usageResult.data.usage : null);
  const isEmpty =
    sections !== null &&
    sections.active === null &&
    sections.ready.length === 0 &&
    sections.history.length === 0;

  // One data fetch, one tree: only the active plan has two presentations
  // (ActivePlan), switched with display classes.
  const primary = sections ? accountPrimaryAction(sections) : null;
  const countLine = esimCountLine(sections);
  const meta = (order: OrderSummary) => `Order ${order.code} · Purchased ${formatDate(order.created_at)}`;

  return (
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the AccountShell sidebar would stop sticking (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("esims")} label="Account">
          <div className="px-1">
            <h1 className="font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              My eSIMs
            </h1>
            <p className="mt-1 text-sm text-onSurfaceVariant">
              {countLine ?? "Your plans, installation details, and remaining data."}
            </p>
          </div>

          {sections === null ? (
            <div className="mt-8 flex items-center gap-4 rounded-[18px] border border-error/30 bg-surface px-5 py-4 shadow-brandCard">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error/10 text-error">
                <WifiOff aria-hidden="true" size={20} />
              </span>
              <div>
                <p className="font-bold text-brandInk">We couldn&apos;t load your plans</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">
                  {ordersResult.ok ? "" : ordersResult.message}
                </p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard">
              <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-brandBlue/10 text-brandBlue">
                <Inbox aria-hidden="true" size={26} />
              </span>
              <p className="mt-5 font-display text-xl font-black text-brandInk">No eSIMs yet</p>
              <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
                Once you buy a plan it will appear here with its QR code and remaining data.
              </p>
              <LinkButton className="mt-7" href="/destinations">
                Browse plans
                <ArrowRight aria-hidden="true" size={16} />
              </LinkButton>
            </div>
          ) : (
            <>
              {sections.active ? (
                <AccountSection
                  description="The plan currently using your data."
                  title="Active plan"
                >
                  <ActivePlan
                    catalog={catalog}
                    order={sections.active}
                    primaryTopUp={primary?.kind === "topup"}
                    usage={usage}
                  />
                </AccountSection>
              ) : null}

              {sections.ready.length > 0 ? (
                <AccountSection
                  description="Bought and waiting. Install one to start using it."
                  title="Ready to use"
                >
                  <ul className={READY_LIST_CLASSES}>
                    {sections.ready.map((order) => (
                      <li className={READY_TILE_CLASSES} key={order.id}>
                        <EsimListRow
                          action={{
                            kind: "install",
                            href: `/account/${order.id}#install`,
                            primary: primary?.kind === "install" && primary.orderId === order.id
                          }}
                          badge={lifecycleBadge(order.lifecycle_status)}
                          description={describePackage(order.package_id, catalog)}
                          meta={meta(order)}
                          orderId={order.id}
                        />
                      </li>
                    ))}
                  </ul>
                </AccountSection>
              ) : null}

              {sections.history.length > 0 ? (
                <AccountSection description="Plans you have finished." title="History">
                  <ul className={ROW_CARD_CLASSES}>
                    {sections.history.map((order) => {
                      const again = buyAgainHref(order.package_id, catalog);
                      return (
                        <li key={order.id}>
                          <EsimListRow
                            action={again ? { kind: "buy-again", href: again } : null}
                            badge={lifecycleBadge(order.lifecycle_status)}
                            description={describePackage(order.package_id, catalog)}
                            meta={meta(order)}
                            muted
                            orderId={order.id}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </AccountSection>
              ) : null}
            </>
          )}
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
```

Replace `src/app/account/loading.tsx`:

```tsx
/** Shaped like the loaded page: title + count, the active card, a row card (lg: sidebar + ring card). */
export default function AccountLoading() {
  return (
    <main aria-busy="true" className="min-h-screen bg-surfaceBright">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] motion-safe:animate-pulse sm:px-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:pt-[108px]">
        <div className="hidden h-[340px] rounded-[20px] bg-surface lg:block" />
        <div>
          <div className="h-9 w-40 rounded-[10px] bg-outline/40" />
          <div className="mt-2 h-4 w-32 rounded-full bg-outline/30" />
          <div className="mt-10 h-[232px] rounded-[18px] bg-brandBlue/15 lg:h-[212px] lg:rounded-[20px] lg:bg-surface" />
          <div className="mt-10 h-[160px] rounded-[18px] bg-surface" />
        </div>
      </div>
    </main>
  );
}
```

Delete the old cards: `git rm src/app/account/PlanCard.tsx` (controller stages it; implementers just delete the file).

- [ ] **Step 4: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit` → **89 files, 683 tests**; tsc clean. `account-sections.test.ts` passes unchanged (`title="Active plan"`, `"/orders/active"` before `"/orders"`, one `/usage\``, `activeOrder\n      ?`, `No eSIMs yet`, `href="/destinations"`).

- [ ] **Step 5: Quick look (optional before Task 9)**

`pnpm build`, then run the Task 9 mock + server and open `/account` at 375 and 1440 with the `full` cookie: blue card / ring card, Japan's Install gradient, UK's flat, US history row with Buy again → `/esim/usa`, the retired row without.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/account/page.tsx src/app/account/loading.tsx src/app/account/EsimListRow.tsx src/app/account/account-layout.test.ts src/app/profile/profile-page.test.ts
git rm src/app/account/PlanCard.tsx
git commit -m "feat(account): My eSIMs as sidebar dashboard (lg) and the app's layout (phones)"
```

---

### Task 6: `/account/[orderId]`: usage card + install card, top-up rows

**Files:**
- Rewrite: `src/app/account/[orderId]/page.tsx` (render), `TopUpPanel.tsx` (markup), `CopyField.tsx`
- Create: `src/app/account/[orderId]/order-detail-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/account/[orderId]/order-detail-layout.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/account/[orderId]/page.tsx", "utf8");
const topUp = readFileSync("src/app/account/[orderId]/TopUpPanel.tsx", "utf8");
const copy = readFileSync("src/app/account/[orderId]/CopyField.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/account/[orderId] layout", () => {
  it("puts the usage card (blue below lg, ring at lg) beside the install card", () => {
    expect(page).toContain('className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start"');
    expect(page).toContain('<div className="lg:hidden">\n                <ActiveEsimCard');
    expect(page).toContain('<div className="hidden lg:block">\n                <UsageRingCard');
    expect(page).toContain('id="install"');
    expect(page).toContain('items={accountShellItems("esims")}');
  });

  it("keeps both banners and the purchase conversion exactly where they were", () => {
    expect(page).toContain('isNew === "1"');
    expect(page).toContain("<PurchaseConversion transactionId={order.code} />");
    expect(page).toContain("Payment complete — your eSIM is ready");
    expect(page).toContain('isToppedUp === "1"');
    expect(page).toContain("Top-up complete");
  });

  it("uses tokens only and 44px controls", () => {
    expect(page).not.toContain("amber-");
    expect(page).not.toMatch(HEX);
    expect(page).toContain("min-h-11");
    expect(copy).toContain("h-11 w-11");
  });
});

describe("TopUpPanel", () => {
  it("lists offers as PlanRow-style rows; the hosted Pokpay flow is unchanged", () => {
    expect(topUp).toContain('id="top-up"');
    expect(topUp).toContain("<PlanDataDisc plan={plan} />");
    expect(topUp).toContain("<PlanPrice plan={plan} />");
    expect(topUp).toContain("planRowTags(plan, { position: null })");
    expect(topUp).toContain('fetch("/bff/payments/topups/intent"');
    expect(topUp).toContain("window.location.assign(payload.data.checkoutUrl)");
    // Every row's Top up is flat: the page's one gradient is the usage card's.
    expect(topUp).toContain('variant="flat"');
    expect(topUp).not.toContain('variant="primary"');
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run "src/app/account/[orderId]"` → FAIL.

- [ ] **Step 3: Implement**

Replace `src/app/account/[orderId]/page.tsx`. Unchanged from today: the types, `describeAllowance`, `notFound()` on 404, the four order fetches, `packageHistory` / `topups` / `qr` / `instructionsAvailable`, both banners with `PurchaseConversion`, the install-card content and the history data. New: `PAGE_CLASSES`, the shell (also around the error state), `getPackageOptions()` in the same `Promise.all`, the usage cards, `#install`, tokens instead of `amber-*`, 44px back link, flat iPhone / Need help? buttons, `relative` scroller (f195).

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Info,
  LifeBuoy,
  QrCode,
  Smartphone,
  WifiOff
} from "lucide-react";
import { describePackage, esimStatusLine, lifecycleBadge, usageMeter } from "@/lib/accountEsims";
import {
  formatMegabytes,
  resolveQrSource,
  summariseUsage,
  type UsagePayload
} from "@/lib/esim-install";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { getPackageOptions } from "@/services/server-packages";
import { AccountShell } from "../../components/AccountShell";
import { ActiveEsimCard } from "../../components/ActiveEsimCard";
import { LinkButton } from "../../components/Button";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { UsageRingCard } from "../../components/UsageRing";
import { SiteFooter } from "../../SiteFooter";
import { accountShellItems } from "../accountShellItems";
import { CopyField } from "./CopyField";
import { PurchaseConversion } from "./PurchaseConversion";
import { TopUpPanel, type TopupPackage } from "./TopUpPanel";

export const metadata: Metadata = createMetadata({
  path: "/account",
  title: "eSIM details | eSim2you",
  description: "Install your eSIM and track your remaining data.",
  indexable: false
});

type Sim = {
  iccid: string;
  qrcode: string;
  direct_apple_installation_url: string | null;
};

type Order = {
  id: number;
  code: string;
  status: string;
  lifecycle_status: "ready" | "active" | "expired";
  package_id: string;
  created_at: string;
  expires_at: string | null;
  sims: Sim[];
};

type Instructions = {
  available?: boolean;
  reason?: string;
  [key: string]: unknown;
};

/** Every field is optional upstream, so each one is rendered defensively. */
type PackageHistoryEntry = {
  id?: string;
  package_id?: string;
  status?: string;
  remaining?: number;
  total?: number;
  is_unlimited?: boolean;
};

/**
 * The backend answers 200 with `available: false` and an explanation when the
 * provider has nothing to sell or the eSIM is not provisioned yet.
 */
type Topups = {
  available?: boolean;
  packages?: TopupPackage[];
  reason?: string;
  message?: string;
};

const PAGE_CLASSES =
  "mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]";

function describeAllowance(entry: PackageHistoryEntry): string {
  if (entry.is_unlimited) return "Unlimited";
  if (typeof entry.total !== "number") return "—";
  if (typeof entry.remaining !== "number") return formatMegabytes(entry.total);
  return `${formatMegabytes(entry.remaining)} of ${formatMegabytes(entry.total)} left`;
}

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ new?: string; topup?: string }>;
}) {
  const { orderId } = await params;
  const { new: isNew, topup: isToppedUp } = await searchParams;
  const basePath = `/account/${orderId}`;

  const orderResult = await fetchForPage<{ order: Order }>(`/orders/${orderId}`, basePath);

  if (!orderResult.ok && orderResult.status === 404) {
    notFound();
  }

  if (!orderResult.ok) {
    return (
      <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
        <Navbar />
        <div className={PAGE_CLASSES}>
          <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("esims")} label="Account">
            <div className="flex items-center gap-4 rounded-[18px] border border-error/30 bg-surface px-5 py-4 shadow-brandCard">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-error/10 text-error">
                <WifiOff aria-hidden="true" size={20} />
              </span>
              <div>
                <p className="font-bold text-brandInk">We couldn&apos;t load this eSIM</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">{orderResult.message}</p>
              </div>
            </div>
          </AccountShell>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const order = orderResult.data.order;
  const sim = order.sims?.[0];

  const [usageResult, instructionsResult, packagesResult, topupsResult, packageOptions] = await Promise.all([
    fetchForPage<{ usage: UsagePayload }>(`/orders/${orderId}/usage`, basePath),
    fetchForPage<{ instructions: Instructions }>(`/orders/${orderId}/instructions`, basePath),
    fetchForPage<{ packages: PackageHistoryEntry[] }>(`/orders/${orderId}/packages`, basePath),
    fetchForPage<{ topups: Topups }>(`/orders/${orderId}/topups`, basePath),
    // Public catalog (60s server cache), already loaded by /account: names the plan on the usage card.
    getPackageOptions()
  ]);

  const usage = summariseUsage(usageResult.ok ? usageResult.data.usage : null);
  // Plan history is supplementary: if the provider call fails, the install and
  // usage panels above are still worth showing on their own.
  const packageHistory = packagesResult.ok ? packagesResult.data.packages : [];
  const topups = topupsResult.ok ? topupsResult.data.topups : null;
  const topupPackages = topups?.available === true ? (topups.packages ?? []) : [];
  const qr = resolveQrSource(sim?.qrcode);
  const instructionsAvailable =
    instructionsResult.ok && instructionsResult.data.instructions?.available === true;
  const plan = describePackage(
    order.package_id,
    new Map(packageOptions.map((option) => [option.id, option]))
  );
  const meter = usageMeter(usage);
  const statusLine = esimStatusLine(order);
  // The list below is the top-up; the card's Top up just jumps to it.
  const topUpHref = topupPackages.length > 0 ? "#top-up" : undefined;

  return (
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className={PAGE_CLASSES}>
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems("esims")} label="Account">
          <Link
            className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
            href="/account"
          >
            <ArrowLeft aria-hidden="true" size={14} />
            All eSIMs
          </Link>

          {isNew === "1" ? (
            <>
              <PurchaseConversion transactionId={order.code} />
              <div className="mt-4 flex items-center gap-4 rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 px-5 py-4">
                <CheckCircle2 aria-hidden="true" className="shrink-0 text-brandTeal" size={22} />
                <div>
                  <p className="font-bold text-brandInk">Payment complete — your eSIM is ready</p>
                  <p className="mt-0.5 text-sm text-onSurfaceVariant">
                    Scan the QR code below to install it on your device.
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {isToppedUp === "1" ? (
            <div className="mt-4 flex items-center gap-4 rounded-[16px] border border-brandTeal/40 bg-brandTeal/10 px-5 py-4">
              <CheckCircle2 aria-hidden="true" className="shrink-0 text-brandTeal" size={22} />
              <div>
                <p className="font-bold text-brandInk">Top-up complete</p>
                <p className="mt-0.5 text-sm text-onSurfaceVariant">
                  Your extra data has been added to this eSIM. Usage can take a few minutes to
                  catch up.
                </p>
              </div>
            </div>
          ) : null}

          <h1 className="mt-5 break-words px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
            {order.package_id}
          </h1>
          <p className="mt-1 px-1 text-sm text-onSurfaceVariant">Order {order.code}</p>

          {/* Phones: blue usage card, then install. lg+: usage ring and install side by side. */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="lg:hidden">
                <ActiveEsimCard
                  flagUri={plan.flagUri}
                  meter={meter}
                  statusLine={statusLine}
                  title={plan.title}
                  topUpHref={topUpHref}
                />
              </div>
              <div className="hidden lg:block">
                <UsageRingCard
                  badge={lifecycleBadge(order.lifecycle_status)}
                  details={plan.details}
                  flagUri={plan.flagUri}
                  meter={meter}
                  primaryTopUp
                  statusLine={statusLine}
                  title={plan.title}
                  topUpHref={topUpHref}
                />
              </div>
            </div>

            <section
              className="scroll-mt-6 rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6"
              id="install"
            >
              <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
                <QrCode aria-hidden="true" className="text-brandBlue" size={20} />
                Install your eSIM
              </h2>

              {qr.kind === "image" ? (
                <>
                  <div className="mt-5 flex justify-center rounded-[16px] border border-outline/60 bg-surface p-4">
                    {/* Plain img: the QR may be a data URI, which the image optimiser cannot process. */}
                    <img
                      alt="eSIM installation QR code"
                      className="h-[200px] w-[200px] object-contain"
                      height={200}
                      src={qr.src}
                      width={200}
                    />
                  </div>
                  <p className="mt-4 text-center text-xs text-onSurfaceVariant">
                    On your phone, open Settings → Mobile Data → Add eSIM, then scan this code.
                  </p>
                </>
              ) : qr.kind === "activation" ? (
                <div className="mt-5 space-y-3">
                  <p className="text-sm text-onSurfaceVariant">
                    Install manually with this activation code:
                  </p>
                  <CopyField label="Activation code" value={qr.code} />
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-outline/60 bg-surfaceBright px-5 py-4">
                  <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
                  <div>
                    <p className="text-sm font-bold text-brandInk">Still provisioning</p>
                    <p className="mt-1 text-sm text-onSurfaceVariant">
                      Your eSIM is being prepared. Refresh this page in a moment to get your QR
                      code.
                    </p>
                  </div>
                </div>
              )}

              {sim?.iccid ? (
                <div className="mt-4">
                  <CopyField label="ICCID" value={sim.iccid} />
                </div>
              ) : null}

              {sim?.direct_apple_installation_url ? (
                <LinkButton className="mt-4 w-full" href={sim.direct_apple_installation_url} variant="flat">
                  <Smartphone aria-hidden="true" size={16} />
                  Install on this iPhone
                </LinkButton>
              ) : null}

              {!instructionsAvailable ? (
                <p className="mt-4 flex items-start gap-2 text-xs text-onSurfaceVariant">
                  <Info aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                  Detailed carrier settings will be available once the eSIM is fully provisioned.
                </p>
              ) : null}

              <LinkButton className="mt-4 w-full" href="/support" variant="flat">
                <LifeBuoy aria-hidden="true" size={16} />
                Need help?
              </LinkButton>
            </section>
          </div>

          {topupPackages.length > 0 ? (
            <TopUpPanel orderId={order.id} packages={topupPackages} />
          ) : topups?.message ? (
            <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-outline/60 bg-surface px-5 py-4 shadow-brandCard">
              <Info aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
              <div>
                <p className="text-sm font-bold text-brandInk">Top-up unavailable</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">{topups.message}</p>
              </div>
            </div>
          ) : null}

          {packageHistory.length > 0 ? (
            <section className="mt-4 rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
                <History aria-hidden="true" className="text-brandBlue" size={20} />
                Plan history
              </h2>
              <p className="mt-2 text-sm text-onSurfaceVariant">
                Every plan that has run on this eSIM, including top-ups.
              </p>

              {/* relative: a scroller must be the containing block of what it scrolls (f195). */}
              <div className="relative mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-label-caps uppercase text-onSurfaceVariant">
                      <th className="pb-3 pr-4 font-semibold">Plan</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageHistory.map((entry, index) => (
                      <tr key={entry.id ?? `${entry.package_id ?? "plan"}-${index}`}>
                        <td className="border-t border-outline/60 py-3 pr-4 font-semibold text-brandInk">
                          {entry.package_id ?? "—"}
                        </td>
                        <td className="border-t border-outline/60 py-3 pr-4 text-onSurfaceVariant">
                          {entry.status ?? "—"}
                        </td>
                        <td className="border-t border-outline/60 py-3 text-brandInk">{describeAllowance(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
```

Replace `src/app/account/[orderId]/TopUpPanel.tsx` (`startTopup` is byte-for-byte the old one):

```tsx
"use client";

import { useState } from "react";
import { CreditCard, Loader2, Plus } from "lucide-react";
import { topupPlanRowPlan, type TopupOffer } from "@/lib/accountEsims";
import { planDurationText, planRowTags } from "@/lib/planRow";
import { Button } from "../../components/Button";
import { PlanDataDisc, PlanPrice, PlanTags } from "../../components/PlanRow";

export type TopupPackage = TopupOffer;

/**
 * "Add more data": the backend's top-up offers as PlanRow-style rows (data disc,
 * days, tags, price). Payment is unchanged: a hosted Pokpay redirect (f019).
 * Every Top up is flat; the page's gradient, if any, is the usage card's Top up.
 */
export function TopUpPanel({
  orderId,
  packages
}: {
  orderId: number;
  packages: TopupPackage[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startTopup(packageId: string) {
    setPendingId(packageId);
    setError(null);

    try {
      const response = await fetch("/bff/payments/topups/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, package_id: packageId })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { checkoutUrl?: string };
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(`/account/${orderId}`)}`);
        return;
      }

      if (!response.ok || !payload.data?.checkoutUrl) {
        setPendingId(null);
        setError(payload.error ?? "We could not start the top-up. Please try again.");
        return;
      }

      // Full-page navigation: popups are unreliable in mobile and in-app browsers.
      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setPendingId(null);
      setError("We could not reach the payment service. Please try again.");
    }
  }

  return (
    <section
      className="mt-4 scroll-mt-6 rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6"
      id="top-up"
    >
      <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
        <Plus aria-hidden="true" className="text-brandBlue" size={20} />
        Add more data
      </h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">
        Top up this eSIM without installing a new one.
      </p>

      <ul className="mt-5 space-y-3">
        {packages.map((pkg) => {
          const plan = topupPlanRowPlan(pkg);
          const busy = pendingId === pkg.id;

          return (
            <li
              className="flex flex-wrap items-center gap-3 rounded-[18px] border border-outline/70 bg-surface p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
              key={pkg.id}
            >
              <PlanDataDisc plan={plan} />

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-title-sm font-black text-brandInk sm:text-lg">
                  {planDurationText(plan)}
                </h3>
                <p className="mt-0.5 truncate text-body-sm font-semibold text-onSurface">{plan.title}</p>
                <PlanTags className="mt-1" tags={planRowTags(plan, { position: null })} />
              </div>

              {/* Phones: price and Top up drop to their own line, like PlanRow. */}
              <div className="flex w-full items-center justify-between gap-2 border-t border-outline/50 pt-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <PlanPrice plan={plan} />
                <Button
                  aria-label={`Top up: ${plan.title}`}
                  className="whitespace-nowrap"
                  disabled={pendingId !== null}
                  onClick={() => void startTopup(pkg.id)}
                  type="button"
                  variant="flat"
                >
                  {busy ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  ) : (
                    <CreditCard aria-hidden="true" size={16} />
                  )}
                  Top up
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}

      <p className="mt-4 text-xs text-onSurfaceVariant">
        You will be redirected to Pokpay to complete your payment securely.
      </p>
    </section>
  );
}
```

Replace `src/app/account/[orderId]/CopyField.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the value stays selectable on screen.
    }
  }

  return (
    <div className="rounded-[12px] border border-outline/60 bg-surfaceBright px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">{label}</p>

      <div className="mt-1.5 flex items-center gap-3">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-brandInk">{value}</code>

        <button
          aria-label={`Copy ${label}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-outline bg-surface text-onSurfaceVariant transition hover:border-brandBlue/75 hover:text-brandInk"
          onClick={() => void copy()}
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit` → **90 files, 687 tests**; tsc clean. `topup-flow.test.ts` (intent + return routes) and `account-sections.test.ts`'s detail-page tests (`/packages\``, `packagesResult.ok ? …`, `overflow-x-auto`, `Plan history`) pass unchanged.

- [ ] **Step 5: Commit (controller)**

```bash
git add "src/app/account/[orderId]/page.tsx" "src/app/account/[orderId]/TopUpPanel.tsx" "src/app/account/[orderId]/CopyField.tsx" "src/app/account/[orderId]/order-detail-layout.test.ts"
git commit -m "feat(account): order page with usage ring + install card, PlanRow-style top-ups"
```

---

### Task 7: `/profile`: `?tab=` sections at lg, grouped settings on phones

**Files:**
- Rewrite: `src/app/profile/page.tsx`, `src/app/profile/ProfileTabs.tsx`
- Modify: `src/app/profile/LinkedProviders.tsx`, `src/app/profile/DeleteAccountCard.tsx`, `src/app/components/SignOutButton.tsx`
- Delete: `src/app/components/SettingsSection.tsx`
- Create: `src/app/profile/profile-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/profile/profile-layout.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/profile/page.tsx", "utf8");
const tabs = readFileSync("src/app/profile/ProfileTabs.tsx", "utf8");
const deleteCard = readFileSync("src/app/profile/DeleteAccountCard.tsx", "utf8");
const linked = readFileSync("src/app/profile/LinkedProviders.tsx", "utf8");
const signOut = readFileSync("src/app/components/SignOutButton.tsx", "utf8");

describe("/profile layout (sidebar sections at lg, grouped list below)", () => {
  it("selects the lg section from ?tab= on the server, through the shared sidebar", () => {
    expect(page).toContain("profileTabFromParam((await searchParams).tab)");
    expect(page).toContain("items={accountShellItems(tab)}");
    expect(page).toContain('<SignOutButton appearance="nav" />');
    expect(page).toContain("overflow-x-clip");
  });

  it("renders every group once; profileGroupClass hides the unselected ones at lg only", () => {
    expect(tabs).not.toContain('"use client"');
    expect(tabs).not.toContain("useState");
    for (const id of ["account", "signin", "payments", "support", "legal"]) {
      expect(tabs).toContain(`profileGroupClass("${id}", tab)`);
    }
    expect(tabs.match(/<SignOutButton/g)).toHaveLength(1);
    expect(tabs.match(/<DeleteAccountCard/g)).toHaveLength(1);
    expect(tabs).toContain('<SettingsGroup className="lg:hidden">');
    expect(existsSync("src/app/components/SettingsSection.tsx")).toBe(false);
  });

  it("never paints sign-out or delete as a gradient or solid red", () => {
    expect(signOut).not.toContain("<Button");
    expect(deleteCard).toContain('tone="danger" type="button" variant="flat"');
    expect(deleteCard).not.toContain('variant="primary"');
  });

  it("gives Unlink a 46px flat button inside the card's hairline rows", () => {
    expect(linked).toContain('variant="flat"');
    expect(linked).not.toContain("h-9");
    expect(linked).toContain("divide-y divide-outline/60");
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/profile` → FAIL (`profile-layout.test.ts`). `profile-page.test.ts` still passes.

- [ ] **Step 3: Implement**

Replace `src/app/profile/page.tsx`:

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { profileTabFromParam } from "@/lib/accountNav";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { accountShellItems } from "../account/accountShellItems";
import { AccountShell } from "../components/AccountShell";
import { Navbar } from "../components/Navbar";
import { SignOutButton } from "../components/SignOutButton";
import { SiteFooter } from "../SiteFooter";
import { ProfileTabs } from "./ProfileTabs";
import type { LinkedIdentity } from "./LinkedProviders";

export const metadata: Metadata = createMetadata({
  path: "/profile",
  title: "Profile | eSim2you",
  description: "Manage your eSim2you account, plans, and preferences.",
  indexable: false
});

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  // lg+: the sidebar's ?tab= picks the one section shown. Below lg every section shows.
  const tab = profileTabFromParam((await searchParams).tab);
  const jar = await cookies();
  const email = readEmailFromAccessToken(jar.get(ACCESS_COOKIE)?.value);

  // Supplementary: an email-only account has no identities, and a failure here
  // should not cost the visitor the rest of their profile.
  const identitiesResult = await fetchForPage<{ identities: LinkedIdentity[] }>(
    "/auth/identities",
    "/profile"
  );
  const identities = identitiesResult.ok ? identitiesResult.data.identities : [];

  return (
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell footer={<SignOutButton appearance="nav" />} items={accountShellItems(tab)} label="Account">
          <div className="px-1">
            <h1 className="font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              Profile
            </h1>
            <p className="mt-1 text-sm text-onSurfaceVariant">Your account, plans, and preferences.</p>
          </div>

          <ProfileTabs email={email} identities={identities} tab={tab} />
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
```

Replace `src/app/profile/ProfileTabs.tsx` (no longer a client component):

```tsx
import { FileText, Globe2, LifeBuoy, ShieldCheck, Wallet } from "lucide-react";
import { profileGroupClass, type ProfileTabId } from "@/lib/accountNav";
import { SettingsGroup, SettingsLinkRow } from "../components/SettingsGroup";
import { SignOutButton } from "../components/SignOutButton";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { LinkedProviders, type LinkedIdentity } from "./LinkedProviders";

/**
 * Profile as the app's grouped settings list. One tree for every width:
 * - phones/tablets: every group, stacked; Sign out and Delete account at the end;
 * - lg+: AccountShell's sidebar selects a tab (?tab=), and profileGroupClass hides
 *   the other groups. Sign out moves to the sidebar footer.
 * So each client island (LinkedProviders, SignOutButton, DeleteAccountCard) mounts once.
 */
export function ProfileTabs({
  email,
  identities,
  tab
}: {
  email: string | null;
  identities: LinkedIdentity[];
  tab: ProfileTabId;
}) {
  return (
    <div className="mt-6 space-y-6 lg:mt-8">
      <SettingsGroup className={profileGroupClass("account", tab)} label="Account">
        <div className="px-4 py-3">
          <span className="block text-xs text-onSurfaceVariant">Signed in as</span>
          <span className="mt-0.5 block break-all font-display text-lg font-black text-brandBlue">
            {email ?? "Your eSim2you account"}
          </span>
        </div>
        <SettingsLinkRow
          description="Your eSIMs, QR codes, and remaining data"
          href="/account"
          icon={Globe2}
          label="My eSIMs"
        />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("signin", tab)} label="Sign-in methods">
        <LinkedProviders identities={identities} />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("payments", tab)} label="Payments">
        <SettingsLinkRow
          description="Billing address and how your card is handled"
          href="/profile/billing"
          icon={Wallet}
          label="Payments and billing"
        />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("support", tab)} label="Support">
        <SettingsLinkRow
          description="Installation help and contact options"
          href="/support"
          icon={LifeBuoy}
          label="Help and support"
        />
      </SettingsGroup>

      <SettingsGroup className={profileGroupClass("legal", tab)} label="Legal">
        <SettingsLinkRow href="/terms" icon={FileText} label="Terms of service" />
        <SettingsLinkRow href="/policy" icon={ShieldCheck} label="Privacy policy" />
      </SettingsGroup>

      {/* lg+: Sign out is the sidebar's footer instead. */}
      <SettingsGroup className="lg:hidden">
        <SignOutButton />
      </SettingsGroup>

      <div className={profileGroupClass("account", tab)}>
        <DeleteAccountCard />
      </div>
    </div>
  );
}
```

Replace `src/app/profile/LinkedProviders.tsx` (`unlink` is unchanged):

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../components/Button";

export type LinkedIdentity = {
  provider: "google" | "apple";
  providerEmail: string | null;
  isPrivateRelay: boolean;
  lastLoginAt: string | null;
};

const PROVIDER_LABELS: Record<LinkedIdentity["provider"], string> = {
  google: "Google",
  apple: "Apple"
};

function describeIdentity(identity: LinkedIdentity): string {
  if (identity.isPrivateRelay) return "Hidden email";
  return identity.providerEmail ?? "Linked";
}

export function LinkedProviders({ identities }: { identities: LinkedIdentity[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function unlink(provider: string) {
    setPending(provider);
    setError(null);

    try {
      const response = await fetch(`/bff/auth/identities/${provider}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setPending(null);
        // 409 here means this is the only way into the account.
        setError(payload.error ?? "We could not unlink that provider. Please try again.");
        return;
      }

      setPending(null);
      router.refresh();
    } catch {
      setPending(null);
      setError("We could not reach the server. Please try again.");
    }
  }

  if (identities.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-onSurfaceVariant">
        No sign-in providers linked. You sign in with an emailed code.
      </p>
    );
  }

  return (
    <>
      {/* Inside a SettingsGroup card: rows split by hairlines like the card's own. */}
      <ul className="divide-y divide-outline/60">
        {identities.map((identity) => (
          <li
            className="flex min-h-14 items-center gap-4 px-4 py-3"
            key={identity.provider}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-brandInk">
                {PROVIDER_LABELS[identity.provider]}
              </span>
              <span className="mt-0.5 block truncate text-xs text-onSurfaceVariant">
                {describeIdentity(identity)}
              </span>
            </span>

            <Button
              className="shrink-0"
              disabled={pending !== null}
              onClick={() => void unlink(identity.provider)}
              type="button"
              variant="flat"
            >
              {pending === identity.provider ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={14} />
              ) : null}
              Unlink
            </Button>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="px-4 py-4 text-sm font-semibold text-error">{error}</p>
      ) : null}
    </>
  );
}
```

Replace `src/app/profile/DeleteAccountCard.tsx` (only the trigger and its comment change; the dialog and `deleteAccount` are unchanged):

```tsx
"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/Button";

/**
 * Trigger is a flat danger button at the end of the settings list (never solid
 * red, never the page's gradient), so the destructive action never visually
 * competes with the rest of the page. The confirm flow itself lives in a native
 * <dialog> — deletion is irreversible and the confirm step spells out what
 * is removed and what is kept.
 */
export function DeleteAccountCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setConfirming(false);
    setError(null);
  }

  async function deleteAccount() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/bff/user/account", { method: "DELETE" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setBusy(false);
        setError(
          payload.error ?? "We could not delete your account. Check your connection and try again."
        );
        return;
      }

      // The route handler has cleared the session cookies, so a full navigation
      // starts from a clean, signed-out state.
      window.location.assign("/profile/deleted");
    } catch {
      setBusy(false);
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-1 lg:flex-row lg:items-center lg:gap-4">
        <p className="text-xs text-onSurfaceVariant">Want to leave?</p>
        <Button className="w-full lg:w-auto" onClick={openDialog} tone="danger" type="button" variant="flat">
          Delete account
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        onClose={() => {
          setConfirming(false);
          setError(null);
        }}
        className="m-auto w-[min(420px,calc(100vw-2.5rem))] rounded-[18px] border border-outline p-0 backdrop:bg-brandInk/40"
      >
        <div className="p-6">
          <h3 className="font-display text-lg font-black text-error">Delete account</h3>

          {confirming ? (
            <>
              <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
                This removes your eSim2you account and the account data we store. Purchased
                eSIM service records may be retained where required for payment, fraud
                prevention, tax, or provider obligations. Any eSIM you have already installed
                keeps working until its data runs out.
              </p>

              {error ? (
                <p className="mt-4 text-sm font-semibold text-error">{error}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  disabled={busy}
                  onClick={() => void deleteAccount()}
                  tone="danger"
                  type="button"
                  variant="flat"
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  {busy ? "Deleting…" : "Yes, delete my account"}
                </Button>

                <Button
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  tone="brand"
                  type="button"
                  variant="flat"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
                Permanently remove your account and its data. This cannot be undone.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setConfirming(true)} tone="danger" type="button" variant="flat">
                  Delete account
                </Button>
                <Button onClick={closeDialog} tone="brand" type="button" variant="flat">
                  Never mind
                </Button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
```

Replace `src/app/components/SignOutButton.tsx` (drops the gradient appearance; default is the row):

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SETTINGS_ICON_TILE_CLASSES } from "./SettingsGroup";

/**
 * - "row": a settings row inside a SettingsGroup card (/profile, phones/tablets).
 * - "nav": a sidebar entry, the footer of AccountShell at lg+.
 * Never a gradient: signing out is not the page's primary action.
 */
type Appearance = "nav" | "row";

const CLASSES: Record<Appearance, string> = {
  nav:
    "flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-sm font-semibold text-onSurfaceVariant transition hover:bg-surfaceBright hover:text-brandInk disabled:cursor-not-allowed disabled:opacity-60",
  row:
    "flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-sm font-semibold text-brandInk transition hover:bg-surfaceBright disabled:cursor-not-allowed disabled:opacity-60"
};

export function SignOutButton({ appearance = "row" }: { appearance?: Appearance }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/bff/auth/signout", { method: "POST" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  return (
    <button className={CLASSES[appearance]} disabled={busy} onClick={() => void signOut()} type="button">
      {appearance === "row" ? (
        <span className={SETTINGS_ICON_TILE_CLASSES}>
          <LogOut aria-hidden="true" size={18} />
        </span>
      ) : (
        <LogOut aria-hidden="true" className="shrink-0" size={18} />
      )}
      Sign out
    </button>
  );
}
```

Delete `src/app/components/SettingsSection.tsx` (`grep -rn SettingsSection src` → nothing left).

- [ ] **Step 4: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit` → **91 files, 691 tests**; tsc clean. Every `profile-page.test.ts` assertion still holds (`<SignOutButton />`, `href="/account"`, `/terms`, `/policy`, `/profile/billing`, `<DeleteAccountCard />`, `<LinkedProviders`, `"/auth/identities"`, the identities fallback, display-only email, `Yes, delete my account`, `retained where required`, `window.location.assign("/profile/deleted")`).

- [ ] **Step 5: Commit (controller)**

```bash
git add src/app/profile/page.tsx src/app/profile/ProfileTabs.tsx src/app/profile/LinkedProviders.tsx src/app/profile/DeleteAccountCard.tsx src/app/components/SignOutButton.tsx src/app/profile/profile-layout.test.ts
git rm src/app/components/SettingsSection.tsx
git commit -m "feat(profile): sidebar sections via ?tab= (lg) and the app's grouped settings list (phones)"
```

---

### Task 8: `/profile/billing` and `/profile/deleted`

**Files:**
- Rewrite: `src/app/profile/billing/page.tsx`, `src/app/profile/deleted/page.tsx`
- Modify: `src/app/profile/billing/BillingForm.tsx`
- Create: `src/app/profile/billing-pages.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/profile/billing-pages.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const billing = readFileSync("src/app/profile/billing/page.tsx", "utf8");
const form = readFileSync("src/app/profile/billing/BillingForm.tsx", "utf8");
const goodbye = readFileSync("src/app/profile/deleted/page.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("/profile/billing and /profile/deleted restyle", () => {
  it("billing sits in the account shell with Payments current, tokens only", () => {
    expect(billing).toContain('items={accountShellItems("payments")}');
    expect(billing).toContain("overflow-x-clip");
    expect(billing).not.toContain("amber-");
    expect(billing).not.toMatch(HEX);
    expect(billing).toContain("min-h-11");
  });

  it("billing form uses the shared 48px fields with focus rings", () => {
    expect(form).toContain("className={FIELD_INPUT_CLASSES}");
    expect(form).toContain("className={FIELD_LABEL_CLASSES}");
    expect(form).not.toContain("INPUT_CLASSNAME");
  });

  it("goodbye page is the centred status card, still with no session", () => {
    expect(goodbye).toContain("rounded-[24px]");
    expect(goodbye).not.toContain("AccountShell");
    expect(goodbye).not.toContain("cookies");
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/profile/billing-pages.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Replace `src/app/profile/billing/page.tsx` (same three fetches and copy):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard, Lock, WifiOff } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { backendFetch } from "@/lib/backend";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { accountShellItems } from "../../account/accountShellItems";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { BillingForm } from "./BillingForm";

type EsimCountry = { code: string; name: string; geography: string };

export const metadata: Metadata = createMetadata({
  path: "/profile/billing",
  title: "Payments and billing | eSim2you",
  description: "Manage the billing address used for your eSim2you purchases.",
  indexable: false
});

type SavedCard = {
  brand: string;
  last4: string;
  nameOnCard: string;
  expiry: string;
} | null;

const CARD_CLASSES = "rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6";

export default async function BillingPage() {
  const basePath = "/profile/billing";

  const [addressResult, cardResult, countriesResult] = await Promise.all([
    fetchForPage<{ billingAddress: BillingAddress | null }>("/user/billing-address", basePath),
    fetchForPage<{ card: SavedCard }>("/user/card-details", basePath),
    backendFetch<{ countries: EsimCountry[] }>("/esim/countries")
  ]);

  const card = cardResult.ok ? cardResult.data.card : null;
  // Only real countries have a genuine ISO alpha-2 code — Airalo's
  // regional/global bundle pseudo-entries ("AFR") don't and would fail
  // billing-address validation if offered here.
  const countries = countriesResult.ok
    ? countriesResult.data.countries
        .filter((country) => country.geography === "local")
        .map((country) => ({ code: country.code, name: country.name }))
    : [];

  return (
    // overflow-x-clip, not -hidden, so the AccountShell sidebar sticks (f215).
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell
          footer={<SignOutButton appearance="nav" />}
          items={accountShellItems("payments")}
          label="Account"
        >
          <div className="max-w-[720px]">
            <Link
              className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
              href="/profile"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              Profile
            </Link>

            <h1 className="mt-3 px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
              Payments and billing
            </h1>
            <p className="mt-1 px-1 text-sm text-onSurfaceVariant">
              Where your receipts are addressed, and how your card is handled.
            </p>

            <section className={`mt-6 ${CARD_CLASSES}`}>
              <h2 className="font-display text-xl font-black text-brandInk">Billing address</h2>
              <p className="mt-2 text-sm text-onSurfaceVariant">
                Used on the receipts for your eSIM purchases.
              </p>

              {addressResult.ok ? (
                <BillingForm countries={countries} initialAddress={addressResult.data.billingAddress} />
              ) : (
                <div className="mt-5 flex items-center gap-4 rounded-[14px] border border-error/30 bg-error/5 px-5 py-4">
                  <WifiOff aria-hidden="true" className="shrink-0 text-error" size={20} />
                  <div>
                    <p className="text-sm font-bold text-brandInk">We couldn&apos;t load your address</p>
                    <p className="mt-1 text-sm text-onSurfaceVariant">{addressResult.message}</p>
                  </div>
                </div>
              )}
            </section>

            <section className={`mt-4 ${CARD_CLASSES}`}>
              <h2 className="flex items-center gap-2.5 font-display text-xl font-black text-brandInk">
                <Lock aria-hidden="true" className="text-brandBlue" size={20} />
                Cards are entered at checkout
              </h2>
              <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
                We never store your card. Your card details are entered directly with
                Pokpay at checkout and never touch our servers.
              </p>

              {card ? (
                <div className="mt-5 flex items-center gap-4 rounded-[14px] border border-outline/60 bg-surfaceBright px-5 py-4">
                  <CreditCard aria-hidden="true" className="shrink-0 text-brandBlue" size={20} />
                  <div>
                    <p className="text-sm font-bold text-brandInk">
                      {card.brand} ending {card.last4}
                    </p>
                    <p className="mt-0.5 text-xs text-onSurfaceVariant">
                      {card.nameOnCard} · expires {card.expiry}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
```

In `src/app/profile/billing/BillingForm.tsx` (save logic unchanged; Save address stays the page's one gradient):
- delete the `INPUT_CLASSNAME` constant;
- add `import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";` after the `BILLING_FIELDS` import;
- `className={INPUT_CLASSNAME}` → `className={FIELD_INPUT_CLASSES}` (the select and the input);
- the label's `className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant"` → `className={FIELD_LABEL_CLASSES}`.

Replace `src/app/profile/deleted/page.tsx` (still static, no session):

```tsx
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../../components/Navbar";
import { LinkButton } from "../../components/Button";
import { SiteFooter } from "../../SiteFooter";

export const metadata: Metadata = createMetadata({
  path: "/profile/deleted",
  title: "Account deleted | eSim2you",
  description: "Your eSim2you account has been deleted.",
  indexable: false
});

/** Signed out by design (no session reads): the same centred card as /checkout/failed. */
export default function AccountDeletedPage() {
  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-28">
        <div className="w-full max-w-[560px] rounded-[24px] border border-outline/70 bg-surface p-6 text-center shadow-brandCard sm:p-9">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brandTeal/15 text-brandTeal">
            <CheckCircle2 aria-hidden="true" size={26} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            Goodbye for now
          </h1>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
            Your eSim2you account has been deleted and you have been signed out. Any eSIM
            you already installed keeps working until its data runs out.
          </p>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
            You are welcome back any time — buying a new plan starts a fresh account.
          </p>

          <LinkButton className="mt-7 w-full sm:w-auto" href="/" size="lg">
            Back to eSim2you
            <ArrowRight aria-hidden="true" size={16} />
          </LinkButton>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 4: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit` → **92 files, 694 tests**; tsc clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/app/profile/billing/page.tsx src/app/profile/billing/BillingForm.tsx src/app/profile/deleted/page.tsx src/app/profile/billing-pages.test.ts
git commit -m "feat(profile): billing in the account shell on shared fields; goodbye page as a status card"
```

---

### Task 9: Full verification (mock backend, no real account)

**Files:**
- No source changes. Scratch: `mock-backend.cjs`, `account-matrix.cjs`.

Scratch files go **outside the repo** (e.g. `$SCRATCH/mock-backend.cjs`, `$SCRATCH/account-matrix.cjs`). Nothing here talks to the real backend.

- [ ] **Step 1: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **92 files, 694 tests** (baseline 84 / 651: +3 usage, +10 rules, +3 nav, +5 shell, +5 cards, +6 account, +4 order page, +4 profile, +3 billing); tsc clean.

- [ ] **Step 2: Production build**

Run: `pnpm build` (normal env: static pages still build from the public catalog). Expected (dry run in brackets) — **route types unchanged**:
- `ƒ /account` [3.27 kB / 118 kB → 205 B / 118 kB];
- `ƒ /account/[orderId]` [4.95 kB / 119 kB → 5.13 kB / 123 kB: PlanRow pieces in TopUpPanel];
- `ƒ /profile` [6.01 kB / 120 kB → 1.91 kB / 120 kB: ProfileTabs is a server component now];
- `ƒ /profile/billing` [4.74 kB / 119 kB → 2.08 kB / 120 kB];
- `○ /profile/deleted` [136 B / 118 kB]; `○ /` and `ƒ /checkout` unchanged.

- [ ] **Step 3: Mock backend + server**

Save as `$SCRATCH/mock-backend.cjs`:

```js
// Fake eSim2you backend for layout checks of the signed-in pages (/account, /account/:id,
// /profile, /profile/billing). Answers ONLY read (GET) endpoints with obviously fake data.
// Every non-GET request gets 405 and is logged: nothing here can buy, top up, unlink,
// sign out or delete. It never calls the real backend.
//
// Variant per browser context: the page sends the fake esim_at token as a Bearer header;
// the mock decodes its (unsigned) payload email and picks the fixture:
//   empty@layout-check.test     -> no eSIMs
//   full@layout-check.test      -> 1 active (60% used) + 2 ready + 2 expired (one no longer sold)
//   unlimited@layout-check.test -> active unlimited plan on a discounted package + 1 expired
// Run: PORT=4599 node mock-backend.cjs   (base URL for Next: http://127.0.0.1:4599/api)
const http = require("http");

const PORT = Number(process.env.PORT || 4599);
const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

// Grey placeholder "flag" and "QR": inline data URIs, so the browser never fetches a CDN.
const FLAG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40"><rect width="60" height="40" fill="#C4C7D4"/></svg>');
const QR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="#FFFFFF"/><rect x="20" y="20" width="180" height="180" fill="#C4C7D4"/></svg>');

const pkg = (id, country, countryCode, dataLabel, dataNumericGb, days, price, extra = {}) => ({
  kind: "standard",
  id,
  country,
  countryCode,
  flagUri: FLAG,
  title: `${dataLabel} - ${days} days`,
  dataLabel,
  durationLabel: `${days} days`,
  price: `€${price.toFixed(2)}`,
  priceNumeric: price,
  dataNumericGb,
  durationDays: days,
  filters: ["local"],
  ...extra,
});

const CATALOG = [
  pkg("mock-us-30days-10gb", "United States", "united-states", "10 GB", 10, 30, 19.0),
  pkg("mock-us-7days-1gb", "United States", "united-states", "1 GB", 1, 7, 4.0),
  pkg("mock-uk-15days-5gb", "United Kingdom", "united-kingdom", "5 GB", 5, 15, 9.5),
  pkg("mock-jp-unlimited-10days", "Japan", "japan", "Unlimited", 999, 10, 12.75, { hasDiscount: true, retailPrice: 15 }),
];
// "retired-pkg-30days-5gb" is deliberately NOT in the catalog: its history row must not offer Buy again.

const order = (id, lifecycle_status, package_id, createdDaysAgo, expiresInDays) => ({
  id,
  code: `LC-${id}`,
  status: "completed",
  lifecycle_status,
  package_id,
  created_at: iso(-createdDaysAgo),
  activated_at: lifecycle_status === "ready" ? null : iso(-createdDaysAgo + 1),
  expires_at: expiresInDays == null ? null : iso(expiresInDays),
  deactivated_at: lifecycle_status === "expired" ? iso(expiresInDays ?? -1) : null,
  quantity: 1,
  gift: null,
  sims: [
    {
      iccid: `89000000000000${String(id).padStart(5, "0")}`,
      qrcode: QR,
      direct_apple_installation_url: "https://example.invalid/layout-check-only",
    },
  ],
});

const FIXTURES = {
  empty: { active: null, orders: [] },
  full: {
    active: order(101, "active", "mock-us-30days-10gb", 5, 12),
    orders: [
      order(101, "active", "mock-us-30days-10gb", 5, 12),
      order(102, "ready", "mock-jp-unlimited-10days", 2, null),
      order(103, "ready", "mock-uk-15days-5gb", 3, null),
      order(104, "expired", "mock-us-7days-1gb", 60, -40),
      order(105, "expired", "retired-pkg-30days-5gb", 120, -80),
    ],
  },
  unlimited: {
    active: order(201, "active", "mock-jp-unlimited-10days", 1, 9),
    orders: [order(201, "active", "mock-jp-unlimited-10days", 1, 9), order(202, "expired", "mock-us-7days-1gb", 30, -20)],
  },
};

const USAGE = {
  101: { available: true, data_total_mb: 10240, data_remaining_mb: 4096, data_used_mb: 6144, is_unlimited: false, last_synced_at: iso(0) },
  201: { available: true, data_total_mb: 0, data_remaining_mb: 0, data_used_mb: 0, is_unlimited: true, last_synced_at: iso(0) },
};
const NO_USAGE = { available: false, reason: "no_iccid", message: "Usage is unavailable until the eSIM is provisioned." };

const TOPUPS = {
  available: true,
  packages: [
    { id: "mock-topup-1gb-7days", title: "1 GB - 7 days", priceDisplay: "€4.50", priceNumeric: 4.5, amount: 1024, day: 7, is_unlimited: false },
    { id: "mock-topup-3gb-30days", title: "3 GB - 30 days", priceDisplay: "€9.00", priceNumeric: 9, retailPrice: 11, hasDiscount: true, amount: 3072, day: 30, is_unlimited: false },
    { id: "mock-topup-unl-7days", title: "Unlimited - 7 days", priceDisplay: "€15.00", priceNumeric: 15, amount: 999999, day: 7, is_unlimited: true },
  ],
};

const HISTORY = [
  { id: "h1", package_id: "mock-us-30days-10gb", status: "ACTIVE", remaining: 4096, total: 10240 },
  { id: "h2", package_id: "mock-topup-1gb-7days", status: "FINISHED", remaining: 0, total: 1024 },
];

const IDENTITIES = [
  { provider: "google", providerEmail: "layout-check@example.com", isPrivateRelay: false, lastLoginAt: null },
  { provider: "apple", providerEmail: null, isPrivateRelay: true, lastLoginAt: null },
];

const BILLING = {
  holdersName: "Layout Check",
  email: "layout-check@example.com",
  countryCode: "US",
  administrativeArea: "TS",
  locality: "Testville",
  address1: "1 Test Street",
  postalCode: "00000",
  phoneNumber: "+1 000 000 0000",
};

const COUNTRIES = [
  { code: "US", name: "United States", geography: "local" },
  { code: "GB", name: "United Kingdom", geography: "local" },
  { code: "EU", name: "Europe", geography: "regional" },
];

function variantOf(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
    const name = String(payload.email || "").split("@")[0];
    return FIXTURES[name] ? name : "full";
  } catch {
    return "full";
  }
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
const ok = (res, data) => send(res, 200, { status: "success", data });

http
  .createServer((req, res) => {
    const path = new URL(req.url, "http://mock").pathname.replace(/^\/api/, "");
    if (req.method !== "GET") {
      console.error(`[mock] REFUSED ${req.method} ${path}`);
      return send(res, 405, { status: "error", error: "Layout mock: read-only" });
    }
    const fixture = FIXTURES[variantOf(req)];
    const findOrder = (id) => fixture.orders.find((o) => String(o.id) === id);
    let m;

    if (path === "/packages") return ok(res, { packages: CATALOG });
    if (path === "/testimonials") return ok(res, { testimonials: [] });
    if (path === "/esim/countries") return ok(res, { countries: COUNTRIES });
    if (path === "/orders/active") return ok(res, { order: fixture.active });
    if (path === "/orders") return ok(res, { orders: fixture.orders.map(({ sims, ...rest }) => ({ ...rest, sims: sims.map(({ iccid }) => ({ iccid })) })) });
    if ((m = path.match(/^\/orders\/(\d+)$/))) {
      const found = findOrder(m[1]);
      return found ? ok(res, { order: found }) : send(res, 404, { status: "error", error: "Order not found" });
    }
    if ((m = path.match(/^\/orders\/(\d+)\/usage$/))) return ok(res, { usage: USAGE[m[1]] || NO_USAGE });
    if ((m = path.match(/^\/orders\/(\d+)\/instructions$/))) return ok(res, { instructions: { available: false, reason: "no_iccid" } });
    if ((m = path.match(/^\/orders\/(\d+)\/packages$/))) return ok(res, { packages: HISTORY });
    if ((m = path.match(/^\/orders\/(\d+)\/topups$/))) return ok(res, { topups: TOPUPS });
    if (path === "/auth/identities") return ok(res, { identities: IDENTITIES });
    if (path === "/user/billing-address") return ok(res, { billingAddress: BILLING });
    if (path === "/user/card-details") return ok(res, { card: { brand: "Visa", last4: "0000", nameOnCard: "Layout Check", expiry: "01/30" } });

    console.error(`[mock] 404 GET ${path}`);
    return send(res, 404, { status: "error", error: "Layout mock: unknown path" });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`[mock] backend on http://127.0.0.1:${PORT}/api`));
```

Run, from the repo:

```bash
PORT=4599 node "$SCRATCH/mock-backend.cjs" &
BACKEND_API_URL=http://127.0.0.1:4599/api pnpm exec next start -p 3106 &
```

The mock must log only its start line during the whole run. Any `REFUSED` line means a page made a write: stop and investigate.

- [ ] **Step 4: Browser matrix (headless Playwright, fixtures, no clicks)**

Save as `$SCRATCH/account-matrix.cjs`, set `PW` to the cached Playwright's `playwright-core` (`$(dirname $(ls -d ~/.npm/_npx/*/node_modules/playwright | tail -1))/playwright-core`) and run `BASE=http://localhost:3106 OUT=$SCRATCH/shots node "$SCRATCH/account-matrix.cjs" > matrix.json`:

```js
// Layout matrix for the signed-in account pages, against mock-backend.cjs. NEVER signs in,
// NEVER clicks a button:
// - "signed in" = an UNSIGNED, display-only esim_at cookie. Middleware only checks that a
//   cookie exists; fetchForPage forwards it as a Bearer token to BACKEND_API_URL, which is
//   the mock. The real backend never sees it.
// - every browser-side /bff/** request is aborted (the pages make none on load) and so is
//   anything that isn't the local app (Google, Meta, Pokpay, fonts are self-hosted).
// Run: BASE=http://localhost:3106 OUT=./shots node account-matrix.cjs
const pw = require(process.env.PW || "/Users/elnorrapaj/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3106";
const OUT = process.env.OUT || __dirname + "/shots";
const WIDTHS = (process.env.WIDTHS || "320,375,768,1024,1440").split(",").map(Number);
fs.mkdirSync(OUT, { recursive: true });

function fakeAccessCookie(variant) {
  const payload = Buffer.from(
    JSON.stringify({ email: `${variant}@layout-check.test`, kind: "access", exp: Date.now() + 3600_000 }),
  ).toString("base64url");
  return `dev-auth.${payload}.not-a-signature`;
}

async function context(browser, width, variant) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 768 ? 740 : 900 },
    isMobile: width < 768,
    hasTouch: width < 1024,
    deviceScaleFactor: 1,
  });
  const url = new URL(BASE);
  const cookies = [
    { name: "esim2you_consent", value: encodeURIComponent(JSON.stringify({ version: 1, analytics: false, marketing: false })), domain: url.hostname, path: "/" },
  ];
  if (variant) cookies.push({ name: "esim_at", value: fakeAccessCookie(variant), domain: url.hostname, path: "/" });
  await ctx.addCookies(cookies);
  await ctx.addInitScript(() => {
    window.__cls = 0;
    window.__src = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        window.__src.push(e.value.toFixed(4) + " " + e.sources.map((x) => (x.node ? x.node.nodeName + "." + String(x.node.className || "").slice(0, 40) : "?")).join(" | "));
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await ctx.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== url.origin) return route.abort();
    if (u.pathname.startsWith("/bff/")) return route.abort();
    return route.continue();
  });
  return ctx;
}

const measure = () => {
  const de = document.documentElement;
  const main = document.querySelector("main");
  const header = document.querySelector("main > header");
  const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const inShell = (el) => (header && header.contains(el)) || el.closest("footer") || el.closest("[data-bottom-dock]");
  const r = (el) => (el ? (({ top, height, width }) => ({ top: Math.round(top), h: Math.round(height), w: Math.round(width) }))(el.getBoundingClientRect()) : null);
  const label = (el) => (el.getAttribute("aria-label") || el.textContent || el.id || "").trim().replace(/\s+/g, " ").slice(0, 28);
  const controls = [...main.querySelectorAll("a,button,input,select")].filter((el) => visible(el) && !inShell(el));
  const nav = document.querySelector('nav[aria-label="Account"]');
  const dock = document.querySelector("[data-bottom-dock]");
  return {
    cls: Number((window.__cls || 0).toFixed(4)),
    clsSrc: window.__src,
    noHScroll: de.scrollWidth === de.clientWidth,
    sw: de.scrollWidth,
    gradients: controls.filter((el) => getComputedStyle(el).backgroundImage.includes("gradient")).map(label),
    small: controls
      // A stretched link (::after inset-0) is as tall as its row, not its text.
      .filter((el) => !el.closest("p") && getComputedStyle(el, "::after").position !== "absolute" && el.getBoundingClientRect().height < 44)
      .map((el) => `${el.tagName.toLowerCase()}:${label(el)}=${Math.round(el.getBoundingClientRect().height)}`),
    sidebar: visible(nav) ? { w: r(nav).w, items: [...nav.querySelectorAll("a,button")].map((a) => label(a) + (a.getAttribute("aria-current") ? "*" : "")) } : null,
    dock: visible(dock) ? (dock.querySelector('[aria-current="page"]')?.textContent || "").trim() : null,
    ring: visible(document.querySelector("[data-usage-ring]")) ? document.querySelector("[data-usage-ring]").getAttribute("aria-label") : null,
    blueCard: visible(document.querySelector("[data-active-esim-card]")),
    headings: [...main.querySelectorAll("h1,h2")].filter((h) => visible(h) && !inShell(h)).map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 30)}`),
    buyAgain: [...main.querySelectorAll("a")].filter((a) => visible(a) && /Buy again/.test(a.textContent)).map((a) => a.getAttribute("href")),
    h1: r(document.querySelector("main h1")),
  };
};

const PAGES = [
  ...["empty", "full", "unlimited"].map((variant) => ({ name: `account-${variant}`, path: "/account", variant })),
  { name: "detail-101", path: "/account/101", variant: "full" },
  { name: "detail-201", path: "/account/201", variant: "unlimited" },
  { name: "profile", path: "/profile", variant: "full" },
  { name: "billing", path: "/profile/billing", variant: "full" },
];

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const results = {};

  for (const page of PAGES) {
    for (const w of WIDTHS) {
      const ctx = await context(browser, w, page.variant);
      const tab = await ctx.newPage();
      const response = await tab.goto(BASE + page.path, { waitUntil: "load" });
      await tab.waitForTimeout(1200);
      results[`${page.name}-${w}`] = { status: response.status(), url: tab.url().replace(BASE, ""), ...(await tab.evaluate(measure)) };
      await tab.screenshot({ path: `${OUT}/${page.name}-${w}.png`, fullPage: true });
      if (w >= 1024 && page.name === "account-full") {
        await tab.evaluate(() => window.scrollTo(0, 400));
        await tab.waitForTimeout(200);
        results[`${page.name}-${w}`].sidebarTopAfterScroll = await tab.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Account"] > div');
          return nav ? Math.round(nav.getBoundingClientRect().top) : null;
        });
      }
      await ctx.close();
    }
  }

  // Profile tabs at lg: deep links select the section; phones show every group.
  for (const [tab, w] of [["signin", 1440], ["payments", 1440], ["legal", 1440], ["bogus", 1440], ["signin", 375]]) {
    const ctx = await context(browser, w, "full");
    const p = await ctx.newPage();
    await p.goto(`${BASE}/profile?tab=${tab}`, { waitUntil: "load" });
    await p.waitForTimeout(600);
    results[`profile-tab-${tab}-${w}`] = await p.evaluate(measure);
    await p.screenshot({ path: `${OUT}/profile-tab-${tab}-${w}.png`, fullPage: true });
    await ctx.close();
  }

  // Banners on the order page (consent cookie says marketing=false, so no conversion fires).
  {
    const ctx = await context(browser, 375, "full");
    const p = await ctx.newPage();
    await p.goto(`${BASE}/account/101?new=1&topup=1`, { waitUntil: "load" });
    await p.waitForTimeout(600);
    results["detail-banners-375"] = await p.evaluate(() => ({
      payment: document.body.innerText.includes("Payment complete — your eSIM is ready"),
      topup: document.body.innerText.includes("Top-up complete"),
    }));
    await ctx.close();
  }

  // Goodbye page: no session at all.
  for (const w of [320, 1440]) {
    const ctx = await context(browser, w, null);
    const p = await ctx.newPage();
    await p.goto(`${BASE}/profile/deleted`, { waitUntil: "load" });
    await p.waitForTimeout(600);
    results[`deleted-${w}`] = await p.evaluate(measure);
    await p.screenshot({ path: `${OUT}/deleted-${w}.png`, fullPage: true });
    await ctx.close();
  }

  // Signed out: the guard still bounces to sign-in.
  {
    const ctx = await context(browser, 375, null);
    const p = await ctx.newPage();
    await p.goto(`${BASE}/account`, { waitUntil: "load" });
    results["guard-redirect"] = p.url().replace(BASE, "");
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 1));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Expected (all observed in the dry run):

| Page × width | Check | Expected |
|---|---|---|
| every page, 320/375/768/1024/1440 | horizontal scroll | `scrollWidth === clientWidth` (44/44 entries) |
| every page | CLS (`layout-shift` observer, 1.2s) | 0 |
| every page | controls < 44px in `main` (outside header, dock, footer, inline copy; stretched links measured by their row) | none (baseline had 1–6 per page) |
| `/account` empty | gradient | `Browse plans` |
| `/account` full | gradient | `Install Japan` only (newest ready); UK Install flat; Top up flat |
| `/account` unlimited | gradient | none below lg; `Top up` at lg (nothing to install) |
| `/account` full | Buy again | exactly `["/esim/usa"]` (the retired package has none) |
| `/account` full / unlimited | ring (lg) | `40% of data left: 4 GB of 10 GB` / `Unlimited data`; blue card visible only below lg |
| `/account/101`, `/account/201` | gradient | none below lg; `Top up` at lg |
| `/profile` | gradient | none |
| `/profile/billing` | gradient | `Save address` |
| `/profile/deleted` | gradient, dock | `Back to eSim2you`; no dock |
| lg pages | sidebar | 240px wide; current = My eSIMs (`/account*`), Account (`/profile`, `?tab=bogus`), Sign-in methods / Payments / Legal for those tabs, Payments on `/profile/billing` |
| `/account` full, 1024/1440 | sticky | sidebar card `top` 24 after `scrollTo(0,400)` |
| phones/tablets | dock | My eSIMs on `/account*`, Profile on `/profile*`; no sidebar |
| `/account/101?new=1&topup=1` @375 | banners | both present |
| signed out `/account` | guard | `/signin?next=%2Faccount` |

Look at the screenshots too: `account-full-375` (blue card, row cards), `account-full-1440` (sidebar, ring card, ready tiles, history rows), `detail-101-1024` (ring above text in the half column, install card beside it), `detail-101-375` (blue card, install, top-up rows), `profile-375` (grouped list, Sign out row, flat red-outline Delete account), `profile-tab-signin-1440` (only Sign-in methods).

- [ ] **Step 5: Lighthouse (mobile) on the mock-backed `/account`**

```bash
TOK="dev-auth.$(node -e 'process.stdout.write(Buffer.from(JSON.stringify({email:"full@layout-check.test",kind:"access",exp:Date.now()+3600000})).toString("base64url"))').not-a-signature"
CONS=$(node -e 'process.stdout.write(encodeURIComponent(JSON.stringify({version:1,analytics:false,marketing:false})))')
LH=$(ls -d ~/.npm/_npx/*/node_modules/.bin/lighthouse | head -1)
$LH http://localhost:3106/account --only-categories=accessibility,performance --form-factor=mobile \
  --chrome-flags="--headless=new" --extra-headers="{\"Cookie\":\"esim_at=$TOK; esim2you_consent=$CONS\"}" \
  --output=json --output-path=./lh-account.json --quiet
```

Run 3 times. Expected: final URL `/account` (no sign-in redirect), **a11y 1.0, CLS 0** [dry run: a11y 1 / 1 / 1, CLS 0 / 0 / 0, LCP 2.60–2.62 s, perf 0.97].

- [ ] **Step 6: Stop the servers**

`kill %1 %2` (or `pkill -f mock-backend.cjs; pkill -f "next start -p 3106"`).

- [ ] **Step 7: Manual check (optional, the owner's own account, no purchases)**

Signed in on a phone and a desktop: `/account` shows real data left (not "0 MB of 0 MB"), Top up jumps to the list on the order page, the sidebar tabs on `/profile` and the browser back button, and VoiceOver reads the ring's label. **Don't tap a Top up row, Unlink, or Delete account.**

---

### Task 10: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append), `feedAI/topics/account-flows.json`, `feedAI/topics/account-profile-pages.json`, `feedAI/topics/troubleshooting.json`, `feedAI/brain.json`, `docs/sessions/INDEX.md`, `docs/overview.md`
- Create: `docs/sessions/2026-10-01_web-ui-polish-account.md`

- [ ] **Step 1: Append facts**

Check the next free id with `tail -1 feedAI/facts.jsonl | cut -c1-20`. It was `f219` when this plan was written, so use `f220`–`f224`.

```json
{"id": "f220", "date": "2026-10-01", "kind": "fix", "topic": "account-flows", "fact": "summariseUsage (src/lib/esim-install.ts) read usage.total/remaining, but GET /orders/:id/usage sends the backend's normalizeSimUsage shape {available, data_total_mb, data_remaining_mb, data_used_mb, is_unlimited} (since 2026-06), so /account and /account/[id] showed '0 MB of 0 MB remaining' for every live plan. It now reads data_*_mb first (old names as fallback), reports is_unlimited as UsageSummary.unlimited (backend zeroes both totals then), and clamps usedPercent to 0-100. Days left come from order.expires_at; the usage payload has no expiry.", "source": "src/lib/esim-install.ts; E-SIM backend/src/services/airalo.service.ts normalizeSimUsage"}
{"id": "f221", "date": "2026-10-01", "kind": "decision", "topic": "account-profile-pages", "fact": "Account area (phase 6 of the mobile-parity redesign): lg+ pages sit in AccountShell (src/app/components/AccountShell.tsx: props-only server component, sticky 240px sidebar, footer slot for SignOutButton appearance='nav'; reused by /partners/* in phase 9) with items from src/app/account/accountShellItems.ts (ACCOUNT_NAV in src/lib/accountNav.ts). /account renders ONE tree from ONE fetch: only the active plan has two presentations (ActiveEsimCard blue card lg:hidden, UsageRingCard hidden lg:block); Ready rows become lg tiles via responsive classes; History rows are muted with Buy again = destinationBrowseHref(catalog option) only while the package is still in getPackageOptions(). Every page using the shell keeps <main> overflow-x-clip (f215).", "source": "src/app/account/page.tsx; src/app/components/{AccountShell,UsageRing,ActiveEsimCard}.tsx; src/lib/accountEsims.ts"}
{"id": "f222", "date": "2026-10-01", "kind": "invariant", "topic": "account-profile-pages", "fact": "One gradient per account view, decided by accountPrimaryAction (src/lib/accountEsims.ts): newest ready plan's Install, else the active plan's Top up (lg ring card), else none. The phone blue ActiveEsimCard never carries a gradient (Top up is the white flat LinkButton, Details an outline). Order page: the ring card's Top up (jumps to #top-up) at lg; every TopUpPanel row is flat. /profile has none (SignOutButton is a row/nav entry, Delete account is Button flat tone=danger).", "source": "src/lib/accountEsims.ts; src/app/account/EsimListRow.tsx; src/app/account/[orderId]/TopUpPanel.tsx"}
{"id": "f223", "date": "2026-10-01", "kind": "decision", "topic": "account-profile-pages", "fact": "Profile tabs are server-side ?tab= links (supersedes f106's local useState): /profile, ?tab=signin|payments|support|legal; profileTabFromParam falls back to account. ProfileTabs is a server component that renders every SettingsGroup once; profileGroupClass adds lg:hidden to the unselected groups, so phones/tablets see the app's full grouped list and lg+ sees one pane beside the AccountShell sidebar. The Sign out row is lg:hidden (sidebar footer at lg). /profile/billing marks Payments current. SettingsSection.tsx was replaced by SettingsGroup.tsx (SettingsGroup + SettingsLinkRow, min-h-14 rows).", "source": "src/app/profile/{page,ProfileTabs}.tsx; src/lib/accountNav.ts; src/app/components/SettingsGroup.tsx"}
{"id": "f224", "date": "2026-10-01", "kind": "invariant", "topic": "account-flows", "fact": "Safe layout verification of the server-fetching signed-in pages: run a local read-only node:http mock (405 on every non-GET) and `BACKEND_API_URL=http://127.0.0.1:4599/api next start` (getBackendApiUrl reads process.env at runtime, which beats .env.production). An unsigned display-only esim_at cookie passes the presence-only middleware guard; the mock decodes its email (empty|full|unlimited@layout-check.test) to pick fixtures. Browser requests to anything but the app and every /bff/** call are aborted, and nothing is clicked. Lighthouse gets the cookie via --extra-headers. Scripts: docs/superpowers/plans/2026-10-01-web-ui-polish-phase6-account.md Task 9.", "source": "docs/superpowers/plans/2026-10-01-web-ui-polish-phase6-account.md"}
```

- [ ] **Step 2: Topics, troubleshooting, session, index, brain sync**

- **`feedAI/topics/account-profile-pages.json`:** add `f221`, `f222`, `f223` to `facts`; rewrite `account_page.sections_rendered` and `profile_page.layout_f106` to the new structure (AccountShell, blue card / ring, ?tab=, grouped list); add `"shared_components": "AccountShell, SettingsGroup, UsageRing(Card), ActiveEsimCard, StatusBadge, EsimFlag (src/app/components); EsimListRow (src/app/account)"`.
- **`feedAI/topics/account-flows.json`:** add `f220`, `f224` to `facts`; under `order_lifecycle` add `"usage_shape": "GET /orders/:id/usage = normalizeSimUsage {data_total_mb, data_remaining_mb, is_unlimited}; summariseUsage reads it (f220)"`.
- **`feedAI/topics/troubleshooting.json`:** append symptom → cause → fix: "/account shows '0 MB of 0 MB remaining' for a live plan" → "summariseUsage read total/remaining; backend sends data_total_mb/data_remaining_mb" → "read both shapes, unlimited flag (f220)".
- **Session log:** write `docs/sessions/2026-10-01_web-ui-polish-account.md` in the shape of `2026-10-01_web-ui-polish-checkout.md` (Goal, What changed, Owner decisions, Verification, Commits, Next), with the test counts, build lines, the matrix and Lighthouse numbers, the one changed assertion and the gradient rule.
- **`docs/sessions/INDEX.md`:** append
  `| 2026-10-01 | [Web UI polish: account + profile](./2026-10-01_web-ui-polish-account.md) | Phase 6: AccountShell sidebar dashboard with usage ring (lg), app My eSIMs + grouped settings (phones), order page ring + install card, ?tab= profile sections; fixed "0 MB of 0 MB" usage; 694 tests. |`
- **`feedAI/brain.json`:** set `sync.date` to `2026-10-01`; prepend `f220-f224: account B/A (AccountShell, usage ring, blue card, ?tab= profile), usage-shape fix, mock-backend verification recipe; next plan = homepage bento.` to `sync.note_latest`; in `phase.current` add "account + profile (f220-f224)" to the shipped list and set "Next:" to homepage bento.
- **`docs/overview.md`:** the account/profile section: AccountShell, `?tab=`, the components above.

- [ ] **Step 3: Validate JSON**

Run: `tail -5 feedAI/facts.jsonl | while read -r l; do echo "$l" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' && echo ok; done && node -e 'for (const f of ["feedAI/brain.json","feedAI/topics/account-flows.json","feedAI/topics/account-profile-pages.json","feedAI/topics/troubleshooting.json"]) JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("json ok")'`
Expected: `ok` ×5, `json ok`.

- [ ] **Step 4: Commit (controller)**

```bash
git add feedAI docs/sessions docs/overview.md
git commit -m "docs: feedAI + session log for web UI polish phase 6 (account + profile)"
```

---

## Risks and open questions

1. **Gradient rule.** Install (newest ready plan) beats Top up; the spec mockup showed Top up as the primary. When a ready plan and an active plan both exist, the ring card's Top up is flat. **Confirm, or flip `accountPrimaryAction` (one line + its test).**
2. **The usage fix changes what users see** ("0 MB of 0 MB" → real figures, unlimited reads "Unlimited / No data cap"). It's a bug fix, but it's the only non-layout change. The bar/ring now fills with data **left** (the app's convention), where the old bar filled with data used.
3. **Buy again** only links while the exact package is in the catalog (destination page, not checkout, per the spec). Orders carry no country, so a rotated package loses its Buy again, unlike the app's "same country, other plans" fallback. A backend `country` on orders would fix it (out of scope).
4. **Order page H1 is still the raw `package_id`** ("mock-us-30days-10gb"), now next to a card that names the country. Content unchanged on purpose; swapping the H1 for `describePackage(...).title` is a one-line follow-up. **Owner call.**
5. **Two presentations of the active plan in the DOM** (one `display:none`). Same props, no second fetch, and hidden content leaves the a11y tree. Accepted by the spec's Risks.
6. **`?tab=` on phones is ignored** (every group shows). A shared desktop link like `/profile?tab=legal` opens the full list on a phone; nothing scrolls to Legal. Acceptable for five short groups.
7. **Timezone of "days left" / dates:** computed on the server (`Date.now()`, `toLocaleDateString(undefined, …)`), as `formatDate` already did.
8. **Pre-existing, not touched:** at exactly 1024px the desktop capsule nav wraps "How it Works", "About Us", "Partner with us" and "Get eSIM Now" onto two lines (visible in `detail-101-1024.png`). That's phase 1's navbar; worth a ticket.

## Verification numbers from the dry run

The dry run applied Tasks 1–8 to a scratch copy, built it with the normal env, and ran it with `BACKEND_API_URL` pointing at the mock (headless Chromium via Playwright, Lighthouse 13.5 mobile).

| | 320 | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| no horizontal scroll (all 8 page/fixture rows) | ✓ | ✓ | ✓ | ✓ | ✓ |
| CLS (all rows) | 0 | 0 | 0 | 0 | 0 |
| controls < 44px in `main` | 0 | 0 | 0 | 0 | 0 |
| `/account` full: gradient | Install Japan | Install Japan | Install Japan | Install Japan | Install Japan |
| `/account` unlimited: gradient | – | – | – | Top up | Top up |
| active plan | blue card | blue card | blue card | ring "40% of data left: 4 GB of 10 GB" | ring |
| sidebar (240px) / dock | dock | dock | dock | sidebar, sticky top 24 | sidebar, sticky top 24 |
| `/profile` · billing gradient | – · Save address | – · Save address | – · Save address | – · Save address | – · Save address |

- Stage counts: base 84/651 → T1 84/654 → T2 85/664 → T3 87/672 → T4 88/677 → T5 89/683 → T6 90/687 → T7 91/691 → T8 92/694, `tsc` clean at each stage.
- Other matrix checks: Buy again `["/esim/usa"]` only; `/profile?tab=` signin/payments/legal mark that entry current, `bogus` → Account; both banners on `?new=1&topup=1`; signed-out `/account` → `/signin?next=%2Faccount`; `/profile/deleted` 0 small controls, no dock. The mock logged no `REFUSED` and no unknown path.
- Lighthouse mobile, mock-backed `/account` (`full`): a11y 1 / 1 / 1, CLS 0 / 0 / 0, LCP 2599–2622 ms, performance 0.97.
- Found and fixed during the dry run: the ring card truncated "United States" to "Uni…" in the order page's half column → `flex-wrap` + `min-w-[220px]` (in Task 4's code).

## Next plans (not in this document)

8. Homepage bento blocks
9. Content pages restyle + legal token fix
10. Partner pages on `AccountShell` (`items` for Dashboard / Buy for a customer / Withdraw / Materials / Status; `SettingsGroup` on phones; `WalletPanel` on the blue-card look)
