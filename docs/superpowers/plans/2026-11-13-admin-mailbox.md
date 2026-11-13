# Admin Mailbox (/xmailx) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Repo rule (AGENTS.md):** every commit step means **STOP AND ASK THE USER FIRST**. Never commit unprompted. Each repo gets its own branch + PR. Subagents never commit/push.

**Goal:** From the hidden admin dashboard, switch between company mailboxes (`@uplisoft.com`), read the inbox/folders, and send/reply, with the whole view reloading when the mailbox changes.

**Architecture:** The Express backend owns all mail access. It logs in to IMAP (Dovecot) with a single **master user** (`<mailbox>*<master>`), so any mailbox in an explicit DB allowlist (`MailAccount`) can be opened without per-mailbox passwords. It sanitizes HTML and exposes `/api/admin/mail/*` (full-admin only, support-scope tokens rejected). The Next.js app reaches it only through `/bff/admin/mail/*`; the new hidden page `/xmailx` has a mailbox switcher, folder list, message list, reader and compose/reply. Refresh is polling (30 s); IMAP IDLE → Socket.IO is out of scope.

**Tech Stack:** Express + Prisma/Postgres + vitest, `imapflow`, `mailparser`, `sanitize-html`, existing `nodemailer` transport; Next.js 15 / React 19 / Tailwind + vitest (node-style tests).

**Out of scope (YAGNI):** IDLE push, full-text search, drafts folder sync, per-admin mailboxes, rules/filters.

---

## Task 0: Server prerequisites (MANUAL, user-run on mail.uplisoft.com)

The mail server was unreachable from the dev machine (ports 587/993/143/465 filtered), so this must be verified from the prod/backend host. The box also runs prod + ~20 apps: **back up `/etc/dovecot` first and reload (not restart) Dovecot.**

- [ ] **Step 1: Confirm IMAP is up** from the backend host: `openssl s_client -connect mail.uplisoft.com:993 -quiet` shows `* OK ... Dovecot ready`. If it's only reachable via the SSH tunnel used for SMTP (see `SMTP_TLS_SERVERNAME` in `.env.example`), note the tunnel host/port; backend gets `MAIL_IMAP_HOST/PORT` + `MAIL_IMAP_TLS_SERVERNAME` for it.
- [ ] **Step 2: Create the master user** (Dovecot 2.x):
  ```
  # /etc/dovecot/conf.d/auth-master.inc
  passdb {
    driver = passwd-file
    args = /etc/dovecot/master-users
    master = yes
    result_success = continue
  }
  ```
  ```
  # generate the entry (long random password):
  doveadm pw -s SHA512-CRYPT      # then put:  esim-admin:{SHA512-CRYPT}<hash>  in /etc/dovecot/master-users
  chmod 600 /etc/dovecot/master-users && chown root:dovecot /etc/dovecot/master-users
  ```
  Add `!include auth-master.inc` to `10-auth.conf` (before the normal passdb), `doveconf -n` to validate, then `systemctl reload dovecot`.
- [ ] **Step 3: Verify** from the backend host: `IMAP login "support@uplisoft.com*esim-admin" "<master pw>"` succeeds and `SELECT INBOX` works. (Default master separator is `*`; if the server uses another, set `MAIL_IMAP_MASTER_SEP`.)
- [ ] **Step 4: Verify sending-as-mailbox.** Send a test from `esim2you` SMTP creds with `From: support@uplisoft.com`. If Postfix rejects (sender-login mismatch), either relax `smtpd_sender_login_maps` for the `esim2you` account or send with the master credentials (`<mailbox>*esim-admin`). Record the outcome; Task 3 depends on it.
- [ ] **Step 5:** Give me the list of mailbox addresses to seed, the master user name, and the Step 4 result. **No later task starts before Steps 1–3 pass.**

---

# Part 1: Backend (`E-SIM backend`, branch `feat/admin-mailbox`)

Branch first: `cd "E-SIM backend" && git switch main && git pull && git switch -c feat/admin-mailbox`. Never commit before asking the user.

### File map
- Modify `prisma/schema.prisma` (+ new migration): `MailAccount`
- Modify `src/config/index.ts`, `.env.example`, `.env`: `MAIL_IMAP_*`
- Create `src/mail/mailAddress.ts`: allowlist/address validation helpers
- Create `src/mail/mailImap.ts`: `withMailbox()` connection helper (the only file that touches `imapflow`)
- Create `src/mail/mail.service.ts`: folders, list, get, flags, move/delete
- Create `src/mail/mailSanitize.ts`: HTML → safe HTML
- Create `src/mail/mailSend.service.ts`: send/reply + Sent append
- Create `src/routes/adminMail.ts`; modify `src/routes/index.ts`
- Tests: `src/mail/__tests__/*.test.ts`, `src/routes/__tests__/adminMail.routes.test.ts`

