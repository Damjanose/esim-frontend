# Individual (per-user) admin notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Let an admin search for a user by email in the `xnotificationy` dashboard and send that one user a custom push notification, with a send history log.

**Architecture:** Two-repo change. `E-SIM backend` gets a new `UserNotification` log table plus three services (`userSearch`, `userNotification` send, `userNotificationLog`) and three admin routes, all mirroring the existing `broadcastNotification`/`sendSupportReplyPush`/`notificationMessage` patterns already in the codebase. `E-SIM-frontend` gets three thin BFF proxy routes and a new "Individual" tab on the existing `xnotificationy` admin page, extracted into its own component.

**Tech Stack:** Express + Prisma/PostgreSQL (backend), Next.js 15 App Router + Tailwind (frontend), Vitest (both).

**Spec:** `docs/superpowers/specs/2026-09-10-individual-user-notifications-design.md` (this repo)

**No worktree:** per this project's standing instruction, work directly on each repo's currently-checked-out branch — do not create a new branch or worktree.

**Commit policy:** per this project's standing instruction, **never run `git commit` without asking the user for explicit confirmation first, every time** — even between tasks in this plan. Stage the changes and ask before each commit step below actually runs.

---

## Backend — `E-SIM backend`

### Task 1: `UserNotification` Prisma model + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [x] **Step 1: Add the model**

Insert after the existing `model NotificationMessage { ... }` block (around line 270):

```prisma
model UserNotification {
  id               String   @id @default(cuid())
  userEmail        String?
  user             User?    @relation(fields: [userEmail], references: [email], onDelete: SetNull)
  title            String?
  body             String?
  sentCount        Int
  failureCount     Int
  sentByAdminEmail String?
  createdAt        DateTime @default(now())

  @@index([userEmail])
  @@index([createdAt])
}
```

`userEmail` is `String?` at the schema level (never actually absent in
practice — the send path always populates it) because Prisma only allows
`onDelete: SetNull` on an optional scalar field. This mirrors
`DeviceToken.userEmail`, which is `String?` for the same reason.

Also add the back-relation to `model User` (alongside the existing `supportThreads SupportThread[]` line):

```prisma
  userNotifications UserNotification[]
```

- [x] **Step 2: Generate and run the migration**

Run: `pnpm prisma:migrate --name add_user_notification`
Expected: prompts complete without manual SQL edits needed; a new folder appears under `prisma/migrations/` (e.g. `2026XXXXXXXXXX_add_user_notification`), and `pnpm exec tsc --noEmit` still passes afterward (the Prisma client regenerates automatically as part of `migrate dev`).

- [x] **Step 3: Commit**

Ask the user for explicit confirmation before committing (see Commit policy above). Once confirmed:

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add UserNotification model for individual admin pushes"
```

---

### Task 2: `userNotificationLog.service.ts` — persistence store

**Files:**
- Create: `src/services/userNotificationLog.service.ts`
- Test: `src/services/__tests__/userNotificationLog.service.test.ts`

This mirrors `src/services/notificationMessage.service.ts`'s injectable-store shape exactly, minus update/delete (this is an append-only log).

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createUserNotificationLogStore } from '../userNotificationLog.service';

function dbRow(overrides: Partial<{
  id: string;
  userEmail: string | null;
  title: string | null;
  body: string | null;
  sentCount: number;
  failureCount: number;
  sentByAdminEmail: string | null;
  createdAt: Date;
}> = {}) {
  return {
    id: 'log-1',
    userEmail: 'user@example.com',
    title: 'Heads up',
    body: 'Your order shipped',
    sentCount: 1,
    failureCount: 0,
    sentByAdminEmail: 'admin@example.com',
    createdAt: new Date('2026-09-10T09:00:00.000Z'),
    ...overrides,
  };
}

describe('createUserNotificationLogStore', () => {
  it('creates a log row with the given fields', async () => {
    const client = {
      userNotification: {
        create: vi.fn().mockImplementation(async ({ data }) => dbRow(data)),
        findMany: vi.fn(),
      },
    };
    const store = createUserNotificationLogStore(client);

    const row = await store.createUserNotificationLog({
      userEmail: 'user@example.com',
      title: 'Heads up',
      body: 'Your order shipped',
      sentCount: 1,
      failureCount: 0,
      sentByAdminEmail: 'admin@example.com',
    });

    expect(client.userNotification.create).toHaveBeenCalledWith({
      data: {
        userEmail: 'user@example.com',
        title: 'Heads up',
        body: 'Your order shipped',
        sentCount: 1,
        failureCount: 0,
        sentByAdminEmail: 'admin@example.com',
      },
    });
    expect(row.id).toBe('log-1');
  });

  it('lists log rows newest first, capped at the given limit', async () => {
    const client = {
      userNotification: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([dbRow({ id: 'log-2' }), dbRow({ id: 'log-1' })]),
      },
    };
    const store = createUserNotificationLogStore(client);

    const rows = await store.listUserNotificationLogs(10);

    expect(client.userNotification.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    expect(rows).toHaveLength(2);
  });

  it('defaults the list limit to 50', async () => {
    const client = {
      userNotification: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    };
    const store = createUserNotificationLogStore(client);

    await store.listUserNotificationLogs();

    expect(client.userNotification.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/services/__tests__/userNotificationLog.service.test.ts`
