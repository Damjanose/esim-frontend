# Event Modals: Web Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A hidden admin page `/xeventsy` where the admin builds and manages in-app event modals (promo/ad and prediction giveaway): list, block editor with live preview, schedule/audience/frequency/translations/rules, and the giveaway results flow (entries, real result, scoring, winners, notify). The backend is already built (PR #36 in `Damjanose/E-SIM-backend`).

**Architecture:** Next.js 15 App Router, client-side admin page (like `/xnotificationy`): `useAdminSession` for the admin token, every call goes through new BFF route handlers under `src/app/bff/admin/event-modals/**` (the browser never calls the backend). The editor keeps one `EditorDraft` in state; tab components are small and receive `draft` + `onChange(patch)`. The preview calls the backend preview endpoint (single source of truth for phases and sample data) and renders the returned payload with a small React renderer.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, lucide-react, vitest (`pnpm test`). **No new dependencies** (no drag-and-drop library: reordering uses accessible up/down buttons; no toast or modal library: inline error/notice strings and two-step inline confirms; never `window.confirm`/`alert`).

**API contract:** `/Users/elnorrapaj/Documents/E-SIM/E-SIM backend/docs/api/event-modals.md` (read the admin routes, block schema, phases and error sections you need; cross-repo read for the API contract is allowed). Key facts:
- Admin routes are under backend `/admin/event-modals` with `Authorization: Bearer <admin token>`; success is `{ status: "success", data }`, errors `{ status: "error", message }`.
- Modal fields: `title, status (draft|published|resolved|archived), startsAt, votingClosesAt, displayUntil, resultsAt, priority, presentation (sheet|modal), audience { platforms?: ("ios"|"android")[], locales?: string[] }, frequency { mode: once|daily|every_n_opens|every_n_hours|until_dismissed|until_voted, n?, maxImpressions? }, blocks[], rulesText, winnerVisibility (public|winner_only), resolution`. Lists/details also carry derived `timeState` and `stats { shown, dismissed, cta_clicked }`.
- Block: `{ id, type, props, visibleIn: Phase[] }`. Types: `image, heading, text, countdown, button, copy_code, divider, vote, results, winner, rules_link`. Phases: `live, live_unvoted, live_voted, closed_pending, resolved_won, resolved_lost`. Text props are `{ default, translations?: { [locale]: string } }` (a plain string is accepted and normalized).
- Routes (full list in the doc): `GET/POST /event-modals`, `GET/PUT /event-modals/:id`, `POST /:id/publish|archive|duplicate|preview`, `POST /event-modals/images` (multipart `file`), `PUT /:id/resolution`, `GET /:id/entries`, `GET /:id/entries.csv`, `POST /:id/disqualify`, `GET /:id/scoreboard`, `GET/POST/DELETE /:id/winners`, `POST /:id/winners/draw`, `POST /:id/resolve`, `POST /:id/winners/notify`. Public image bytes: backend `GET /event-modals/images/:id`.

## Rules for every task (read first)
- Branch `feat/event-modals-admin` (already created from `main`). Never commit, never create branches or worktrees: the main session owns git. Leave changes in the working tree.
- Tests first when there is logic: write the test, see it FAIL, implement, see it PASS. Tests are vitest (`pnpm exec vitest run <file>`, whole suite `pnpm test`), `environment: node`, include `src/**/*.test.ts`, alias `@` = `./src`. UI components have no DOM test setup: test their pure helpers directly and add source-grep tests (read the file, assert key strings) in the style of `src/app/xnotificationy/admin-notifications.test.ts`. Route handlers are tested by importing and calling them (style of `src/app/xstreaky/admin-streak-promo.test.ts`) with `vi.mock("@/lib/backend", ...)`.
- Type check: `pnpm exec tsc --noEmit`. Lint if configured: check `package.json` scripts and run them for your files.
- Style: copy the look of `src/app/xnotificationy/page.tsx` (Tailwind classes `bg-cloud`, `text-midnight`, `border-line`, `text-muted`, `rounded-xl`, `font-black`, `text-[10px] uppercase tracking-[0.12em]` eyebrows, buttons like the existing ones; shared CTA in `src/app/components/Button.tsx` / `buttonClasses.ts`). Icons: `lucide-react` only.
- Admin data fetching: `"use client"`, `useAdminSession()` token, `fetch("/bff/admin/event-modals...", { headers: { Authorization: \`Bearer ${token}\` }, cache: "no-store" })`; on `response.status === 401` call `handleUnauthorized()`.
- Other agents may work in parallel on other tasks (different files). Do not touch files outside your task; ignore tsc/test errors that come only from other tasks' in-flight files and report them.
- Use only `@example.test` addresses in fixtures. No secrets in client code (admin pages have no middleware guard).
- If blocked (ambiguous spec, failure you cannot explain, or 2 failed attempts at the same thing): STOP and end your report with `BLOCKED: <question, what you tried, file paths>`.

