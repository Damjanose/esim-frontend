# Hidden Admin Dashboard

## What existed before
The web frontend had public landing, policy, terms, and package proxy routes, but no admin-only purchase dashboard.

## What was done
- Added hidden `/xloginy` Next route without linking it from the homepage navigation or footer.
- Added an admin login form that stores the returned admin token in `sessionStorage`.
- Added dashboard summary cards, a CSS/SVG purchases-over-time chart, and a purchase table with email, package, price, status, and purchase date.
- Added local proxy routes for `/api/admin/login` and `/api/admin/dashboard`.
- Added source-level tests for route existence, hidden navigation behavior, dashboard UI requirements, and proxy routes.

## How it was done
The page is a client component so it can handle login state and token storage locally. The graph is built with inline SVG to avoid adding a chart dependency.

## Outcome
Frontend `pnpm test` and `pnpm build` pass, and the production build includes `/xloginy` plus both admin API proxy routes.
