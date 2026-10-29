# E-SIM-frontend

Next.js 15 (App Router) site for eSIM2you: marketing, checkout, account and the hidden admin dashboard. It is a BFF in front of the `E-SIM backend` API; see `AGENTS.md` and `docs/overview.md`.

```bash
pnpm install
cp .env.example .env.local   # then fill in
pnpm dev                     # http://localhost:3000
pnpm test                    # vitest
pnpm build
```

Production runs as the `esim-frontend` systemd service on `127.0.0.1:3020` behind nginx; deploy with `update.sh`. Environment variables are documented in `.env.example`.

## Blog (Holo)

Posts at `/blog` and `/blog/<slug>` are written by [Holo](https://tryholo.ai) and pushed automatically:

1. Holo POSTs each article to `https://esim.uplisoft.com/api/holo-webhook`. nginx sends `/api` to the Express backend, which verifies the signature, upserts the post into Postgres (`BlogPost`) and answers `{ url }`. Contract: `E-SIM backend/docs/api/blog.md`.
2. The backend then calls this app's `POST /bff/blog/revalidate`, which expires the `blog` fetch-cache tag (index pages, related-post blocks, sitemaps) and runs `revalidatePath` for `/blog`, `/blog/<slug>` and the sitemaps. Pages also refresh themselves hourly.
3. The pages read posts from `GET /api/blog` and `GET /api/blog/:slug`. `/blog` lists every post newest first, 12 per page (`?page=N`); each post ends with 3 related posts. Posts are listed in `/sitemaps/blog.xml`.
4. Near-duplicate posts are listed in `DUPLICATE_POST_GROUPS` (`src/lib/blog.ts`): the older one stays live but its canonical names the newest, and only the newest is in the sitemap.

| Variable | Where | Value |
| --- | --- | --- |
| `HOLO_WEBHOOK_SECRET` | backend `.env` **and** this app's `.env.production` | The webhook signing secret from Holo. The same value in both places. |
| `BLOG_REVALIDATE_URL` | backend `.env` (optional) | Defaults to `https://esim.uplisoft.com/bff/blog/revalidate`. |

## Analytics (GA4 + Google Ads)

`src/app/GoogleTag.tsx` loads one gtag.js and configures GA4 (`NEXT_PUBLIC_GA_ID`, default `G-95H527D5BG`) after analytics consent and Google Ads after marketing consent. Page views: the config's first `page_view` plus GA4 enhanced measurement's history-change page views (keep "Page changes based on browser history events" **on** in the GA4 data stream; there is no manual page_view, so nothing double-counts).

GA4 events (`src/lib/analytics.ts`, `src/app/GaEvent.tsx`, all EUR): `view_item` on `/esim/<slug>` and `/pkg/<id>`, `begin_checkout` on `/checkout`, `purchase` once per order on `/account/<id>?new=1` (value = what checkout charged, discounts included), `login` (email/google/apple) and `generate_lead` (partner request).