## Shared contracts (every task relies on these exact names)
`src/app/xeventsy/eventModal.ts` (Task W2) exports: types `Phase`, `BlockType`, `TextValue`, `Block`, `Frequency`, `EventModalRecord` (API shape incl. `timeState`, `stats`), `EditorDraft`; constants `PHASES`, `BLOCK_TYPES`, `BLOCK_DEFS`; functions listed in W2. `src/app/xeventsy/api.ts` (W2) exports `adminFetch`. Tab components (W4-W8) have the props named below.

```ts
export type EditorDraft = {
  title: string;
  priority: number;
  presentation: "sheet" | "modal";
  startsAt: string;          // value for <input type="datetime-local"> in the admin's local time, "" when unset
  votingClosesAt: string;
  displayUntil: string;
  audience: { platforms: Array<"ios" | "android">; locales: string }; // locales = comma separated, "" = all
  frequency: { mode: Frequency["mode"]; n: string; maxImpressions: string }; // strings from inputs
  rulesText: string;
  winnerVisibility: "public" | "winner_only";
  blocks: Block[];
};
// Tab props
type TabProps = { draft: EditorDraft; onChange: (patch: Partial<EditorDraft>) => void };
```

## File structure
Create under `src/app/xeventsy/`: `eventModal.ts`, `api.ts`, `layout.tsx`, `page.tsx` (list), `[id]/page.tsx` (editor shell), `editor/ScheduleTab.tsx`, `editor/AudienceFrequencyTab.tsx`, `editor/RulesTab.tsx`, `editor/BlocksTab.tsx`, `editor/BlockInspector.tsx`, `editor/TranslationsTab.tsx`, `editor/PreviewPanel.tsx`, `editor/PhonePreview.tsx`, `editor/ResultsTab.tsx`, tests beside each. BFF: `src/app/bff/admin/event-modals/**/route.ts`. Modify: `src/app/AdminNav.tsx`, `src/app/AdminNav.test.ts` if needed, `src/lib/seo.ts` (+ `seo.test.ts`).

Execution order: **wave 1** W1 ‖ W2; **wave 2** W3 ‖ W5 ‖ W6 ‖ W7 ‖ W8 ‖ (W4 tabs part); **wave 3** W4 shell; then W9.

---

### Task W1: BFF routes

**Files:** Create `src/app/bff/admin/event-modals/**/route.ts` and `src/app/bff/admin/event-modals/event-modals.bff.test.ts`. Read `src/lib/admin-bff.ts`, `src/lib/backend.ts` (`backendFetch`, `backendFetchFormData`, `backendFetchBinary`), and `src/app/bff/admin/notifications/route.ts` + `[id]/send/route.ts` for the patterns. Dynamic params are `Promise<{ id: string }>` (await them) and must be `encodeURIComponent`'d into the backend path.

