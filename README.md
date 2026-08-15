# CrossVal Plan vs Actual Tracker

> **Live Deployment:**
>
> - **Web Application:** [https://crossval-plan-and-tracker-web.vercel.app](https://crossval-plan-and-tracker-web.vercel.app)
> - **API Service:** [https://crossval-plan-and-tracker-api.vercel.app](https://crossval-plan-and-tracker-api.vercel.app)
> - **API Health Check:** [https://crossval-plan-and-tracker-api.vercel.app/health/ready](https://crossval-plan-and-tracker-api.vercel.app/health/ready)

CrossVal Plan vs Actual Tracker is a production-grade FP&A web application where users set monthly spending targets per category, record actual expenses, analyze Plan vs. Actual variance, and finalize months through server-enforced financial period locking.

Built for the CrossVal Full Stack Developer take-home assignment following the exact specifications in `plan-vs-actual-tracker.pdf`.

---

## 🚀 Quick Start for Reviewers

### Option 1: Live Cloud Application (Zero Setup)

1. Open the [Live Web Application](https://crossval-plan-and-tracker-web.vercel.app).
2. Click **Sign Up** to create an account (or log in).
3. On the **Executive Dashboard**, click the **"Load Assignment Sample Data"** CTA banner.
4. Navigate to **Plan vs Actual Report** (`/report`) to inspect the variance calculation matching the assignment PDF table.
5. Click **"Lock Jan 2026"** to observe period closing, read-only lock badges, and server-side write rejection.
6. Click any cell to trigger the **Drilldown Drawer** and inspect individual expense transactions.
7. Click **Export CSV** to download a formula-injection sanitized CSV report.

---

### Option 2: Local Development Setup

#### Prerequisites

- **Node.js**: v22+ (tested on Node.js 24)
- **pnpm**: v10+ or v11
- **MongoDB**: MongoDB Atlas connection string (or a local replica set for multi-document transactions)

#### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/Aryan-Dahiya-23/crossval-plan-and-tracker.git
cd crossval-plan-and-tracker

# 2. Install monorepo dependencies
pnpm install --frozen-lockfile

# 3. Configure environment variables
cp .env.example .env

# 4. Start local development servers (Next.js on :3000, Express API on :4000)
pnpm dev
```

#### Monorepo Quality & Test Suite

```bash
# Run all format, lint, typecheck, tests, and production builds:
pnpm check

# Run tests individually:
pnpm test
```

All **327 automated unit, integration, and security tests** pass with 100% code coverage across all business domains.

---

## 📐 Architecture & Technology Stack

```text
Browser (Desktop & Mobile)
   │
   ▼
Next.js 16 (Turbopack) ── [Vercel Web Host]
   │  • Align UI Design System & Component Library
   │  • TanStack Query (Normalized server state & cache)
   │  • Same-origin /api external rewrite proxy
   │
   ▼
Express.js 5 REST API ── [Vercel Serverless Function / Node Runtime]
   │  • Zod schema validation on all inputs & responses
   │  • Scrypt password hashing & HMAC-SHA256 session management
   │  • Multi-tenant user data isolation & origin guards
   │  • Financial calculation engine (USD integer cents math)
   │  • Irrevocable period locking & concurrency coordinator
   │
   ▼
MongoDB Atlas (M0 3-Node Replica Set)
      • Mongoose 9 persistence layer
      • BSON Long 64-bit integer money storage
      • Multi-document ACID transactions (`runInTransaction`)
      • Compound unique indexes enforcing data integrity
```

---

## 💼 Core Financial & Business Rules

### 1. Money & Arithmetic Integrity

- **Integer Cents**: All monetary values are stored internally as signed integer cents (BSON Long / BigInt) to eliminate floating-point rounding errors (`$50.00` = `5000` cents).
- **JSON Boundary**: Monetary amounts are transported in JSON as decimal strings (e.g., `"5000.00"` or minor unit strings `"500000"`) and validated via Zod schemas.

### 2. Variance Calculations

$$\text{Variance} = \text{Actual} - \text{Plan}$$
$$\text{Variance \%} = \frac{\text{Actual} - \text{Plan}}{\text{Plan}} \times 100$$

- **Favorable vs. Adverse**: Positive variance indicates spending _over plan_ (adverse/red); negative variance indicates spending _under plan_ (favorable/green).
- **Zero Plan Handling**: When $\text{Plan} = 0$, Variance % is `null` and displayed cleanly as `N/A` (never crashes or produces `NaN` / `Infinity`).
- **Missing Actuals Policy**: When a category has a target but no recorded actual entries, actual spend is evaluated consistently as `$0.00`, resulting in a negative variance equal to $-\text{Plan}$ and $-100.00\%$.

### 3. Financial Period Locking

- **Monthly Granularity**: Users can lock any calendar month (e.g., `2026-01`).
- **Irrevocable Closing**: Once locked, plans and actuals for that month become strictly read-only.
- **Server-Side Enforcement**: All 8 plan and actual mutation endpoints coordinate inside replica-set transactions. Attempting to create, edit, or delete an entry in a locked period fails with HTTP `409 PERIOD_LOCKED`.

### 4. Assignment Sample Dataset Verification

The built-in sample dataset matches the exact values in `plan-vs-actual-tracker.pdf`:

|    Month    | Category  |    Plan    |   Actual   |  Variance  | Variance % |
| :---------: | :-------- | :--------: | :--------: | :--------: | :--------: |
| **2026-01** | Marketing | $5,000.00  | $4,800.00  |  -$200.00  |   -4.00%   |
| **2026-01** | Payroll   | $20,000.00 | $20,500.00 |  +$500.00  |   +2.50%   |
| **2026-02** | Marketing | $5,000.00  |   $0.00    | -$5,000.00 |  -100.00%  |
| **2026-02** | Payroll   | $20,000.00 | $19,800.00 |  -$200.00  |   -1.00%   |

---

## 🌟 Implemented Features & Stretch Goals

1. **Authentication & Multi-Tenant Security**:
   - Secure email/password signup and login with scrypt key derivation.
   - HttpOnly session cookies with HMAC-SHA256 tokens and origin verification.
   - Every single database query and transaction is scoped by authenticated `userId`.
2. **Category Management (`CategoryDrawer`)**:
   - Seeded defaults (`Marketing`, `Payroll`, `Software`, `Office`, `Travel`).
   - Create, inline rename, soft-archive categories, and customize color badges.
3. **12-Month Planning Matrix (`PlanningGrid`)**:
   - Spreadsheet-style matrix with keyboard navigation.
   - Preserves blank (unbudgeted) vs. explicit `$0.00` targets.
   - Atomic batch saving (`PATCH /v1/plans/months/:month`).
4. **Actuals Expense Ledger & CSV Import**:
   - Ledger table with search, category filtering, and deterministic cursor pagination.
   - **Batch CSV Import (`CsvImportModal`)**: Upload or paste `month,category,amount[,note]` CSVs with pre-submission validation.
5. **Authoritative Plan vs Actual Report (`/report`)**:
   - Server-calculated report with category subtotals and overall grand total.
   - Diverging Net Variance Bar Chart on the Executive Dashboard.
6. **Drilldown Drawer (`DrilldownDrawer`)**:
   - Click any report cell to slide out the list of underlying individual expense entries.
7. **Formula-Safe CSV Export (`CsvExportButton`)**:
   - Download reports as CSV with automatic sanitization against CSV formula injection (`=`, `+`, `-`, `@`).
8. **Align UI Design System**:
   - Built with compound Align UI primitives (`Button`, `FancyButton`, `CompactButton`, `Badge`, `StatusBadge`, `Input`, `Select`, `Table`, `Drawer`, `Modal`, `Dropdown`, `WidgetBox`, `SegmentedControl`).
   - Responsive layout with collapsible navigation (`⌘B` / `Ctrl+B` toggle).

---

## ⚡ Indexing & Scalability Strategy

To ensure sub-millisecond query performance at scale:

- **`categories`**: `{ userId: 1, nameCanonical: 1 }` (unique) & `{ userId: 1, archivedAt: 1, name: 1 }`.
- **`plans`**: `{ userId: 1, categoryId: 1, monthKey: 1 }` (unique compound) & `{ userId: 1, monthKey: 1 }`.
- **`actuals`**: `{ userId: 1, monthKey: 1, categoryId: 1, createdAt: -1, _id: -1 }` (compound index for fast range filtering, aggregation, and cursor pagination).
- **`financialPeriods`**: `{ userId: 1, monthKey: 1 }` (unique).
- **`sessions`**: `{ tokenHash: 1 }` (unique) & TTL index on `expiresAt`.

---

## 🛡️ Production & Security Considerations

- **No Credential/Stack Leakage**: Centralized error middleware sanitizes all internal Mongoose and system errors.
- **Session Tokens**: 7-day TTL with server-side revocation on logout.
- **CSRF & Origin Guard**: Validates request origin against allowed web origins on all state-modifying endpoints.
- **Rate Limiting**: In-memory rate limiting on authentication routes to mitigate brute-force attempts.

---

## 📄 License

MIT © Aryan Dahiya
