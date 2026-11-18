# 2026-11-18 event modals web admin

Built the web admin for in-app event modals at the hidden `/xeventsy` route (list, create, edit, publish, results). Plan: `docs/superpowers/plans/2026-11-18-event-modals-web-plan.md`. Facts: f354-f360.

- Registrations: `AdminNav` link in the Product group, `/xeventsy` in the `seo.ts` private prefixes, layout `indexable: false`.
- BFF under `src/app/bff/admin/event-modals/**`: JSON routes via `proxyAdminJson`, image upload forwards multipart, image read is public (no token, cached an hour), entries CSV passes the backend bytes and headers through.
- Editor (`editor/EditorShell.tsx`): draft and tab state live in React only, with a dirty flag. Nothing is saved in the browser, so an unsaved draft is lost on reload. Results shows only for a saved modal with a vote block. Block reorder is up/down buttons. Delete and archive use two-step confirms. No new dependencies.
- Preview: the phone preview comes from the backend preview endpoint through the BFF, shows the last saved version, and needs a saved modal.
- Schedule: `datetime-local` values are the admin's local time, converted to UTC ISO on save.
- Results: scoreboard, entries with CSV download, winners. The winners section carries the account-deletion warning.
- Gotcha: `next dev` hits the production backend unless `BACKEND_API_URL` is set (f004, f360). Editor writes in dev change live data.
- Docs: `feedAI/topics/admin-dashboard-ui.json` gained an `xeventsy_event_modals` section and the stale sessionStorage claim now says cookie (f182, f307). `brain.json` sync updated to branch `feat/event-modals-admin`.