Routes (each forwards the admin Bearer token; JSON routes use `proxyAdminJson(request, path, { method, body })` and parse the request JSON body with a 400 `{ status: "error", message: "Invalid JSON body" }` on failure):
- `route.ts`: `GET` -> `/admin/event-modals`; `POST` -> same, body forwarded.
- `[id]/route.ts`: `GET`, `PUT` -> `/admin/event-modals/:id`.
- `[id]/publish/route.ts`, `[id]/archive/route.ts`, `[id]/duplicate/route.ts`, `[id]/resolve/route.ts`, `[id]/winners/notify/route.ts`: `POST`, no body needed.
- `[id]/preview/route.ts`: `POST` with body (`{ phase, locale }`).
- `[id]/resolution/route.ts`: `PUT` with body. `[id]/disqualify/route.ts`: `POST` with body. `[id]/scoreboard/route.ts`: `GET`. `[id]/entries/route.ts`: `GET`.
- `[id]/winners/route.ts`: `GET`, `POST` (body), `DELETE`. `[id]/winners/draw/route.ts`: `POST` (body).
- `[id]/entries.csv/route.ts`... Next.js folder names cannot contain a dot-route cleanly: use `[id]/entries-csv/route.ts` (`GET`) that calls `backendFetchBinary(\`/admin/event-modals/${id}/entries.csv\`, { token })` and returns `new Response(buffer, { headers: { "Content-Type": contentType, "Content-Disposition": contentDisposition ?? \`attachment; filename="entries.csv"\`, "Cache-Control": "no-store" } })`; error -> JSON error with the backend status.
- `images/route.ts`: `POST` multipart: `const formData = await request.formData(); backendFetchFormData("/admin/event-modals/images", { token, formData })`, return `{ status: "success", data }` or the error JSON (copy `src/app/bff/admin/support/threads/[id]/attachments/route.ts`).
- `images/[id]/route.ts`: `GET` (NO admin token needed, the backend route is public): `backendFetchBinary(\`/event-modals/images/${encodeURIComponent(id)}\`)`, respond with the bytes, the backend content type, `Cache-Control: public, max-age=3600`, `X-Content-Type-Options: nosniff`; 404 JSON on error.
- [ ] Failing tests first (`vi.mock("@/lib/backend", ...)` and mock `@/lib/admin-bff` only if simpler): for every route, assert the backend path/method/body/token that is called and that a backend error status/message is passed through; JSON-body routes return 400 on invalid JSON; the CSV and image routes return the bytes and the headers above; `images/[id]` forwards no token. Then implement. Run the file, `pnpm exec tsc --noEmit`.

---

### Task W2: Domain library and admin fetch helper

**Files:** Create `src/app/xeventsy/eventModal.ts`, `src/app/xeventsy/api.ts`, `src/app/xeventsy/eventModal.test.ts`, `src/app/xeventsy/api.test.ts`.

