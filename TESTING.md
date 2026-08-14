# Testing Strategy

## 1. Goals

Testing should prove the behaviors most likely to affect evaluation:

- Correct money and variance calculations.
- Correct actual aggregation.
- Correct inclusive month ranges.
- Server-enforced period locking.
- Ownership isolation.
- MongoDB uniqueness and transaction behavior.
- A reliable reviewer workflow in the deployed-shaped application.

Coverage percentage is secondary to invariant coverage.

## 2. Tooling

- Vitest for unit and service tests.
- Supertest for Express API tests.
- Playwright for browser end-to-end tests.
- A real MongoDB replica-set-capable test database for transaction/integration tests.

Do not mock Mongoose for tests intended to prove indexes, aggregation, transactions, or ownership queries.

## 3. Test layers

### Unit tests

No database. Cover pure functions:

- Money parsing and serialization.
- Month string/key conversion.
- Month range iteration.
- Variance calculations.
- Percentage rounding.
- Report-grid merging and totals where kept pure.
- CSV escaping and formatting.
- Query-key normalization.

### Service/integration tests

Use the real test database. Cover:

- Model indexes and duplicate handling.
- Ownership-scoped services.
- Transactions.
- Period coordination and locking.
- MongoDB actual aggregation.
- Sample-data atomicity.

### API tests

Mount the Express app without a network listener. Cover:

- Cookies and authentication.
- Zod validation.
- Status codes and response DTOs.
- Structured errors.
- Ownership behavior.
- API-driven report results.

### End-to-end tests

Run the production-shaped web/API stack. Cover one or two high-value reviewer journeys rather than duplicating every API test.

## 4. Canonical calculation fixtures

### Assignment sample

| Month   | Category  |  Plan | Actual | Variance | Variance % |
| ------- | --------- | ----: | -----: | -------: | ---------: |
| 2026-01 | Marketing |  5000 |   4800 |     -200 |     -4.00% |
| 2026-01 | Payroll   | 20000 |  20500 |     +500 |     +2.50% |
| 2026-02 | Marketing |  5000 |      0 |    -5000 |   -100.00% |
| 2026-02 | Payroll   | 20000 |  19800 |     -200 |     -1.00% |

The report API test must assert all row, category subtotal, monthly, and overall totals from this fixture.

### Multiple entries

Marketing January actual entries:

```text
Google Ads   2000
LinkedIn     1000
Agency       1800
```

Expected actual total: `4800`.

### Zero plan

```text
Plan: 0
Actual: 125
Variance: 125
Variance percentage: null
```

### Rounding

Include positive and negative values whose third percentage decimal is below, equal to, and above five. Confirm half-away-from-zero behavior.

## 5. Month tests

- Accept leap-year February as a month without day semantics.
- Convert January and December correctly.
- Iterate across year boundaries.
- Inclusive one-month range.
- Reject malformed strings and month 00/13.
- Reject `from > to`.
- Reject ranges over 60 months.
- Confirm no test depends on process timezone.

## 6. Money tests

- Whole dollars and cents.
- Zero plan accepted.
- Zero actual entry rejected.
- Negative rejected.
- More than two fractional digits rejected.
- Very large values within the approved bound.
- Values over the bound rejected.
- JSON serializers never receive raw `bigint`.
- Aggregation results normalize BSON Long/BigInt consistently.

## 7. Category tests

- Default categories are created once at signup.
- Trimmed/case-insensitive uniqueness.
- Same category name allowed for different users.
- Rename collision rejected.
- Archive preserves plans/actuals/report rows.
- Archived category rejected for new plan/actual.
- User A cannot read, rename, or archive User B's category.

## 8. Plan tests

- Create, replace, clear.
- Explicit zero plan versus absent plan.
- Unique user/category/month index.
- Atomic batch success.
- Atomic batch rollback when one item is invalid.
- Duplicate category in batch rejected.
- Category ownership enforced.
- Locked month rejects single and batch mutations.

## 9. Actual tests

