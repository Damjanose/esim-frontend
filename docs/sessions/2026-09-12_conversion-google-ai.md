# Conversion, Google, and AI search follow-up

## Scope

Implemented the code and content portion of the “Lift conversion, then Google
and AI search” plan without editing the plan file.

## Completed

- Homepage no longer auto-opens the Help me choose wizard.
- Wizard closes via its close button, backdrop, or Escape and exposes dialog
  semantics.
- Navbar purchase CTA routes to `/destinations`; mobile navigation includes a
  drawer with a direct Browse eSIM plans CTA.
- Destination SEO hero uses the live lowest offer in its primary “Buy from
  €X.XX” CTA.
- Checkout sign-in explains that authentication keeps the eSIM and QR code in
  the account.
- Replaced the unsupported “Best value” rail label with “Featured plans”.
- Rewrote public support copy around website/account flows.
- Corrected `public/llms.txt` to canonical `/travel/*` guide paths, added a
  canonical USA destination URL, and fixed the support email.
- Added an AI-search outreach and monthly retest checklist.

## Verification

- Targeted Vitest suite: 492 tests passed.
- Browser-tested homepage wizard behavior, Escape close, mobile navigation,
  `/esim/usa`, `/support`, and checkout-targeted `/signin`.

## Manual production follow-up

- Cloudflare’s production robots policy still needs AI crawler access reviewed
  by an account owner; the dashboard is not available in this workspace.
- Google Search Console verification, sitemap submission, URL inspection, and
  Bing Webmaster submission require the site-owner account.
- Production `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` still needs restoring in the
  deployment environment; local code correctly renders Google when the variable
  is present.