`eventModal.ts` exports (exact):
```ts
export const PHASES = ["live","live_unvoted","live_voted","closed_pending","resolved_won","resolved_lost"] as const;
export type Phase = (typeof PHASES)[number];
export const PHASE_LABELS: Record<Phase, string>; // "Promo (live)", "Live, not voted", "Live, voted", "Closed, awaiting result", "Resolved, you won", "Resolved, you lost"
export const BLOCK_TYPES = ["image","heading","text","countdown","button","copy_code","divider","vote","results","winner","rules_link"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export type TextValue = { default: string; translations?: Record<string, string> };
export type Block = { id: string; type: BlockType; props: Record<string, unknown>; visibleIn: Phase[] };
export type Frequency = { mode: "once"|"daily"|"every_n_opens"|"every_n_hours"|"until_dismissed"|"until_voted"; n?: number; maxImpressions?: number };
export type EventModalRecord = { id: string; title: string; status: "draft"|"published"|"resolved"|"archived"; timeState: string; stats: { shown: number; dismissed: number; cta_clicked: number }; startsAt: string|null; votingClosesAt: string|null; displayUntil: string|null; resultsAt: string|null; priority: number; presentation: "sheet"|"modal"; audience: { platforms?: string[]; locales?: string[] }; frequency: Frequency; requiredSchemaVersion: number; blocks: Block[]; rulesText: string|null; winnerVisibility: "public"|"winner_only"; resolution: unknown; createdAt: string; updatedAt: string };
export type EditorDraft = { /* exactly as in "Shared contracts" */ };
export const BLOCK_DEFS: Record<BlockType, { label: string; description: string; icon: string /* lucide icon name */; defaultVisibleIn: Phase[]; createProps: () => Record<string, unknown>; isVoteType?: boolean }>;
export const ROUTE_OPTIONS: Array<{ value: string; label: string; needsSlug?: boolean }>; // the 12 allowed routes from the API doc, "Country page" needsSlug
export function emptyDraft(): EditorDraft;
export function draftFromRecord(record: EventModalRecord): EditorDraft;
export function draftToRequestBody(draft: EditorDraft): Record<string, unknown>; // ISO dates ("" -> null), numbers parsed, locales split/trimmed/lowercased, platforms, frequency n/maxImpressions only when relevant/non-empty, rulesText "" -> null
export function toLocalInput(iso: string | null): string;   // ISO -> "YYYY-MM-DDTHH:mm" in the browser's local time, "" for null/invalid
export function fromLocalInput(value: string): string | null; // local datetime string -> ISO UTC, null for ""/invalid
export function newBlock(type: BlockType, existingIds: string[]): Block; // unique id like "vote-1", props from createProps(), visibleIn from defaultVisibleIn
export function moveBlock(blocks: Block[], index: number, delta: -1 | 1): Block[]; // no-op at the ends, returns a new array
export function removeBlock(blocks: Block[], id: string): Block[];
export function updateBlock(blocks: Block[], id: string, patch: Partial<Pick<Block, "props" | "visibleIn">>): Block[];
export function hasVoteBlock(blocks: Block[]): boolean;
export function voteBlocksOf(blocks: Block[]): Block[];
export function textOf(value: unknown): string;               // default text of a TextValue or plain string, "" otherwise
export function setTextDefault(value: unknown, text: string): TextValue; // keeps translations
export function setTranslation(value: unknown, locale: string, text: string): TextValue; // empty text removes the locale
export function collectTextFields(blocks: Block[]): Array<{ blockId: string; blockType: BlockType; path: string; label: string; value: TextValue }>; // every TextValue prop incl. vote question and option labels, e.g. path "question" or "options.0.label"
export function applyTextField(blocks: Block[], blockId: string, path: string, value: TextValue): Block[];
export function validateDraft(draft: EditorDraft): string[]; // light client checks: title required (<=120), startsAt required, displayUntil after startsAt, votingClosesAt within window when set, vote modal needs votingClosesAt and rulesText, choice vote needs 2-10 options with labels, every_n_* modes need n >= 1, copy_code non-empty code, https URLs for url buttons/images; the backend stays the authority
export const LOCALES: Array<{ code: string; label: string }>; // en, ar, fr, es, de, pt, tr, sq, it, el (the 10 app locales)
```
Default props: heading `{ text: { default: "" } }`; text same; image `{ alt: { default: "" } }` (admin picks `imageId` or `url` later); countdown `{ target: "displayUntil" }`; button `{ label: { default: "Open" }, action: { type: "dismiss" }, style: "primary" }`; copy_code `{ code: "" }`; divider `{}`; vote `{ question: { default: "" }, questionType: "choice", options: [{ id: "home", label: { default: "Home" } }, { id: "away", label: { default: "Away" } }], points: 1 }`; results `{ voteBlockId: "" }`; winner `{ title: { default: "You won!" } }`; rules_link `{}`. `defaultVisibleIn` mirrors the backend defaults: old types `["live"]`; vote `["live_unvoted"]`; results `["live_voted","closed_pending","resolved_won","resolved_lost"]`; winner `["resolved_won"]`; rules_link `["live_unvoted","live_voted"]`.

