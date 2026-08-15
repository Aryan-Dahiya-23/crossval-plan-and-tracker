# Frontend Specification

## Implementation status

Phases 0–17 and the Batch CSV Actuals Import stretch goal are 100% complete and deployed live. The web application features a full suite of Align UI primitives, complete authentication flows (`/login`, `/signup`, `AuthGuard`), collapsible dual-state sidebar shell, Category Management Drawer (`CategoryDrawer`), 12-Month Annual Planning Matrix (`PlanningGrid`), Actuals Expense Ledger (`ActualsTable`, `ExpenseDrawer`, `CsvImportModal`), Executive Dashboard (`/dashboard` with KPI cards, SpendingChart, and SampleData CTA), authoritative Plan vs Actual Report (`/report` with `DrilldownDrawer`, `LockPeriodModal`, CSV export), React Query hover/focus route prefetching, and smooth Align UI loading states.

## 1. Product direction

The frontend is an analysis-first B2B finance dashboard. It should feel consistent with the developer's existing Align UI work while using information architecture appropriate to Plan vs Actual.

Design references, strictly read-only:

- `/Users/aryandahiya/Desktop/Programming/sendit/hypermarket-v2-dashboard`
- `/Users/aryandahiya/Desktop/Programming/resolvex/resolvex-dashboard`
- `/Users/aryandahiya/Desktop/Programming/synergy/synergy-frontend`

Conceptually adapt:

- Hypermarket's collapsible shell, page headers, dialogs, and product states.
- ResolveX's finance-oriented widgets, charts, dense tables, and detail drawers.
- Synergy's compact forms, search/filter bars, and admin actions.

Do not copy feature pages, business logic, broad state invalidation, global atoms, or complete components verbatim.

## 2. Routes

```text
/                       redirect by auth state
/login                  public
/signup                 public
/dashboard              authenticated overview
/planning               authenticated monthly target grid
/actuals                 authenticated actual-entry ledger
/report                  authenticated detailed Plan vs Actual report
```

Category management is a drawer accessible from Planning and navigation settings. Period locking is contextual to Planning and Report, so it does not need a separate page.

## 3. Application shell

Desktop:

- Collapsible left sidebar.
- Product mark and navigation.
- Page header with title, concise description, and contextual actions.
- Content maximum width around 1360–1440px while report tables may use the available width.
- User menu and logout.

The Phase 10 shell uses a non-interactive workspace summary in the account area; Phase 11 replaces it with the authenticated user menu and logout action.

Navigation:

```text
Overview
Planning
Actuals
Report
```

Mobile/narrow screens:

- Compact top header and navigation drawer.
- Cards stack vertically.
- Tables retain horizontal scrolling rather than hiding financial columns.
- Primary actions remain reachable without sticky overlays obscuring data.

## 4. Visual language

- Align UI primitives are the default component foundation.
- Neutral surfaces and restrained finance/B2B palette.
- Semantic colors:
  - over plan: error/red
  - under plan: success/teal
  - on plan: neutral
  - locked: neutral/feature badge with lock icon
  - open: subtle status treatment
- Use explicit text with color; never color alone.
- Money uses tabular numerals and right alignment.
- Avoid excessive animation. Short entry transitions are acceptable; financial mutations should feel stable.

## 5. Dashboard

### Header controls

- Month-range selector.
- Presets: current month, previous month, current quarter, previous quarter.
- Actions: Add actual and Set plans.

### KPI cards

- Total Planned.
- Total Actual.
- Net Variance, labeled Over/Under Plan.
- Categories Over Plan.

Cards use the same report query and selected range. They do not issue independent summary requests.

### Primary chart

Monthly net-variance diverging bar chart:

- Zero baseline.
- Adverse positive bars and favorable negative bars.
- Accessible tooltip with month and formatted value.
- Empty state when no selected-range activity exists.

### Supporting content

- Category Plan vs Actual chart when included.
- Compact category-variance table linking to the filtered report.
- Period status strip or badges for the selected range.

## 6. Planning workflow

The main surface is a monthly planning grid.

```text
Category | Current target | New target / status
```

Behavior:

