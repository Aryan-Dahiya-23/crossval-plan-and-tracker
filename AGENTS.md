# Repository Instructions for Coding Agents

## Current repository state

Phases 0–15 are complete. The repository has a verified monorepo foundation, complete MongoDB persistence layer, shared domain primitives, structured error handling, composed Express API shell, complete authentication & session management, complete category domain, complete plan domain, complete actual entry domain, complete financial-period locking domain, authoritative report calculation engine (`GET /v1/reports/plan-vs-actual`), transactional demo sample data loading (`POST /v1/demo/assignment-sample`), verified Align UI/TanStack Query frontend shell, live authentication flows (`/login`, `/signup`, `UserButton`, `AuthGuard`), Category Management Drawer (`CategoryDrawer`), 12-Month Planning Spreadsheet Matrix (`PlanningGrid`), Actuals Expense Ledger (`ActualsTable` & `ExpenseDrawer`), Executive Dashboard (`/dashboard`), Authoritative Plan vs Actual Report (`/report` with Drilldown Drawer, Lock Period modal, and CSV export), Reviewer Guidance & toast system, the full end-to-end automated reviewer integration suite (`reviewer-workflow.test.ts`), and the full Security, Performance & Quality Audit (`security-audit.test.ts`). Public production deployment (Phase 16) is next. Do not proceed into deployment unless the user explicitly assigns it from [ROADMAP.md](ROADMAP.md).

## Read before working

For any implementation task, read:

1. This file.
2. [DECISIONS.md](DECISIONS.md).
3. The assigned phase in [ROADMAP.md](ROADMAP.md).
4. The relevant domain/API/database/frontend/testing document.

The assignment PDF remains the source for mandatory requirements.

## Confirmed architecture

- Next.js + TypeScript frontend.
- Express + TypeScript backend.
- MongoDB with Mongoose; no PostgreSQL or Prisma.
- pnpm monorepo.
- Align UI.
- TanStack Query / React Query for frontend server state.
- Zod transport validation.
- Dedicated Express REST API; Next.js routes are not the authoritative backend.

Do not change these choices casually. A material change requires user approval and synchronized documentation updates.

## Non-negotiable domain rules

- All money is USD integer cents stored as BSON Long through Mongoose BigInt.
- JSON money values are strings.
- Months use database `YYYYMM` integers and API/UI `YYYY-MM` strings.
- Multiple actual entries per category/month are allowed.
- Missing actual aggregates to zero.
- Variance is Actual minus Plan.
- Zero-plan variance percentage is `null` / `N/A`.
- One plan exists per user/category/month.
- Every user-owned query is scoped by authenticated `userId`.
- Monthly locks are irreversible in initial scope.
- All protected mutations coordinate and check financial-period state transactionally.
- The backend owns authoritative calculations and lock decisions.

Never duplicate report calculation logic in the frontend.

## MongoDB rules

- Transactional code must run against a replica-set-capable MongoDB environment.
- Use Mongoose sessions consistently for every operation in a transaction.
- Do not use `Promise.all()` inside a transaction.
- Unique indexes are part of correctness, not only performance.
- Do not trust document references without matching `userId`.
- Do not enable production `autoIndex` or run destructive `syncIndexes()` blindly.
- Database changes require versioned, idempotent scripts and verification.
- Tests must never target development or production databases.

## React Query rules

- Use centralized query-key factories.
- Normalize filter inputs.
- Keep server data in TanStack Query, not another global store.
- Keep form drafts and dialog state local.
- Do not optimistically update plans, actuals, or period locks.
- Invalidate only queries affected by the mutation.
- Handle `401` without retry/refetch loops.
- Clear user-scoped cache on logout.

Do not add Redux, Zustand, Jotai, Recoil, or another global store without a documented independent client-state requirement and user approval.

## Align UI rules

The local dashboard repositories listed in [FRONTEND.md](FRONTEND.md) are read-only references.

- Do not modify them.
- Do not import files from them.
- Do not create runtime dependencies on them.
- Adapt their shell, table, drawer, form, and product-state patterns conceptually.
- Build an analysis/reporting UX, not a reskinned Orders application.
- Preserve financial scannability over decoration.

## Code-quality rules

Prefer:

- Strong TypeScript.
- Small cohesive functions.
- Explicit domain services.
- Thin controllers.
- Clear names.
- JSON-safe DTO serializers.
- Targeted tests for invariants.
- Focused changes within the assigned phase.

Avoid:

- Giant files.
- `any` without a narrow documented boundary.
- Generic repositories/base services.
- Speculative abstractions.
- Duplicate calculations.
- Wrapper functions that add no behavior.
- Dead code and commented-out implementations.
- Unrelated refactors.
- Excessive comments explaining obvious syntax.
- New dependencies when platform/library primitives already solve the need.

## Change workflow

1. Inspect current code and git status.
2. Identify the relevant specification and roadmap acceptance criteria.
3. State any assumption that could change behavior.
4. Make the smallest cohesive change.
5. Add or update high-value tests in the same phase.
6. Run format, lint, typecheck, relevant tests, and builds proportionate to the change.
7. Review the diff for unrelated changes and generated secrets.
8. Update documentation when behavior or commands become real.
9. Report what changed, verification performed, and unresolved risks.

## Documentation truthfulness

- Do not claim planned behavior is implemented.
- Replace placeholders only when corresponding commands/URLs exist and have been verified.
- If implementation requires changing a settled decision, stop and request approval rather than silently drifting.
- Avoid duplicating a canonical rule into several documents unless the cross-reference is insufficient; duplicated rules must remain consistent.

## Security rules

- Never log passwords, cookies, raw tokens, password hashes, peppers, or connection strings.
- Never expose MongoDB/Mongoose errors or stack traces to clients.
- Never accept `userId` from request input for ownership.
- Validate ObjectIds before database access.
- Apply exact origin/CORS and cookie policies.
- Escape formula-leading CSV cells.

## Phase discipline

- Complete the assigned roadmap phase and its acceptance criteria before expanding scope.
- Do not implement stretch goals while a core quality gate is failing.
- CSV actual import is deferred and requires its own approved specification.
- Deployment actions require the deployment phase or explicit user authorization.