Expected: FAIL — `Cannot find module '../userNotificationLog.service'`

- [x] **Step 3: Write the implementation**

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export interface UserNotificationRecord {
  id: string;
  // Nullable to match the Prisma column: onDelete: SetNull clears this when the
  // linked User account is deleted, same as DeviceTokenRecord.userEmail.
  userEmail: string | null;
  title: string | null;
  body: string | null;
  sentCount: number;
  failureCount: number;
  sentByAdminEmail: string | null;
  createdAt: Date;
}

export interface CreateUserNotificationLogInput {
  userEmail: string;
  title: string | null;
  body: string | null;
  sentCount: number;
  failureCount: number;
  sentByAdminEmail: string | null;
}

type UserNotificationClient = {
  userNotification: {
    create(args: { data: CreateUserNotificationLogInput }): Promise<UserNotificationRecord>;
    findMany(args: { orderBy: { createdAt: 'desc' }; take: number }): Promise<UserNotificationRecord[]>;
  };
};

const DEFAULT_LIST_LIMIT = 50;

export function createUserNotificationLogStore(client: UserNotificationClient) {
  return {
    createUserNotificationLog(input: CreateUserNotificationLogInput): Promise<UserNotificationRecord> {
      return client.userNotification.create({ data: input });
    },

    listUserNotificationLogs(limit: number = DEFAULT_LIST_LIMIT): Promise<UserNotificationRecord[]> {
      return client.userNotification.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    },
  };
}

let prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (prismaClient) return prismaClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for user notification log persistence');
  }

  prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return prismaClient;
}

function getDefaultStore() {
  return createUserNotificationLogStore(getPrismaClient() as unknown as UserNotificationClient);
}

export function createUserNotificationLog(input: CreateUserNotificationLogInput): Promise<UserNotificationRecord> {
  return getDefaultStore().createUserNotificationLog(input);
}

export function listUserNotificationLogs(limit?: number): Promise<UserNotificationRecord[]> {
  return getDefaultStore().listUserNotificationLogs(limit);
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/services/__tests__/userNotificationLog.service.test.ts`
Expected: PASS (3 tests)

- [x] **Step 5: Commit**

Ask for confirmation first, then:
```bash
git add src/services/userNotificationLog.service.ts src/services/__tests__/userNotificationLog.service.test.ts
git commit -m "feat: add UserNotification log store"
```

---

### Task 3: `userSearch.service.ts` — email search

**Files:**
- Create: `src/services/userSearch.service.ts`
- Test: `src/services/__tests__/userSearch.service.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createUserSearchStore, searchUsers } from '../userSearch.service';

describe('createUserSearchStore', () => {
  it('maps device-token count to a boolean and orders by email', async () => {
    const client = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          { email: 'a@example.com', _count: { deviceTokens: 2 } },
          { email: 'b@example.com', _count: { deviceTokens: 0 } },
        ]),
      },
    };
    const store = createUserSearchStore(client);

    const rows = await store.searchUsers('exam');

    expect(client.user.findMany).toHaveBeenCalledWith({
      where: { email: { contains: 'exam', mode: 'insensitive' } },
      orderBy: { email: 'asc' },
      take: 10,
      select: { email: true, _count: { select: { deviceTokens: true } } },
    });
    expect(rows).toEqual([
      { email: 'a@example.com', hasDeviceToken: true },
      { email: 'b@example.com', hasDeviceToken: false },
    ]);
  });
});

