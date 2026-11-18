# 2026-11-18 event modals: results page and templates

Added to the `/xeventsy` admin: one-click templates for an image-only promo and a match-prediction giveaway, and a standalone results page reachable from the list without opening the editor. Plan: `docs/superpowers/plans/2026-11-18-event-modals-results-and-templates.md`. Fact: f363.

- Templates: `src/app/xeventsy/templates.ts` (pure). The list has "New match giveaway", "New promo (image)" and "Blank", linking to `/xeventsy/new?template=match|promo`. The `[id]` page reads the `searchParams` promise and `EditorShell` seeds the draft only for id `new`.
- Match template: image, heading, countdown to `votingClosesAt`, one `choice` vote (Home win / Draw / Away win, 1 point), results, winner, rules link, frequency `until_voted`. Title, dates, rules text and the image upload are still the admin's job.
- Results: `/xeventsy/[id]/results` (`editor/ResultsShell.tsx`) reuses `ResultsTab` (entries with email, answer, entered time; CSV; disqualify; resolution; scoreboard; winners). A modal with no vote block shows shown / dismissed / button-click cards. The list shows a Results action for non-draft giveaways; the editor header links to it too.
- No backend change. Promo vs giveaway still comes from `hasVoteBlock`.
- Test change: `admin-event-modals.test.ts` pinned the old "New event modal" label and now checks the new labels.
- Not done: manual browser check (dev hits the production backend unless `BACKEND_API_URL` is set, f004); mobile vote UI is a separate plan.

- Follow-up: removed the Bottom sheet / Centered modal choice; events always save as `modal` (f364).
