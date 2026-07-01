# Legal Pages And Hydration Warning Fix

## Summary

Fixed the Next.js hydration warning caused by browser-injected root attributes and added public legal pages linked from the footer.

## What Changed

- Added `suppressHydrationWarning` to the root `<html>` and `<body>` elements in `src/app/layout.tsx` to avoid noisy mismatches from pre-hydration browser extension attributes such as `cz-shortcut-listen`.
- Updated footer links so Policy routes to `/policy`, Terms routes to `/terms`, and Contact uses `esim@uplisoft.com`.
- Added shared legal document content in `src/content/legal.ts`, using the same Terms and Privacy Policy substance as the mobile app legal screens.
- Added `/policy` and `/terms` App Router pages with a shared legal document renderer.
- Added `src/app/legal-pages.test.ts` to cover the footer links, legal route files, and hydration-warning suppression.
- Updated `.gitignore` for the generated `tsconfig.tsbuildinfo` file.

## Verification

- `pnpm test` passed.
- `pnpm exec tsc --noEmit` passed.
- `pnpm build` passed and prerendered `/policy` and `/terms`.

## Notes

The hydration stack trace showed `cz-shortcut-listen="true"` on `<body>`, which is not produced by this app. That attribute is commonly injected by browser tooling or extensions before React hydrates, so the fix suppresses hydration warnings only at the root shell where those external attributes appear.
