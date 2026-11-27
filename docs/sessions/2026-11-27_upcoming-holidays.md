# 2026-11-27 upcoming holidays

**Goal:** Use global holidays on the /xinsightsy Daily trend to plan discounts.

**What changed**
- `TrendSection.tsx`: new Upcoming holidays panel under the chart: the next 90 days of built-in holidays, days away, and a link per market to `/xpricing?q=<country>` (worldwide dates open all of pricing).
- `src/lib/insights/holidays.ts` (+ test): range, filter/sort, days-away label, pricing link.
- `ChartNote.markets` (optional) added to match the backend; `useChartNotes` takes just `{ from, to }`.
- `/xpricing` fills its search box from `?q=`.

**Open**
- Needs the backend branch feat/global-holidays deployed for the global list and markets; until then the panel shows the old US/UK dates with a plain pricing link.
- Browser check of the panel at 375px still open.
