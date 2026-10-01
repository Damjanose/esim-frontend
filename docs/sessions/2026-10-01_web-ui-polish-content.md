# 2026-10-01: Web UI polish, phase 8: content pages

## Goal
Spec option 8B: keep the structure and restyle with the new tokens, type and cards. This covers `/travel/*`, `/use-cases/*`, `/compare/*` and their hubs, `/policy`, `/terms` and `/support`. Content, links and JSON-LD are unchanged. Plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase8-content.md`.

## What changed
- **Shared**: `contentClasses.ts`, `ContentFaq.tsx` and `retiredTokens.ts`, the last being a guard used by the new tests.
- **SeoContentPage**:
  - a light hero band and card sections;
  - a Related panel that stacks on phones and is deliberately not sticky;
  - a 44px back link and the shared FAQ;
  - the **App Store** link is the single gradient (US-first, a controller decision), and Google Play is flat.
- **Hubs and compare**: whole-card links, 44px breadcrumbs, the table in a positioned box (f195), the shared FAQ.
- **Legal**: off the retired dark-theme tokens. This fixes the `text-cyan` contrast failure (a11y 0.96 → 1).
- **/support**:
  - `overflow-x-clip`, so the FAQ intro now actually sticks;
  - a 44px search field and clear button;
  - the empty-state button is flat, leaving one gradient: Email support.

## Verification
- `pnpm test`: 97 files, 716 passed. The one failure is the known one, from the owner's homepage WIP. `tsc` is clean.
- `pnpm build`: hubs, legal and support stay ○ and the slug pages stay ●.
- **Content snapshot diff against the pre-phase baseline**: JSON-LD, visible text and hrefs are identical on all 32 prerendered content routes.
- **Playwright matrix**: 48 checks (9 pages × 5 widths plus 3 support search states), 0 issues.
- **Lighthouse mobile**: `/support`, `/policy` and `/travel/how-to-install-esim` all score a11y 1 with CLS 0.

## Owner WIP handling
During this phase the owner's homepage WIP was **staged** in the index: `page.tsx`, `how-it-works.test.ts` and both images. Every phase 8 commit used `git commit --only -- <paths>`, so it carries only its own files. The owner's staged files are still staged and uncommitted (fact f226).

## Follow-ups (final pass)
- Legal pages have no Navbar or dock. That's pinned by tests, and it's a small switch if wanted.
- The compare table at 320px scrolls but isn't keyboard-focusable. This was already the case before.

## Commits
`609b884` plan, `ce838a5` shared pieces, `baac07e` SeoContentPage, `cd5ef3f` hubs + compare, `4ab126f` legal, `e547f7c` support, then this docs/feedAI commit.
