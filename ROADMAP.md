# Implementation Roadmap

Only the explicitly assigned phase should be implemented at a time. Every phase ends in a verifiable repository state. Documentation must be updated when implementation reveals a necessary decision change.

## Phase 0 — Documentation and specification

**Status:** Complete.

**Objective:** Establish the source of truth before application code.

**Scope:** The Markdown documents currently in the repository.

**Dependencies:** Assignment, approved decisions, reference-dashboard research.

**Acceptance criteria:**

- MongoDB/Mongoose and React Query are consistent across documents.
- Domain rules, API, database, frontend, testing, and deployment are specified.
- No application code or configuration exists.

**Checks:** Link review, contradiction search, assignment requirement audit.

**Non-goals:** Scaffolding, dependencies, schemas, tests, or deployment.

## Phase 1 — Monorepo foundation

**Status:** Complete and verified.

**Objective:** Create a minimal pnpm workspace with independently buildable web, API, and contracts packages.

**Likely files/modules:** Root workspace manifests and scripts, `apps/web`, `apps/api`, `packages/contracts`, TypeScript/lint/format/test configuration, environment examples.

**Dependencies:** Phase 0 approval.

**Acceptance criteria:**

- Frozen pnpm install works.
- Web and API start with placeholder health/page behavior.
- Shared contracts compile without importing framework-specific code.
- Root format, lint, typecheck, test, and build commands exist.

**Checks:** Install, format, lint, typecheck, builds, placeholder test.

**Non-goals:** Database models, authentication, product UI, or business routes.

**Implemented result:**

- Pinned pnpm workspace with `apps/web`, `apps/api`, and `packages/contracts`.
- Next.js placeholder with TanStack Query provider and `/api` rewrite.
- Express liveness endpoint with shared Zod response contract.
- Root Prettier, ESLint, TypeScript, Vitest, build, and aggregate check scripts.
- Passing clean install, formatting, lint, typecheck, placeholder tests, and production builds.

## Phase 2 — MongoDB foundation

**Status:** Complete and verified.

**Objective:** Establish safe Mongoose connectivity, models, indexes, and test infrastructure.

**Likely modules:** Database connection, model definitions, index declarations, migration runner, test database helper, transaction helper.

**Dependencies:** Phase 1 and replica-set-capable databases.

**Acceptance criteria:**

- All approved collections and indexes are defined.
- Money maps to BSON Long/BigInt and serializes safely.
- Transactions run locally/test.
- Index verification command reports expected indexes.
- Production `autoIndex` is disabled.

**Checks:** Model tests, duplicate-index tests, transaction smoke test, destructive-target guard tests.

**Non-goals:** Public resource endpoints or frontend data fetching.

**Implemented result:**

- Configured Mongoose 9+ with strict mode, connection pooling, and disabled production autoIndex.
- Defined all 7 models (`users`, `sessions`, `categories`, `plans`, `actuals`, `financialPeriods`, `schemaMigrations`) with compound unique and range indexes.
- Mapped `amountMinor` to BSON Long / Mongoose `BigInt` for 64-bit integer cents.
- Implemented `runInTransaction` with session management and transient error retries.
- Created `ensureIndexes` and `verifyIndexes` with CLI commands (`pnpm db:ensure-indexes`, `pnpm db:verify-indexes`).
- Built isolated replica-set test harness using `mongodb-memory-server` with destructive-target guards.
- All 18 unit, model, guard, transaction, and index tests passing.

## Phase 3 — Shared domain primitives and API shell (Complete)

**Objective:** Implement month, money, errors, serialization, request IDs, configuration, and Express composition.

**Implemented result:**

