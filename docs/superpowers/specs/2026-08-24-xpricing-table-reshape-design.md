# /xpricing table reshape — design

## Problem
`/xpricing` (admin package pricing page, `src/app/xpricing/page.tsx`) shows one combined
"Package" cell (title/country/type/id) plus Original price, Retail price, Discount, Final
price, Save. The user wants the table to instead surface, per row: coverage (country +
flag), connection type, network/operator, data package size, and validity — matching a
reseller-style pricing table layout — while keeping retail price editable (the existing
free-text input already supports setting it above cost, i.e. "increasing" the price) and
keeping the existing discount + save controls.

## Backend change
`E-SIM backend/src/routes/admin.ts`, `serializePricingRow()` and its two callers
(`GET /admin/packages/pricing`, `PUT /admin/packages/pricing/:packageId`): add four fields
sourced from the cached `AiraloPackage` object (`listCachedPackages()`), no new provider
calls needed:

- `countryCode: string | null` — `pkg.countryCode ?? pkg.slug ?? null`
- `flagUrl: string | null` — `pkg.country?.image?.url ?? null`
- `network: string | null` — `pkg.operators.map(o => o.title).join(', ') || null`
- `dataLabel: string` — `pkg.data` (already formatted, e.g. `"10 GB"`)
- `durationDays: number` — `pkg.day`

`serializePricingRow` currently takes `(packageId, title, country, type, originalPrice,
override)`; extend its signature to accept the full `AiraloPackage` (or the specific new
fields) instead of threading five more positional params.

## Frontend change
`E-SIM-frontend/src/app/xpricing/page.tsx`:

- Extend the `PricingRow` type with `countryCode`, `flagUrl`, `network`, `dataLabel`,
  `durationDays`.
- Replace the single "Package" column with: **Coverage** (flag `<img>` + country name),
  **Type** (small icon keyed off `row.type`: local/regional/global — reuse an existing
  lucide icon, e.g. `Globe`/`MapPin`/`Signal`), **Network** (`row.network ?? '—'`),
  **Package** (`row.dataLabel`), **Validity** (`` `${row.durationDays} days` ``).
- Keep **Retail price** (editable input, unchanged behavior) and **Price** (bold final
  price, unchanged calc) in the same position as today.
- Keep **Discount** and **Save** as trailing columns after Price — screenshot doesn't
  show them but the row-level discount config and save action stay necessary.
- Drop the standalone "Original price" column (no longer shown) — cost price stays
  available server-side for the retail-price-defaults-to-cost logic but isn't rendered.
- No change to the top summary cards, search bar, or bulk-discount panel.
- Update `src/app/xpricing/admin-package-pricing.test.ts` for the new fields/columns as
  needed.

## Out of scope
- No new "quick increase by %" control — the existing free-text retail price input plus
  Save already lets an admin set any (including higher) retail price.
- No change to bulk-discount behavior.
- No change to the customer-facing marketplace/checkout pricing display.
