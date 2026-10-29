# 2026-10-30: Admin operations dashboard

## What changed
- Replaced the chart with UTC daily finances and currency-separated totals.
- Added searchable purchases, expandable package/provider details and Users/OTP tabs.
- Added a protected provider-details BFF route; refresh failures retain data and superseded requests are aborted.

## Validation
- Typecheck passed; 137 test files and 1,073 tests passed.
- Backend build passed; its full suite currently has five auth/notification test failures.
- Live provider and browser validation were not performed in this commit session.
