# Admin users and OTP tracking

## Summary
Upgraded the hidden `/xloginy` dashboard to show total users, persisted user rows, and recent OTP request events alongside the existing purchase dashboard.

## Changes
- Added frontend data types for admin users and OTP request events.
- Added a “Total users” summary card.
- Added a users table with email, created date, updated date, OTP request count, and latest OTP timestamp.
- Added a recent OTP requests table with email, status, timestamp, and delivery error metadata.
- Kept the existing login form, purchase chart, and purchase table behavior unchanged.

## Verification
- `pnpm exec vitest run src/app/xloginy/admin-dashboard.test.ts`
- `pnpm test`
- `pnpm build`
