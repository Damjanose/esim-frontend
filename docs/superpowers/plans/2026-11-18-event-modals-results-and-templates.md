# Event Modals: Results page and Promo/Match templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin open a giveaway's results (email, answer, timestamp) straight from the `/xeventsy` list without entering the editor, and create an image-only promo or a match-prediction giveaway in one click from templates.

**Architecture:** Web only, no backend change. The Results UI already exists as `editor/ResultsTab.tsx` (entries table with email / answer per vote block / entered time, CSV, disqualify, resolution, scoreboard, winners). We reuse it on a new standalone route `/xeventsy/[id]/results`, add a "Results" row action, and add pure template builders that pre-fill the editor draft via `/xeventsy/new?template=promo|match`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind, vitest (`pnpm exec vitest run <path>`).

**Branch:** `feat/event-modals-results-and-templates` (already created off `main` in `E-SIM-frontend`). Do not commit without asking the user. Do not run `next build` while a dev server is on :3000.

**Facts to know (verified in code):**
- `EditorShell` (`src/app/xeventsy/editor/EditorShell.tsx`) starts with `useState<EditorDraft>(emptyDraft)` and treats id `"new"` as create.
- `newBlock(type, existingIds)` and `emptyDraft()` live in `src/app/xeventsy/eventModal.ts`. Block ids are `${type}-${n}`.
- Countdown `props.target` is `"votingClosesAt"` or `"displayUntil"`. `results` blocks carry `props.voteBlockId`.
- `validateDraft` requires title, start date, and for vote modals: `votingClosesAt` and rules text; choice votes need 2 to 10 labelled options.
- `ResultsTab` props: see its call in `EditorShell.tsx` (search `<ResultsTab`); copy that call exactly.
- Tests are vitest, colocated; UI wiring is tested by reading source text (see `src/app/xeventsy/[id]/shell.test.ts`).

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/xeventsy/templates.ts` | Create | Pure: `parseTemplate`, `draftForTemplate` (promo, match) |
| `src/app/xeventsy/templates.test.ts` | Create | Tests for the above |
| `src/app/xeventsy/editor/editor.ts` | Modify | Add `resultsHref(id)` |
| `src/app/xeventsy/editor/editor.test.ts` | Modify | Test `resultsHref` |
| `src/app/xeventsy/[id]/page.tsx` | Modify | Read `?template=` search param, pass to shell |
| `src/app/xeventsy/editor/EditorShell.tsx` | Modify | Accept `template`, seed the draft; add "Results" header link |
| `src/app/xeventsy/editor/ResultsShell.tsx` | Create | Standalone results page body (loads record, renders `ResultsTab` or promo stats) |
| `src/app/xeventsy/[id]/results/page.tsx` | Create | Route wrapper for `ResultsShell` |
| `src/app/xeventsy/page.tsx` | Modify | "New promo" / "New match giveaway" / "Blank" buttons; "Results" row action |
| `src/app/xeventsy/list-and-results.test.ts` | Create | Source-text wiring tests |

---

### Task 1: Template builders (pure)

**Files:**
- Create: `src/app/xeventsy/templates.ts`
- Test: `src/app/xeventsy/templates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/xeventsy/templates.test.ts
import { describe, expect, it } from "vitest";
import { draftForTemplate, parseTemplate } from "./templates";
import { hasVoteBlock, validateDraft, voteBlocksOf } from "./eventModal";

describe("parseTemplate", () => {
  it("accepts only promo and match", () => {
    expect(parseTemplate("promo")).toBe("promo");
    expect(parseTemplate("match")).toBe("match");
    expect(parseTemplate("other")).toBeNull();
    expect(parseTemplate(undefined)).toBeNull();
    expect(parseTemplate(["match", "promo"])).toBe("match");
  });
});