- Create, list, detail, edit, delete.
- Multiple entries aggregate.
- Notes optional and length-limited.
- Cursor pagination stable across equal timestamps.
- Edit month/category.
- Source and destination locks both checked when moving.
- Archived category rejected as a destination.
- Cross-user IDs return `NOT_FOUND`.

## 10. Locking tests

At minimum verify `PERIOD_LOCKED` for:

- Plan create/update.
- Plan clear.
- Batch plan edit.
- Actual create.
- Actual update in place.
- Actual move out of locked month.
- Actual move into locked month.
- Actual delete.
- Sample-data operation affecting locked month.

Also verify:

- Lock creates one `financialPeriods` document.
- Duplicate lock returns `PERIOD_ALREADY_LOCKED`.
- Lock does not change existing plan/actual values.
- Locked data remains readable.
- No unlock endpoint exists.

### Concurrency test

Run a mutation and lock concurrently against the same user/month many times or under controlled transaction barriers.

Valid outcomes:

- Mutation commits before the lock, then lock commits; final data includes the mutation and period is locked.
- Lock commits first; mutation retries/observes locked and fails.

Invalid outcome:

- Mutation reports success after serialization behind a committed lock without being ordered before it.

## 11. Authentication/session tests

- Signup creates user, categories, and session atomically.
- Duplicate normalized email rejected.
- Login success and generic invalid credentials.
- Password hash not returned.
- Auth cookie properties by environment.
- Logout revokes session.
- Expired session rejected even before TTL deletion.
- Token stored hashed, not plaintext.
- Auth rate limit behavior.

## 12. Report tests

- Assignment sample rows.
- Missing actual zero.
- Missing plan zero with `hasPlan: false`.
- Explicit zero plan with `hasPlan: true`.
- Multiple-entry sums.
- Category subtotals.
- Overall percentage calculated from totals, not averaged.
- Category filtering.
- Inclusive range.
- Archived category with historical data.
- Category-over-plan count uses aggregate category variance.
- Locked flags per month.
- Empty-range response has stable zeros/empty arrays, not errors.

## 13. API contract tests

- All money fields are strings.
- All month fields are `YYYY-MM`.
- ObjectId validation fails as `VALIDATION_ERROR` rather than database cast error.
- `401`, `404`, `409`, and `422` behavior is consistent.
- Every error contains code, message, and request ID.
- Unexpected errors omit stack/database details.
- `204` responses have no JSON body.

## 14. React Query tests

Prefer testing query options/key factories and critical hooks rather than implementation internals.

- Equivalent filters generate equivalent keys.
- Category arrays are normalized.
- Plan mutation invalidates affected report/plan keys only.
- Actual move invalidates source and destination views.
- Lock updates/invalidate relevant period and financial queries.
- Logout clears user-scoped cache.
- `401` does not enter a retry loop.
- Financial mutations are not optimistic.

## 15. Frontend component tests

High-value cases:

- Money and variance semantics.
- `N/A` zero-plan tooltip.
- Locked banner and disabled controls.
- Planning dirty-state and batch payload.
- Report filters reflected in URL.
- Empty/error/retry states.
- Lock confirmation wording.
- CSV export escaping.

Do not snapshot every Align UI wrapper.

## 16. End-to-end journeys

### Reviewer happy path

1. Sign up.
2. Load sample data.
3. Open Q1 report.
4. Verify KPIs and a sample variance.
5. Drill into Marketing January actuals.
6. Lock January.
7. Observe read-only state.
8. Attempt a stale direct mutation and observe the domain error.
9. Export CSV.

### Ownership path

Create two users and prove one cannot retrieve or mutate the other's known IDs.

## 17. Database isolation

- Use a dedicated database name per test worker where practical.
- Drop only explicitly named test databases.
- Ensure collections and indexes before tests.
- Never point tests at development or production databases.
- Test environment startup must fail if the database name does not visibly identify itself as test data.

## 18. CI quality gate

Required before merge/deploy:

```text
format check
lint
typecheck
unit tests
integration/API tests
production builds
selected Playwright smoke flow
```

Full browser coverage may run separately if CI duration requires it, but the core smoke flow must run before production deployment.
