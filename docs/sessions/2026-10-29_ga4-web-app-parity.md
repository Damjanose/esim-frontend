# 2026-10-29: GA4 web/app purchase parity

## What changed
- `transaction_id` for both the Google Ads `conversion` and the GA4 `purchase` on `/account/[orderId]?new=1` is now `order.payment_reference` (the Pokpay payment id, same as the app), falling back to `order.code` for legacy orders without one.
- `gaItem` (`src/lib/analytics.ts`) now builds items the way the app's `analyticsItemFromCheckout` does: `item_name` "Turkey 5GB 7 Days", `item_category` = catalog region, `item_category2` = `esim_package`. Applies to view_item, begin_checkout and purchase.
- `region` added to `HeroPackageOption` (catalog localStorage cache version bumped to 2) and `DestinationPlanRow`.

## Notes
- Purchase dedupe keys are built from the transaction id, so they change too. That's harmless because the event only fires on `?new=1`.
- Facts: f328 plus a troubleshooting entry.

## Follow-up review fixes
- **Missing:** web top-ups sent no GA4 `purchase` at all, while the app logs them as `esim_topup`. `TopUpPanel` now stashes the payment id, charged amount and item when the intent succeeds, and `TopUpConversion` sends the purchase on `?topup=1` (f329). Top-ups don't send a Google Ads conversion, same as before.
- `/esim/<slug>` `view_item` items now use each package's own API country name (what the app reports), falling back to the curated display name.
- `feedAI/topics/account-flows.json` no longer says the Ads conversion uses the order code.
- PR #13 review: the top-up purchase is now bound to the provisioned payment. The return route adds `payment=<id>` and the stash must match it, so an abandoned intent's stash is never reported.
- Top-up funnel parity: `TopUpPanel` sends `view_item` for the offers shown and `begin_checkout` when the payment starts. `add_payment_info` is left out because card entry happens on Pokpay's hosted page.
