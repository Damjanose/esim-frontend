# Admin activity + outdated-users list Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Git rule (user, hard):** NO `git commit`, branch, push or PR from a subagent. Leave changes in the working tree; the main session asks the user before committing.

**Goal:** `/xactivityy` shows email + app version per row; `/xversion` lists devices/users with version and lets the admin send an individual "please update" push per row.

**Architecture:** Backend joins `AppVersionCheckIn` (version per deviceId) with `DeviceToken` (deviceId ↔ userEmail) at read time (no migration). Pure join logic lives in a prisma-free util so it's unit-testable. Web adds one BFF pass-through and a self-contained section component; sending reuses the existing `/bff/admin/users/[email]/notify`.

**Tech Stack:** Backend: Express + Prisma + vitest (`npx vitest run <file>`). Web: Next.js 15, React 19, vitest (`pnpm vitest run <file>`), Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-19-admin-activity-version-users-design.md` (this repo).

**Repos:** backend = `/Users/elnorrapaj/Documents/E-SIM/E-SIM backend`, web = `/Users/elnorrapaj/Documents/E-SIM/E-SIM-frontend`. Tasks 1-2 backend, 3-6 web. Backend must be merged/deployed before web works against prod.

---

### Task 0: Branches (main session only)

- [ ] Backend: `cd "/Users/elnorrapaj/Documents/E-SIM/E-SIM backend" && git switch main && git pull && git switch -c feat/admin-version-users` (currently on `feat/event-modal-opt-out`, tree clean).
- [ ] Web: `cd /Users/elnorrapaj/Documents/E-SIM/E-SIM-frontend && git pull && git switch -c feat/admin-version-users` (on `main`; `.env.local` is already modified and the spec/plan are untracked. Leave both alone.)

---

### Task 1: Backend pure join logic (TDD)

**Files:**
- Create: `src/utils/appVersionUsers.ts`
- Test: `src/utils/__tests__/appVersionUsers.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/utils/__tests__/appVersionUsers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildVersionUsers,
  enrichActivityRows,
  isOutdatedVersion,
} from '../appVersionUsers';

const d = (s: string) => new Date(s);

const checkIns = [
  { deviceId: 'd1', platform: 'ios', version: '1.0.0', updatedAt: d('2026-11-01T00:00:00Z') },
  { deviceId: 'd2', platform: 'android', version: '1.2.0', updatedAt: d('2026-11-02T00:00:00Z') },
  { deviceId: 'd3', platform: 'android', version: '1.1.0', updatedAt: d('2026-11-03T00:00:00Z') },
  { deviceId: 'd4', platform: 'ios', version: '1.0.0', updatedAt: d('2026-11-04T00:00:00Z') },
];
const tokens = [
  { deviceId: 'd1', userEmail: 'a@x.com' },
  { deviceId: 'd2', userEmail: 'a@x.com' },
  { deviceId: 'd3', userEmail: null },
];

describe('isOutdatedVersion', () => {
  it('is true only when version < min', () => {
    expect(isOutdatedVersion('1.0.0', '1.1.0')).toBe(true);
    expect(isOutdatedVersion('1.1.0', '1.1.0')).toBe(false);
    expect(isOutdatedVersion('2.0.0', '1.1.0')).toBe(false);
    expect(isOutdatedVersion('0.0.1', '0.0.0')).toBe(false);
  });
});

describe('buildVersionUsers', () => {
  it('links email via DeviceToken and flags outdated', () => {
    const rows = buildVersionUsers(checkIns, tokens, '1.1.0', false);
    const byId = Object.fromEntries(rows.map((r) => [r.deviceId, r]));
    expect(byId.d1.email).toBe('a@x.com');
    expect(byId.d1.isOutdated).toBe(true);
    expect(byId.d3.email).toBeNull();
    expect(byId.d3.isOutdated).toBe(false);
    expect(byId.d4.email).toBeNull();
  });

  it('sorts outdated first, then oldest version, then most recently seen', () => {
    const rows = buildVersionUsers(checkIns, tokens, '1.1.0', false);
    expect(rows.map((r) => r.deviceId)).toEqual(['d4', 'd1', 'd3', 'd2']);
  });

  it('filters to outdated only', () => {
    const rows = buildVersionUsers(checkIns, tokens, '1.1.0', true);
    expect(rows.map((r) => r.deviceId)).toEqual(['d4', 'd1']);
  });
});

