# Brand domain: stop losing "esim2you" visitors

## Why

The brand is **eSIM2you**, but the site lives on `esim.uplisoft.com`. As of 2026-10-08:

- Typing "esim2you" in an address bar autocompletes to `esim2you.com`, a STRATO "domain reserved" placeholder we don't control.
- Searching "esim2you" can surface `www.esim2me.com`, a competing eSIM shop with a near-identical name.

Code can't stop a browser from opening someone else's domain. The real fix is to own the brand domain (part A). Part B lists what we can do before that, and part C is the move itself.

## A. Get the domain (owner action)

1. Check who holds `esim2you.com` (WHOIS, or ask STRATO). If it's ours, go to part C. If it isn't, make an offer through the registrar or a broker.
2. If it can't be had, register the closest available name (`esim2you.app`, `getesim2you.com`, `esim2you.eu`) and the common typos (`esim2u.com`, `esimtoyou.com`).
3. Point every domain we own at the server, even the ones that won't be canonical, and list them in `NEXT_PUBLIC_SITE_ALIAS_HOSTS`. The middleware 308s all of them to the canonical host.

## B. Brand signals that help right now (no domain needed)

The code side shipped on 2026-10-08:
- WebSite and Organization JSON-LD carry `alternateName: ["esim2you"]` (the lowercase form people type), which Google's site-name system reads. The Organization node also has `description` and a `contactPoint`.
- The brand is spelled **eSIM2you** everywhere on the site, and a test (`seo.test.ts` "brand spelling") fails on any variant.
- `/about` (AboutPage) and `/contact` (ContactPage) pages tie the brand to the Organization and are linked from the footer.
- Off-site mentions: follow `docs/brand-outreach-kit.md`.
- Organization `sameAs` lists Instagram, Facebook, the App Store and Google Play.

Still manual:
- [ ] **Search Console**: add a Domain property for `esim.uplisoft.com`, or use the HTML-tag method by setting `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in `.env.production` and redeploying. Submit `/sitemap.xml`, then request indexing of `/`.
- [ ] **Bing Webmaster**: verify with its own method (`NEXT_PUBLIC_BING_SITE_VERIFICATION`), not the GSC import. The GSC import is why IndexNow returns 403 (see `scripts/ping-indexnow.mjs`).
- [ ] **App Store Connect / Play Console**: set the marketing or website URL to the site. Google uses store listings as entity evidence.
- [ ] **Instagram / Facebook bios**: link the site.
- [ ] **One spelling off-site too**: the website is now "eSIM2you" everywhere. Make the App Store and Play listing names, the mobile app's display name and strings (velocity-eSim i18n), and the social profile names match.
- [ ] **Google Business Profile** (if eligible): it gives the brand a knowledge panel that outranks look-alikes.
- [ ] **Branded ads**: a small Google Ads campaign on the exact keyword "esim2you". It's cheap because nobody else bids on it, and it puts us above esim2me for that query.

## C. Moving the site to the brand domain

Do these in order, all on the same day.

### Server
1. DNS: A records for the apex and `www` → the production server IP.
2. Nginx: add the new names to the existing `server_name`, or copy the server block. The routing stays the same: `/` → `127.0.0.1:3020`, `/api` and `/socket.io` → `127.0.0.1:4010`. **Keep the `esim.uplisoft.com` block serving `/api` and `/socket.io` unchanged**, because shipped mobile builds hardcode `https://esim.uplisoft.com/api` (feedAI f028).
3. Certbot: `certbot --nginx -d <new> -d www.<new>`.

### Web (this repo)
4. In `.env.production`, set `NEXT_PUBLIC_SITE_HOST=<new>`. The old host becomes an alias and 308s every page to the new one. `.well-known/*` is never redirected, so app-link verification keeps working on both hosts.
5. Update `PUBLIC_FRONTEND_URL` and `PUBLIC_HEALTH_URL` in `update.sh` (leave `PUBLIC_API_URL` as-is, or move it too once the backend is reachable on the new host).
6. Regenerate `public/images/qr-esim-uplisoft.svg` for the new host. `/llms.txt` is generated from `siteUrl` (`src/content/llms.ts`), so it needs no edit.
7. Update the tests that assert the literal host (`grep -rln esim.uplisoft.com src | grep test`), then run `pnpm test`.
8. Deploy with `update.sh`. It pings IndexNow with the new host.

### Third parties
9. Google Cloud OAuth client: add `https://<new>` to Authorized JavaScript origins. Missing origins caused `redirect_uri_mismatch` before (f014).
10. Apple Services ID (`com.uplisoft.velocityesim.web`): add the domain and return URL `https://<new>/signin`.
11. Pokpay: add the new return and callback URLs to the merchant allowlist.
12. Backend: add the new origin to CORS and to any `PUBLIC_SITE_ORIGIN` / email link base, so that receipt and OTP emails link to the new host.
13. Mobile (velocity-eSim): build with `EXPO_PUBLIC_SITE_HOST=<new>`. Share and site links switch to it, `app.config.ts` adds it to the Android App Links (applied by the release build's prebuild) and to the iOS associated domains. Also add `applinks:<new>` to `ios/VelocityeSIM/*.entitlements` by hand, because ios/ is committed and not regenerated. Links on the old host keep opening the app. Ship this build only after the new host serves the AASA and assetlinks files: Android 11 and older drop App Links for every host if any one fails verification.

### Search engines
14. Search Console: verify the new property, then on the **old** property use Settings → Change of address → new property. Submit the new sitemap.
15. Bing Webmaster: the Site Move tool, then a new sitemap.
16. Watch GSC for 4–8 weeks. A temporary dip is normal, but a drop of more than 20% that doesn't recover means some redirect or canonical was missed.

## Verify

```bash
curl -sI https://esim2you.com/esim/usa            # 308 → https://<canonical>/esim/usa
curl -sI https://www.esim.uplisoft.com/            # 308 → https://<canonical>/
curl -sI https://<canonical>/.well-known/apple-app-site-association   # 200, no redirect
curl -s https://<canonical>/ | grep -o '"alternateName":[^]]*]'
```