describe("draftForTemplate", () => {
  it("null gives the blank draft", () => {
    const draft = draftForTemplate(null);
    expect(draft.blocks).toEqual([]);
    expect(draft.title).toBe("");
  });

  it("promo is a single image block with no vote", () => {
    const draft = draftForTemplate("promo");
    expect(draft.blocks.map((b) => b.type)).toEqual(["image"]);
    expect(draft.blocks[0].visibleIn).toEqual(["live"]);
    expect(hasVoteBlock(draft.blocks)).toBe(false);
    expect(draft.frequency.mode).toBe("once");
  });

  it("match has image, heading, countdown, one 3-option choice vote, results, winner, rules link", () => {
    const draft = draftForTemplate("match");
    expect(draft.blocks.map((b) => b.type)).toEqual([
      "image",
      "heading",
      "countdown",
      "vote",
      "results",
      "winner",
      "rules_link"
    ]);
    const votes = voteBlocksOf(draft.blocks);
    expect(votes).toHaveLength(1);
    expect(votes[0].props.questionType).toBe("choice");
    expect((votes[0].props.options as unknown[]).length).toBe(3);
    const results = draft.blocks.find((b) => b.type === "results")!;
    expect(results.props.voteBlockId).toBe(votes[0].id);
    const countdown = draft.blocks.find((b) => b.type === "countdown")!;
    expect(countdown.props.target).toBe("votingClosesAt");
    expect(draft.frequency.mode).toBe("until_voted");
  });

  it("match image and heading show in every vote phase, not just live", () => {
    const draft = draftForTemplate("match");
    const image = draft.blocks.find((b) => b.type === "image")!;
    expect(image.visibleIn).toEqual([
      "live_unvoted",
      "live_voted",
      "closed_pending",
      "resolved_won",
      "resolved_lost"
    ]);
  });

  it("match passes validation once title, dates and rules are filled in", () => {
    const draft = draftForTemplate("match");
    const problems = validateDraft(draft);
    expect(problems).toEqual(
      expect.arrayContaining([
        "Title is required.",
        "Start date is required.",
        "Vote modals need a voting close date.",
        "Vote modals need rules text."
      ])
    );
    const filled = {
      ...draft,
      title: "Derby prediction",
      startsAt: "2026-11-20T10:00",
      votingClosesAt: "2026-11-25T18:00",
      displayUntil: "2026-12-01T00:00",
      rulesText: "One entry per person."
    };
    expect(validateDraft(filled)).toEqual([]);
  });

  it("returns a fresh draft each call (no shared block objects)", () => {
    const a = draftForTemplate("match");
    const b = draftForTemplate("match");
    expect(a.blocks[0]).not.toBe(b.blocks[0]);
    a.blocks[0].visibleIn.push("live");
    expect(b.blocks[0].visibleIn).not.toContain("live");
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** (module `./templates` not found)

Run: `pnpm exec vitest run src/app/xeventsy/templates.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/app/xeventsy/templates.ts
// One-click starting points for the /xeventsy editor. Pure: no fetch, no React.
import { emptyDraft, newBlock, type Block, type BlockType, type EditorDraft, type Phase } from "./eventModal";

export const EVENT_TEMPLATES = ["promo", "match"] as const;
export type EventTemplate = (typeof EVENT_TEMPLATES)[number];

export function parseTemplate(value: string | string[] | undefined): EventTemplate | null {
  const first = Array.isArray(value) ? value[0] : value;
  return (EVENT_TEMPLATES as readonly string[]).includes(first ?? "") ? (first as EventTemplate) : null;
}

const VOTE_FLOW_PHASES: Phase[] = [
  "live_unvoted",
  "live_voted",
  "closed_pending",
  "resolved_won",
  "resolved_lost"
];

function add(blocks: Block[], type: BlockType, patch: Partial<Block> = {}): Block {
  const block = { ...newBlock(type, blocks.map((b) => b.id)), ...patch };
  blocks.push(block);
  return block;
}

function matchGiveaway(): EditorDraft {
  const blocks: Block[] = [];
  add(blocks, "image", { visibleIn: [...VOTE_FLOW_PHASES] });
  const heading = add(blocks, "heading", { visibleIn: [...VOTE_FLOW_PHASES] });
  heading.props = { text: { default: "Guess the result" } };
  const countdown = add(blocks, "countdown", { visibleIn: ["live_unvoted", "live_voted"] });
  countdown.props = { target: "votingClosesAt" };
  const vote = add(blocks, "vote");
  vote.props = {
    question: { default: "Who wins?" },
    questionType: "choice",
    options: [
      { id: "home", label: { default: "Home win" } },
      { id: "draw", label: { default: "Draw" } },
      { id: "away", label: { default: "Away win" } }
    ],
    points: 1
  };
  const results = add(blocks, "results");
  results.props = { voteBlockId: vote.id };
  add(blocks, "winner");
  add(blocks, "rules_link");
  return { ...emptyDraft(), frequency: { mode: "until_voted", n: "", maxImpressions: "" }, blocks };
}

function promo(): EditorDraft {
  const blocks: Block[] = [];
  add(blocks, "image");
  return { ...emptyDraft(), blocks };
}

export function draftForTemplate(template: EventTemplate | null): EditorDraft {
  if (template === "promo") return promo();
  if (template === "match") return matchGiveaway();
  return emptyDraft();
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `pnpm exec vitest run src/app/xeventsy/templates.test.ts`

- [ ] **Step 5: Stop and ask the user before committing.** Suggested message: `feat(event-modals): promo and match giveaway templates`

---

### Task 2: Create from a template

**Files:**
- Modify: `src/app/xeventsy/[id]/page.tsx`
- Modify: `src/app/xeventsy/editor/EditorShell.tsx` (the `EditorShell` signature and the first `useState<EditorDraft>(emptyDraft)`)
- Modify: `src/app/xeventsy/page.tsx` (the "New event modal" link)
- Test: `src/app/xeventsy/list-and-results.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// src/app/xeventsy/list-and-results.test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = __dirname;
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

describe("create from template wiring", () => {
  it("list page offers promo, match giveaway and blank", () => {
    const page = read("page.tsx");
    expect(page).toContain('href="/xeventsy/new?template=promo"');
    expect(page).toContain('href="/xeventsy/new?template=match"');
    expect(page).toContain('href="/xeventsy/new"');
  });

  it("editor route reads the template search param and seeds the draft", () => {
    const route = read("[id]", "page.tsx");
    expect(route).toContain("searchParams");
    expect(route).toContain("parseTemplate");
    const shell = read("editor", "EditorShell.tsx");
    expect(shell).toContain("draftForTemplate");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm exec vitest run src/app/xeventsy/list-and-results.test.ts`

- [ ] **Step 3: Implement**

`[id]/page.tsx` becomes:

```tsx
"use client";

import { use } from "react";
import { EditorShell } from "../editor/EditorShell";
import { parseTemplate } from "../templates";

export default function AdminEventModalEditorPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const { id } = use(params);
  const { template } = use(searchParams);
  return <EditorShell id={id} template={parseTemplate(template)} />;
}
```

`EditorShell.tsx`: add `import { draftForTemplate, type EventTemplate } from "../templates";`, change the signature to `export function EditorShell({ id, template = null }: { id: string; template?: EventTemplate | null })`, and change `useState<EditorDraft>(emptyDraft)` to `useState<EditorDraft>(() => (isNew ? draftForTemplate(template) : emptyDraft()))`. `isNew` is defined above that line already (`const isNew = isNewModalId(id);`); if `useState` for draft comes before it, move the `isNew` line up. Keep the `emptyDraft` import (still used).

`page.tsx` (list): replace the single `New event modal` `<Link>` with three links, same styling for the first two (primary style), third is the plain `ROW_BUTTON`-like secondary:

```tsx
<Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90" href="/xeventsy/new?template=match">
  <Plus aria-hidden="true" size={14} />
  New match giveaway
</Link>
<Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan" href="/xeventsy/new?template=promo">
  <Plus aria-hidden="true" size={14} />
  New promo (image)
</Link>
<Link className="inline-flex h-10 items-center rounded-xl px-2 text-xs font-bold text-muted underline-offset-2 hover:underline" href="/xeventsy/new">
  Blank
</Link>
```

- [ ] **Step 4: Run tests and type-check, expect PASS**

Run: `pnpm exec vitest run src/app/xeventsy && pnpm exec tsc --noEmit`

- [ ] **Step 5: Stop and ask before committing.** Message: `feat(event-modals): create promo or match giveaway from the list`

---

### Task 3: Standalone Results page and row action

**Files:**
- Modify: `src/app/xeventsy/editor/editor.ts` (add `resultsHref`)
- Modify: `src/app/xeventsy/editor/editor.test.ts`
- Create: `src/app/xeventsy/editor/ResultsShell.tsx`
- Create: `src/app/xeventsy/[id]/results/page.tsx`
- Modify: `src/app/xeventsy/page.tsx` (row action)
- Modify: `src/app/xeventsy/editor/EditorShell.tsx` (header link)
- Modify: `src/app/xeventsy/list-and-results.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `editor/editor.test.ts` (add `resultsHref` to its import from `./editor`):

```ts
describe("resultsHref", () => {
  it("points at the standalone results page and encodes the id", () => {
    expect(resultsHref("abc123")).toBe("/xeventsy/abc123/results");
    expect(resultsHref("a/b")).toBe("/xeventsy/a%2Fb/results");
  });
});
```

Append to `list-and-results.test.ts`:

```ts
describe("results page wiring", () => {
  it("list shows a Results link only for giveaways that are not drafts", () => {
    const page = read("page.tsx");
    expect(page).toContain("resultsHref(modal.id)");
    expect(page).toMatch(/hasVoteBlock\(modal\.blocks\)[\s\S]{0,200}modal\.status !== "draft"|modal\.status !== "draft"[\s\S]{0,200}hasVoteBlock\(modal\.blocks\)/);
  });

  it("results route renders ResultsShell", () => {
    expect(read("[id]", "results", "page.tsx")).toContain("ResultsShell");
  });

  it("ResultsShell reuses ResultsTab and shows promo stats when there is no vote block", () => {
    const shell = read("editor", "ResultsShell.tsx");
    expect(shell).toContain("<ResultsTab");
    expect(shell).toContain("stats.shown");
    expect(shell).toContain('href={`/xeventsy/${encodeURIComponent(record.id)}`}');
  });

  it("editor header links to the results page for a saved giveaway", () => {
    expect(read("editor", "EditorShell.tsx")).toContain("resultsHref(record.id)");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm exec vitest run src/app/xeventsy`

- [ ] **Step 3: Implement**

`editor/editor.ts`, add:

```ts
/** The standalone results page for a saved modal. */
export function resultsHref(id: string): string {
  return `/xeventsy/${encodeURIComponent(id)}/results`;
}
```

`[id]/results/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { ResultsShell } from "../../editor/ResultsShell";

export default function AdminEventModalResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResultsShell id={id} />;
}
```

`editor/ResultsShell.tsx` (model it on the top of `EditorShell.tsx`: same imports for `AdminNav`, `AdminLoginCard`, `useAdminSession`, `adminFetch`, `splitBackendMessage`, same page wrapper `min-h-screen bg-cloud px-6 py-7 md:px-9`, same header look and `STATUS_CHIP`/`BUTTON` classes). Behavior:

1. Export `ResultsShell({ id }: { id: string })`.
2. `useAdminSession()` → if no token render the same `AdminLoginCard` block as EditorShell.
3. Load `GET /${encodeURIComponent(id)}` via `adminFetch<{ eventModal: EventModalRecord }>` into `record`; keep an `error: string[]` (use `splitBackendMessage`) and a `refresh()` that reloads the record (this is the `onChanged` for ResultsTab).
4. Header: eyebrow "Admin · Results", `<h1>` = record title, status chip, and two links: `Back to list` (`/xeventsy`) and `Edit` (`href={`/xeventsy/${encodeURIComponent(record.id)}`}`).
5. Body: `const votes = voteBlocksOf(record.blocks)`.
   - If `votes.length > 0`: render `<ResultsTab ... />` with exactly the props EditorShell passes (`modalId={record.id}`, `voteBlocks={votes}`, `status={record.status}`, `token`, `onUnauthorized={handleUnauthorized}`, `onChanged={refresh}`, `resolution={record.resolution}`). Copy the real prop names from the `<ResultsTab` call in EditorShell.
   - Else (promo): three stat cards from `record.stats`: `record.stats.shown` ("Shown"), `record.stats.dismissed` ("Dismissed"), `record.stats.cta_clicked` ("Button clicks"), with a one-line note "Counts every impression, not unique users."

`page.tsx` (list): import `resultsHref` from `./editor/editor`; in the actions cell, next to Edit, add:

```tsx
{hasVoteBlock(modal.blocks) && modal.status !== "draft" ? (
  <Link className={`${ROW_BUTTON} border-cyan`} href={resultsHref(modal.id)}>
    Results
  </Link>
) : null}
```

`EditorShell.tsx`: import `resultsHref`; in the header actions, when `record && hasVote` render a `Link` styled with `BUTTON` to `resultsHref(record.id)` labelled "Results page". (`hasVote` is defined just above the return.)

- [ ] **Step 4: Run tests and type-check, expect PASS**

Run: `pnpm exec vitest run src/app/xeventsy && pnpm exec tsc --noEmit`

- [ ] **Step 5: Stop and ask before committing.** Message: `feat(event-modals): standalone results page and Results row action`

---

### Task 4: Manual check, review, docs

- [ ] **Step 1: Full test run:** `pnpm test` (expect all green) and `pnpm exec tsc --noEmit`.
- [ ] **Step 2: Manual check.** Confirm nothing is on :3000 first (`lsof -i :3000`). Start `BACKEND_API_URL=<local backend> pnpm dev` (without it, dev writes hit PRODUCTION data). Check: New match giveaway pre-fills 7 blocks; filling title, dates, rules, uploading an image and publishing works; New promo gives one image block; a giveaway row shows Results and it opens the entries table (email, answer, entered time); a draft giveaway and a promo row show no Results link; editing a modal that has entries still opens and the Results page link works.
- [ ] **Step 3: Review the diff** as if it were someone else's PR (invoke `reviewer` agent or `superpowers:requesting-code-review`).
- [ ] **Step 4: Docs.** Append a fact to `feedAI/facts.jsonl` (next free `f###`; check `tail -1 feedAI/facts.jsonl`): templates via `?template=promo|match`, standalone results route `/xeventsy/[id]/results` reusing `ResultsTab`, Results row action only for non-draft giveaways. Add a short note to the `xeventsy_event_modals` section of `feedAI/topics/admin-dashboard-ui.json`. Write `docs/sessions/2026-11-18_event-modals-results-and-templates.md`, append a row to `docs/sessions/INDEX.md`, and bump the `sync` block in `feedAI/brain.json`.
- [ ] **Step 5: Stop and ask before committing**, then (after the user confirms) push and `gh pr create`.

---

## Out of scope (YAGNI)

- Entrant count column on the list (needs a backend change; Results page shows `total`).
- Drag-and-drop, per-event timezone settings, richer promo analytics.
- Mobile vote UI and `EventModalHost` (separate plan, mobile repo).
