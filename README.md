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
2. The backend then calls this app's `POST /bff/blog/revalidate`, which runs `revalidatePath` for `/blog`, `/blog/<slug>` and the sitemaps. Pages also refresh themselves hourly.
3. The pages read posts from `GET /api/blog` and `GET /api/blog/:slug`. Posts are listed in `/sitemaps/blog.xml`.

| Variable | Where | Value |
| --- | --- | --- |
| `HOLO_WEBHOOK_SECRET` | backend `.env` **and** this app's `.env.production` | The webhook signing secret from Holo. The same value in both places. |
| `BLOG_REVALIDATE_URL` | backend `.env` (optional) | Defaults to `https://esim.uplisoft.com/bff/blog/revalidate`. |
