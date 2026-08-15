# Product Requirements

## 1. Purpose

Build a small, polished financial-planning dashboard in which an authenticated user sets monthly spending targets, records actual expenses, compares the two over a selected month range, and locks finalized months.

The product should optimize for correctness, simplicity, reviewer experience, and reporting clarity.

## 2. Requirement sources

Priority order:

1. The CrossVal assignment PDF for mandatory product behavior.
2. Explicit user decisions, including MongoDB and React Query.
3. [DECISIONS.md](DECISIONS.md) for approved ambiguity resolutions.
4. The remaining project documents for implementation detail.

The assignment permits any stack, so using MongoDB does not conflict with it.

## 3. Functional requirements

### Authentication

- A user can sign up with email and password.
- A user can log in and log out.
- A user can retrieve their current session identity.
- Each user can see and modify only their own data.

### Categories

- A new user receives a useful default category set.
- A user can list, create, rename, and archive categories.
- Category names are unique per user after trimming and case normalization.
- Archived categories remain visible in historical reports.
- Archived categories cannot receive new plans or actuals.

### Plans

- A user can set one target per category/month.
- A user can update or clear a plan while the month is open.
- A monthly planning grid supports saving several category targets atomically.
- A locked month's plans cannot be created, changed, or deleted.

### Actuals

- A user can create multiple actual entries per category/month.
- Each actual contains category, month, amount, and an optional note.
- A user can list, inspect, edit, and delete their actual entries while the month is open.
- A locked month's actuals cannot be created, changed, or deleted.

### Report

- A user can select an inclusive month range.
- The report contains category, month, plan, actual, variance, and variance percentage.
- Rows are grouped by category and include category subtotals.
- The report includes an overall total.
- Missing actual entries count as zero recorded spend.
- A zero plan never produces `NaN` or infinity.
- The report includes period lock state.
- A user can drill into the actual entries behind an actual total.
- A user can export the current report as CSV.

### Dashboard and charting

- The dashboard displays Total Planned, Total Actual, Net Variance, and Categories Over Plan.
- At least one chart displays monthly net variance.
- A secondary category Plan vs Actual chart is included if core quality is stable.
- All chart values come from server-produced report data.

### Period locking

- A user can lock an open month they own.
- Locking makes plans and actuals for the month read-only.
- Lock enforcement occurs in the API and database transaction boundary.
- Locking is irreversible in the initial product.
- Repeated lock requests return a deterministic conflict response.

### Sample-data experience

- An empty account can load the assignment sample through an explicit action.
- Loading is transactional and cannot partially create sample data.
- The sample produces the assignment's expected report values.
- The action is idempotent or rejected clearly after data exists.

### Batch CSV actuals import (Implemented)

- A user can upload or paste a CSV file of actual expenses.
- The UI provides a downloadable standard template (`month,category,amount,note`).
- Client-side parser performs pre-submission syntax and schema validation.
- Live validation error table highlights missing categories, invalid amounts, or malformed dates.
- Atomic backend transaction creates up to 500 expense records atomically, rejecting writes if any target month is locked.

## 4. Calculation requirements

```text
Actual = sum of actual entries for category/month
Variance = Actual - Plan
Variance % = (Actual - Plan) / Plan × 100
```

- Positive variance means spending over plan and is adverse.
- Negative variance means spending under plan.
- When Plan is zero, variance percentage is `null` and displays as `N/A`.
- Authoritative calculations do not use floating-point money.
- Percentage output is rounded to two decimal places.

See [DOMAIN.md](DOMAIN.md) for exact rules.

## 5. UX requirements

- Desktop financial-table quality is the priority.
- Core workflows remain usable on narrow screens.
- Money is right-aligned and uses tabular numerals.
- Locked states are obvious and explained.
- Empty, loading, mutation-pending, error, and session-expired states are designed explicitly.
- Dialogs and drawers preserve keyboard navigation and focus.
- Color never serves as the only status indicator.

## 6. Technical requirements

- Next.js frontend and dedicated Express backend.
- MongoDB through Mongoose.
- MongoDB deployment must support transactions.
- TanStack Query manages frontend server state.
- Express owns authentication, authorization, validation, calculations, aggregation, and lock enforcement.
- All user-owned database queries are scoped by `userId`.
- API errors use one structured format.
- MongoDB indexes support ownership and month-range queries.

## 7. Required tests

- Assignment sample calculations.
- Overspending and underspending.
- Missing actual as zero.
- Zero plan.
- Multiple actual aggregation.
- Inclusive range reporting.
- Plan uniqueness.
- Ownership isolation.
- Lock rejection for every protected mutation.
- Concurrent lock/mutation behavior.

## 8. Deliverables

- Source code.
- Database/index setup and change scripts.
- Seed/sample-data utilities.
- Public deployment.
- README with setup, live URL, assumptions, calculations, locking, missing-data policy, scaling, tradeoffs, and production improvements.
- Automated tests.

## 9. Core completion criteria

Core is complete only when:

- The sample report is correct.
- All protected mutations reject locked months server-side.
- Cross-user access tests pass.
- The frontend uses React Query without duplicating server data into another global store.
- The live deployment supports signup through lock demonstration.
- Lint, typecheck, unit, integration, end-to-end, and production build checks pass.

## 10. Deferred and excluded requirements

Deferred until after core completion:

- CSV actual import.
- Additional report visualizations.

Explicitly excluded initially:

- Fiscal-year customization.
- Unlocking.
- Audit history.
- Multi-currency.
- Organizations and permissions.
- Forecast scenarios.
