# Partner promo materials — creative brief + per-file rollout — design

## Problem
`/partners/materials` (`src/app/partners/materials/page.tsx`) already renders 7 promo
template downloads, but no artwork exists yet — every entry shows a "Coming soon" badge
(`comingSoon: true`), per `public/partner-materials/README.md`. An external designer will
supply the actual files. Two things are needed: (1) a brief the designer can work from
without needing to read this codebase, and (2) a repeatable process for wiring each file
in as it's delivered, without waiting for the full set of 7.

## Deliverable 1 — Designer brief
A new file, `docs/partner-materials-brief.md` (repo docs, not the superpowers specs
folder — this one is meant to be handed to a non-engineer). Contents:

- **Brand assets**: `public/logo-full.png` (horizontal lockup) and `public/logo-icon.png`
  (mark only) as the source logos. Palette from `tailwind.config.ts`: `brandBlue #0B49B7`,
  `brandTeal #09C3BE`, `brandInk #061131` as primary/accent/text, `mist #dff6fa` and
  `cloud #f4fbfd` as light supporting tones. Fonts: display headings in Hanken Grotesk
  (bold/black weight), body text in Inter.
- **Hard constraint, called out prominently**: no QR code or promo code is baked into any
  template. Each partner's QR/code renders separately, over their own referral link
  (`QrCodeCard`/`CopyField` on the same page). Every template must reserve visible empty
  space — a corner box or dedicated panel — labeled placeholder-style (e.g. "[ Partner QR
  code + promo code go here ]") so the designer sizes their layout around it and a partner
  isn't left improvising where to add their code after printing/exporting.
- **Per-asset spec table** — for each of the 7 files, exact output filename (matching
  `public/partner-materials/README.md`'s existing table exactly), format, dimensions, and
  a short copy suggestion (headline + 2-3 value-prop bullets + CTA). Value props to draw
  from: instant activation (no physical SIM swap), works the moment you land, no roaming
  bill surprises.

  | File | Format | Dimensions | Placeholder zone |
  | --- | --- | --- | --- |
  | `flyer-a4.pdf` | PDF, print-ready (300dpi, CMYK if the designer's tooling supports it) | A4 portrait, 210×297mm | Bottom third or side panel |
  | `flyer-a5.pdf` | PDF, print-ready | A5 portrait, 148×210mm | Bottom third |
  | `counter-card.pdf` | PDF, print-ready | Standard tent/standee, e.g. 100×150mm per face | Front face, prominent |
  | `instagram-story.png` | PNG | 1080×1920 | Lower third (thumb-safe zone) |
  | `instagram-post.png` | PNG | 1080×1080 | Corner or bottom band |
  | `facebook-post.png` | PNG | 1200×630 | Corner or bottom band |
  | `whatsapp-share.png` | PNG | 1080×1080 | Corner or bottom band |

- **Delivery instructions**: file naming must match the table exactly (case-sensitive),
  PNGs delivered flat (no transparency needed since QR overlay isn't baked in), PDFs
  should embed fonts. Files can be delivered incrementally — no need to wait for all 7.

## Deliverable 2 — Per-file rollout process
Documented as a short section in the same brief (or a sibling note near
`public/partner-materials/README.md`) plus the actual code changes made each time a file
lands. For each delivered file:

1. Add it to `public/partner-materials/<filename>` (exact name from the table above).
2. In `src/app/partners/materials/page.tsx`, flip that one entry's `comingSoon: true` to
   `false` — leave every other (not-yet-delivered) entry untouched.
3. Update `public/partner-materials/README.md`: move the delivered filename's row (or mark
   it) as landed, so the README stops claiming "no real files exist here yet" once at least
   one has.
4. Update `partners-materials.test.ts`:
   - Replace the `"marks every template as coming soon..."` test (which currently asserts
     exactly 7 `comingSoon: true` and zero `comingSoon: false`) with a self-updating
     assertion: for each entry in `MATERIALS`, check `fs.existsSync("public" + href)` and
     assert `comingSoon` is `false` exactly when the file exists (and `true` otherwise) —
     not a hardcoded allow-list, which would need a manual edit on every file drop and
     defeats the point of making this self-updating.
   - The README test (`"explains the directory holds pending design assets"`) needs to
     become conditional or split: once ≥1 file has landed, the README will no longer say
     "no real files exist here yet" for that file, so assert on the per-row content
     instead of the blanket disclaimer once the first file lands.
5. No feedAI fact needed per-file — this is a content delivery, not a behavior change.
   One fact is added the first time any file lands, per root `CLAUDE.md`'s "shipping a
   feature" rule, noting that `/partners/materials` now serves at least one real
   downloadable template (so a future session doesn't assume the page is still all
   placeholders).

## Out of scope
- No code renders or generates the artwork itself — it's designer-supplied.
- No change to the page's static intro copy ("Artwork is on its way — check back soon.")
  as files land partially — it stays as-is until all 7 are delivered. Deliberate: keeping
  it accurate mid-rollout ("3 of 7 ready") isn't worth the added state/copy-branching for
  a page every partner can already see is filling in via the per-card badges.
- No per-partner artwork generation (baking promo code/QR into the file server-side) —
  confirmed out of scope by the existing design spec
  (`E-SIM backend/docs/superpowers/specs/2026-09-03-affiliate-partner-program-design.md`)
  and unchanged here.
- No change to the page's layout, gating logic, or the QR/CopyField rendering — only the
  `MATERIALS` array's `comingSoon` flags change, one at a time.