`api.ts`: `export type AdminResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string }; export async function adminFetch<T>(path: string, opts: { token: string; method?: string; body?: unknown; onUnauthorized?: () => void }): Promise<AdminResult<T>>` — calls `fetch(\`/bff/admin/event-modals${path}\`, { method, headers: { Authorization: \`Bearer ${token}\`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: JSON.stringify(body), cache: "no-store" })`, returns `data` from `{ status: "success", data }`, a `message` (fallback `"Something went wrong."`) for errors, calls `onUnauthorized` on 401, never throws (network failure -> `{ ok: false, status: 0, message: "Could not reach the server." }`). Also `export async function adminUpload(file: File, opts: { token; onUnauthorized? }): Promise<AdminResult<{ id: string; url: string }>>` (multipart POST to `/bff/admin/event-modals/images`).
- [ ] Failing tests first for every function above (timezone-independent assertions: round-trip `fromLocalInput(toLocalInput(iso))` equals `iso` at minute precision; `draftToRequestBody` golden cases; `validateDraft` cases; text helpers; `collectTextFields`/`applyTextField` for vote option labels; `moveBlock` edges) and for `adminFetch`/`adminUpload` with `vi.stubGlobal("fetch", ...)` (success, error message passthrough, 401 calls `onUnauthorized`, network failure). Implement; run both files and `tsc`.

---

### Task W3: Admin registration and list page

**Files:** Modify `src/app/AdminNav.tsx`, `src/lib/seo.ts`, and the tests `src/app/AdminNav.test.ts` / `src/lib/seo.test.ts` only if they enumerate routes; Create `src/app/xeventsy/layout.tsx`, `src/app/xeventsy/page.tsx`, `src/app/xeventsy/admin-event-modals.test.ts`.
- [ ] `layout.tsx` copied from `xnotificationy/layout.tsx` (`createMetadata({ path: "/xeventsy", title: "Event Modals | eSIM2you", description: "Private eSIM2you in-app event modal admin surface.", indexable: false })`).
- [ ] Register: `{ href: "/xeventsy", label: "Modals", full: "Event modals", Icon: Megaphone }` in `adminLinks` and `"/xeventsy"` in the `Product` group of `adminNavGroups` (keep alphabetical order in `privateRoutePrefixes` for `seo.ts`); the existing AdminNav/seo tests must still pass and the new href must be asserted by `admin-event-modals.test.ts`.
- [ ] `page.tsx` (`"use client"`, `AdminNav`, `AdminLoginCard`, `useAdminSession`, `adminFetch` from `./api` (Task W2; if the file is not there yet when you start, wait/re-check, or report BLOCKED)): header "Event modals", "New event modal" button linking to `/xeventsy/new`, Refresh; a table (hand-rolled `<table>`, copy markup style from `src/app/xactivityy/page.tsx`): title, status chip (colored by `timeState`: draft grey, scheduled amber, live green, closed orange, resolved blue, ended/archived grey), schedule (`startsAt` -> `displayUntil` formatted in local time with the timezone name in the header cell), impressions (`shown / dismissed / cta_clicked`), a "Giveaway" badge when the modal has a vote block, and row actions: Edit (link `/xeventsy/{id}`), Duplicate, Publish (drafts), Archive (two-step inline confirm: first click turns the button into "Confirm archive"/"Cancel"). Inline `error`/`notice` strings; 401 -> `handleUnauthorized`; empty state text.
- [ ] Tests: source-grep (route exists, `"use client"`, `useAdminSession`, `/bff/admin/event-modals`, `response.status === 401` or `onUnauthorized`, the nav registration, layout `indexable: false`), plus that `/xeventsy` is in `privateRoutePrefixes`. Run `pnpm exec vitest run src/app/AdminNav.test.ts src/lib/seo.test.ts src/app/xeventsy`, `tsc`.

---

### Task W4: Editor shell, details, schedule, audience, frequency and rules tabs

