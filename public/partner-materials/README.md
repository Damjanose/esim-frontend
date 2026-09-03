# Partner promo materials — pending design assets

This directory is where the static partner promo-material files referenced by
`src/app/partners/materials/page.tsx` belong. **No real files exist here yet** —
Task 9.5 only wired up the download page; the artwork itself still needs to be
designed/supplied separately.

Expected files (filenames are already wired into the page — drop files in with
these exact names and the "Coming soon" state on the page will need to be
removed for that item):

| File | Format | Description |
| --- | --- | --- |
| `flyer-a4.pdf` | PDF | A4 flyer |
| `flyer-a5.pdf` | PDF | A5 flyer |
| `counter-card.pdf` | PDF | Hotel/venue counter card |
| `instagram-story.png` | PNG | Instagram story template |
| `instagram-post.png` | PNG | Instagram post template |
| `facebook-post.png` | PNG | Facebook post template |
| `whatsapp-share.png` | PNG | WhatsApp share image |

Per the design spec (`E-SIM backend/docs/superpowers/specs/2026-09-03-affiliate-partner-program-design.md`),
these are **static, generic templates** — not per-partner generated artwork
with a baked-in QR code. Partners pair these generic templates with their own
QR code/promo code, which the materials page renders separately (via
`QrCodeCard` and `CopyField`).

Do not commit placeholder/dummy binary files here — a partner clicking
"download" on a fake file would get something broken or misleading. Replace
this README's entries with real files once the artwork is ready, and update
the `MATERIALS` array in `src/app/partners/materials/page.tsx` to drop the
"Coming soon" flag for each one as it lands.
