# Architecture

## 1. Architecture goals

- Keep financial rules server-authoritative.
- Keep the system small enough to understand in one review session.
- Make ownership and period locking difficult to bypass.
- Use MongoDB intentionally rather than copying a relational design.
- Keep frontend server state predictable through TanStack Query.
- Support independent, verifiable roadmap phases.

## 2. System context

```text
┌─────────────────────────────────────────────────────────┐
│ Next.js web application                                │
│ Align UI · forms · charts · TanStack Query             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / JSON through /api
┌───────────────────────▼─────────────────────────────────┐
│ Express API                                             │
│ auth · validation · ownership · domain rules · reports │
└───────────────────────┬─────────────────────────────────┘
                        │ Mongoose
┌───────────────────────▼─────────────────────────────────┐
│ MongoDB replica set / Atlas                            │
│ documents · indexes · transactions                     │
└─────────────────────────────────────────────────────────┘
```

The Next.js application does not connect to MongoDB. Express is the only authoritative data-access boundary.

## 3. Monorepo structure

```text
apps/
  web/
    app/
      (auth)/
        login/
        signup/
      (dashboard)/
        dashboard/
        planning/
        actuals/
        report/
      layout.tsx
      providers.tsx
    src/
      components/
        ui/                 Align UI primitives
        shared/             cross-feature UI only
      features/
        auth/
        categories/
        planning/
        actuals/
        reports/
        periods/
      lib/
        api-client/
        query-keys/
        formatting/
      providers/
  api/
    src/
      app.ts                Express composition, no listen side effect
      server.ts             process startup and shutdown
      config/
      database/
        connection.ts
        indexes.ts
        migrations/
      http/
        middleware/
        errors/
        router.ts
      modules/
        auth/
        categories/
        plans/
        actuals/
        periods/
        reports/
        demo/
      shared/
        money/
        month/
        transactions/
        serialization/
packages/
  contracts/
    src/
      auth/
      categories/
      plans/
      actuals/
      reports/
      periods/
      errors/
```

The precise file names may evolve, but feature and responsibility boundaries should remain.

## 4. Package boundaries

### `apps/web`

Owns:

- Routes and page composition.
- Align UI components.
- Forms and local draft state.
- TanStack Query hooks and cache behavior.
- Formatting and accessible presentation.

Does not own:

- Authoritative calculations.
- Ownership decisions.
- Lock enforcement.
- Database access.

### `apps/api`

Owns:

- Authentication and sessions.
- Authorization and ownership scoping.
- Request validation and response serialization.
- Category, plan, actual, period, and report domain behavior.
- MongoDB models, indexes, and transactions.
- Structured errors and request logging.

### `packages/contracts`

Owns only transport-level concepts:

- Zod request/query/response schemas.
- API error code union.
- Branded strings such as `MonthString` and `MoneyMinorString`.
- JSON-safe DTO types.

It must not import Mongoose, React, Express, or server-only domain services.

## 5. API request lifecycle

```text
request id
  -> security headers / body limits
  -> origin and CORS policy
  -> cookie session authentication
  -> route parameter/query/body validation
  -> controller
  -> domain service
  -> Mongoose query or transaction
  -> DTO serialization
  -> structured JSON response
  -> centralized error handling
```

Controllers translate HTTP to service inputs and outputs. They should contain no calculation, ownership, or transaction logic.

## 6. Backend module pattern

A feature module may contain:

```text
*.model.ts          Mongoose model
*.service.ts        domain behavior
*.controller.ts     HTTP translation
*.routes.ts         route declaration
*.serializer.ts     document/aggregate to DTO
*.errors.ts         feature-specific error constructors
*.test.ts           colocated unit tests where useful
```

Do not create repository interfaces or generic base services. Mongoose access inside cohesive services is adequate.

## 7. Validation boundaries

- Shared Zod schemas validate JSON-safe transport inputs.
- Mongoose schemas validate persistence shape.
- Services validate ownership, category state, uniqueness intent, period state, and domain invariants.
- Unique indexes are the final authority against races.
- Controllers never assume frontend validation already ran.

