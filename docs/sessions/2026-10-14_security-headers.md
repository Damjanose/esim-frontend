# 2026-10-14 · security headers

**Focus:** web

## Why
A technical SEO audit of https://esim.uplisoft.com (claude-seo `/seo technical`, score 82/100, nothing critical) flagged three missing security headers. HSTS, X-Frame-Options and nosniff were already present, sent by the proxy in front of Next.

## What changed
- `next.config.mjs` `headers()`, `/:path*`:
  - `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`
- The CSP has no `script-src` / `style-src` on purpose. Next would need per-request nonces for those, which turns off static rendering and ISR. GTM, Meta Pixel, Google and Apple sign-in and Lottie would also each need allowlisting. `payment=()` is safe because Pokpay checkout is a redirect. Fact f280.

## Audit findings not acted on
- IndexNow: the audit only probed `/indexnow.txt`. The real key file is `public/f0cff59a….txt`, which returns 200, and `update.sh` pings IndexNow on every deploy (f138). Already done.
- Titles of 61–75 chars on `/esim/*` come from `brandedTitle()` appending ` | eSIM2you` (f273), which is a brand decision. Left as is.
- Core Web Vitals weren't measured because PSI hit its shared rate limit and there's no Google API key.

## Verified
- Temporary `next dev -p 3077` (no other dev server running): `/`, `/esim/france`, `/robots.txt`, `/checkout`, the IndexNow key file and `/images/*` all return the 3 headers. `/checkout` still has `X-Robots-Tag: noindex, nofollow` and `/images/*` keeps its immutable `Cache-Control`.
- After deploy: `curl -sI https://esim.uplisoft.com/ | grep -iE 'content-security|referrer|permissions'`, and check that Google and Apple sign-in and the Pokpay redirect still work.