### Task 1: MailAccount model + config

**Files:** `prisma/schema.prisma`, `src/config/index.ts`, `.env.example`, `.env`, test `src/config/__tests__/index.test.ts`

- [ ] **Step 1:** Add to `schema.prisma`:
  ```prisma
  model MailAccount {
    id        String   @id @default(cuid())
    address   String   @unique   // normalized lowercase, e.g. support@uplisoft.com
    label     String
    active    Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
- [ ] **Step 2:** `pnpm prisma:migrate --name add_mail_account` → migration folder created; `pnpm prisma:generate`.
- [ ] **Step 3:** Failing test in `src/config/__tests__/index.test.ts` (follow the file's existing pattern for env-driven config): with `MAIL_IMAP_HOST/MASTER_USER/MASTER_PASS` set, `config.mail.imap` exposes `{host, port: 993, masterUser, masterPass, masterSep: '*', tlsServername}`; unset → `config.mail.imap.enabled === false`.
- [ ] **Step 4:** Implement `config.mail.imap` in `src/config/index.ts` next to the `smtp*` fields (defaults: port 993, sep `*`). Add `MAIL_IMAP_HOST=mail.uplisoft.com`, `MAIL_IMAP_PORT=993`, `MAIL_IMAP_TLS_SERVERNAME=`, `MAIL_IMAP_MASTER_USER=`, `MAIL_IMAP_MASTER_PASS=`, `MAIL_IMAP_MASTER_SEP=*` to `.env.example` (blank secrets) and real values to `.env` (secrets are intentionally tracked).
- [ ] **Step 5:** `pnpm test` → config tests pass. **Ask user before committing** (`feat: add MailAccount model and IMAP master config`).

### Task 2: Address helpers + allowlist

**Files:** Create `src/mail/mailAddress.ts`, test `src/mail/__tests__/mailAddress.test.ts`

- [ ] **Step 1: Failing test**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { normalizeMailAddress, imapLoginFor } from '../mailAddress';
  describe('mailAddress', () => {
    it('normalizes and rejects non-company/odd addresses', () => {
      expect(normalizeMailAddress(' Support@Uplisoft.com ')).toBe('support@uplisoft.com');
      expect(normalizeMailAddress('a@b.com*x')).toBeNull();      // master separator injection
      expect(normalizeMailAddress('x@evil.com')).toBeNull();     // domain not allowed
      expect(normalizeMailAddress('no-at')).toBeNull();
    });
    it('builds master login', () => {
      expect(imapLoginFor('support@uplisoft.com', 'esim-admin', '*')).toBe('support@uplisoft.com*esim-admin');
    });
  });
  ```
