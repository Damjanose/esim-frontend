# 2026-10-29: GA4 web/app purchase parity

## What changed
- `transaction_id` for both the Google Ads `conversion` and the GA4 `purchase` on `/account/[orderId]?new=1` is now `order.payment_reference` (the Pokpay payment id, same as the app), falling back to `order.code` for legacy orders without one.
- `gaItem` (`src/lib/analytics.ts`) now builds items the way the app's `analyticsItemFromCheckout` does: `item_name` "Turkey 5GB 7 Days", `item_category` = catalog region, `item_category2` = `esim_package`. Applies to view_item, begin_checkout and purchase.
- `region` added to `HeroPackageOption` (catalog localStorage cache version bumped to 2) and `DestinationPlanRow`.

## Notes
- Purchase dedupe keys are built from the transaction id, so they change too. That's harmless because the event only fires on `?new=1`.
- Facts: f328 plus a troubleshooting entry.