- Built `@crossval/contracts` schemas: `MonthString` (`YYYY-MM`), `MoneyMinorString`, `ErrorCode` enum (13 canonical codes), `ApiErrorResponse`, and `ReadyResponse`.
- Implemented pure integer-cent money utilities (`shared/money.ts`) without floating-point math: string-to-cents parsing, display formatting, JSON serialization, variance arithmetic, and half-away-from-zero percentage rounding using `BigInt`.
- Implemented pure integer month utilities (`shared/month.ts`): bidirectional `YYYY-MM` <-> `YYYYMM` conversions, range iteration across year boundaries, and 60-month limit validation.
- Built structured API error hierarchy (`http/errors.ts`) mapping 13 canonical domain error codes to HTTP statuses.
- Built Express middleware pipeline: `requestIdMiddleware` (`X-Request-Id`), `validate` (Zod params/query/body validation), `notFoundHandler` (404), and `errorHandler` (sanitizing database errors, Mongoose CastErrors, and stack traces).
- Composed Express application in `createApp()` with configurable CORS, security headers, 100kb body limit, `/health/live`, `/health/ready` (MongoDB probe), and mounted `/v1` router.
- Added 81 new unit and Supertest tests (total 99 tests passing across monorepo).

## Phase 4 — Authentication and ownership (Complete)

**Objective:** Implement secure email/password sessions and reusable authenticated ownership conventions.

**Implemented result:**

- Built `@crossval/contracts` schemas: `signupRequestSchema`, `loginRequestSchema`, `userDtoSchema`, and `authResponseSchema`.
- Implemented `password.service.ts` using OWASP-compliant `crypto.scrypt` with 32-byte salts and `crypto.timingSafeEqual` constant-time verification.
- Implemented `session.service.ts` generating 256-bit cryptographically random tokens, HMAC-SHA-256 peppered hashing, and 7-day TTL with proactive expiration checks.
- Implemented `auth.service.ts` providing atomic signup inside `runInTransaction` (creating user, seeding 5 default categories: `Marketing`, `Payroll`, `Software`, `Office`, `Travel`, and issuing session), generic credential verification on login, and idempotent logout.
- Built Express authentication middleware: `authenticate` (reads session from `HttpOnly` cookie / Bearer header and attaches `req.user`), `requireAuth` (401 route guard), `createOriginGuard` (CSRF mutation protection), and `createRateLimiter` (429 sliding window limiter).
- Built auth controller and mounted routes at `POST /v1/auth/signup`, `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me`.
- Added 40 new unit, service, and Supertest integration tests (total 139 tests passing across monorepo).

## Phase 5 — Category domain (Complete)

**Objective:** Implement owned category listing, creation, rename, and archive.

**Implemented result:**

- Built `@crossval/contracts` category schemas: `objectIdSchema`, `categoryParamsSchema`, `createCategoryRequestSchema`, `updateCategoryRequestSchema`, `listCategoriesQuerySchema`, `categoryDtoSchema`, and response envelopes.
- Implemented `category.service.ts` providing owned category listing (alphabetical sort, filtering archived categories by default or including with `includeArchived`), `getCategoryById`, `createCategory` (enforcing per-user canonical lowercase uniqueness), `updateCategory` (rename with collision detection and color update), `archiveCategory` (soft-archive setting `archivedAt`, preserving history), and `assertActiveCategory` domain guard.
- Built category HTTP controller and mounted protected routes at `GET /v1/categories`, `POST /v1/categories`, `GET /v1/categories/:id`, `PATCH /v1/categories/:id`, and `POST /v1/categories/:id/archive`.
- Added 19 new unit and Supertest integration tests verifying multi-user isolation, canonical uniqueness across casing variants, 404 security boundaries on cross-user access, and archive idempotency (total 158 tests passing across monorepo).

## Phase 6 — Plans (Complete)

**Objective:** Implement single and atomic batch monthly target operations.

**Implemented result:**

