# 2026-11-27 data health clarity

**Problem:** After turning on ANALYTICS_COLLECTION_ENABLED, Data health showed red "No data" for every platform and looked broken.

**Cause:** Nothing was broken. The admin's own browser is excluded by /bff/events (admin token cookie), only analytics-consenting visitors count, and store app 1.2.5 only sends app_open from the start-up ping (14 pings a day).

**Fix:** `platformHealth()` (src/lib/insights/dataHealth.ts, tested): neutral "No events yet", red only when events stopped for 24h; a hint under each card saying what it counts; a note on "Sales without a saved snapshot".

**Open:** Full app events (screens, searches) need the next app release.