**Files:** Create `src/app/xeventsy/[id]/page.tsx`, `editor/ScheduleTab.tsx`, `editor/AudienceFrequencyTab.tsx`, `editor/RulesTab.tsx`, `editor/EditorShell.tsx` (or keep the shell in `page.tsx`), `editor/editor.test.ts`. The tab components for blocks, translations, preview and results come from Tasks W5-W8: import them by the exact names/paths below; if one does not exist yet when you build the shell, wait and re-check, or report BLOCKED.
- [ ] `[id]/page.tsx` is a client component; `id === "new"` creates, otherwise loads `GET /event-modals/:id` (`draftFromRecord`). State: `draft`, `record`, `dirty`, `saving`, `error` (list of messages), `notice`. Header: title, status chip, and the buttons Save (create: `POST`, then `router.replace(\`/xeventsy/${id}\`)`; update: `PUT`), Publish (saves first, then `POST /:id/publish`; show the backend `message` split on `; ` as a bullet list under the header, plus `validateDraft` results before sending), Duplicate, Archive (two-step inline confirm), Back to list. Show the `requiredSchemaVersion` note ("needs app version supporting blocks v2") when the draft has vote/results/winner/rules_link blocks. Locked-field hints: when the backend returns `entries_exist`/`resolution_set` 409 messages, show them as-is.
- [ ] Tabs (hand-rolled like `xnotificationy`): **Content** (`BlocksTab` + `PreviewPanel` side by side), **Schedule**, **Audience & frequency**, **Translations**, **Giveaway rules** (`RulesTab`), **Results** (only when the modal is saved and the draft has a vote block: `ResultsTab`).
- [ ] `ScheduleTab({ draft, onChange })`: `datetime-local` inputs for `startsAt`, `displayUntil`, and `votingClosesAt` (the last only meaningful for countdown/giveaway: label "Voting closes (match kickoff)"), a visible line "Times are in your local time zone: <Intl.DateTimeFormat().resolvedOptions().timeZone>" and the UTC equivalent under each input; helper text "Show until" explains the modal keeps showing after voting closes so winners can see the result.
- [ ] `AudienceFrequencyTab`: platform checkboxes (iOS, Android; none = everyone), locales text input (comma separated, "empty = all languages"), `presentation` radio (Bottom sheet / Centered modal), `priority` number input (higher wins), frequency `<select>` with the six modes, `n` input shown for `every_n_hours` ("hours") and `every_n_opens` ("opens"), `maxImpressions` optional; plain-language description of each mode.
- [ ] `RulesTab`: `rulesText` textarea (<= 10000 chars, counter), `winnerVisibility` radio (public masked names / only the winner), a note "Required before publishing a giveaway; the app adds the line 'Apple is not a sponsor of or involved in this giveaway'", disabled/hidden hint when there is no vote block.
- [ ] Tests: pure helpers used by the shell (if any, put them in `eventModal.ts`'s sibling file `editor/editor.ts` and test them), plus source-grep tests for the page and each tab (`ScheduleTab` mentions the time zone, `AudienceFrequencyTab` lists all six modes, `RulesTab` has the winner visibility options, the page imports the tab components and uses `adminFetch`). Run the tests, `tsc`.

---

### Task W5: Blocks tab (canvas + inspector, image upload)

**Files:** Create `src/app/xeventsy/editor/BlocksTab.tsx`, `editor/BlockInspector.tsx`, `editor/blocks.test.ts`. Props: `BlocksTab({ draft, onChange, token, onUnauthorized }: TabProps & { token: string; onUnauthorized: () => void })`. Uses `newBlock`, `moveBlock`, `removeBlock`, `updateBlock`, `BLOCK_DEFS`, `ROUTE_OPTIONS`, `adminUpload`, `textOf`, `setTextDefault` from W2.
- [ ] Left column "Blocks": ordered list; each row shows the type icon + label, a one-line summary (heading text, button label, vote question...), up/down buttons (`aria-label="Move up"` / `"Move down"`, disabled at the ends), delete button (two-step inline confirm), selecting a row opens it in the inspector. "Add block" menu: buttons for each `BLOCK_TYPES` entry (label + description from `BLOCK_DEFS`); a hint on giveaway blocks ("needs app 2+").
- [ ] Right column inspector for the selected block, by type: **heading/text** (textarea for the default text, align left/center); **image** (upload button -> `adminUpload` -> sets `props.imageId` and clears `props.url`; OR an https URL input that clears `imageId`; thumbnail `<img src="/bff/admin/event-modals/images/{id}">`; alt text); **countdown** (target select: Display until / Voting closes, optional label); **button** (label; action select: Open link (https URL), Open in app (route select from `ROUTE_OPTIONS` + slug input for the country page), Just close; style select); **copy_code** (code input restricted to letters, digits, `-`, `_`; optional label); **divider** (no fields); **vote** (question text; `questionType` select; for choice: option list with id + label inputs, add/remove (2-10 options, ids unique `[A-Za-z0-9_-]{1,40}`); exact score: optional home/away labels; number: min, max, unit; points 1-100); **results** (select of the draft's vote blocks by question; title); **winner** (title, message); **rules_link** (label).
- [ ] For every block a "Visible in" checklist of the six phases with `PHASE_LABELS` and a hint explaining that promos use "Promo (live)" and giveaways use the other five; changes go through `updateBlock`. Text edits only change the default text (translations live in the Translations tab).
- [ ] Tests: pure helpers extracted to `editor/blocks.ts` (summary text per block, option id uniqueness check, route action builders) tested directly; source-grep tests assert `Move up`, `Move down`, `adminUpload`, every `BLOCK_TYPES` member appears in the add menu or inspector, and `Visible in`. Run, `tsc`.

---

### Task W6: Translations tab

**Files:** Create `src/app/xeventsy/editor/TranslationsTab.tsx`, `editor/translations.test.ts`. Props `TabProps`.
- [ ] Locale picker (the 10 `LOCALES`, English is the default text and cannot be edited here). For the selected locale list every text field from `collectTextFields(draft.blocks)`: a row with block type, the field label, the English default as read-only text, and an input for the translation (`setTranslation`, then `applyTextField`). A badge per locale in the picker showing how many fields are translated (`n / total`), a "Copy English into empty fields" is NOT needed. Empty input removes the translation. Info text: "Anything not translated falls back to English."
- [ ] Tests for the progress counting helper (put it in `editor/translations.ts`) and source-grep (all 10 locale codes, fallback text). Run, `tsc`.

---

### Task W7: Preview panel

**Files:** Create `src/app/xeventsy/editor/PreviewPanel.tsx`, `editor/PhonePreview.tsx`, `editor/preview.ts`, `editor/preview.test.ts`. Props: `PreviewPanel({ modalId, token, onUnauthorized, version, hasUnsavedChanges }: { modalId: string | null; token: string; onUnauthorized: () => void; version: number; hasUnsavedChanges: boolean })` (`version` changes after each save so the panel refetches).
- [ ] Phase switcher (the six phases, defaults to `live`), locale select (`LOCALES`), a refresh button. It POSTs `/event-modals/:id/preview` with `{ phase, locale }` through `adminFetch` and renders `data.payload` in a phone-shaped frame (rounded border, max-width ~320px, scrollable). When `modalId` is null show "Save the modal once to see a preview". When `hasUnsavedChanges` show "Preview shows the last saved version". When `payload` is null show "No blocks are visible in this phase".
- [ ] `PhonePreview({ payload })` renders the backend payload (`blocks: Array<{ id, type, props }>`, texts already resolved to strings, plus top-level `rulesText`, `phase`, `signedIn`, `votingClosed`): heading/text (align), image (`props.imageId` -> `/bff/admin/event-modals/images/{id}` or `props.url`), countdown (show the remaining time to the target date computed in the browser from `payload.votingClosesAt` / `payload.displayUntil`, as `Xd Yh Zm`, text "Ends in ..."), button (styled primary/secondary, shows the action target as a tooltip/small text), copy_code (code chip), divider, vote (question + choice options as disabled radio-like rows / exact-score two number boxes / number box, plus `myAnswer` highlight and a "Locked" note when `locked`), results (bars from `props.results`: choice options with percent; exact_score top list; number average), winner (title/message, "You won" with prize when `youWon`, else the masked winners list), rules_link ("Rules" link showing `rulesText` in an expandable inline panel). Unknown types render a grey "Unsupported block" box.
- [ ] `preview.ts`: pure helpers (`formatRemaining(targetIso, nowMs)`, `percentWidth(percent)`, `describeAction(action)`) with tests; plus source-grep test that every `BLOCK_TYPES` member is handled in `PhonePreview.tsx`. Run, `tsc`.

---

### Task W8: Results tab (giveaway)

**Files:** Create `src/app/xeventsy/editor/ResultsTab.tsx`, `editor/results.ts`, `editor/results.test.ts`. Props: `ResultsTab({ modalId, voteBlocks, status, token, onUnauthorized, onChanged }: { modalId: string; voteBlocks: Block[]; status: EventModalRecord["status"]; token: string; onUnauthorized: () => void; onChanged: () => void })` (`onChanged` asks the shell to reload the record).
Sections, each loading with `adminFetch` and showing backend `message`s inline:
- [ ] **Entries**: `GET /:id/entries` -> table of entrants (email, answers per vote block rendered compactly, disqualified badge, created time); shows `total` and a "Showing the first 5000" note when `truncated`; "Download CSV" button (fetches `/bff/admin/event-modals/:id/entries-csv` with the Bearer header, creates a Blob URL and triggers a download of the returned file; revoke the URL after); per-row "Disqualify"/"Reinstate" (`POST /:id/disqualify` `{ userEmail, disqualified }`, disabled once `status === "resolved"`).
- [ ] **Real result**: one input group per vote block (same answer types: choice -> select of its options, exact score -> two number inputs, number -> number input), "Save result" -> `PUT /:id/resolution` `{ resolution: { [blockId]: answer } }`; show the 409 messages (voting still open, winners exist, only voting modals); prefill from `record.resolution` when present (pass it via the draft/record if available; otherwise leave empty).
- [ ] **Scoreboard**: `GET /:id/scoreboard` (after a result exists) -> totals (`totalEntrants`, `perfectScorers`) and the top list (email, score, correct blocks).
- [ ] **Winners**: `GET /:id/winners` list (email, score, prize, method, notified time/result); "Draw" form (`count` 1-50, `prize` text) -> `POST /:id/winners/draw`; "Pick manually" (textarea of emails, one per line, prize) -> `POST /:id/winners`; "Clear winners" (two-step confirm, `DELETE`); "Resolve" (two-step confirm) -> `POST /:id/resolve` then `onChanged()`; "Notify winners" -> `POST /:id/winners/notify` and show the per-winner results table (push sent/failed, email sent/failed, `notified`), with the explicit line "A winner is only marked notified when the push reached a device or the email was sent; you can retry after 30 seconds."; a warning box: "If a winner deletes their account their winner record is deleted with it. Contact winners and deliver prizes promptly."
- [ ] `results.ts`: pure helpers (`answerLabel(block, answer)`, `buildResolutionBody(voteBlocks, inputs)`, `parseEmails(text)` trimming/lowercasing/deduping) with tests; source-grep tests for the routes used (`entries-csv`, `resolution`, `disqualify`, `scoreboard`, `winners/draw`, `resolve`, `winners/notify`) and the warning text. Run, `tsc`.

---

### Task W9: Docs

**Files:** `feedAI/facts.jsonl` (append; look at the last lines for the format and next id; validate every line parses), `feedAI/brain.json` (`sync`; see `feedAI/MAINTAIN.md`), `docs/overview.md`, `docs/sessions/` (new session file + INDEX row), the admin-dashboard-ui topic (`feedAI/topics/admin-dashboard-ui.json`: add `/xeventsy` and FIX the stale statement that the admin token lives in sessionStorage: it is a cookie, see `src/app/useAdminSession.ts` and `src/lib/adminTokenCookie.ts`).
- [ ] Facts: the page and its three registrations (AdminNav links + group, `seo.ts` prefix, layout `indexable: false`); BFF routes list and the image/CSV pass-through; the draft/tab architecture and no new dependencies (up/down reorder, two-step confirms); the preview uses the backend endpoint; datetime-local inputs are local time converted to UTC; the account-deletion warning is shown in the Results tab; `next dev` hits the production backend unless `BACKEND_API_URL` is set.
- [ ] Update `docs/overview.md` and write the session log; documentation only.

---

## After all tasks (main session)
Run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` if present, `pnpm build` only if no dev server is running on :3000 (building over a running dev server corrupts `.next`; check first). Review the whole diff with the `reviewer` agent, fix findings, commit per task, push, open the PR against `main`, review the PR.
