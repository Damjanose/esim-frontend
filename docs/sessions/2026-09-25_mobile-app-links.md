---
date: 2026-09-25
focus: web
status: complete
---

# Session: mobile app links

## What was done
- Added `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` route handlers (JSON, no redirect), built from `src/lib/app-links.ts` and tested by `app-links.test.ts`.
- They let the mobile app claim `https://esim.uplisoft.com/checkout?package={id}`, the link its checkout share button now sends. With the app installed the link opens the app's checkout; otherwise it opens this site's `/checkout` for that package (signed-out visitors go through sign-in and come back).

- `OpenInAppBanner` (root layout, phones only): when the page is `/checkout?package=…` or `/signin?next=/checkout?package=…`, offers "Open in app" via `velocity-esim://pkg/{id}`, for the cases universal / App Links don't fire (Instagram/Facebook in-app browsers, pasted links).
- History: the Aug 16 spec (mobile `aab3769`, plan `884bac8`) already chose universal links + web fallback, but only the custom-scheme part shipped (mobile `4b5348a`); no `.well-known` files existed in any repo before this.

## Follow-ups
- If the Android app ships through Google Play with Play App Signing, add the Play "App signing key" SHA-256 to `ANDROID_SHA256_CERT_FINGERPRINTS`.
- Verify in production: `curl -i https://esim.uplisoft.com/.well-known/apple-app-site-association` must return 200 `application/json` with no redirect.
