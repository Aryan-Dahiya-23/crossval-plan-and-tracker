# Deployment and Operations Plan

This document describes the intended deployment. No infrastructure currently exists.

## 1. Target topology

```text
Browser
  -> Vercel: Next.js web
       /api/* external rewrite
  -> Render: Express web service
  -> MongoDB Atlas: replica-set-capable managed MongoDB
```

Primary references:

- [Vercel external rewrites](https://vercel.com/docs/routing/rewrites)
- [Render Express deployment](https://render.com/docs/deploy-node-express-app)
- [MongoDB Atlas connection documentation](https://www.mongodb.com/docs/atlas/connect-your-application/)
- [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/)

## 2. Why this topology

- Vercel is the natural host for Next.js.
- Render runs a persistent Express process and supports health checks and deployment commands.
- Atlas provides managed MongoDB with transaction-capable replica sets.
- A Vercel external rewrite keeps browser API requests on the web origin, simplifying secure cookie behavior while Express remains the backend.

Use a non-sleeping API service for the final submission so reviewer requests do not suffer cold-start delays.

## 3. Environments

### Local

- Next.js on `localhost:3000`.
- Express on `localhost:4000`.
- Next.js rewrites `/api/*` to the local API.
- MongoDB Atlas development database or a local single-node replica set.

A standalone local `mongod` is insufficient for transaction tests.

### Test

- Dedicated transaction-capable MongoDB instance/database.
- Explicit test database names.
- No production credentials.
- Deterministic secrets and short session lifetime where helpful.

### Preview

- Vercel preview web deployment.
- A safe API/database strategy selected before enabling public previews.
- Never point arbitrary pull-request previews at production MongoDB.

For a take-home, preview deployments may use one controlled staging API and database rather than per-branch API services.

### Production

- Vercel production web project.
- Render production API web service.
- MongoDB Atlas production database/user.
- Secure cookies, production logging, exact origin policy, and non-sleeping service.

## 4. Environment variables

### Web

```text
API_UPSTREAM_URL          server-side upstream used by rewrite
NEXT_PUBLIC_APP_URL       canonical public web URL when needed
```

Do not expose database or session secrets through `NEXT_PUBLIC_*` variables.

### API

```text
NODE_ENV
PORT
MONGODB_URI
MONGODB_DB_NAME
WEB_ORIGIN
SESSION_COOKIE_NAME
SESSION_TOKEN_PEPPER
SESSION_TTL_SECONDS
PASSWORD_HASH_PARAMETERS or documented constants
LOG_LEVEL
TRUST_PROXY
```

If transactional email, analytics, or monitoring is added later, document each new secret before use.

### CI/Test

```text
TEST_MONGODB_URI
TEST_MONGODB_DB_PREFIX
TEST_SESSION_TOKEN_PEPPER
```

## 5. API process requirements

- Bind to `0.0.0.0` and the platform-provided `PORT`.
- Handle `SIGTERM` by stopping new requests, closing the HTTP server, and closing Mongoose cleanly.
- Configure Express `trust proxy` deliberately for Render.
- Fail startup if required configuration is absent.
- Fail readiness if MongoDB is unavailable.
- Avoid connecting/listening as an import side effect so API tests can mount `app.ts`.

## 6. Health endpoints

### `GET /health/live`

Proves the process is running. It should not require authentication or a database round trip.

### `GET /health/ready`

Checks MongoDB connection readiness with a short timeout.

Health responses contain no secrets, connection strings, database names, or internal topology.

## 7. Cookie and proxy strategy

The browser calls the web origin:

```text
https://app.example.vercel.app/api/v1/...
```

Vercel rewrites the request to the Render API without changing the browser URL.

Production cookie:

- HttpOnly.
- Secure.
- SameSite=Lax.
- Path `/` or the narrowest path compatible with auth and API requests.
- Host-only by omitting `Domain`.
- Explicit Max-Age/Expires matching server session policy.

Deployment smoke tests must verify that `Set-Cookie` survives the external rewrite and subsequent `/api` requests authenticate correctly. If platform behavior blocks this, the fallback is custom sibling domains under one parent domain, not browser-accessible tokens.

## 8. CORS and origin checks

The same-origin production proxy means browser requests normally do not need permissive CORS.

API policy:

- Allow only documented local/direct origins when direct access is needed.
- Use credentials only with an exact origin, never `*`.
- Validate `Origin` on state-changing browser requests.
- Health endpoints may remain broadly readable.

## 9. HTTP caching

- Authenticated API responses use `Cache-Control: no-store` at shared caches.
- Do not enable Vercel rewrite/CDN caching for authenticated `/api` traffic.
- TanStack Query provides private in-browser memory caching.
- Static web assets use framework defaults.

## 10. Database provisioning

Atlas setup:

- Region reasonably close to the API region.
- Dedicated application database user with least practical privileges.
- Network access restricted as far as platform egress allows.
- TLS connection string stored only as a secret.
- Replica-set-capable cluster.
- Backups enabled where the selected tier supports them.

Use separate users/databases for staging and production.

## 11. Database change process

Before application code depends on a new shape/index:

1. Add a versioned, idempotent database-change script.
2. Test against a production-shaped staging database.
3. Back up if the change is destructive.
4. Run the script before or during deployment through a controlled release step.
5. Verify the `schemaMigrations` record and indexes.
6. Deploy compatible application code.

Do not rely on Mongoose production `autoIndex` or blind `syncIndexes()`.

## 12. Build and start commands

Verified Phase 1 commands:

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm --filter @crossval/web build
pnpm --filter @crossval/api build
pnpm --filter @crossval/api start
```

Database-change and index-verification commands are created in Phase 2 and do not exist yet.

## 13. CI/CD pipeline

Pull request / pre-deploy:

1. Frozen dependency install.
2. Formatting check.
3. Lint.
4. Typecheck.
5. Unit tests.
6. MongoDB integration/API tests.
7. Web and API production builds.
8. Playwright smoke test against a production-shaped environment where feasible.

Production release:

1. Confirm database backup/change readiness.
2. Apply pending database-change scripts.
3. Deploy API.
4. Verify readiness and API smoke tests.
5. Deploy web.
6. Verify rewrite, signup, report, lock, and logout.
7. Record deployed commit and URLs in README.

## 14. Rollback

- Web: redeploy the last known-good Vercel deployment.
- API: redeploy the last known-good Render build.
- Database: prefer backward-compatible expand/contract changes so application rollback does not require immediate data rollback.
- Destructive data rollback requires the change-specific backup/restore plan.

## 15. Production smoke checklist

- Public web URL loads without authentication errors.
- Signup creates categories and session.
- Session cookie is Secure and HttpOnly.
- Reload preserves authentication.
- Sample data loads.
- Report numbers match fixtures.
- Chart renders.
- January locks.
- Locked mutation returns `PERIOD_LOCKED`.
- CSV downloads safely.
- Logout clears/revokes session.
- Health endpoints report expected state.
- No secrets or stack traces appear in browser responses/logs.

## 16. Production improvements beyond the take-home

- External error monitoring and alerting.
- Centralized log retention.
- Automated backup-restore exercises.
- Secret rotation procedure.
- Session/device management.
- Audit history and controlled period reopening.
- Load tests and report-performance dashboards.