- Built `@crossval/contracts` plan schemas: `planDtoSchema`, `putPlanParamsSchema`, `putPlanRequestSchema`, `deletePlanParamsSchema`, `listPlansQuerySchema`, `batchPlanParamsSchema`, `batchPlanRequestSchema`, and response envelopes.
- Implemented `period-coordination.service.ts` providing authoritative transactional financial-period locking coordination (`assertPeriodOpenAndCoordinate` incrementing `version` on `financialPeriods` and checking `OPEN` status before mutations).
- Implemented `plan.service.ts` providing range queries with category filtering (`getPlans`), single plan upsert with active category validation (`upsertPlan`), single plan clear (`deletePlan`), and atomic multi-category batch updates (`batchUpdatePlans`) in replica-set transactions with rollback on failure.
- Built plan HTTP controller and mounted protected routes at `GET /v1/plans`, `PUT /v1/plans/:categoryId/:month`, `DELETE /v1/plans/:categoryId/:month`, and `PATCH /v1/plans/months/:month`.
- Added 37 new unit, coordination, service, and Supertest integration tests verifying single upsert, explicit zero target, plan deletion, atomic batch updates, rollback on archived category, period lock rejection, and multi-tenant isolation (total 195 tests passing across monorepo).

## Phase 7 — Actual entries (Complete)

**Objective:** Implement the actual-entry ledger and multiple-entry model.

**Implemented result:**

- Built `@crossval/contracts` actual schemas: `positiveMoneyMinorStringSchema` (strictly $>0$ integer cents), `actualDtoSchema`, `actualParamsSchema`, `createActualRequestSchema`, `updateActualRequestSchema`, `listActualsQuerySchema`, `actualResponseSchema`, `actualPaginationMetaSchema`, and `actualsResponseSchema`.
- Implemented `actual-cursor.ts` providing deterministic, URL-safe Base64URL pagination cursor encoding and decoding over `{ monthKey, createdAt, id }`.
- Implemented `actual.service.ts` providing CRUD operations (`createActual`, `getActualById`, `listActuals`, `updateActual`, `deleteActual`) with transactional financial-period coordination, active category verification, deterministic cursor pagination, and dual-period coordination on month moves.
- Built actual HTTP controller and mounted protected routes at `GET /v1/actuals`, `POST /v1/actuals`, `GET /v1/actuals/:id`, `PATCH /v1/actuals/:id`, and `DELETE /v1/actuals/:id`.
- Added 47 new unit, service, and Supertest integration tests verifying strictly positive money validation, multiple entries preservation, cursor pagination across pages, month moves across open/locked source and destination periods, category archive rejections, and multi-tenant isolation (total 242 tests passing across monorepo).

## Phase 8 — Period locking (Complete)

**Objective:** Complete explicit lock APIs and prove concurrency behavior.

**Implemented result:**

- Built `@crossval/contracts` period schemas: `financialPeriodStatusSchema` (`OPEN` | `LOCKED`), `financialPeriodDtoSchema`, `financialPeriodResponseSchema`, `financialPeriodsResponseSchema`, `lockPeriodParamsSchema`, and `listPeriodsQuerySchema` (with $from \le to$ validation).
- Implemented `period.service.ts` providing `lockPeriod` (irreversible transition to `LOCKED`, setting `lockedAt: new Date()` and incrementing `version` in a transaction, throwing `409 PERIOD_ALREADY_LOCKED` on duplicate attempt), `getPeriod` (returning stored record or implicit `OPEN`), and `listPeriods` (range queries merging stored periods with implicit `OPEN` representations).
- Built period HTTP controller and mounted protected routes at `POST /v1/periods/:month/lock`, `GET /v1/periods/:month`, and `GET /v1/periods?from=...&to=...`.
- Added 28 new unit, service, locking matrix, and concurrency integration tests (total 270 tests passing across 24 test suites in monorepo).
- Proved comprehensive locking invariant matrix across all 8 protected plan and actual mutations, read accessibility for locked periods, and transactional concurrency serialization.

## Phase 9 — Reporting and sample data (Complete)

**Objective:** Produce the authoritative report DTO and reviewer fixture.

