# Admin operations dashboard implementation plan

Goal: Replace the unused chart with daily finances and useful customer/package operations.
Architecture: Existing Express dashboard with additive fields and read-only provider endpoint; Next BFF remains the browser’s only API path. No migration or dependency additions.
Spec: ../specs/2026-10-29-admin-operations-design.md

## Constraints
Stay on current branches; no commits. Use shared admin auth, nav and buttons. UTC dates; separate currencies; estimated profit excludes fees and commissions. Graceful provider failure. No QR credentials. Respect existing user edits.

## Review focus
Unknown costs cannot inflate profit. Financial summaries must not follow pagination/search. Top-ups cannot borrow unrelated statuses. Stale browser requests cannot replace the current filters. Provider checks must not overload Airalo.

### Task 1: Backend contract (independent worker)
- [ ] Test additive dashboard finances, complete totals/search, package enrichment and protected provider details.
- [ ] Implement existing dashboard extensions and provider detail service/route using the spec contract; cache/coalesce and exact matching.
- [ ] Run focused and full backend tests/build; document endpoint and knowledge/session entries.

### Task 2: Web dashboard
- [ ] Test provider presentation and new BFF forwarding; revise outdated chart tests.
- [ ] Implement typed dashboard helpers, finance and purchase components, secondary user/OTP tabs, accessible expansion and progressive provider checks.
- [ ] Keep stale data on refresh failure; abort superseded requests. Add useful empty/loading states.
- [ ] Verify tests/type check/build; inspect desktop and phone browser renders using fictional fixtures.

### Task 3: Integration review
- [ ] Verify exact backend/web types and routes; run suites and inspect own diff.
- [ ] Fresh review of cross-repo changes; fix material findings and recheck.
- [ ] Record feedAI, session and overview changes; deliver uncommitted implementation with validation and limits.
