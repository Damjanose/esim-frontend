# Apple Services ID wiring (and a Google client id pasted into the Apple slot)

**Date:** 2026-08-13

## Problem

Reported as "Google auth and Apple are not working."

## Cause

Two independent faults. Neither was missing code — the mobile app, the web app
and the backend all had complete, correct implementations.

### 1. A Google client id was pasted into the Apple Services ID slot (web)

`.env.local` and `.env.production` both had:

```
NEXT_PUBLIC_APPLE_SERVICES_ID=275860271813-iq11qhopopcu46da2g7qjpcfu2amd1bl.apps.googleusercontent.com
```

That string is the `CLIENT_ID` field of `velocity-eSim/GoogleService-Info.plist` —
the Google **iOS OAuth client id**. It is not an Apple Services ID.

The underlying misconception is worth recording: velocity's `google-services.json`
and `GoogleService-Info.plist` contain *only Google* credentials. Apple web sign-in
needs an identifier that appears in neither file and can only be created in the
Apple Developer portal. No amount of copying files from the mobile repo supplies it.

Effect, per `src/app/signin/SocialSignInButtons.tsx`: the render guard at line 261
only checks for a **non-empty** value, so the button appeared, then
`AppleID.auth.init({ clientId: <google id> })` (line 211) failed with
`invalid_client`. Before the paste the button was correctly hidden — so the paste
converted "absent" into "visible and broken", which is strictly worse. The comment
directly above the value in `.env.production` had already warned "Do not paste a
Google client id here."

### 2. The backend had no Apple audience configured at all

`E-SIM backend/.env` set `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY`
but neither `APPLE_BUNDLE_ID` nor `APPLE_SERVICES_ID`. Since
`config.apple.enabled = Boolean(appleBundleId || appleServicesId)`, Apple sign-in
was disabled server-side and `/auth/social/apple` returned 503 — breaking the
**mobile** app against a local backend too, independently of the web bug.

(Production answered 401 rather than 503 on a bogus token, so the deployed
environment does carry a bundle id; only the local `.env` was short.)

## Change

- `NEXT_PUBLIC_APPLE_SERVICES_ID=com.uplisoft.velocityesim.web` in `.env.local`
  and `.env.production`.
- Added `APPLE_BUNDLE_ID` and `APPLE_SERVICES_ID` to the backend `.env`.
- Expanded the comments in all three files plus `.env.example` to state what the
  value is not (bundle id, Google client id) and what the portal must contain.

### Why the Services ID is not `com.uplisoft.velocityesim`

The request was to "keep the same mobile and web". Apple does not permit a
Services ID to equal an App ID, so the identifiers cannot literally match. What
is shared instead — and what actually produces one account across both platforms
— is registering the Services ID under the **same primary App ID**
(`com.uplisoft.velocityesim`, team `R72R8C56GK`). Apple then issues the same `sub`
for a given user on mobile and web, and the backend already accepts both strings
(`audiences: [appleBundleId, appleServicesId]`).

## Verification

- `config.apple.enabled` `false → true`; audiences now
  `['com.uplisoft.velocityesim', 'com.uplisoft.velocityesim.web']`;
  `revocationEnabled = true`.
- Backend: 305 tests pass (42 files). `tsc --noEmit` clean.
- Web: `vitest run src/app/signin` 9 tests pass; `next build` succeeds.
- Built bundle `chunks/app/signin/page-*.js` contains
  `com.uplisoft.velocityesim.web` and the Google web client id, and no longer
  contains the stray `iq11…` iOS id.

## Still required outside the code (cannot be done from here)

1. **Apple Developer portal** → Identifiers → Services IDs → create
   `com.uplisoft.velocityesim.web`, enable Sign in with Apple, group it under
   primary App ID `com.uplisoft.velocityesim`, domain `esim.uplisoft.com`,
   return URLs `https://esim.uplisoft.com/signin` and
   `http://localhost:3000/signin`. **Until this exists the Apple button renders
   and fails** — the env value alone does not create it.
2. **Apple Developer portal** → enable the "Sign in with Apple" capability on the
   App ID itself (the entitlement in `ios/VelocityeSIM/VelocityeSIM.entitlements`
   does not grant it server-side).
3. **Google Cloud Console** → add `https://esim.uplisoft.com` as an Authorized
   JavaScript origin on web OAuth client `275860271813-vt4mc…`. **Confirmed** —
   see the addendum below.
4. Deploy the backend with the two new Apple env vars.

## Mobile was already correct

Checked and found sound, no changes needed: both keystore SHA-1s are registered in
`google-services.json` (release `3F:99:18:08…`, debug `5E:8F:16:06…`), the reversed
iOS client id is present in `ios/VelocityeSIM/Info.plist` as a URL scheme, the
Apple entitlement is in the entitlements file, and `.env` carries both Google
client ids. If Google fails on a Play Store build specifically, suspect Play App
Signing — Google re-signs with its own key, whose SHA-1 differs from the local
release keystore and is not in `google-services.json`.

---

## Addendum — the Google failure, root-caused

Reported symptom: *"Access blocked: Authorisation error — You can't sign in to
this app because it doesn't comply with Google's OAuth 2.0 policy."*

That wording reads like a policy/verification rejection. It is not. It is
Google's generic body text for **`redirect_uri_mismatch`**.

### How it was isolated

The button *renders* on production `/signin`, which rules out a client-id or
script-load problem. GIS does not redirect to a normal URL — its popup uses a
`storagerelay://<scheme>/<host>` redirect URI, which Google validates against the
client's **Authorized JavaScript origins**. Probing the authorization endpoint
directly with everything held constant except the origin:

| Origin | Google's response |
|---|---|
| `https://esim.uplisoft.com` | `Error 400: redirect_uri_mismatch` |
| `http://localhost:3000` | account chooser renders, "to continue to Velocity eSIM" |

Decoding the `authError` parameter on the failing response:

```
redirect_uri_mismatch
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
If you're the app developer, register the JavaScript origin in the Google Cloud Console.
  https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#authorization-errors-origin-mismatch
origin  https://esim.uplisoft.com
```

### Conclusion

`http://localhost:3000` is registered as an Authorized JavaScript origin;
`https://esim.uplisoft.com` is not. This is why Google sign-in works locally and
fails on production. The consent screen is correctly configured and the app is not
awaiting verification — both were visible in the localhost run.

**There is no code fix.** Google Cloud Console → APIs & Services → Credentials →
OAuth 2.0 Client ID `275860271813-vt4mc…` → Authorized JavaScript origins → add
`https://esim.uplisoft.com`.

### Resolved

Added `https://esim.uplisoft.com` to **Authorised JavaScript origins** on client
`275860271813-vt4mc…` (Google Cloud console → Google Auth Platform → Clients).

The stored list before the change was `http://localhost`, `http://localhost:5000`,
`https://velocity-esim.firebaseapp.com` — confirming the production origin was
absent. Note `http://localhost:3000` was never listed either; the localhost probe
still passed because **Google ignores the port for localhost origins**, which is
why the bug only ever manifested in production.

Re-running the identical probe after saving:

```
before:  Error 400: origin_mismatch
after :  "Choose an account — to continue to uplisoft.com"
         app_domain=https://esim.uplisoft.com
```

No code change was involved in this fix.
