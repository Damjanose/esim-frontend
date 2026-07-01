# Frontend Landing Page

## Summary

Created the initial public Velocity eSIM frontend in the previously empty `E-SIM-frontend` repo. The project is a Next.js App Router site with TypeScript, Tailwind CSS, lucide icons, and a small Vitest content contract.

## What Changed

- Added Next.js project configuration and pnpm scripts.
- Added typed landing content in `src/content/landing.ts`.
- Added a responsive landing page in `src/app/page.tsx`.
- Added global Tailwind styles in `src/app/globals.css`.
- Added metadata in `src/app/layout.tsx`.
- Added a content test in `src/content/landing.test.ts`.

## Verification

- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm dev --hostname 127.0.0.1 --port 3000` started successfully.
- `curl -I http://127.0.0.1:3000` returned `HTTP/1.1 200 OK`.

## Notes

The first version is intentionally public and informational only. There is no login, checkout, or backend integration. Footer and FAQ content leave space for support and contact pages later.