**Implemented result:**

- Extended `@crossval/contracts` with `signedMoneyMinorStringSchema` (supporting negative variance integer strings), `reportRangeDtoSchema`, `reportSummaryDtoSchema`, `reportMonthlySeriesItemDtoSchema`, `reportCategoryMonthItemDtoSchema`, `reportCategoryItemDtoSchema`, `reportDtoSchema`, `reportResponseSchema`, `getReportQuerySchema` ($from \le to$, max 60 months), and `loadDemoSampleResponseSchema`.
- Implemented authoritative report calculation service in `report.service.ts` with parallel user-scoped queries, missing plan/actual zero-filling, exact BigInt half-away-from-zero variance and percentage math, aggregate subtotal/total calculations, and monthly lock flags.
- Implemented transactional demo sample data loader in `demo.service.ts` with clean account verification (guarding against accounts with plans, actuals, or locked periods with `409 SAMPLE_DATA_NOT_AVAILABLE`) and atomic creation of 4 plans and 5 actual entries.
- Built report and demo HTTP controllers and mounted routes at `GET /v1/reports/plan-vs-actual` and `POST /v1/demo/assignment-sample` on `/v1`.
- Added 18 new unit, service, and Supertest integration tests proving exact mathematical match against assignment sample fixture numbers, zero plan percentage `null` behavior, missing actual `-100.00%` behavior, category filtering, clean account guards, and multi-tenant isolation (total 288 tests passing across monorepo).

## Phase 10 — Frontend foundation (Complete)

**Objective:** Establish Align UI design tokens/primitives, providers, auth layouts, and dashboard shell.

**Likely modules:** App layouts, UI primitives, shell/sidebar/header, theme, QueryClient provider, typed API client.

**Dependencies:** Phase 1; can begin once API contracts are stable.

**Acceptance criteria:**

- Responsive shell matches the approved reference-derived direction.
- Authenticated/public layouts are separate.
- API client parses structured errors.
- Query Devtools are development-only.
- Core skeleton/error/empty primitives exist.

**Checks:** Lint/typecheck/build, keyboard and responsive manual QA.

**Non-goals:** Full business workflows or copied reference pages.

**Implemented result:**

- Established an Align UI-derived semantic token system with reusable button, icon-button, badge, tooltip, drawer, skeleton, empty-state, error-state, and page-header primitives.
- Added separate public authentication and dashboard route-group layouts, a responsive 1440px content frame, collapsible desktop sidebar with keyboard shortcut, and focus-trapped mobile navigation drawer.
- Added a centralized TanStack Query client with bounded retry behavior, no retries for authentication/client errors, mutation retries disabled, normalized query-key factories, and development-only Query Devtools.
- Added a typed `/api/v1` client with credentialed requests, abort-signal support, no-content handling, Zod success parsing, canonical structured-error conversion, and safe malformed/network error fallbacks.
- Added 10 focused frontend unit tests covering API contracts, structured errors, retry policy, and deterministic query keys.
- Verified production build, keyboard navigation, mobile drawer focus/route behavior, public/dashboard separation, and responsive layouts at 375px, 768px, 1024px, and 1440px without horizontal overflow.

## Phase 11 — Authentication and category frontend

**Objective:** Implement signup/login/session/logout and category management.

**Likely modules:** Auth forms/hooks/guards, category query options, manager drawer.

**Dependencies:** Phases 4–5 and 10.

**Acceptance criteria:**

- Authentication persists through refresh via cookie.
- Session expiration has one controlled UX path.
- Category create/rename/archive states are clear.
- React Query owns server data; no global store is added.

**Checks:** Component tests and browser auth/category flow.

**Non-goals:** Password recovery or profile settings.

## Phase 12 — Planning and actuals frontend

**Objective:** Deliver the monthly plan grid and actual ledger/drawer workflows.

**Likely modules:** Planning page/grid/draft state, actual table, add/edit drawer, delete dialog, query/mutation options.