describe('searchUsers (exported wrapper)', () => {
  it('returns an empty array without touching the database for a query under 2 characters', async () => {
    const rows = await searchUsers('a');
    expect(rows).toEqual([]);
  });

  it('returns an empty array for an empty or non-string query', async () => {
    expect(await searchUsers('')).toEqual([]);
    expect(await searchUsers(undefined)).toEqual([]);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/services/__tests__/userSearch.service.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the implementation**

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export interface UserSearchResult {
  email: string;
  hasDeviceToken: boolean;
}

type UserSearchClient = {
  user: {
    findMany(args: {
      where: { email: { contains: string; mode: 'insensitive' } };
      orderBy: { email: 'asc' };
      take: number;
      select: { email: true; _count: { select: { deviceTokens: true } } };
    }): Promise<{ email: string; _count: { deviceTokens: number } }[]>;
  };
};

const MAX_RESULTS = 10;
const MIN_QUERY_LENGTH = 2;

export function createUserSearchStore(client: UserSearchClient) {
  return {
    async searchUsers(query: string): Promise<UserSearchResult[]> {
      const rows = await client.user.findMany({
        where: { email: { contains: query, mode: 'insensitive' } },
        orderBy: { email: 'asc' },
        take: MAX_RESULTS,
        select: { email: true, _count: { select: { deviceTokens: true } } },
      });
      return rows.map((row) => ({ email: row.email, hasDeviceToken: row._count.deviceTokens > 0 }));
    },
  };
}

let prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (prismaClient) return prismaClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for user search');
  }

  prismaClient = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return prismaClient;
}

function getDefaultStore() {
  return createUserSearchStore(getPrismaClient() as unknown as UserSearchClient);
}

/**
 * Guards against a full-table scan on every single-keystroke debounce tick from
 * the admin UI — a 1-character query is rejected before it ever reaches Prisma.
 */
export async function searchUsers(query: unknown): Promise<UserSearchResult[]> {
  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (trimmed.length < MIN_QUERY_LENGTH) return [];
  return getDefaultStore().searchUsers(trimmed);
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/services/__tests__/userSearch.service.test.ts`
Expected: PASS (3 tests)

- [x] **Step 5: Commit**

Ask for confirmation first, then:
```bash
git add src/services/userSearch.service.ts src/services/__tests__/userSearch.service.test.ts
git commit -m "feat: add admin user email search"
```

---

### Task 4: `userNotification.service.ts` — send logic

**Files:**
- Create: `src/services/userNotification.service.ts`
- Test: `src/services/__tests__/userNotification.service.test.ts`

This mirrors `src/services/supportReplyPush.service.ts` almost exactly, but writes a `UserNotification` log row instead of being fire-and-forget, and reuses the `'broadcast'` Android channel (per spec, since these are the same "admin-sent alert" style as broadcast pushes, just narrowed to one recipient) rather than a dedicated channel.

- [x] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendUserNotification } from '../userNotification.service';

const {
  listDeviceTokensForUserMock,
  deleteDeviceTokensMock,
  getFirebaseMessagingMock,
  createUserNotificationLogMock,
} = vi.hoisted(() => ({
  listDeviceTokensForUserMock: vi.fn(),
  deleteDeviceTokensMock: vi.fn(),
  getFirebaseMessagingMock: vi.fn(),
  createUserNotificationLogMock: vi.fn(),
}));

vi.mock('../deviceToken.service', () => ({
  listDeviceTokensForUser: listDeviceTokensForUserMock,
  deleteDeviceTokens: deleteDeviceTokensMock,
}));

vi.mock('../notification.service', () => ({
  getFirebaseMessaging: getFirebaseMessagingMock,
}));

vi.mock('../userNotificationLog.service', () => ({
  createUserNotificationLog: createUserNotificationLogMock,
}));

function deviceToken(deviceId: string) {
  return { deviceId, pushToken: `token-${deviceId}`, platform: 'android', userEmail: 'user@example.com', updatedAt: new Date() };
}

describe('sendUserNotification', () => {
  beforeEach(() => {
    listDeviceTokensForUserMock.mockReset();
    deleteDeviceTokensMock.mockReset();
    getFirebaseMessagingMock.mockReset();
    createUserNotificationLogMock.mockReset();
    createUserNotificationLogMock.mockResolvedValue({});
  });

  it('throws when both title and body are empty', async () => {
    await expect(
      sendUserNotification({ userEmail: 'user@example.com', title: null, body: null, sentByAdminEmail: null }),
    ).rejects.toThrow('sendUserNotification requires a title or a body');
  });

  it('logs a zero-count send and skips Firebase when the user has no linked device', async () => {
    listDeviceTokensForUserMock.mockResolvedValue([]);

    const result = await sendUserNotification({
      userEmail: 'user@example.com',
      title: 'Hi',
      body: null,
      sentByAdminEmail: 'admin@example.com',
    });

    expect(result).toEqual({ sentCount: 0, failureCount: 0 });
    expect(getFirebaseMessagingMock).not.toHaveBeenCalled();
    expect(createUserNotificationLogMock).toHaveBeenCalledWith({
      userEmail: 'user@example.com',
      title: 'Hi',
      body: null,
      sentCount: 0,
      failureCount: 0,
      sentByAdminEmail: 'admin@example.com',
    });
  });

  it('logs a zero-count send when Firebase is not configured', async () => {
    listDeviceTokensForUserMock.mockResolvedValue([deviceToken('a')]);
    getFirebaseMessagingMock.mockResolvedValue(null);

    const result = await sendUserNotification({
      userEmail: 'user@example.com',
      title: 'Hi',
      body: null,
      sentByAdminEmail: null,
    });

    expect(result).toEqual({ sentCount: 0, failureCount: 0 });
    expect(createUserNotificationLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ sentCount: 0, failureCount: 0 }),
    );
  });

  it('sends a targeted multicast push on the broadcast channel and logs the result', async () => {
    listDeviceTokensForUserMock.mockResolvedValue([deviceToken('a'), deviceToken('b')]);
    const sendEachForMulticast = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });
    getFirebaseMessagingMock.mockResolvedValue({ sendEachForMulticast });

    const result = await sendUserNotification({
      userEmail: 'User@Example.com',
      title: 'Heads up',
      body: 'Your order shipped',
      sentByAdminEmail: 'admin@example.com',
    });

    expect(listDeviceTokensForUserMock).toHaveBeenCalledWith('user@example.com');
    const call = sendEachForMulticast.mock.calls[0][0];
    expect(call.tokens).toEqual(['token-a', 'token-b']);
    expect(call.notification).toEqual({ title: 'Heads up', body: 'Your order shipped' });
    expect(call.android).toEqual({ priority: 'high', notification: { channelId: 'broadcast', sound: 'default' } });
    expect(call.data).toEqual({ type: 'admin_notification' });
    expect(result).toEqual({ sentCount: 2, failureCount: 0 });
    expect(createUserNotificationLogMock).toHaveBeenCalledWith({
      userEmail: 'user@example.com',
      title: 'Heads up',
      body: 'Your order shipped',
      sentCount: 2,
      failureCount: 0,
      sentByAdminEmail: 'admin@example.com',
    });
  });

  it('prunes device tokens FCM reports as no-longer-registered', async () => {
    listDeviceTokensForUserMock.mockResolvedValue([deviceToken('a'), deviceToken('b')]);
    getFirebaseMessagingMock.mockResolvedValue({
      sendEachForMulticast: vi.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        ],
      }),
    });

    await sendUserNotification({
      userEmail: 'user@example.com',
      title: 'Hi',
      body: null,
      sentByAdminEmail: null,
    });

    expect(deleteDeviceTokensMock).toHaveBeenCalledWith(['b']);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/services/__tests__/userNotification.service.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the implementation**

```ts
import { deleteDeviceTokens, listDeviceTokensForUser } from './deviceToken.service';
import { fcmAlertTransport } from './fcmAlertTransport';
import { getFirebaseMessaging } from './notification.service';
import { createUserNotificationLog } from './userNotificationLog.service';
import { logger } from '../utils/logger';

const UNREGISTERED_ERROR_CODE = 'messaging/registration-token-not-registered';

/**
 * Reuses the broadcast Android channel rather than a dedicated one — an
 * individual admin notification is the same "admin-sent alert" style as a
 * broadcast, just narrowed to one recipient.
 */
const ANDROID_CHANNEL_ID = 'broadcast';

export interface SendUserNotificationInput {
  userEmail: string;
  title: string | null;
  body: string | null;
  sentByAdminEmail: string | null;
}

export interface SendUserNotificationResult {
  sentCount: number;
  failureCount: number;
}

export async function sendUserNotification(input: SendUserNotificationInput): Promise<SendUserNotificationResult> {
  if (!input.title && !input.body) {
    throw new Error('sendUserNotification requires a title or a body');
  }

  const userEmail = input.userEmail.trim().toLowerCase();
  const deviceTokens = await listDeviceTokensForUser(userEmail);

  let sentCount = 0;
  let failureCount = 0;

  if (deviceTokens.length > 0) {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      logger.info('[user-notification] Firebase is not configured; skipping send', { userEmail });
    } else {
      const response = await messaging.sendEachForMulticast({
        tokens: deviceTokens.map((row) => row.pushToken),
        notification: { title: input.title ?? undefined, body: input.body ?? undefined },
        ...fcmAlertTransport(ANDROID_CHANNEL_ID),
        data: { type: 'admin_notification' },
      });

      sentCount = response.successCount;
      failureCount = response.failureCount;

      const deviceIdsToPrune: string[] = [];
      response.responses.forEach((result, index) => {
        if (!result.success && result.error?.code === UNREGISTERED_ERROR_CODE) {
          deviceIdsToPrune.push(deviceTokens[index].deviceId);
        }
      });
      if (deviceIdsToPrune.length > 0) {
        await deleteDeviceTokens(deviceIdsToPrune);
      }
    }
  }

  await createUserNotificationLog({
    userEmail,
    title: input.title,
    body: input.body,
    sentCount,
    failureCount,
    sentByAdminEmail: input.sentByAdminEmail,
  });

  logger.info('[user-notification] sent individual notification', { userEmail, sentCount, failureCount });

  return { sentCount, failureCount };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/services/__tests__/userNotification.service.test.ts`
Expected: PASS (5 tests)

- [x] **Step 5: Commit**

Ask for confirmation first, then:
```bash
git add src/services/userNotification.service.ts src/services/__tests__/userNotification.service.test.ts
git commit -m "feat: add individual per-user push send logic"
```

---

### Task 5: Wire up admin routes

**Files:**
- Modify: `src/routes/admin.ts`
- Modify: `src/routes/__tests__/admin.routes.test.ts`

- [x] **Step 1: Add imports**

Near the existing service imports (around line 62-64, alongside `sendBroadcastNotification` and `pickAndSendRandomNotification`):

```ts
import { searchUsers } from '../services/userSearch.service';
import { sendUserNotification } from '../services/userNotification.service';
import { listUserNotificationLogs, type UserNotificationRecord } from '../services/userNotificationLog.service';
```

- [x] **Step 2: Add a serializer**

Near `serializeNotificationMessage` (around line 645-655):

```ts
function serializeUserNotification(row: UserNotificationRecord) {
  return {
    id: row.id,
    userEmail: row.userEmail,
    title: row.title,
    body: row.body,
    sentCount: row.sentCount,
    failureCount: row.failureCount,
    sentByAdminEmail: row.sentByAdminEmail,
    createdAt: toIsoDate(row.createdAt),
  };
}
```

- [x] **Step 3: Add the routes**

Insert the `GET /notifications/individual` route right after the existing `adminRouter.post('/notifications', ...)` block and before `adminRouter.put('/notifications/:id', ...)` (around line 680) — declaring it ahead of the `:id`-style routes in this group as a defensive habit, even though today's `:id` routes are all non-`GET`:

```ts
adminRouter.get('/notifications/individual', requireAdminDashboardAuth, async (_req, res) => {
  try {
    const notifications = await listUserNotificationLogs();
    res.json(successResponse({ notifications: notifications.map(serializeUserNotification) }));
  } catch (err) {
    logger.error('[admin] individual notification list failed', err);
    res.status(500).json(errorResponse('Failed to load individual notifications'));
  }
});
```

Then, after the existing `adminRouter.post('/notifications/:id/send', ...)` block (around line 720, right before the `serializeUserActivity` function), add the user search and send routes:

```ts
adminRouter.get('/users/search', requireAdminDashboardAuth, async (req, res) => {
  try {
    const users = await searchUsers(req.query.q);
    res.json(successResponse({ users }));
  } catch (err) {
    logger.error('[admin] user search failed', err);
    res.status(500).json(errorResponse('Failed to search users'));
  }
});

adminRouter.post('/users/:email/notify', requireAdminDashboardAuth, async (req, res) => {
  const title = optionalString(req.body?.title) ?? null;
  const body = optionalString(req.body?.body) ?? null;
  if (!title && !body) {
    res.status(400).json(errorResponse('Title or body is required'));
    return;
  }

  try {
    const adminEmail = (req as AdminRequest).admin?.email ?? null;
    const result = await sendUserNotification({
      userEmail: req.params.email,
      title,
      body,
      sentByAdminEmail: adminEmail,
    });
    res.json(successResponse({ sentCount: result.sentCount, failureCount: result.failureCount }));
  } catch (err) {
    logger.error('[admin] user notification send failed', err);
    res.status(500).json(errorResponse('Failed to send notification'));
  }
});
```

- [x] **Step 4: Write the failing route tests**

Add near the top of `admin.routes.test.ts`, alongside the other mock declarations (around line 24-30):

```ts
const searchUsersMock = vi.fn();
const sendUserNotificationMock = vi.fn();
const listUserNotificationLogsMock = vi.fn();
```

Add mock registrations alongside the existing `vi.mock('../../services/notificationMessage.service', ...)` block (around line 82-91):

```ts
vi.mock('../../services/userSearch.service', () => ({
  searchUsers: searchUsersMock,
}));

vi.mock('../../services/userNotification.service', () => ({
  sendUserNotification: sendUserNotificationMock,
}));

vi.mock('../../services/userNotificationLog.service', () => ({
  listUserNotificationLogs: listUserNotificationLogsMock,
}));
```

Add a new `describe` block after the existing `describe('notifications', ...)` block (after its closing `});`, around line 1120):

```ts
describe('individual notifications', () => {
  it('requires an admin token to search, send, or list individual notifications', async () => {
    const search = await request('/api/admin/users/search?q=al');
    const send = await request('/api/admin/users/user@example.com/notify', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hi' }),
    });
    const list = await request('/api/admin/notifications/individual');

    for (const { response } of [search, send, list]) {
      expect(response.status).toBe(401);
    }
  });

  it('searches users by email', async () => {
    searchUsersMock.mockResolvedValue([{ email: 'alice@example.com', hasDeviceToken: true }]);
    const token = await adminToken();

    const { response, payload } = await request('/api/admin/users/search?q=al', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(payload.data.users).toEqual([{ email: 'alice@example.com', hasDeviceToken: true }]);
    expect(searchUsersMock).toHaveBeenCalledWith('al');
  });

  it('rejects sending an individual notification with both title and body empty', async () => {
    const token = await adminToken();

    const { response, payload } = await request('/api/admin/users/user@example.com/notify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: '', body: '' }),
    });

    expect(response.status).toBe(400);
    expect(payload.status).toBe('error');
    expect(sendUserNotificationMock).not.toHaveBeenCalled();
  });

  it('sends an individual notification and records the sending admin', async () => {
    sendUserNotificationMock.mockResolvedValue({ sentCount: 1, failureCount: 0 });
    const token = await adminToken();

    const { response, payload } = await request('/api/admin/users/user@example.com/notify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Hi', body: '' }),
    });

    expect(response.status).toBe(200);
    expect(payload.data).toEqual({ sentCount: 1, failureCount: 0 });
    expect(sendUserNotificationMock).toHaveBeenCalledWith({
      userEmail: 'user@example.com',
      title: 'Hi',
      body: null,
      sentByAdminEmail: expect.any(String),
    });
  });

  it('lists individual notification history without being shadowed by a notifications/:id route', async () => {
    listUserNotificationLogsMock.mockResolvedValue([
      {
        id: 'log-1',
        userEmail: 'user@example.com',
        title: 'Hi',
        body: null,
        sentCount: 1,
        failureCount: 0,
        sentByAdminEmail: 'admin@example.com',
        createdAt: new Date('2026-09-10T09:00:00.000Z'),
      },
    ]);
    const token = await adminToken();

    const { response, payload } = await request('/api/admin/notifications/individual', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(listUserNotificationLogsMock).toHaveBeenCalledTimes(1);
    expect(payload.data.notifications).toHaveLength(1);
    expect(payload.data.notifications[0].userEmail).toBe('user@example.com');
  });
});
```

- [x] **Step 5: Run tests to verify they fail**

Run: `pnpm exec vitest run src/routes/__tests__/admin.routes.test.ts`
Expected: FAIL — routes/services don't exist yet (this step is really a checkpoint; since Step 3's route code and Step 4's tests are written together in this task, run this right after Step 4 and before double-checking Step 3 is actually in place)

- [x] **Step 6: Run tests to verify they pass**

Run: `pnpm exec vitest run src/routes/__tests__/admin.routes.test.ts`
Expected: PASS (all existing tests plus the 5 new ones)

- [x] **Step 7: Full backend verification**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

Run: `pnpm exec vitest run`
Expected: full suite passes

- [x] **Step 8: Commit**

Ask for confirmation first, then:
```bash
git add src/routes/admin.ts src/routes/__tests__/admin.routes.test.ts
git commit -m "feat: add admin routes for individual user notifications"
```

---

### Task 6: Backend docs

Per this repo's `CLAUDE.md` docs workflow and the root `CLAUDE.md`'s "Shipping a new feature" practice:

**Files:**
- Create: `docs/sessions/2026-09-10_individual-user-notifications.md`
- Modify: `docs/sessions/INDEX.md`
- Modify: `feedAI/facts.jsonl`

- [x] **Step 1:** Write the session doc using the template at the top of `docs/sessions/INDEX.md`, summarizing what was built (the 3 new services, the 3 new routes, the new `UserNotification` model) and noting this is a two-repo change (frontend PR/commit reference if available).
- [x] **Step 2:** Append one row to `docs/sessions/INDEX.md`.
- [x] **Step 3:** Append a fact to `feedAI/facts.jsonl` describing the new endpoints and their auth requirement (admin dashboard token, same as every other `/admin/*` route), per `feedAI/MAINTAIN.md`'s format.
- [x] **Step 4: Commit**

Ask for confirmation first, then:
```bash
git add docs/sessions/2026-09-10_individual-user-notifications.md docs/sessions/INDEX.md feedAI/facts.jsonl
git commit -m "docs: record individual user notifications session"
```

---

## Frontend — `E-SIM-frontend`

### Task 7: BFF proxy routes

**Files:**
- Create: `src/app/bff/admin/users/search/route.ts`
- Create: `src/app/bff/admin/users/[email]/notify/route.ts`
- Create: `src/app/bff/admin/notifications/individual/route.ts`

These are thin proxies with no business logic, so this task is written-and-verified together rather than strict TDD (matching how the existing `bff/admin/notifications/*` routes were built) — Task 10 covers their test coverage.

- [x] **Step 1: Create the search proxy**

`src/app/bff/admin/users/search/route.ts`:

```ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const result = await backendFetch<unknown>(`/admin/users/search?q=${encodeURIComponent(q)}`, { token });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
```

- [x] **Step 2: Create the notify proxy**

`src/app/bff/admin/users/[email]/notify/route.ts`:

```ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ email: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const email = (await context.params).email;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }

  const result = await backendFetch<unknown>(`/admin/users/${encodeURIComponent(email)}/notify`, {
    method: "POST",
    body,
    token,
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
```

- [x] **Step 3: Create the history proxy**

`src/app/bff/admin/notifications/individual/route.ts`:

```ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  const result = await backendFetch<unknown>("/admin/notifications/individual", { token });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
```

- [x] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

(No commit here — bundled with Task 10's test commit, since these files have no independent test coverage until then. If you'd rather commit now, ask first as usual.)

---

### Task 8: `IndividualNotificationsTab` component

**Files:**
- Create: `src/app/xnotificationy/IndividualNotificationsTab.tsx`

Extracted as its own component (rather than growing `page.tsx` further) since `page.tsx` is already 450+ lines and this is a self-contained unit: user search, compose form, send history.

- [x] **Step 1: Create the component**

```tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search, Send } from "lucide-react";

type UserSearchResult = { email: string; hasDeviceToken: boolean };

type SearchPayload = { status?: string; data?: { users?: UserSearchResult[] }; message?: string };

type IndividualNotification = {
  id: string;
  // Backend's UserNotification.userEmail is nullable: onDelete: SetNull clears it
  // if the linked account is later deleted, so the history can outlive the user.
  userEmail: string | null;
  title: string | null;
  body: string | null;
  sentCount: number;
  failureCount: number;
  sentByAdminEmail: string | null;
  createdAt: string;
};

type HistoryPayload = { status?: string; data?: { notifications?: IndividualNotification[] }; message?: string };

type SendPayload = { status?: string; data?: { sentCount?: number; failureCount?: number }; message?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function IndividualNotificationsTab({
  token,
  handleUnauthorized,
}: {
  token: string;
  handleUnauthorized: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fieldsInvalid, setFieldsInvalid] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [history, setHistory] = useState<IndividualNotification[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadHistory() {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/bff/admin/notifications/individual", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as HistoryPayload;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load notification history");
      }
      setHistory(payload.data?.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notification history");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`/bff/admin/users/search?q=${encodeURIComponent(trimmed)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const payload = (await response.json()) as SearchPayload;
          if (response.status === 401) {
            handleUnauthorized();
            return;
          }
          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.message ?? "Could not search users");
          }
          setResults(payload.data?.users ?? []);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not search users");
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, token]);

  function pickUser(user: UserSearchResult) {
    setSelected(user);
    setResults([]);
    setQuery("");
    setError("");
    setNotice("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (!title.trim() && !body.trim()) {
      setFieldsInvalid(true);
      setError("Enter a title, a body, or both.");
      return;
    }

    setFieldsInvalid(false);
    setIsSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/users/${encodeURIComponent(selected.email)}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const payload = (await response.json()) as SendPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not send notification");
      }

      const sentCount = payload.data?.sentCount ?? 0;
      const failureCount = payload.data?.failureCount ?? 0;
      setNotice(
        sentCount === 0
          ? "Sent to 0 devices — this user has no linked device."
          : failureCount > 0
            ? `Sent to ${sentCount} device(s), ${failureCount} failed.`
            : `Sent to ${sentCount} device(s).`
      );
      setTitle("");
      setBody("");
      setSelected(null);
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-midnight">Send to a user</h2>

        {!selected ? (
          <div className="relative">
            <label className="block text-sm font-bold text-midnight" htmlFor="user-search">
              Find a user by email
            </label>
            <div className="relative mt-1.5">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                className="h-11 w-full rounded-xl border border-line pl-9 pr-3.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                id="user-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="name@example.com"
                value={query}
              />
            </div>
            {isSearching ? <p className="mt-1.5 text-xs font-semibold text-muted">Searching...</p> : null}
            {results.length > 0 ? (
              <ul className="absolute z-10 mt-1.5 w-full rounded-xl border border-line bg-white shadow-card">
                {results.map((user) => (
                  <li key={user.email}>
                    <button
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-cloud"
                      onClick={() => pickUser(user)}
                      type="button"
                    >
                      <span className="font-semibold text-midnight">{user.email}</span>
                      {!user.hasDeviceToken ? (
                        <span className="text-xs font-bold text-muted">no device linked</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <form onSubmit={send}>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-cloud px-3.5 py-2.5">
              <p className="text-sm font-bold text-midnight">
                Sending to: <span className="font-black">{selected.email}</span>
                {!selected.hasDeviceToken ? (
                  <span className="ml-2 text-xs font-bold text-red-700">no device linked</span>
                ) : null}
              </p>
              <button className="text-xs font-bold text-muted hover:text-midnight" onClick={() => setSelected(null)} type="button">
                Change
              </button>
            </div>

            <label className="block text-sm font-bold text-midnight" htmlFor="individual-title">
              Title
            </label>
            <input
              aria-invalid={fieldsInvalid}
              className={`mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20 ${
                fieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
              }`}
              id="individual-title"
              onChange={(event) => {
                setTitle(event.target.value);
                if (fieldsInvalid) setFieldsInvalid(false);
              }}
              value={title}
            />
            <label className="mt-4 block text-sm font-bold text-midnight" htmlFor="individual-body">
              Body
            </label>
            <textarea
              aria-invalid={fieldsInvalid}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20 ${
                fieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
              }`}
              id="individual-body"
              onChange={(event) => {
                setBody(event.target.value);
                if (fieldsInvalid) setFieldsInvalid(false);
              }}
              rows={2}
              value={body}
            />
            {fieldsInvalid ? <p className="mt-1 text-xs font-bold text-red-700">Enter a title, a body, or both.</p> : null}

            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSending}
              type="submit"
            >
              <Send aria-hidden="true" size={14} />
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>

      {error ? <p className="mb-4 text-sm font-bold text-red-700">{error}</p> : null}
      {notice ? <p className="mb-4 text-sm font-bold text-emerald-700">{notice}</p> : null}

      <div className="rounded-2xl border border-line bg-white shadow-card">
        <h2 className="border-b border-line p-5 text-sm font-black uppercase tracking-wide text-midnight">Send history</h2>
        {history.length === 0 && !isLoadingHistory ? (
          <p className="p-6 text-sm font-semibold text-muted">No individual notifications sent yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((row) => (
              <li className="p-5" key={row.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-midnight">{row.userEmail ?? "(deleted account)"}</p>
                    {row.title ? <p className="mt-1 text-sm font-bold text-midnight">{row.title}</p> : null}
                    {row.body ? <p className="mt-1 text-sm text-muted">{row.body}</p> : null}
                    <p className="mt-2 text-xs font-semibold text-muted">
                      {formatDate(row.createdAt)}
                      {row.sentByAdminEmail ? ` · sent by ${row.sentByAdminEmail}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-muted">
                    {row.sentCount} sent{row.failureCount > 0 ? `, ${row.failureCount} failed` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (this component isn't wired into `page.tsx` yet, but should still typecheck standalone)

---

### Task 9: Wire the tab into `xnotificationy/page.tsx`

**Files:**
- Modify: `src/app/xnotificationy/page.tsx`

- [x] **Step 1: Import the new component and add tab state**

Add to the import block near the top:

```tsx
import { IndividualNotificationsTab } from "./IndividualNotificationsTab";
```

Add alongside the other `useState` declarations near the top of `AdminNotificationsPage` (around line 35):

```tsx
const [tab, setTab] = useState<"broadcast" | "individual">("broadcast");
```

- [x] **Step 2: Add a tab switcher and wrap the existing broadcast UI**

In the JSX, immediately after the `{error ? ... : null}` / `{notice ? ... : null}` block and before the `{!token ? (<AdminLoginCard ... />) : (` line, this doesn't change — the tab switcher only needs to render once signed in. So: inside the `) : (` branch (the signed-in branch), right after the opening `<>`, add:

```tsx
<div className="mb-6 inline-flex rounded-xl border border-line bg-white p-1 shadow-sm">
  <button
    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
      tab === "broadcast" ? "bg-midnight text-aqua" : "text-muted hover:text-midnight"
    }`}
    onClick={() => setTab("broadcast")}
    type="button"
  >
    Broadcast
  </button>
  <button
    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
      tab === "individual" ? "bg-midnight text-aqua" : "text-muted hover:text-midnight"
    }`}
    onClick={() => setTab("individual")}
    type="button"
  >
    Individual
  </button>
</div>

{tab === "individual" ? (
  <IndividualNotificationsTab handleUnauthorized={handleUnauthorized} token={token} />
) : (
  <>
```

Then, at the very end of the existing broadcast JSX (right before the final `</>` that closes the signed-in branch, and before the outer `)}`), close the new conditional:

```tsx
  </>
)}
```

Concretely: everything that currently sits between the signed-in `(` and its matching `)` — the "Add notification" form and the notifications list `<div>` — stays exactly as-is, just now wrapped inside the `tab === "individual" ? (...) : (<>...</>)` conditional instead of being the entire branch body.

- [x] **Step 3: Run the app locally and click through both tabs**

Run: `pnpm dev`, sign into `/xloginy`, open `/xnotificationy`, confirm:
- Broadcast tab still lists/creates/edits/deletes/sends exactly as before.
- Individual tab shows the search box, and typing 2+ characters of a real seeded user's email shows a result.
- Picking a result shows the compose form; sending with both fields empty shows the validation message; sending with a title shows a success notice and a new history row.

- [x] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

- [x] **Step 5: Commit**

Ask for confirmation first, then:
```bash
git add src/app/xnotificationy/page.tsx src/app/xnotificationy/IndividualNotificationsTab.tsx src/app/bff/admin/users src/app/bff/admin/notifications/individual
git commit -m "feat: add individual per-user notification tab to admin dashboard"
```

---

### Task 10: Frontend tests

**Files:**
- Modify: `src/app/xnotificationy/admin-notifications.test.ts`

Matches this repo's existing convention for this page: lightweight source-string assertions (`readFileSync` + `toContain`), not full component rendering.

- [x] **Step 1: Write the failing tests**

Append to `src/app/xnotificationy/admin-notifications.test.ts`:

```ts
it("adds an individual-notifications tab with user search, a send form, and a history list", () => {
  const pageSource = readFileSync("src/app/xnotificationy/page.tsx", "utf8");
  const tabSource = readFileSync("src/app/xnotificationy/IndividualNotificationsTab.tsx", "utf8");

  expect(pageSource).toContain("IndividualNotificationsTab");
  expect(pageSource).toContain('"broadcast"');
  expect(pageSource).toContain('"individual"');
  expect(tabSource).toContain("/bff/admin/users/search");
  expect(tabSource).toContain("/notify");
  expect(tabSource).toContain("/bff/admin/notifications/individual");
  expect(tabSource).toContain("Enter a title, a body, or both.");
});

it("adds local admin API proxy routes for user search, individual send, and individual history", () => {
  expect(existsSync("src/app/bff/admin/users/search/route.ts")).toBe(true);
  expect(existsSync("src/app/bff/admin/users/[email]/notify/route.ts")).toBe(true);
  expect(existsSync("src/app/bff/admin/notifications/individual/route.ts")).toBe(true);

  const searchProxy = readFileSync("src/app/bff/admin/users/search/route.ts", "utf8");
  const notifyProxy = readFileSync("src/app/bff/admin/users/[email]/notify/route.ts", "utf8");
  const historyProxy = readFileSync("src/app/bff/admin/notifications/individual/route.ts", "utf8");

  expect(searchProxy).toContain("/admin/users/search");
  expect(searchProxy).toContain("backendFetch");
  expect(notifyProxy).toContain("/notify");
  expect(notifyProxy).toContain('method: "POST"');
  expect(historyProxy).toContain("/admin/notifications/individual");
});
```

- [x] **Step 2: Run tests to verify they fail (if run before Tasks 7-9) or pass (if run after)**

Run: `pnpm test src/app/xnotificationy/admin-notifications.test.ts`
Expected: PASS, assuming Tasks 7-9 are already done (this task is written last deliberately, as the verification step for the whole frontend slice)

- [x] **Step 3: Full frontend verification**

Run: `pnpm exec tsc --noEmit`
Expected: no errors

Run: `pnpm test`
Expected: full suite passes

Run: `pnpm build`
Expected: production build succeeds

- [x] **Step 4: Commit**

Ask for confirmation first, then:
```bash
git add src/app/xnotificationy/admin-notifications.test.ts
git commit -m "test: cover individual notifications tab and BFF routes"
```

---

### Task 11: Frontend docs

Per this repo's `CLAUDE.md` docs workflow:

**Files:**
- Create: `docs/sessions/2026-09-10_individual-user-notifications.md`
- Modify: `docs/sessions/INDEX.md`
- Modify: `feedAI/facts.jsonl`

- [x] **Step 1:** Write the session doc summarizing the new Individual tab, the 3 new BFF routes, and that this is a two-repo change alongside the `E-SIM backend` session doc from Task 6.
- [x] **Step 2:** Append one row to `docs/sessions/INDEX.md`.
- [x] **Step 3:** Append a fact to `feedAI/facts.jsonl` describing the new tab and its endpoints.
- [x] **Step 4: Commit**

Ask for confirmation first, then:
```bash
git add docs/sessions/2026-09-10_individual-user-notifications.md docs/sessions/INDEX.md feedAI/facts.jsonl
git commit -m "docs: record individual user notifications session"
```