- [ ] **Step 2:** `pnpm vitest run src/mail/__tests__/mailAddress.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement**
  ```ts
  const ALLOWED_DOMAIN = 'uplisoft.com';
  const RE = /^[a-z0-9._+-]+@[a-z0-9.-]+$/;
  export function normalizeMailAddress(input: string): string | null {
    const v = input.trim().toLowerCase();
    if (!RE.test(v) || v.endsWith(`@${ALLOWED_DOMAIN}`) === false) return null;
    return v;
  }
  export const imapLoginFor = (address: string, masterUser: string, sep: string) =>
    `${address}${sep}${masterUser}`;
  ```
  (`*` is not in the regex, so separator injection is rejected.)
- [ ] **Step 4:** Test passes. Ask before commit.

### Task 3: IMAP service (folders, list, get, flags, move/delete)

**Files:** Create `src/mail/mailImap.ts`, `src/mail/mailSanitize.ts`, `src/mail/mail.service.ts`; tests `src/mail/__tests__/mail.service.test.ts`, `mailSanitize.test.ts`. Deps: `pnpm add imapflow mailparser sanitize-html` and `pnpm add -D @types/mailparser @types/sanitize-html`.

- [ ] **Step 1: Sanitizer test** (`mailSanitize.test.ts`): `<script>`, `on*=` attributes, `javascript:` hrefs, `<iframe>`, `<form>` stripped; remote `<img src="https://…">` rewritten to `data-remote-src` (blocked by default, tracking-pixel safe); `<a>` gets `target="_blank" rel="noopener noreferrer"`; `cid:` images kept as-is. Run → FAIL.
- [ ] **Step 2: Implement `sanitizeMailHtml(html)`** with `sanitize-html` (allowlist of basic tags/attrs, `transformTags` for `a` and `img`, `allowedSchemes: ['http','https','mailto','cid']`). Test passes.
- [ ] **Step 3: `mailImap.ts`** (the only place that imports `imapflow`):
  ```ts
  import { ImapFlow } from 'imapflow';
  import { config } from '../config';
  import { imapLoginFor } from './mailAddress';
  export async function withMailbox<T>(address: string, fn: (c: ImapFlow) => Promise<T>): Promise<T> {
    const { host, port, masterUser, masterPass, masterSep, tlsServername } = config.mail.imap;
    const client = new ImapFlow({
      host, port, secure: true, logger: false,
      tls: tlsServername ? { servername: tlsServername } : undefined,
      auth: { user: imapLoginFor(address, masterUser, masterSep), pass: masterPass },
    });
    await client.connect();
    try { return await fn(client); } finally { await client.logout().catch(() => {}); }
  }
  ```
- [ ] **Step 4: Failing service tests** (`mail.service.test.ts`, `vi.mock('../mailImap')` with a fake client exposing `list()`, `getMailboxLock()`, `fetch()`, `fetchOne()`, `messageFlagsAdd()`, `messageMove()`, `messageDelete()`): assert
  - `listFolders(addr)` → `[{path,name,specialUse,unread}]`, INBOX first;
  - `listMessages(addr,{folder,page,pageSize:30})` → newest-first `{items:[{uid,from,subject,date,seen,hasAttachments,preview}],total}`;
  - `getMessage(addr,folder,uid)` → parsed via `mailparser`, `html` sanitized, `attachments:[{id,filename,size,contentType}]` (no bytes), and marks `\Seen`;
  - `moveMessage` / `deleteMessage` (delete = move to Trash, hard-delete only if already in Trash);
  - folder paths are validated against the real folder list (reject `../` / unknown).
  Run → FAIL.
- [ ] **Step 5: Implement `mail.service.ts`** to satisfy them (always `getMailboxLock(folder)` + `lock.release()` in `finally`; `pageSize` capped at 100; preview = first 140 chars of text).
- [ ] **Step 6:** `pnpm vitest run src/mail` → PASS; `pnpm build` (tsc) clean. Ask before commit.

### Task 4: Send / reply service

**Files:** Create `src/mail/mailSend.service.ts`, test `src/mail/__tests__/mailSend.service.test.ts`; reuse `createEmailTransporter` from `src/utils/emailTransport`.

- [ ] **Step 1: Failing test** (mock transporter + `mailImap`): `sendMail(addr, {to,cc,subject,text,html?,inReplyTo?,references?,attachments?})` sets `From: "<label>" <addr>`, passes `In-Reply-To`/`References` when replying, caps attachments (≤ 10 files, ≤ 20 MB total), rejects empty `to`/body, and **appends the raw message to the `\Sent` folder** via IMAP `append` (build raw with `nodemailer`'s `MailComposer`).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. Auth mode follows Task 0 Step 4 (either existing SMTP creds with a mailbox `From`, or master-user SMTP login); keep that in one function `transportFor(address)`.
- [ ] **Step 4:** Tests pass. Ask before commit.

### Task 5: Admin routes (full-admin only)

**Files:** Create `src/routes/adminMail.ts`, modify `src/routes/index.ts` (`router.use('/admin', adminMailRouter)` next to line 64), test `src/routes/__tests__/adminMail.routes.test.ts` (copy the harness from `admin.routes.test.ts`).

Routes (all under `/api/admin/mail`):
`GET /accounts` · `POST /accounts` · `PATCH /accounts/:id` (label/active) · `GET /:account/folders` · `GET /:account/messages?folder=&page=` · `GET /:account/messages/:uid?folder=` · `POST /:account/messages/:uid/move` · `DELETE /:account/messages/:uid?folder=` · `POST /:account/send` (multer memory, field limits) · `GET /:account/messages/:uid/attachments/:partId?folder=` (stream).

- [ ] **Step 1: Failing tests:** no token → 401; **support-scope token → 403/401** (`verifyAdminDashboardToken(token, now)` **without** `allowSupportScope`, unlike `adminSupport.ts`); unknown or inactive `:account` (not in `MailAccount`) → 404 *before* any IMAP call (assert the mock is never called); invalid address → 400; happy-path list returns service output; `POST /accounts` normalizes and rejects other domains/duplicates.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement with a local `requireFullAdmin` middleware + `resolveAccount` param middleware (`prisma.mailAccount.findFirst({ where:{address, active:true} })`); map service errors to 400/404/502 (IMAP unreachable → 502 `MAIL_UNAVAILABLE`); never log message bodies or the master password.
- [ ] **Step 4:** `pnpm test` all green, `pnpm build` clean.
- [ ] **Step 5: Seed** the allowlist addresses from Task 0 Step 5 via a one-off script `src/scripts/seedMailAccounts.ts` (idempotent upsert), run once. Ask before commit; then (after user confirms) push + `gh pr create`.

---

# Part 2: Web (`E-SIM-frontend`, branch `feat/admin-mailbox`)

Branch: `git switch main && git pull && git switch -c feat/admin-mailbox`. Backend PR must be deployed (or run locally with `BACKEND_API_URL` set, per invariant f004) before the end-to-end check.

### File map
- Create `src/lib/mail-types.ts`: shared types (`MailAccount`, `MailFolder`, `MailMessageSummary`, `MailMessage`)
- Create BFF routes under `src/app/bff/admin/mail/**` (thin `proxyAdminJson` wrappers; multipart send uses `backendFetchFormData` as `support` attachments do)
- Create `src/app/xmailx/{layout.tsx,page.tsx,MailInbox.tsx,MailReader.tsx,MailCompose.tsx,mail-state.ts,admin-mail.test.ts}`
- Modify `src/app/AdminNav.tsx` (add entry)

### Task 6: Types + BFF routes

- [ ] **Step 1: Failing test** `src/app/xmailx/admin-mail.test.ts` (same style as `xsupport/admin-support.test.ts`): each BFF route file exists, lives under `src/app/bff/` (never `src/app/api/`, f003), and forwards to the expected backend path with the admin bearer (assert via source/mocked `proxyAdminJson`).
- [ ] **Step 2:** `pnpm vitest run src/app/xmailx` → FAIL.
- [ ] **Step 3:** Create `src/lib/mail-types.ts` and routes, each like `support/threads/route.ts`:
  - `bff/admin/mail/accounts/route.ts` → GET/POST `/admin/mail/accounts`
  - `bff/admin/mail/[account]/folders/route.ts` → `/admin/mail/${account}/folders`
  - `bff/admin/mail/[account]/messages/route.ts` → forwards `folder`, `page`
  - `bff/admin/mail/[account]/messages/[uid]/route.ts` → GET, DELETE; `.../move/route.ts` POST; `.../attachments/[partId]/route.ts` binary via `backendFetchBinary`
  - `bff/admin/mail/[account]/send/route.ts` → multipart via `backendFetchFormData`
  Always `encodeURIComponent` path params.
- [ ] **Step 4:** Tests pass; `pnpm exec tsc --noEmit` clean. Ask before commit.

### Task 7: State logic (pure, tested)

**Files:** `src/app/xmailx/mail-state.ts`, extend `admin-mail.test.ts`

- [ ] **Step 1: Failing tests** for the pure reducer/helpers: switching mailbox resets `folder='INBOX'`, `page=1`, clears selection + list; stale responses ignored via a request generation counter (same pattern as `threadRequestRef` in `SupportInbox`, f113); reply builder produces `Re: ` subject (no double `Re:`), `inReplyTo` = original Message-ID, `references` = original refs + id, quoted body; unread badge sum.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS. Ask before commit.

### Task 8: Page shell + mailbox switcher + folders + list

**Files:** `xmailx/layout.tsx` (copy `xsupport/layout.tsx`: `indexable: false`, path `/xmailx`), `page.tsx`, `MailInbox.tsx`

- [ ] **Step 1:** `layout.tsx`: metadata `createMetadata({ path: "/xmailx", title: "Mailbox | eSIM2you", description: "Private eSIM2you admin mailbox.", indexable: false })`.
- [ ] **Step 2:** `page.tsx` mirrors `xsupport/page.tsx`: `useAdminSession`, `AdminLoginCard` when no token, `AdminNav`, header "Mailbox", Refresh button.
- [ ] **Step 3:** `MailInbox.tsx` (`"use client"`): `<select>` of accounts (from `/bff/admin/mail/accounts`, remembered in `localStorage` wrapped in try/catch); on change → reducer reset → refetch folders + messages for the new mailbox. Three panes at `lg:`; list/detail stack on narrow screens. Use design tokens/classes already used in `SupportInbox` (no hardcoded colors; `resolveButtonClasses()` for buttons). Polling every 30 s while tab visible; handle 401 via `handleUnauthorized`; show "Mail server unavailable" on 502.
- [ ] **Step 4:** Add `{ href: "/xmailx", label: "Mail", full: "Mailbox", Icon: Mail }` to `AdminNav.tsx` (import `Mail` from `lucide-react`). Do **not** rename the `x*` route.
- [ ] **Step 5:** `pnpm exec tsc --noEmit` + `pnpm test` pass. Ask before commit.

### Task 9: Reader

**Files:** `MailReader.tsx`

- [ ] **Step 1:** Render header (from/to/date/subject), attachments list (download via BFF binary route), and body. HTML goes into `<iframe sandbox="" srcDoc={...} />` (no scripts, no same-origin) with a strict CSP `<meta>` (`default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'`). A banner "Remote images blocked · Load images" re-renders with `data-remote-src` restored for that one message. Plain-text fallback in `<pre className="whitespace-pre-wrap">`.
- [ ] **Step 2:** Actions: Reply, Reply all, Delete, Mark unread (`POST …/move` / flags endpoints). Opening a message updates its row to read and decrements the folder's unread badge.
- [ ] **Step 3:** Test the pure parts (reply-building already in Task 7). tsc + tests pass. Ask before commit.

### Task 10: Compose / reply

**Files:** `MailCompose.tsx`

- [ ] **Step 1:** Modal (native `<dialog>`, like `DeleteAccountCard`) with To/Cc/Subject/body, attachment picker (client-side limits matching backend: ≤ 10 files, ≤ 20 MB), "From" fixed to the active mailbox (read-only label). Reply prefills via the Task 7 builder. Send → multipart POST `/bff/admin/mail/${account}/send`; disable button while sending; show error text from the response; on success close, refresh Sent counts, toast.
- [ ] **Step 2:** The screen has text inputs → wrap in `KeyboardAwareScrollView` only applies to mobile app; on web just ensure labels/`aria-live` for errors. tsc + tests pass. Ask before commit.

### Task 11: End-to-end check, docs, review

- [ ] **Step 1: E2E (local):** run backend with the real master env, web with `BACKEND_API_URL=http://localhost:4000/api`. **First check `:3000` for a running dev server; never `next build` over it (memory: no-build-over-running-dev).** Sign in at `/xloginy`, open `/xmailx`: switch between ≥ 2 mailboxes (list, folders, unread update), open a message (marks read), reply (check it arrives, threads in a mail client, and lands in Sent), delete (goes to Trash), try a support-scope token (rejected), try an address not in the allowlist (404).
- [ ] **Step 2: Docs/feedAI (per rules):**
  - Backend `feedAI/facts.jsonl`: master-user IMAP design, allowlist invariant, full-admin-only (no support scope), 502 `MAIL_UNAVAILABLE`, sanitize-on-backend. Update its `topics/*.json` + `docs/overview.md`.
  - Web `feedAI/facts.jsonl` + `topics/admin-dashboard-ui.json` (add `xmailx|mailbox` to the route key in `brain.json`): `/xmailx` pattern, iframe sandbox + remote-image blocking invariant, never rename.
  - Session notes `docs/sessions/2026-11-13_admin-mailbox.md` + `INDEX.md` row + bump `sync` in each `brain.json`.
- [ ] **Step 3: Self-review each diff** as someone else's PR (focus: auth on every route, allowlist check before IMAP, no secrets/bodies in logs, sanitizer coverage, stale-response handling). Optionally run the `reviewer` agent (security-sensitive: auth + mail).
- [ ] **Step 4:** Ask the user to confirm commits; then push both branches and `gh pr create` per repo. Merge order: backend first, then web.

---

## Risks / open items
- **Server unreachable from dev machine** → Task 0 must pass first; consider an SSH tunnel for local dev.
- **Master user can read every mailbox** → the `MailAccount` allowlist + full-admin-only routes are the guard; keep `MAIL_IMAP_MASTER_PASS` out of logs.
- **Sending as another mailbox may be rejected by Postfix** → resolved in Task 0 Step 4.
- Message bodies contain customer PII → never persist them in our DB or logs; mail stays on the mail server.
- Email HTML is hostile input → sanitize on the backend **and** render in a sandboxed iframe.