- Select exactly one month.
- Display active categories and current target.
- A blank draft means clear/no plan; explicit `0.00` means a zero plan.
- Track dirty rows locally.
- Save all dirty rows through the atomic batch endpoint.
- Disable Save when nothing changed or validation fails.
- Confirm navigation away with unsaved changes.
- Refresh query data after successful save and clear the draft.
- Locked month shows an explanatory banner and read-only values.

Category drawer:

- List active categories.
- Create and rename inline or through compact forms.
- Archive through a confirmation dialog.
- Explain that archived categories remain in history.

## 7. Actuals workflow

### Actual ledger

- Cursor-paginated table.
- Filters: month/range and category.
- Columns: note, category, month, amount, period status, updated date, actions.
- Search is optional because notes are small; do not add server search unless it materially helps.

### Add/edit drawer

Fields:

- Category.
- Month.
- Amount.
- Optional note.

Behavior:

- Use the same form for create and edit with explicit mode labels.
- Show field-level validation.
- Show locked-period errors returned by the API, even if the UI believed the period was open.
- Disable submission while pending.
- Do not optimistically add or edit ledger rows.

### Delete

- Confirmation dialog identifies amount, category, and month.
- Locked records have no enabled delete action.
- Stale attempts still rely on API rejection.

## 8. Report workflow

### Filters

- Inclusive from/to month range.
- Category multi-select.
- Quarter presets.
- Filters are stored in URL search parameters.
- Invalid URL filters fall back to a safe default and surface no crash.

### Table

Grouped by category:

```text
Category header / subtotal
  Month | Plan | Actual | Variance | Variance % | Status | Details
```

Features:

- Sticky column header.
- Expand/collapse category groups, default expanded for small ranges.
- Right-aligned numeric columns.
- Category subtotals.
- Overall totals footer.
- `N/A` with tooltip for zero-plan percentages.
- Visible distinction between absent plan and explicit zero plan.
- Actual total opens a drill-down drawer when entry count is nonzero.
- Locked badge links conceptually to the period state, not a disabled-app error.

Default order is category name, then month ascending. A “largest over plan” category sort may be added without changing month ordering.

### Drill-down drawer

Displays:

- Category and month.
- Aggregated actual total.
- Underlying actual entries with note and amount.
- Add actual action only for open months.
- Edit/delete actions only for open months.

The drawer queries the existing actual-list endpoint with category/month filters.

### Lock action

- Available for an open month when the UI is focused on one month or through an explicit period control.
- Confirmation states that locking cannot be undone.
- On success, show a toast and update/invalidate affected caches.

## 9. CSV export

Generate from the current report DTO so exported values match the visible report.

Columns:

```text
Category,Month,Plan,Actual,Variance,Variance %,Period Status
```

Requirements:

- Apply current filters.
- Format money as decimal USD values.
- Preserve `N/A` for undefined percentages.
- Escape commas, quotes, line breaks, and formula-leading text.
- Use a deterministic filename such as `plan-vs-actual_2026-01_to_2026-03.csv`.

## 10. React Query architecture

TanStack Query is mandatory for all server state.

### Query-key factory

Conceptual factory:

```text
auth.all                 -> ['auth']
auth.me                  -> ['auth', 'me']

categories.all          -> ['categories']
categories.list(filters)-> ['categories', 'list', normalizedFilters]

plans.all               -> ['plans']
plans.list(filters)     -> ['plans', 'list', normalizedFilters]

actuals.all             -> ['actuals']
actuals.list(filters)   -> ['actuals', 'list', normalizedFilters]
actuals.detail(id)      -> ['actuals', 'detail', id]

reports.all             -> ['reports']
reports.planVsActual(f) -> ['reports', 'plan-vs-actual', normalizedFilters]

periods.all             -> ['periods']
periods.list(filters)   -> ['periods', 'list', normalizedFilters]
```

Normalization rules:

- Omit undefined filter properties.
- Sort category ID arrays.
- Use API `YYYY-MM` strings.
- Keep cursor in actual-list keys.
- Do not use freshly created object instances with unstable nested values that change key meaning.

### Query policy

- `auth.me`: stale for approximately 5 minutes; never retry `401`.
- Categories: stale for approximately 5 minutes.
- Plans, actuals, periods, and reports: stale for 30–60 seconds.
- Retry GET network/5xx failures once with bounded backoff.
- Never retry deterministic `4xx` errors.
- Keep previous report data while filters change only if the UI clearly shows fetching state and old range cannot be mistaken for new data.

