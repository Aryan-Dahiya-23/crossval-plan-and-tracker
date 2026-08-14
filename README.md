# CrossVal Plan vs Actual Tracker

> Project state: Phases 0–2 complete; authentication and product domain implementation has not started.

CrossVal Plan vs Actual Tracker is a focused FP&A-style dashboard for setting monthly spending plans, recording actual expenses, comparing Plan vs Actual over time, and finalizing months through server-enforced period locking.

This repository contains the approved specifications, verified monorepo foundation (Phase 1), and complete MongoDB data layer with Mongoose models, compound indexes, and transaction utilities (Phase 2). Authentication, domain routes, and product UI have not been implemented.

## Assignment context

The product is a standalone submission for CrossVal's Full Stack Developer take-home assignment. It is independent from the separate Orders & Settlements submission. The two products may share an Align UI design language, but they must not share source code, deployments, or product information architecture.

The assignment source is `plan-vs-actual-tracker.pdf`. Where project documents add detail, they record deliberate product and engineering choices within the assignment's allowed scope.

## Confirmed stack

- Frontend: Next.js and TypeScript
- Backend: Express.js and TypeScript
- Database: MongoDB, selected to align with the role requirements
- MongoDB modeling: Mongoose
- Package manager: pnpm
- Repository: pnpm monorepo
- UI system: Align UI
- Server state: TanStack Query / React Query
- Validation: Zod
- Charts: Recharts
- Authentication: email/password with database-backed HttpOnly-cookie sessions
- Tests: Vitest, Supertest, and Playwright

PostgreSQL and Prisma are not part of this project. MongoDB is a confirmed requirement, and Mongoose is the intentionally selected data-modeling layer.

## Confirmed product decisions

- A category/month may contain multiple individual actual entries.
- Missing actual entries are reported as zero recorded spend.
- Months are represented by an integer `YYYYMM` key internally and `YYYY-MM` at API/UI boundaries.
- Locks operate at monthly granularity and cannot be reversed in the initial version.
- New accounts receive common categories; users can create, rename, and archive categories.
- USD amounts are stored as integer cents using MongoDB BSON 64-bit integers.
- The backend owns aggregation, variance calculations, ownership checks, and lock enforcement.
- A zero plan has a valid variance amount but an `N/A` variance percentage.
- The report uses category groups containing month rows and subtotal rows.
- Drill-down and report CSV export are in core scope.
- CSV actual import is deferred until all core requirements are stable.

See [DECISIONS.md](DECISIONS.md) for rationale and consequences.

## Intended architecture

```text
Browser
  -> Next.js UI
  -> TanStack Query API client
  -> same-origin /api proxy
  -> Express REST API
  -> domain services
  -> Mongoose
  -> MongoDB replica set / Atlas
```

MongoDB transactions require a replica-set-capable environment. Production will use MongoDB Atlas; local development will use either Atlas or a documented single-node replica set.

## Planned repository structure

```text
apps/
  web/                 Next.js product UI
  api/                 Express API and MongoDB models
packages/
  contracts/           shared API schemas and transport types
docs are kept at repository root for reviewer and agent discoverability
```

The exact implementation tree is specified in [ARCHITECTURE.md](ARCHITECTURE.md).

## Local foundation setup

Prerequisites:

- Node.js 24
- pnpm 11

Install and run both development servers:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Foundation endpoints:

- Web: `http://localhost:3000`
- API liveness: `http://localhost:4000/health/live`
- Proxied API liveness: `http://localhost:3000/api/health/live`

Environment examples are available at `apps/web/.env.example` and `apps/api/.env.example`. The checked-in defaults are sufficient for the Phase 1 placeholders.

Quality commands:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

## Documentation index

- [REQUIREMENTS.md](REQUIREMENTS.md) — assignment requirements, scope, and acceptance criteria
- [DECISIONS.md](DECISIONS.md) — settled architectural and product decisions
- [DOMAIN.md](DOMAIN.md) — financial rules, calculations, time semantics, and locking invariants
- [ARCHITECTURE.md](ARCHITECTURE.md) — system boundaries, request flow, and module layout
- [DATABASE.md](DATABASE.md) — MongoDB collections, indexes, transactions, and change management
- [API.md](API.md) — intended REST contracts and error behavior
- [FRONTEND.md](FRONTEND.md) — routes, Align UI direction, workflows, and React Query strategy
- [TESTING.md](TESTING.md) — test layers, fixtures, and critical cases
- [DEPLOYMENT.md](DEPLOYMENT.md) — environments, hosting, cookies, and release process
- [ROADMAP.md](ROADMAP.md) — independently verifiable implementation phases
- [AGENTS.md](AGENTS.md) — rules for future coding agents

## Current status

- Research and planning: complete
- Architecture decisions: documented
- Monorepo foundation: complete
- MongoDB foundation and Mongoose models: complete
- Compound unique indexes and verification: complete
- Multi-document transactions and test harness: complete
- Authentication and domain implementation: not started
- Deployment: not created
- Live URL: not available yet

## Reviewer workflow target

Once implemented, a reviewer should be able to:

1. Create an account.
2. Load the assignment sample data.
3. Review Plan vs Actual totals and variance.
4. Inspect underlying actual entries.
5. Lock January 2026.
6. Observe read-only controls.
7. Attempt a stale mutation and receive a clear API error.

## Deliberate non-goals

- Enterprise FP&A functionality
- Organizations, teams, roles, or approval workflows
- Multiple currencies
- Forecast versions and scenario modeling
- Fiscal-year customization
- Reversible period locks
- Microservices, queues, Redis, event sourcing, or CQRS
- Runtime dependencies on the Orders & Settlements repository or reference dashboards
