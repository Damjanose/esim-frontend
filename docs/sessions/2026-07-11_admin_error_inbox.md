# Admin Error Inbox

## What existed before
The frontend had the hidden `/xloginy` purchase dashboard and admin proxy routes, but no dedicated page for debugging failed backend requests.

## What was done
- Added hidden `/xerrors` route with a plain admin utility layout.
- Reused the existing admin login token storage behavior.
- Added filters for email, request ID, area, severity, and unresolved-only mode.
- Added a dense error table and detail panel with sanitized request/query data, safe cURL, notes, resolve, and conditional repair controls.
- Added Next API proxy routes for error list/detail/update/repair.

## Verification
- `pnpm test`
- `pnpm build`