### Mutation invalidation

Category create/rename/archive:

- Invalidate category lists.
- Invalidate report queries because names and active/history membership may change.
- Invalidate planning data if category availability changes.

Plan mutation:

- Invalidate plan lists whose ranges include the affected month.
- Invalidate report queries whose ranges include the month and whose category filters can include the affected category.
- Do not invalidate unrelated actual lists.

Actual create/update/delete:

- Invalidate actual lists matching the source or destination category/month.
- Invalidate actual detail when updated/deleted.
- Invalidate report queries containing source or destination month/category.
- Do not invalidate categories or unrelated plan lists.

Period lock:

- Update the exact period-list cache when straightforward.
- Invalidate period lists containing the month.
- Invalidate relevant plan/actual/report queries because their `locked` metadata changes.

Authentication:

- Login/signup sets `auth.me`, then invalidates user-scoped roots as needed.
- Logout cancels in-flight queries, calls the API, and clears all user-scoped cache data.
- A global authenticated API handler turns `401` into a session-expired flow without refetch loops.

### Optimistic updates

Do not optimistically mutate plans, actuals, or period status. Server confirmation is required.

Direct cache updates are acceptable after success when the response exactly represents the authoritative resource, followed by only the targeted invalidations needed for aggregates.

## 11. API client

One typed API client handles:

- Base `/api/v1` path.
- `credentials: include` where needed.
- JSON parsing.
- No-content responses.
- Structured API error conversion.
- Abort signals from TanStack Query.

Feature code should not duplicate `fetch` wrappers or parse untyped error bodies.

## 12. Form architecture

- React Hook Form for drawer/dialog forms.
- Zod contract-derived client schemas where transport rules match.
- Server errors remain authoritative and map to form/global feedback.
- Money input maintains user-friendly display but submits a minor-unit string.
- Month picker submits `YYYY-MM`, never a timestamp.

The planning grid may use controlled local draft state rather than one React Hook Form instance per cell.

## 13. Loading, empty, and error states

Required states:

- Auth bootstrap skeleton.
- Dashboard KPI/chart skeleton.
- Planning-grid skeleton.
- Actual-table skeleton.
- Report-table/chart skeleton.
- No categories.
- No plans for month.
- No actuals.
- No selected-range activity.
- Filtered zero results.
- Query failure with Retry.
- Mutation failure with retained draft.
- Locked period.
- Expired session.

Avoid replacing the full app shell with a spinner after authentication has resolved.

## 14. Accessibility

- Semantic headings, tables, buttons, forms, and labels.
- Visible focus states.
- Radix/Align UI focus trapping for drawers and dialogs.
- Restore focus to the invoking control.
- `aria-live` for mutation results where toasts alone are insufficient.
- Chart information also available in table/text form.
- Tooltips are supplementary, not the only explanation.
- Sufficient contrast for semantic variance colors.

## 15. Responsive strategy

Desktop is primary because the report is a financial table.

- Preserve all critical columns through horizontal scroll on small screens.
- Keep category/month context visible where sticky positioning is reliable.
- Do not turn every table row into a card if that harms comparison.
- Drawers become near-full-screen on narrow screens.
- Test at approximately 375px, 768px, 1024px, and desktop widths.

## 16. Component boundaries

Shared product components:

- `AppShell`
- `PageHeader`
- `MonthPicker` / `MonthRangePicker`
- `MoneyText` / `MoneyInput`
- `VarianceText` / `VarianceBadge`
- `PeriodStatusBadge`
- `KpiCard`
- `ReportTable`
- `ActualEntryDrawer`
- `ActualDrilldownDrawer`
- `CategoryManagerDrawer`
- `PeriodLockDialog`
- `QueryErrorState`
- Feature-specific skeletons and empty states

Avoid a universal dashboard widget factory or all-purpose CRUD table.

## 17. Frontend non-goals

- A second backend in Next.js route handlers.
- Redux, Zustand, Jotai, or duplicated server state.
- Client-side report aggregation.
- Optimistic financial writes.
- A mobile-first redesign that weakens desktop comparison.
- Decorative charts without decision value.
