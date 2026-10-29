# Admin operations dashboard

User delegated design and implementation choices: “you pick the best option also to be UI/UX friendly”. Focus web, with a backend contract extension. Stay on main in both repos; no commits or worktrees.

## Outcome
Replace the unused graph with an operations dashboard. Today’s revenue and estimated profit are always visible independently of the selected month. A daily earnings table shows purchases, revenue, estimated Airalo cost and estimated profit with separate currency amounts. UTC defines days and month boundaries and is visible in the UI. Profit is before payment fees and partner commissions; current catalogue costs are estimates, never historical net profit. Missing cost must not silently become zero. All-time totals must not be truncated to the latest 1000 orders.

Searchable purchases show customer, meaningful package title/destination/allowance/duration, paid amount, Airalo package status and remaining units. Expand a purchase for ICCIDs, provider activation/expiry, payment and order identifiers. Provider checks run separately from the dashboard load, with cached responses, timestamps, explicit unavailable/error states and retry. Never derive activation from local payment status or infer profile installation. Match package history carefully; never borrow an unrelated top-up’s status. Unlimited plans display Unlimited; missing usage displays unavailable.

Users and OTP activity are secondary tabs. Clicking a customer’s packages searches across purchases. Keep shared admin auth/nav and hidden route. Responsive layout, labelled inputs, keyboard-operable expansion, live errors, stable refreshing state and empty states.

## Approaches
1. Cosmetic graph replacement would leave payment status and opaque package IDs, so it does not meet the request.
2. Recommended and selected by delegated judgment: extend existing dashboard and add an admin-only provider detail endpoint, using existing Airalo services; no schema migration.
3. Persist accounting snapshots and continuously sync all provider states: useful later, but adds schema/jobs and cannot reconstruct old fees/costs.

## Contract
Existing GET /admin/dashboard remains compatible. Add reportingTimezone: UTC; today and dailyEarnings rows use date, purchases, revenueByCurrency, costByCurrency, profitByCurrency, missingCostCount. Add packageTitle, destination, dataLabel, durationDays, network, iccids to each purchase. Search query q filters purchase rows/count only; period financial totals stay independent of search. Users can link to the exact customer filter via userEmail query.

GET /admin/dashboard/purchases/:id/provider is admin authenticated and read-only. Returns {checkedAt, sims:[{iccid,status,activatedAt,expiresAt,remainingMb,totalMb,isUnlimited,remainingVoice,totalVoice,remainingText,totalText,error}]}. Null denotes unknown. Provider errors degrade locally rather than breaking financial reporting. Cache and coalesce checks for 20 minutes per order; bound cache size and provider calls. Client progressively checks visible purchases serially with a delay and cancels stale work. Repeat purchases/top-ups must not inherit another package’s data. No secrets/QR installation credentials returned.

## Validation
Backend route/service tests for access control, correct package matching, provider outages/cache, mixed currencies/missing cost, period/search independence and complete totals. Web helpers/render tests for statuses, units, unlimited/unknown and responsive browser inspection with fake BFF fixtures. Run both suites, type checks/builds and review diffs. Update both repos’ feedAI and session records. Leave changes uncommitted.
