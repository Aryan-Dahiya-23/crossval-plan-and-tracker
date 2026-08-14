# MongoDB Data Design

## 1. Technology decision

Use MongoDB with Mongoose. Mongoose `BigInt` maps to MongoDB's BSON 64-bit integer (`long`), which supports the approved integer-cents model. MongoDB unique compound indexes enforce cross-document uniqueness, and Mongoose/MongoDB sessions support multi-document transactions.

Relevant primary documentation:

- [Mongoose SchemaTypes](https://mongoosejs.com/docs/schematypes.html)
- [Mongoose transactions](https://mongoosejs.com/docs/transactions.html)
- [MongoDB unique indexes](https://www.mongodb.com/docs/manual/core/index-unique/)
- [MongoDB compound indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/)

## 2. General conventions

- Document IDs: MongoDB `ObjectId`.
- API IDs: 24-character hexadecimal strings.
- Ownership field: `userId: ObjectId` on every user-owned document.
- Timestamps: UTC BSON dates for real instants such as `createdAt`, `updatedAt`, and `lockedAt`.
- Month: `monthKey: Int32` in `YYYYMM` form.
- Money: Mongoose `BigInt` / BSON Long, expressed as integer cents.
- Mongoose schema strict mode enabled.
- `versionKey` disabled unless a feature explicitly uses document versioning; financial-period coordination has its own `version`.
- Collection names are explicit and plural.

MongoDB references are intentionally denormalized with `userId` to make ownership predicates and compound indexes straightforward.

## 3. Collections

### `users`

```text
_id: ObjectId
email: string
emailCanonical: string
passwordHash: string
createdAt: Date
updatedAt: Date
```

Indexes:

```text
{ emailCanonical: 1 } unique
```

Rules:

- Canonical email is trimmed and lowercased.
- Password hashes are never selected by default except in the login service.

### `sessions`

```text
_id: ObjectId
userId: ObjectId
tokenHash: string
expiresAt: Date
createdAt: Date
lastSeenAt?: Date
```

Indexes:

```text
{ tokenHash: 1 } unique
{ userId: 1, expiresAt: 1 }
{ expiresAt: 1 } expireAfterSeconds: 0
```

TTL deletion is cleanup only; authentication always rejects `expiresAt <= now` because TTL cleanup is asynchronous.

### `categories`

```text
_id: ObjectId
userId: ObjectId
name: string
nameCanonical: string
colorKey: string
archivedAt: Date | null
createdAt: Date
updatedAt: Date
```

Indexes:

```text
{ userId: 1, nameCanonical: 1 } unique
{ userId: 1, archivedAt: 1, name: 1 }
```

Uniqueness applies across archived and active categories. A user cannot create a new category with an archived category's name; future restoration can be added deliberately.

### `plans`

```text
_id: ObjectId
userId: ObjectId
categoryId: ObjectId
monthKey: Int32
amountMinor: BigInt / BSON Long
createdAt: Date
updatedAt: Date
```

Indexes:

```text
{ userId: 1, categoryId: 1, monthKey: 1 } unique
{ userId: 1, monthKey: 1, categoryId: 1 }
```

The first index prevents duplicate plans. The second supports user/month range scans and report joins.

### `actuals`

```text
_id: ObjectId
userId: ObjectId
categoryId: ObjectId
monthKey: Int32
amountMinor: BigInt / BSON Long
note: string | null
createdAt: Date
updatedAt: Date
```

Indexes:

```text
{ userId: 1, monthKey: 1, categoryId: 1 }
{ userId: 1, categoryId: 1, monthKey: 1 }
{ userId: 1, monthKey: -1, createdAt: -1, _id: -1 }
```

The first supports reports; the second supports category drill-down across time; the third supports actual-ledger pagination.

### `financialPeriods`

```text
_id: ObjectId
userId: ObjectId
monthKey: Int32
status: "OPEN" | "LOCKED"
version: Int32
lockedAt: Date | null
createdAt: Date
updatedAt: Date
```

Indexes:

```text
{ userId: 1, monthKey: 1 } unique
{ userId: 1, status: 1, monthKey: 1 }
```

The document is both the period state and concurrency-coordination record.

### `schemaMigrations`

```text
_id: string              migration identifier
appliedAt: Date
checksum?: string
```

Used by versioned, idempotent change scripts. It is infrastructure, not a domain collection.

## 4. Referential integrity

MongoDB does not provide application-level foreign keys. Services must:

- Query categories by `{ _id: categoryId, userId }`.
- Reject archived categories for new financial data.
- Query plans/actuals by both `_id` and `userId`.
- Never trust a request-provided `userId`.
- Treat a missing owned resource as `NOT_FOUND`.

Category IDs and user IDs in plan/actual documents are not client-authoritative; `userId` comes from the session.

## 5. Transactions and locking

All protected mutations write the relevant `financialPeriods` document and financial documents in one transaction.

The coordination write increments `version`. This intentionally causes concurrent operations for the same user/month to conflict and retry rather than both proceeding from an unlocked snapshot.

For an actual moved between two months:

1. Sort the two month keys.
2. Coordinate the lower key.
3. Coordinate the higher key.
4. Verify both are open.
5. Update the actual.

Consistent ordering reduces avoidable contention.

Transaction requirements:

- MongoDB replica set or sharded cluster.
- Primary read preference for the transaction.
- Majority write concern and snapshot read concern when supported by the chosen helper/default.
- No `Promise.all()` inside a transaction.
- Retry transient transaction failures through the driver/Mongoose helper.
- Convert exhausted retries into a generic conflict or internal error without leaking database details.

## 6. Report query strategy

For a range:

- `categories.find({ userId, ... })`
- `plans.find({ userId, monthKey: { $gte, $lte }, ... })`
- `actuals.aggregate([{ $match }, { $group }])`
- `financialPeriods.find({ userId, monthKey: { $gte, $lte } })`

Actual aggregation groups by:

```text
{ categoryId, monthKey }
```

and sums `amountMinor`.

The service creates the bounded category/month grid and calculates totals. The initial range maximum is 60 months.

Do not use `$lookup` by default. Parallel user-scoped reads followed by a cohesive server merge are easier to test and adequate for the expected dataset. Profile before introducing a single complex aggregation pipeline.

## 7. Data-change management

Mongoose models are not a deployment migration strategy.

Plan:

- `autoIndex: true` only in development/test if convenient.
- `autoIndex: false` in production.
- Versioned scripts create/change indexes and transform documents.
- Scripts record completion in `schemaMigrations`.
- Every script is idempotent or explicitly guarded.
- Destructive transformations require backup and rollback instructions.
- Deployment runs pending scripts before switching traffic to code that requires them.

Do not call `syncIndexes()` blindly in production because it may drop indexes not declared by the current model.

## 8. Seed and sample data

Default categories are created inside the signup transaction.

Assignment sample data is not a global seed shared by users. It is loaded into an authenticated, empty account through a transactional domain operation.

Automated tests use isolated database names or collections and deterministic fixture builders.

## 9. Scaling notes

At modest scale, the approved indexes and bounded range queries are sufficient.

At larger scale:

- Verify pipelines with `explain("executionStats")`.
- Use cursor pagination for actuals.
- Keep equality fields (`userId`) before range/sort fields in compound indexes.
- Monitor index size and write amplification.
- Consider monthly summary documents only after measuring report latency.
- If sharding becomes necessary, choose a shard key based on observed tenant distribution and account for unique-index constraints.

Do not introduce sharding, materialized summaries, or external caches in the take-home implementation.

## 10. Backup and recovery expectations

MongoDB Atlas managed backups are a production recommendation. The take-home deployment should at minimum document:

- How to recreate indexes.
- How to run versioned change scripts.
- How sample data is recreated.
- Which environment owns the production connection string.