describe('enrichActivityRows', () => {
  const rows = [
    { identifier: 'a@x.com', identifierType: 'email' },
    { identifier: 'd3', identifierType: 'device' },
    { identifier: 'd1', identifierType: 'device' },
    { identifier: 'nobody@x.com', identifierType: 'email' },
    { identifier: 'unknown-device', identifierType: 'device' },
  ];

  it('email rows use the lowest version across the user devices', () => {
    const out = enrichActivityRows(rows, checkIns, tokens, '1.1.0');
    expect(out[0]).toMatchObject({ email: 'a@x.com', appVersion: '1.0.0', platform: 'ios', isOutdated: true });
  });

  it('device rows get version from check-in and email from DeviceToken', () => {
    const out = enrichActivityRows(rows, checkIns, tokens, '1.1.0');
    expect(out[1]).toMatchObject({ email: null, appVersion: '1.1.0', platform: 'android', isOutdated: false });
    expect(out[2]).toMatchObject({ email: 'a@x.com', appVersion: '1.0.0', isOutdated: true });
  });

  it('rows with no check-in return null version and not outdated', () => {
    const out = enrichActivityRows(rows, checkIns, tokens, '1.1.0');
    expect(out[3]).toMatchObject({ email: 'nobody@x.com', appVersion: null, platform: null, isOutdated: false });
    expect(out[4]).toMatchObject({ email: null, appVersion: null, platform: null, isOutdated: false });
  });

  it('preserves original row fields', () => {
    const out = enrichActivityRows(rows, checkIns, tokens, '1.1.0');
    expect(out[0].identifier).toBe('a@x.com');
    expect(out[0].identifierType).toBe('email');
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (module not found): `npx vitest run src/utils/__tests__/appVersionUsers.test.ts`

- [ ] **Step 3: Implement** — create `src/utils/appVersionUsers.ts`:

```ts
import { compareVersions } from './semver';

export interface CheckInInput {
  deviceId: string;
  platform: string;
  version: string;
  updatedAt: Date;
}

export interface TokenInput {
  deviceId: string;
  userEmail: string | null;
}

export interface VersionUserRow {
  deviceId: string;
  platform: string;
  version: string;
  email: string | null;
  lastSeen: Date;
  isOutdated: boolean;
}

export interface ActivityVersionInfo {
  email: string | null;
  appVersion: string | null;
  platform: string | null;
  isOutdated: boolean;
}

export function isOutdatedVersion(version: string, minVersion: string): boolean {
  return compareVersions(version, minVersion) < 0;
}

/** One row per check-in device, email attached when a DeviceToken links it. Outdated first, oldest version first. */
export function buildVersionUsers(
  checkIns: CheckInInput[],
  tokens: TokenInput[],
  minVersion: string,
  outdatedOnly: boolean,
): VersionUserRow[] {
  const emailByDevice = new Map<string, string>();
  for (const token of tokens) {
    if (token.userEmail) emailByDevice.set(token.deviceId, token.userEmail);
  }

  const rows: VersionUserRow[] = checkIns.map((checkIn) => ({
    deviceId: checkIn.deviceId,
    platform: checkIn.platform,
    version: checkIn.version,
    email: emailByDevice.get(checkIn.deviceId) ?? null,
    lastSeen: checkIn.updatedAt,
    isOutdated: isOutdatedVersion(checkIn.version, minVersion),
  }));

  const filtered = outdatedOnly ? rows.filter((row) => row.isOutdated) : rows;
  return filtered.sort(
    (a, b) =>
      Number(b.isOutdated) - Number(a.isOutdated) ||
      compareVersions(a.version, b.version) ||
      b.lastSeen.getTime() - a.lastSeen.getTime(),
  );
}

/**
 * Adds email/appVersion/platform/isOutdated to activity rows.
 * identifierType 'device' → check-in by deviceId, email from DeviceToken.
 * identifierType 'email'  → the user's devices via DeviceToken; lowest version wins.
 */
export function enrichActivityRows<T extends { identifier: string; identifierType: string }>(
  rows: T[],
  checkIns: CheckInInput[],
  tokens: TokenInput[],
  minVersion: string,
): Array<T & ActivityVersionInfo> {
  const checkInByDevice = new Map(checkIns.map((checkIn) => [checkIn.deviceId, checkIn]));
  const emailByDevice = new Map<string, string>();
  const devicesByEmail = new Map<string, string[]>();
  for (const token of tokens) {
    if (!token.userEmail) continue;
    emailByDevice.set(token.deviceId, token.userEmail);
    const list = devicesByEmail.get(token.userEmail) ?? [];
    list.push(token.deviceId);
    devicesByEmail.set(token.userEmail, list);
  }

  return rows.map((row) => {
    let email: string | null;
    let candidates: CheckInInput[];

    if (row.identifierType === 'email') {
      email = row.identifier;
      candidates = (devicesByEmail.get(row.identifier) ?? [])
        .map((deviceId) => checkInByDevice.get(deviceId))
        .filter((checkIn): checkIn is CheckInInput => checkIn !== undefined);
    } else {
      email = emailByDevice.get(row.identifier) ?? null;
      const checkIn = checkInByDevice.get(row.identifier);
      candidates = checkIn ? [checkIn] : [];
    }

    if (candidates.length === 0) {
      return { ...row, email, appVersion: null, platform: null, isOutdated: false };
    }

    const lowest = candidates.reduce((a, b) => (compareVersions(b.version, a.version) < 0 ? b : a));
    return {
      ...row,
      email,
      appVersion: lowest.version,
      platform: lowest.platform,
      isOutdated: isOutdatedVersion(lowest.version, minVersion),
    };
  });
}
```

- [ ] **Step 4: Run, expect PASS**: `npx vitest run src/utils/__tests__/appVersionUsers.test.ts`

If a sort/lowest-version assertion fails and you can't explain why after 2 attempts, stop with `BLOCKED:`.

---

### Task 2: Backend DB wrapper + routes

**Files:**
- Create: `src/services/appVersionUsers.service.ts`
- Modify: `src/routes/admin.ts` (imports near line 97; `serializeUserActivity` ~line 1380; `GET /activity` ~line 1400; new route after `GET /app-version/report` ~line 1140)

- [ ] **Step 1: Create `src/services/appVersionUsers.service.ts`:**

```ts
import { prisma } from '../lib/prisma';
import { buildVersionUsers, enrichActivityRows } from '../utils/appVersionUsers';
import { getMinAppVersion } from './appVersion.service';

async function loadJoinInputs() {
  const [checkIns, tokens, min] = await Promise.all([
    prisma.appVersionCheckIn.findMany(),
    prisma.deviceToken.findMany({ select: { deviceId: true, userEmail: true } }),
    getMinAppVersion(),
  ]);
  return { checkIns, tokens, minVersion: min.version };
}

export async function listVersionUsers(outdatedOnly: boolean) {
  const { checkIns, tokens, minVersion } = await loadJoinInputs();
  return buildVersionUsers(checkIns, tokens, minVersion, outdatedOnly);
}

export async function withActivityVersions<T extends { identifier: string; identifierType: string }>(rows: T[]) {
  const { checkIns, tokens, minVersion } = await loadJoinInputs();
  return enrichActivityRows(rows, checkIns, tokens, minVersion);
}
```

- [ ] **Step 2: Edit `src/routes/admin.ts`.**

(a) Add import next to the other service imports (after the `activityNotify.service` import at line ~97):
```ts
import { listVersionUsers, withActivityVersions } from '../services/appVersionUsers.service';
```

(b) Replace the `GET /activity` handler body so it enriches rows:
```ts
adminRouter.get('/activity', requireAdminDashboardAuth, async (_req, res) => {
  try {
    const rows = await withActivityVersions(await listUserActivity());
    res.json(
      successResponse({
        activity: rows.map((row) => ({
          ...serializeUserActivity(row),
          email: row.email,
          appVersion: row.appVersion,
          platform: row.platform,
          isOutdated: row.isOutdated,
        })),
      }),
    );
  } catch (err) {
    logger.error('[admin] activity list failed', err);
    res.status(500).json(errorResponse('Failed to load activity'));
  }
});
```

(c) Add right after the `GET /app-version/report` route:
```ts
adminRouter.get('/app-version/users', requireAdminDashboardAuth, async (req, res) => {
  try {
    const outdatedOnly = req.query.outdated === 'true';
    const rows = await listVersionUsers(outdatedOnly);
    res.json(
      successResponse({
        users: rows.map((row) => ({
          deviceId: row.deviceId,
          platform: row.platform,
          version: row.version,
          email: row.email,
          lastSeen: toIsoDate(row.lastSeen),
          isOutdated: row.isOutdated,
        })),
      }),
    );
  } catch (err) {
    logger.error('[admin] app version users fetch failed', err);
    res.status(500).json(errorResponse('Failed to load app version users'));
  }
});
```

- [ ] **Step 3: Verify:** `npx tsc --noEmit` (expect no errors) and `npx vitest run src` (expect all pass, incl. Task 1 tests).

---

### Task 3: Web BFF proxy + pure helper (TDD)

**Files:**
- Create: `src/app/bff/admin/app-version/users/route.ts`
- Create: `src/lib/version-users.ts`
- Test: `src/lib/version-users.test.ts`

- [ ] **Step 1: Write failing test** `src/lib/version-users.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_UPDATE_BODY,
  DEFAULT_UPDATE_TITLE,
  canNotify,
  filterVersionUsers,
  type VersionUserRow,
} from "./version-users";

const rows: VersionUserRow[] = [
  { deviceId: "d1", platform: "ios", version: "1.0.0", email: "a@x.com", lastSeen: "2026-11-01T00:00:00Z", isOutdated: true },
  { deviceId: "d2", platform: "android", version: "1.0.0", email: null, lastSeen: "2026-11-02T00:00:00Z", isOutdated: true },
  { deviceId: "d3", platform: "android", version: "2.0.0", email: "b@x.com", lastSeen: "2026-11-03T00:00:00Z", isOutdated: false },
];

describe("version-users helpers", () => {
  it("filters outdated only", () => {
    expect(filterVersionUsers(rows, { outdatedOnly: true, platform: "all" }).map((r) => r.deviceId)).toEqual(["d1", "d2"]);
  });

  it("filters by platform", () => {
    expect(filterVersionUsers(rows, { outdatedOnly: false, platform: "android" }).map((r) => r.deviceId)).toEqual(["d2", "d3"]);
  });

  it("combines both filters", () => {
    expect(filterVersionUsers(rows, { outdatedOnly: true, platform: "android" }).map((r) => r.deviceId)).toEqual(["d2"]);
  });

  it("canNotify requires an email", () => {
    expect(canNotify(rows[0])).toBe(true);
    expect(canNotify(rows[1])).toBe(false);
  });

  it("exposes a non-empty default message", () => {
    expect(DEFAULT_UPDATE_TITLE.length).toBeGreaterThan(0);
    expect(DEFAULT_UPDATE_BODY).toContain("update");
  });
});
```

- [ ] **Step 2: Run, expect FAIL:** `pnpm vitest run src/lib/version-users.test.ts`

- [ ] **Step 3: Create `src/lib/version-users.ts`:**

```ts
export type VersionUserRow = {
  deviceId: string;
  platform: string;
  version: string;
  email: string | null;
  lastSeen: string;
  isOutdated: boolean;
};

export type VersionUserFilter = {
  outdatedOnly: boolean;
  platform: "all" | "ios" | "android";
};

export const DEFAULT_UPDATE_TITLE = "Update available";
export const DEFAULT_UPDATE_BODY =
  "A new version of eSIM2you is available. Please update the app to keep everything running smoothly.";

export function filterVersionUsers(rows: VersionUserRow[], filter: VersionUserFilter): VersionUserRow[] {
  return rows.filter(
    (row) =>
      (!filter.outdatedOnly || row.isOutdated) && (filter.platform === "all" || row.platform === filter.platform)
  );
}

export function canNotify(row: VersionUserRow): boolean {
  return Boolean(row.email);
}
```

- [ ] **Step 4: Create BFF `src/app/bff/admin/app-version/users/route.ts`:**

```ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const outdated = new URL(request.url).searchParams.get("outdated") === "true";

  const result = await backendFetch<unknown>(`/admin/app-version/users${outdated ? "?outdated=true" : ""}`, {
    token
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  return NextResponse.json({ status: "success", data: result.data });
}
```

- [ ] **Step 5: Run, expect PASS:** `pnpm vitest run src/lib/version-users.test.ts`

---

### Task 4: `/xactivityy` email + version columns

**Files:**
- Modify: `src/app/xactivityy/page.tsx` (type at lines 9-16; table lines ~254-275)
- Test: `src/app/xactivityy/admin-activity.test.ts` (append one `it`)

- [ ] **Step 1: Failing test** — append inside the existing top-level `describe` in `admin-activity.test.ts` (match its `readFileSync` import style; add the import if missing):

```ts
  it("shows email, app version and outdated badge columns", () => {
    const pageSource = readFileSync("src/app/xactivityy/page.tsx", "utf8");

    expect(pageSource).toContain("appVersion");
    expect(pageSource).toContain("isOutdated");
    expect(pageSource).toContain("Anonymous install");
  });
```
Run `pnpm vitest run src/app/xactivityy/admin-activity.test.ts` → expect FAIL.

- [ ] **Step 2: Extend `ActivityRow` type** (add after `lastNotifiedAt`):
```ts
  email?: string | null;
  appVersion?: string | null;
  platform?: string | null;
  isOutdated?: boolean;
```

- [ ] **Step 3: Table.** In `<thead>` add after the "Identifier" `<th>`:
```tsx
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">App version</th>
```
In the row, add right after the Identifier `<td>…</td>` (the one at line ~264) and before the "Last used" `<td>`:
```tsx
                        <td className="px-5 py-3 text-midnight">
                          {row.email ?? <span className="text-muted">Anonymous install</span>}
                        </td>
                        <td className="px-5 py-3 text-midnight">
                          {row.appVersion ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="font-semibold">
                                {row.appVersion}
                                {row.platform ? <span className="ml-1 text-muted">({row.platform})</span> : null}
                              </span>
                              {row.isOutdated ? (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                                  Outdated
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
```
If the table has an empty-state `colSpan`, bump it by 2.

- [ ] **Step 4: Run test → PASS;** `pnpm exec tsc --noEmit` → no errors.

---

### Task 5: `/xversion` outdated-users section with per-row Notify

**Files:**
- Create: `src/app/xversion/VersionUsersSection.tsx`
- Modify: `src/app/xversion/page.tsx` (import + render below the "Installed versions" `</section>`, before the closing `</div>` of the signed-in block, ~line 368)
- Test: `src/app/xversion/admin-app-version.test.ts` (append)

- [ ] **Step 1: Failing test** — append inside the existing `describe`:

```ts
  it("lists users by version with a per-row notify action and no bulk send", () => {
    expect(existsSync("src/app/bff/admin/app-version/users/route.ts")).toBe(true);
    expect(existsSync("src/app/xversion/VersionUsersSection.tsx")).toBe(true);

    const section = readFileSync("src/app/xversion/VersionUsersSection.tsx", "utf8");
    const pageSource = readFileSync("src/app/xversion/page.tsx", "utf8");

    expect(pageSource).toContain("VersionUsersSection");
    expect(section).toContain("/bff/admin/app-version/users");
    expect(section).toContain("/notify");
    expect(section).toContain("response.status === 401");
    expect(section).not.toMatch(/notify all/i);
  });
```
Run → expect FAIL.

- [ ] **Step 2: Create `src/app/xversion/VersionUsersSection.tsx`:**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import {
  DEFAULT_UPDATE_BODY,
  DEFAULT_UPDATE_TITLE,
  canNotify,
  filterVersionUsers,
  type VersionUserFilter,
  type VersionUserRow
} from "@/lib/version-users";

type UsersPayload = { status?: string; data?: { users?: VersionUserRow[] }; message?: string };
type SendPayload = { status?: string; data?: { sentCount?: number; failureCount?: number }; message?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function VersionUsersSection({
  token,
  handleUnauthorized
}: {
  token: string | null;
  handleUnauthorized: () => void;
}) {
  const [users, setUsers] = useState<VersionUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<VersionUserFilter>({ outdatedOnly: true, platform: "all" });

  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState(DEFAULT_UPDATE_TITLE);
  const [body, setBody] = useState(DEFAULT_UPDATE_BODY);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});

  async function loadUsers() {
    if (!token) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/bff/admin/app-version/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as UsersPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.users) {
        throw new Error(payload.message ?? "Could not load users");
      }

      setUsers(payload.data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const visible = useMemo(() => filterVersionUsers(users, filter), [users, filter]);

  function openForm(row: VersionUserRow) {
    setOpenId(row.deviceId);
    setTitle(DEFAULT_UPDATE_TITLE);
    setBody(DEFAULT_UPDATE_BODY);
  }

  async function send(row: VersionUserRow) {
    if (!token || !row.email) return;
    setIsSending(true);

    try {
      const response = await fetch(`/bff/admin/users/${encodeURIComponent(row.email)}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });
      const payload = (await response.json()) as SendPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not send the notification");
      }

      const sent = payload.data?.sentCount ?? 0;
      const failed = payload.data?.failureCount ?? 0;
      setResults((current) => ({
        ...current,
        [row.deviceId]: sent > 0 ? `Sent to ${sent} device${sent === 1 ? "" : "s"}` : `Not delivered (${failed} failed)`
      }));
      setOpenId(null);
    } catch (err) {
      setResults((current) => ({
        ...current,
        [row.deviceId]: err instanceof Error ? err.message : "Could not send the notification"
      }));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-muted">Users and app versions</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-midnight">
            <input
              checked={filter.outdatedOnly}
              onChange={(event) => setFilter((current) => ({ ...current, outdatedOnly: event.target.checked }))}
              type="checkbox"
            />
            Outdated only
          </label>
          <select
            className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-bold text-midnight"
            onChange={(event) =>
              setFilter((current) => ({ ...current, platform: event.target.value as VersionUserFilter["platform"] }))
            }
            value={filter.platform}
          >
            <option value="all">All platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadUsers()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={12} />
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-xs font-semibold text-red-700">{error}</p> : null}

      {visible.length === 0 ? (
        <p className="mt-4 text-xs font-semibold text-muted">{isLoading ? "Loading..." : "No matching devices"}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wide text-muted">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Last seen</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr key={row.deviceId} className="align-top">
                  <td className="px-3 py-2 font-semibold text-midnight">
                    {row.email ?? <span className="text-muted">Anonymous install</span>}
                  </td>
                  <td className="px-3 py-2 text-muted">{row.platform === "ios" ? "iOS" : "Android"}</td>
                  <td className="px-3 py-2 text-midnight">
                    <span className="font-semibold">{row.version}</span>
                    {row.isOutdated ? (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                        Outdated
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted">{formatDate(row.lastSeen)}</td>
                  <td className="px-3 py-2">
                    {!canNotify(row) ? (
                      <span className="text-[11px] font-semibold text-muted">Not signed in, can&apos;t be notified</span>
                    ) : openId === row.deviceId ? (
                      <div className="grid min-w-64 gap-2">
                        <input
                          className="h-9 rounded-lg border border-line px-2 text-xs text-midnight outline-none focus:border-cyan"
                          onChange={(event) => setTitle(event.target.value)}
                          value={title}
                        />
                        <textarea
                          className="min-h-16 rounded-lg border border-line px-2 py-1 text-xs text-midnight outline-none focus:border-cyan"
                          onChange={(event) => setBody(event.target.value)}
                          value={body}
                        />
                        <div className="flex gap-2">
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-midnight to-ink px-3 text-[11px] font-black text-aqua disabled:opacity-50"
                            disabled={isSending || (!title.trim() && !body.trim())}
                            onClick={() => void send(row)}
                            type="button"
                          >
                            <Send aria-hidden="true" size={12} />
                            {isSending ? "Sending..." : "Send"}
                          </button>
                          <button
                            className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight disabled:opacity-50"
                            disabled={isSending}
                            onClick={() => setOpenId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight transition hover:border-cyan"
                          onClick={() => openForm(row)}
                          type="button"
                        >
                          <Send aria-hidden="true" size={12} />
                          Notify
                        </button>
                        {results[row.deviceId] ? (
                          <span className="text-[11px] font-semibold text-muted">{results[row.deviceId]}</span>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Wire into `page.tsx`.** Add import after `useAdminSession`:
```tsx
import { VersionUsersSection } from "./VersionUsersSection";
```
Insert immediately after the closing `</section>` of the "Installed versions by platform" section (the last `</section>` before the `</div>` that closes the signed-in block):
```tsx
            <VersionUsersSection handleUnauthorized={handleUnauthorized} token={token} />
```
(`token` and `handleUnauthorized` are already destructured from `session` at the top of the component. If `token` is typed `string | null` the prop matches; adjust the prop type if tsc complains.)

- [ ] **Step 4: Verify:** `pnpm vitest run src/app/xversion src/lib/version-users.test.ts` → PASS; `pnpm exec tsc --noEmit` → no errors; `pnpm lint` if configured → no new errors. Do NOT run `next build` (user's dev server may be on :3000).

---

### Task 6: feedAI docs (main session or implementer)

- [ ] Backend `feedAI/facts.jsonl`: append a fact (next free id; check last line) — `GET /admin/app-version/users` + `GET /admin/activity` now join AppVersionCheckIn↔DeviceToken by deviceId at read time (no migration); email rows use the user's lowest device version; `isOutdated = version < AppMinVersion`; logic in `src/utils/appVersionUsers.ts`.
- [ ] Web `feedAI/facts.jsonl` + `feedAI/topics/admin-dashboard-ui.json`: /xactivityy Email + App version columns; /xversion `VersionUsersSection` (filters, per-row Notify via `/bff/admin/users/[email]/notify`, no bulk send by design, anonymous rows can't be notified); helper `src/lib/version-users.ts`; BFF `bff/admin/app-version/users`.
- [ ] Bump `sync` block in each repo's `feedAI/brain.json`; add a `docs/sessions/2026-11-19_admin-version-users.md` + INDEX row in each repo.

---

### Final review (main session)
- [ ] Run backend `npx vitest run src` + `npx tsc --noEmit`; web `pnpm vitest run` + `pnpm exec tsc --noEmit`.
- [ ] Spawn `reviewer` on both diffs; then ask the user before any commit (one commit per task, one branch/PR per repo).
