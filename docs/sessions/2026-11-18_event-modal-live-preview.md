# 2026-11-18 event modal live preview + AI translation

- `/xeventsy` editor: sticky live phone preview of the unsaved draft (debounced 500ms, phase + language pickers) via new BFF route `bff/admin/event-modals/preview-draft`. Facts: f362.
- Removed the manual Translations tab: admins write English only; the backend AI-translates for each user's app language (backend facts f423, f424).
- Backend dependency: preview-draft endpoint + `EventModalTextTranslation` migration must be deployed before this web change works.
