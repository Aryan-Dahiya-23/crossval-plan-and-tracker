## Phase 16 — Deployment

**Objective:** Create and verify the public production environment.

**Implemented result:**

- Configured and deployed MongoDB Atlas 3-node replica set cluster with transaction capabilities.
- Configured and deployed Express API on Vercel Serverless runtime (`apps/api/api/index.ts`) with connection pooling and rapid cold-start performance.
- Deployed Next.js 16 Web Application on Vercel (`apps/web`) with same-origin `/api/*` rewrite proxy.
- Verified live readiness: `GET /health/ready` returns `status: ok, database: connected`.
- Production environment variables, CORS policies, and `HttpOnly` same-origin cookies verified.

## Phase 17 — Submission audit

**Objective:** Prepare a reviewer-ready repository and handoff.

**Implemented result:**

- Updated `README.md` with live production URLs, quick-start guide, architectural overview, calculation rules, indexing/scaling strategy, and reviewer workflow.
- Verified all assignment requirements against `plan-vs-actual-tracker.pdf`.
- All 326 tests pass across contracts, API, and frontend suites.

## Stretch Goal — CSV Actuals Batch Import (Implemented)

**Objective:** Support batch CSV import for actual expense entries.

**Implemented result:**

- Added `importActualsRequestSchema` and `importActualsResponseSchema` in `@crossval/contracts`.
- Implemented `importActuals` transactional backend service in `apps/api/src/modules/actuals/actual.service.ts` with active category matching, month format validation, and atomic multi-document creation.
- Built Align UI `CsvImportModal` with sample template download, file dropzone / text parser, live client-side validation preview table, and error reporting.
- Integrated into `/actuals` ledger with full test coverage (`actual.service.test.ts` & `actual.integration.test.ts`).
