# REST API Specification

## 1. Conventions

- Base path: `/v1`
- Content type: `application/json`
- Authentication: opaque HttpOnly session cookie
- IDs: MongoDB ObjectId strings
- Months: `YYYY-MM`
- Money: integer-cent decimal strings
- Timestamps: ISO 8601 UTC strings

Successful single-resource responses use `{ "data": ... }`. Collections use `{ "data": [...], "meta": ... }` when pagination or range metadata exists.

## 2. Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": {
      "fields": {
        "amountMinor": ["Amount must be greater than zero."]
      }
    },
    "requestId": "req_123"
  }
}
```

Approved codes:

- `VALIDATION_ERROR`
- `AUTHENTICATION_REQUIRED`
- `INVALID_CREDENTIALS`
- `EMAIL_ALREADY_EXISTS`
- `NOT_FOUND`
- `CATEGORY_ALREADY_EXISTS`
- `CATEGORY_ARCHIVED`
- `PERIOD_ALREADY_LOCKED`
- `PERIOD_LOCKED`
- `SAMPLE_DATA_NOT_AVAILABLE`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

Do not expose MongoDB duplicate-key messages, cast errors, or stack traces.

## 3. Authentication

### `POST /v1/auth/signup`

Request:

```json
{
  "email": "reviewer@example.com",
  "password": "correct horse battery staple"
}
```

Behavior:

- Normalize email.
- Hash password.
- Create user, default categories, and session transactionally.
- Set session cookie.

Response: `201` with public user DTO.

Errors: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `RATE_LIMITED`.

### `POST /v1/auth/login`

Request: email and password.

Response: `200` with public user DTO and refreshed session cookie.

Invalid email and password use the same `INVALID_CREDENTIALS` response.

### `POST /v1/auth/logout`

Revokes the current session and clears the cookie. Repeated logout is safe. Response: `204`.

### `GET /v1/auth/me`

Response: current public user DTO or `AUTHENTICATION_REQUIRED`.

## 4. Categories

Category DTO:

```json
{
  "id": "object-id",
  "name": "Marketing",
  "colorKey": "purple",
  "archivedAt": null,
  "createdAt": "2026-08-14T10:00:00.000Z",
  "updatedAt": "2026-08-14T10:00:00.000Z"
}
```

### `GET /v1/categories?includeArchived=false`

Returns alphabetically sorted owned categories.

### `POST /v1/categories`

Request: `{ "name": "Travel", "colorKey": "sky" }`.

Response: `201`.

### `PATCH /v1/categories/:categoryId`

May update `name` and `colorKey`. Response: `200`.

### `POST /v1/categories/:categoryId/archive`

Archives an active category. Response: `200` with updated category.

Category metadata changes are not blocked by month locks because they do not alter locked plan or actual amounts. The frontend must resolve or warn about unsaved planning-grid drafts before initiating an archive.

## 5. Plans

Plan DTO:

```json
{
  "id": "object-id",
  "categoryId": "object-id",
  "month": "2026-01",
  "amountMinor": "500000",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /v1/plans?from=2026-01&to=2026-03&categoryId=`

Returns owned plans in the inclusive range.

### `PUT /v1/plans/:categoryId/:month`

Request: `{ "amountMinor": "500000" }`.

Creates or replaces the target. Response: `200` or `201`; the implementation should use one documented status consistently.

### `DELETE /v1/plans/:categoryId/:month`

Clears the plan. Response: `204` whether absent or deleted, provided the owned category exists and the month is open.

### `PATCH /v1/plans/months/:month`

Request:

```json
{
  "changes": [
    { "categoryId": "id-1", "amountMinor": "500000" },
    { "categoryId": "id-2", "amountMinor": null }
  ]
}
```

`null` clears a plan. Duplicate category IDs are rejected. All changes commit atomically. Response returns the resulting plans for that month.

## 6. Actuals

Actual DTO:

```json
{
  "id": "object-id",
  "categoryId": "object-id",
  "month": "2026-01",
  "amountMinor": "200000",
  "note": "Google Ads",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /v1/actuals`

Query parameters:

- `month` or `from`/`to`
- `categoryId`
- `cursor`
- `limit`, default 20, maximum 100

Sort: `monthKey desc`, `createdAt desc`, `_id desc`.

### `POST /v1/actuals`

Request:

```json
{
  "categoryId": "object-id",
  "month": "2026-01",
  "amountMinor": "200000",
  "note": "Google Ads"
}
```

Response: `201`.

### `GET /v1/actuals/:actualId`

Returns one owned actual or `NOT_FOUND`.

### `PATCH /v1/actuals/:actualId`

May update category, month, amount, or note. If the month changes, both source and destination periods must be open.

### `DELETE /v1/actuals/:actualId`

Deletes an owned actual from an open month. Response: `204`.

### `POST /v1/actuals/import`

Batch creates actual expense entries from a structured payload (derived from CSV file parsing).

Request:

```json
{
  "entries": [
    {
      "month": "2026-01",
      "categoryName": "Marketing",
      "amountMinor": "200000",
      "note": "Google Ads Retainer"
    }
  ]
}
```

Behavior:

- Maximum 500 entries per batch payload.
- Validates active category ownership by name (case-insensitive trim match).
- Validates that target months are open (rejects with `409 PERIOD_LOCKED` if any target month is locked).
- Creates all valid expense items atomically within a single MongoDB transaction.

Response: `201` with created actual documents and summary counts:

```json
{
  "data": {
    "createdCount": 1,
    "actuals": [ ... ]
  }
}
```

Errors: `VALIDATION_ERROR`, `CATEGORY_NOT_FOUND`, `CATEGORY_ARCHIVED`, `PERIOD_LOCKED`.

## 7. Report

### `GET /v1/reports/plan-vs-actual`

Query:

- `from` required
- `to` required
- `categoryId` repeatable or a normalized comma-separated list, selected consistently during implementation

Maximum range: 60 months.

Response shape:

```json
{
  "data": {
    "range": { "from": "2026-01", "to": "2026-03" },
    "summary": {
      "planMinor": "5000000",
      "actualMinor": "4900000",
      "varianceMinor": "-100000",
      "variancePercent": "-2.00",
      "overPlanCategoryCount": 1
    },
    "monthlySeries": [
      {
        "month": "2026-01",
        "planMinor": "2500000",
        "actualMinor": "2530000",
        "varianceMinor": "30000",
        "locked": false
      }
    ],
    "categories": [
      {
        "category": { "id": "...", "name": "Marketing", "colorKey": "purple" },
        "subtotal": {
          "planMinor": "1000000",
          "actualMinor": "480000",
          "varianceMinor": "-520000",
          "variancePercent": "-52.00"
        },
        "months": [
          {
            "month": "2026-01",
            "hasPlan": true,
            "planMinor": "500000",
            "actualMinor": "480000",
            "varianceMinor": "-20000",
            "variancePercent": "-4.00",
            "actualEntryCount": 3,
            "locked": false
          }
        ]
      }
    ]
  }
}
```

When aggregate plan is zero, `variancePercent` is `null`.

Actual drill-down uses the ordinary actuals endpoint filtered by category and month; no duplicate report-specific detail endpoint is required.

## 8. Periods

### `GET /v1/periods?from=2026-01&to=2026-12`

Returns explicit period documents plus implicit open state for missing months when needed by the UI.

### `POST /v1/periods/:month/lock`

Request body is empty.

Response: `201` or `200` with locked period DTO. A second request returns `409 PERIOD_ALREADY_LOCKED`.

There is no unlock endpoint.

## 9. Demo data

### `POST /v1/demo/assignment-sample`

Loads the assignment sample into an empty authenticated account.

Response: `201` with created counts and recommended report range.

Errors:

- `SAMPLE_DATA_NOT_AVAILABLE` if plans, actuals, or locks already exist.
- Normal validation/transaction errors otherwise.

This endpoint is part of reviewer experience, not an unauthenticated seed backdoor.

## 10. Report CSV export

Initial implementation generates CSV in the browser from the already-authoritative report DTO. It does not create another API endpoint.

Requirements:

- Export matches active filters.
- UTF-8 with stable headings.
- Money exported as decimal currency values, not cents.
- Formula-leading text cells are escaped.
- Filename contains the report range.

If report sizes later exceed browser-friendly limits, move export generation to a streaming API endpoint.

## 11. HTTP caching and retries

- Authenticated financial responses default to `Cache-Control: no-store` at shared HTTP/CDN layers.
- TanStack Query provides browser-memory caching.
- Mutations are not automatically retried by the frontend.
- The backend transaction helper may retry transient database transaction failures.

## 12. Idempotency

No general idempotency-key system is included initially.

- Plan `PUT` is naturally idempotent.
- Plan deletion and logout are safe to repeat.
- Period re-lock returns a stable conflict.
- Actual creation and batch CSV import are transactional.
- UI disables repeated submission while pending.
