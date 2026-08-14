# Domain Specification

This document is the canonical source for financial and time-period behavior.

## 1. Terminology

- **Plan:** one monthly target for a category.
- **Actual entry:** one recorded expense assigned to a category and month.
- **Actual total:** sum of actual entries for a category/month.
- **Variance:** actual total minus plan.
- **Financial period:** one user-owned calendar month whose state is open or locked.
- **Locked:** the month rejects all plan and actual mutations.

## 2. Core invariants

```text
one plan per user + category + month
one financial period per user + month
category belongs to the same user as every plan and actual that references it
money is nonnegative integer cents
actual total is the sum of all matching actual entries
locked periods reject protected mutations
all user-owned reads and writes are scoped by authenticated userId
```

These rules must be protected by database indexes, service checks, and tests where applicable.

## 3. Money

### Storage

- Currency: USD only.
- Unit: cents.
- Storage type: MongoDB BSON 64-bit integer through Mongoose `BigInt`.
- API type: base-10 integer string.

Examples:

```text
$0.00       ->  "0"
$48.25      ->  "4825"
$5,000.00   ->  "500000"
```

### Input parsing

- Forms accept a conventional decimal currency string.
- At most two fractional digits are allowed.
- Inputs are converted directly to integer cents without `parseFloat` arithmetic.
- Scientific notation, negatives, separators in invalid positions, `NaN`, and infinity are rejected.
- Plans may be zero.
- Actual entries must be greater than zero. A month with no spend has no actual entries and aggregates to zero.
- The maximum accepted amount is `99999999999999` cents (`$999,999,999,999.99`) per plan or actual entry. This is far above take-home needs while providing a deterministic validation boundary.

### Serialization

Never pass JavaScript `bigint` directly to `JSON.stringify`. API serializers convert money to strings. Frontend formatters consume those strings.

## 4. Month semantics

### API/UI representation

```text
YYYY-MM
```

### Database representation

```text
YYYYMM as a MongoDB Int32
```

Examples:

```text
2026-01 -> 202601
2026-12 -> 202612
```

Validation must reject invalid months, including `2026-00`, `2026-13`, partial strings, timestamps, and ambiguous locale formats.

Range boundaries are inclusive. `from=2026-01&to=2026-03` contains January, February, and March.

Month iteration must use integer year/month arithmetic rather than adding milliseconds or local-time `Date` operations.

## 5. Actual aggregation

For a report cell:

```text
actualMinor = sum(actual.amountMinor)
where userId, categoryId, and monthKey match
```

If the query matches no actual documents:

```text
actualMinor = 0
```

Actual notes do not influence aggregation.

## 6. Variance

```text
varianceMinor = actualMinor - planMinor
```

Interpretation for expense planning:

| Result   | Meaning             | Semantic presentation     |
| -------- | ------------------- | ------------------------- |
| Positive | Spending over plan  | Adverse / red             |
| Negative | Spending under plan | Favorable / teal or green |
| Zero     | On plan             | Neutral                   |

The product must not label a positive numerical variance as “positive performance.” Use explicit labels such as “Over plan” and “Under plan.”

## 7. Variance percentage

When plan is greater than zero:

```text
variancePercent = (actualMinor - planMinor) / planMinor × 100
```

The server returns a decimal string rounded to two fractional digits using half-away-from-zero rounding.

Exact integer algorithm:

```text
scaledNumerator = varianceMinor × 10000
percentageHundredths = roundHalfAwayFromZero(scaledNumerator / planMinor)
display percentageHundredths / 100 with exactly two decimal places
```

Using `10000` produces hundredths of one percent without floating-point arithmetic.

Examples:

|     Plan |   Actual | Variance | Variance % |
| -------: | -------: | -------: | ---------: |
|  5000.00 |  4800.00 |  -200.00 |     -4.00% |
| 20000.00 | 20500.00 |  +500.00 |     +2.50% |

When plan is zero:

- Variance amount remains `actualMinor`.
- Variance percentage is `null` in the API.
- UI displays `N/A` with an explanation.

## 8. Missing plans

A category/month can exist without a plan. For report-grid consistency, a missing plan is represented as zero but must carry `hasPlan: false` so the UI can distinguish “not planned” from an explicit zero target.

This distinction matters in Planning. Report calculations still use zero as the arithmetic plan amount.

## 9. Report totals

Category totals are sums across selected month rows. Overall totals are sums across category totals.

Category inclusion rules:

- Include categories with at least one plan or actual in the selected range.
- Include an explicitly filtered active category even when it has no range activity, so the user can inspect its zero state.
- Include archived categories only when they have selected-range history or are explicitly requested by ID.
- Do not fill an unfiltered empty report with every seeded category and zero-only rows.

```text
totalVarianceMinor = totalActualMinor - totalPlanMinor
```

Overall and category variance percentages are calculated from their aggregate totals, not by averaging row percentages.

If an aggregate plan is zero, its percentage is `null`.

“Categories over plan” counts categories whose selected-range aggregate variance is greater than zero. It does not count individual month rows.

## 10. Category lifecycle

- Names are trimmed and compared through a canonical lowercase form.
- A category cannot be renamed to another category's canonical name.
- Archiving preserves all history.
- Archived categories remain reportable when they have data in the selected range.
- New plans and actuals cannot target archived categories.
- A category can be restored only if the feature is explicitly added later; restoration is not initial scope.
- Renaming or archiving a category is metadata management and is not blocked by financial-period locks; it cannot change locked plan or actual amounts.

## 11. Plan lifecycle

- Setting a plan for a category/month creates or replaces the single plan.
- Clearing a plan deletes it, preserving the semantic distinction between absent and explicit zero.
- Batch plan edits are atomic: all valid changes commit, or none do.
- Every affected category must be active and user-owned.
- Every affected month must be open.

## 12. Actual lifecycle

- Actual entries are independent ledger records.
- Editing can change category, month, amount, and note while both the source and destination months are open.
- If an edit moves an actual to another month, the transaction coordinates both periods in a deterministic month-key order to avoid conflicts.
- Deletion is physical in the initial version because audit history is out of scope.
- Locked actuals remain readable and drillable.

## 13. Financial-period locking

### Granularity

One calendar month per user.

### Protected operations

- Create, update, clear, or batch-edit plans.
- Create actuals.
- Update actuals, including moving them into or out of the month.
- Delete actuals.
- Load sample data affecting the month.
- Future CSV imports affecting the month.

### Lock transaction

Each protected mutation and each lock request participates in a MongoDB transaction and writes the same `financialPeriods` document for the relevant user/month by incrementing its version.

Conceptually:

```text
start transaction
upsert and increment period version
read period state inside transaction
if LOCKED -> abort with PERIOD_LOCKED
perform financial write
commit
```

A lock request uses the same coordination document, verifies it is open, sets `LOCKED`, and records `lockedAt`.

Concurrent transaction conflicts are retried using the supported transaction helper. After retry, a mutation that lost to the lock observes `LOCKED` and fails.

### Irreversibility

No public unlock endpoint or UI exists initially. Manual database editing is not a supported product operation.

## 14. Sample-data rules

The sample loader may run only when the account has no plans, actuals, or locked financial periods.

It creates the assignment sample transactionally and uses ordinary domain services or the same invariants. It must not bypass ownership or locking checks.

## 15. Derived versus stored values

Stored:

- Plans.
- Individual actual entries.
- Financial-period state.
- Category metadata.

Derived:

- Actual totals.
- Variance.
- Variance percentage.
- KPI totals.
- Chart series.
- Over-plan counts.

Derived values must not be persisted because they could drift from source records.