## 8. Authentication boundary

The browser receives an opaque session cookie. Express hashes the presented token and loads an unexpired session plus user.

Session middleware exposes a small authenticated principal:

```text
{ userId, sessionId, email }
```

Database queries accept `userId` explicitly. Do not hide ownership in mutable process-global context.

## 9. Transaction boundary

MongoDB transactions are required for:

- Signup plus seeded categories plus session creation.
- Batch plan edits.
- Actual moves between months.
- Every protected financial mutation's period coordination.
- Period locking.
- Sample-data loading.

Use Mongoose `Connection#transaction()` or the underlying `withTransaction()` behavior, which retries transient transaction errors. Do not run parallel operations with `Promise.all()` inside one transaction.

The deployment and local database must be replica-set capable.

## 10. Reporting boundary

Reports are read models produced on demand from stored plans, actuals, categories, and financial periods.

The reporting service:

1. Validates range and filters.
2. Queries user-scoped categories and plans.
3. Aggregates actuals in MongoDB with `$match` and `$group`.
4. Loads period states.
5. Builds the category/month grid.
6. Calculates rows, subtotals, summary, and chart series.
7. Serializes all money to strings.

Do not download raw actual entries to the browser to compute the report.

## 11. Frontend architecture

Pages compose feature components. Feature folders contain:

```text
api/              request functions and query options
components/       feature-specific UI
forms/            Zod-backed form behavior
hooks/            small UI coordination hooks
types/            UI-only types when needed
```

Use server components for stable layout/metadata where helpful, but authenticated product data is consumed through the Express API and TanStack Query. Do not introduce Next.js route handlers as a second backend.

## 12. Server-state architecture

TanStack Query owns remote state. Query keys are centralized and filter objects are normalized.

Local React state owns:

- Drawer/dialog visibility.
- Draft form input.
- Unsaved planning-grid edits.
- Ephemeral table selection.

URL search parameters own shareable report filters.

No query response should be copied into a global atom/store. Forms may initialize a draft from query data and submit explicit changes.

## 13. Error architecture

Services throw typed application errors. Central middleware maps them to:

```json
{
  "error": {
    "code": "PERIOD_LOCKED",
    "message": "January 2026 is locked and can no longer be modified.",
    "details": { "month": "2026-01" },
    "requestId": "request-id"
  }
}
```

Unexpected errors are logged with the request ID and returned as a generic `INTERNAL_ERROR`. Stack traces and database messages are never returned to clients.

## 14. Observability

Initial scope:

- Structured JSON logs in production.
- Request ID on every request and error.
- Method, route, status, and duration.
- Health endpoints.
- Transaction retry and unexpected duplicate-key error logging.
- No passwords, cookies, session tokens, or raw connection strings in logs.

Distributed tracing and external APM are production improvements, not take-home requirements.

## 15. Security architecture

- Argon2id password hashing.
- Hashed opaque session tokens.
- HttpOnly, Secure, SameSite=Lax production cookie.
- Same-origin API proxy.
- Mutation origin validation.
- Exact CORS allowlist for direct local development.
- Login/signup rate limits.
- JSON body limits.
- Ownership included in every user-resource predicate.
- Report and export range limits.
- CSV formula-injection escaping.

## 16. Architecture constraints

Do not add:

- Next.js API routes as authoritative endpoints.
- PostgreSQL or Prisma.
- Redux/Zustand/Jotai for server data.
- GraphQL.
- Microservices.
- Message queues.
- Redis caching.
- Event sourcing or CQRS.
- Generic repository or use-case frameworks.
- Shared source dependencies on other CrossVal submissions.

## 17. Evolution points

Only after measurement or new requirements:

- Report-specific aggregation pipelines or materialized monthly summaries.
- CSV import job processing.
- Audit events.
- Reopening periods with authorization.
- Organizations and roles.
- Multi-currency.