**Dependencies:** Phases 6–8 and 10–11.

**Acceptance criteria:**

- Batch planning preserves blank versus explicit zero.
- Unsaved changes are protected.
- Actual CRUD works with targeted invalidation.
- Locked states and stale API errors are clear.
- Financial mutations are not optimistic.

**Checks:** Component tests, query invalidation tests, browser workflows, responsive QA.

**Non-goals:** Report presentation or import.

## Phase 13 — Dashboard and report frontend

**Objective:** Build the central analytical experience.

**Likely modules:** Dashboard KPIs/chart, report filters/table/totals, drill-down drawer, lock dialog.

**Dependencies:** Phases 8–12.

**Acceptance criteria:**

- URL-driven filters work.
- KPI, table, and chart values share one report source.
- Grouped rows, subtotals, overall totals, `N/A`, and lock badges are correct.
- Drill-down uses actual queries.
- Lock success updates relevant UI without a full reload.

**Checks:** Fixture-driven component/API tests, Playwright reviewer path, accessibility and responsive QA.

**Non-goals:** Additional decorative visualizations.

## Phase 14 — CSV export and reviewer polish

**Objective:** Complete high-value reviewer features and all product states.

**Likely modules:** CSV formatter/download, sample-data CTA, polished empty/error/skeleton states, onboarding hints.

**Dependencies:** Phase 13.

**Acceptance criteria:**

- Export matches filters and escapes formula cells.
- Empty account can load sample data easily.
- Reviewer path takes only a few minutes.
- Loading, empty, error, lock, and session-expired states are polished.

**Checks:** CSV unit tests and full reviewer Playwright flow.

**Non-goals:** CSV actual import unless all core gates are already green and separately approved.

## Phase 15 — Security, performance, and quality audit

**Objective:** Verify the complete core product before deployment.

**Scope:** Ownership matrix, transaction races, indexes/explain plans, accessibility, responsive behavior, error/log hygiene, dependency audit.

**Dependencies:** Phases 1–14.

**Acceptance criteria:**

- All required quality gates pass.
- Critical queries use intended indexes.
- No secrets or database errors leak.
- Cross-user and lock matrices pass.
- Production builds succeed from a clean install.

**Checks:** Full CI suite, manual rubric audit, dependency/security review.

**Non-goals:** New features.

## Phase 16 — Deployment

**Objective:** Create and verify the public production environment.

**Likely work:** Atlas database/user, Render API, Vercel web/rewrite, secrets, database-change release step, health checks.

**Dependencies:** Phase 15.

**Acceptance criteria:**

- Public URL works without cold-start-quality problems.
- Cookie survives the web-to-API rewrite.
- Production database supports transactions.
- Signup through lock and export pass smoke testing.
- Rollback target is known.

**Checks:** DEPLOYMENT.md production checklist.

**Non-goals:** Multi-region architecture or autoscaling experiments.

## Phase 17 — Submission audit

**Objective:** Prepare a reviewer-ready repository and handoff.

**Scope:** README final state, setup commands, live URL, screenshots, architecture summary, assumptions/tradeoffs, production improvements, test instructions, optional walkthrough.

**Dependencies:** Phase 16.

**Acceptance criteria:**

- README no longer contains planned-command placeholders.
- Fresh local setup is tested.
- Live URL appears prominently.
- Assignment rubric is checked item by item.
- No documentation falsely claims deferred features.

**Checks:** Fresh-clone rehearsal and final reviewer journey.

**Non-goals:** Last-minute architecture changes or risky stretch features.

## Stretch gate

CSV actual import may begin only after Phases 15–16 are green and the core deployment is stable. Its specification must first define:

- File/row limits.
- Header and encoding requirements.
- Category matching.
- Duplicate/retry policy.
- All-or-nothing versus partial success.
- Row-level error format.
- Lock behavior across multiple months.
- Injection and file-upload protections.
