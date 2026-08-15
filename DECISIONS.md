# Decision Register

This document records approved decisions. Future agents must not silently change them. A material change requires updating this file and every affected specification before implementation proceeds.

## D-001 — MongoDB and Mongoose

**Decision:** Use MongoDB and Mongoose. Do not use PostgreSQL or Prisma.

**Reason:** MongoDB aligns with the role requirement explicitly supplied by the user. Mongoose is a native MongoDB modeling layer with schema definitions, BSON types, indexes, middleware, and transaction/session integration.

**Consequences:**

- Production and test environments need replica-set transaction support.
- Referential integrity is enforced in services and ownership-scoped queries, not foreign keys.
- Database changes use versioned MongoDB scripts rather than relational migrations.

## D-002 — Multiple actual entries

**Decision:** Permit multiple actual entries per category/month.

**Reason:** It models real expenses, preserves notes, supports drill-down, and makes future CSV import natural.

**Consequence:** Reports aggregate actual documents by user, category, and month.

## D-003 — Missing actual is zero

**Decision:** The sum of no actual entries is zero recorded spend.

**Reason:** It matches the assignment sample, makes totals/charts complete, and fits an entry-ledger model.

**Consequence:** The UI should use wording such as “Recorded actual” where data completeness might otherwise be implied.

## D-004 — Month key

**Decision:** Store months as an integer `YYYYMM`; use `YYYY-MM` in API and UI contracts.

**Reason:** A month is not an instant. This avoids timezone bugs while retaining sortable, indexable range values.

**Consequence:** Shared conversion and validation utilities are mandatory.

## D-005 — Monthly irreversible locks

**Decision:** Lock one month at a time; do not provide unlock in the initial version.

**Reason:** It is clear, easy to demonstrate, and provides strong finalization semantics without introducing roles or audit requirements.

**Consequence:** The UI requires a deliberate confirmation and must describe the action as permanent.

## D-006 — Financial-period coordination document

**Decision:** Store one `financialPeriods` document per user/month with `OPEN` or `LOCKED` status and a monotonic version.

**Reason:** Every protected mutation can write the same period document inside a transaction. This creates a concurrency boundary between mutations and locking that a standalone lock document check would not reliably provide.

**Consequence:** Plans and actual mutations require a MongoDB transaction even though each primarily changes one financial document.

## D-007 — Seeded, user-managed categories

**Decision:** Seed common categories at signup and allow create, rename, and archive.

**Reason:** It gives reviewers useful defaults without reducing the product to a fixed list.

**Consequence:** Historical categories are archived rather than deleted.

## D-008 — Integer cents as BSON Long

**Decision:** Store USD money in integer cents using Mongoose `BigInt`, which maps to MongoDB BSON 64-bit integer/Long.

**Reason:** Floating-point values are inappropriate for authoritative financial amounts.

**Consequence:** API money values are decimal strings because JSON cannot encode JavaScript `bigint`.

## D-009 — Zero-plan percentage

**Decision:** Calculate the variance amount normally and return `null` for variance percentage when plan is zero.

**Reason:** Percentage variance is mathematically undefined when its denominator is zero.

## D-010 — Backend authority

**Decision:** Express owns financial calculations, aggregation, ownership, and lock decisions.

**Reason:** Browser calculations and disabled buttons cannot protect financial invariants.

**Consequence:** The frontend may format values but must not recompute authoritative report fields.

## D-011 — Report layout

**Decision:** Use category groups containing month rows, category subtotals, and an overall total.

**Reason:** It preserves the assignment's category/month detail without producing an arbitrarily wide pivot table.

## D-012 — Database-backed cookie sessions

**Decision:** Use opaque database sessions in Secure, HttpOnly cookies.

**Reason:** They are revocable, simple to reason about, and avoid browser-accessible token storage.

**Consequence:** Production uses a same-origin `/api` proxy and origin checks on mutations.

## D-013 — React Query for server state

**Decision:** Use TanStack Query for authentication identity, categories, plans, actuals, reports, and locks.

**Reason:** It supplies caching, deduplication, mutation state, and invalidation without another global server-state copy.

**Consequence:** Do not add Redux, Zustand, Jotai, Recoil, or similar unless an independent client-state requirement is documented first.

## D-014 — No optimistic financial mutations

**Decision:** Plan, actual, and lock mutations wait for server confirmation.

**Reason:** Correctness and clear domain errors matter more than a speculative instant update.

## D-015 — Drill-down and report export

**Decision:** Include actual-entry drill-down and report CSV export in core scope.

**Reason:** Both provide high reviewer/product value for modest cost.

## D-016 — Actual CSV batch import (Implemented)

**Decision:** Implement batch CSV import with client-side file parsing, live validation error preview table, sample template download, and server-side atomic multi-document transaction creation.

**Reason:** Enables bulk historical data loading and rapid expense ingestion while upholding locked-period immutability and active category validation.

## D-017 — Deployment topology

**Decision:** Deploy Next.js 16 Web application on Vercel, Express REST API on Vercel Serverless runtime (`apps/api/api/index.ts`), and MongoDB Atlas 3-node replica set cluster.

**Reason:** Eliminates cold-start sleep delays, ensures high availability, provides same-origin `/api/*` rewrite proxying, and enables multi-document ACID transactions on MongoDB Atlas.

**Consequence:** Single-origin session cookie architecture with verified zero-friction reviewer experience.

## D-018 — Independent submission

**Decision:** Share design language with Orders & Settlements, but share no code, packages, database, deployment, or feature architecture.
