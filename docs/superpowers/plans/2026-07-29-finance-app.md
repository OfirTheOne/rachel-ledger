# Self-Managing Finance App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app for manual expense tracking with editable categories, week/month KPI dashboards (by category, shop, day-of-week), Gemini-assisted categorization and on-demand insights, and a fully themeable calm UI.

**Architecture:** A single Next.js (App Router, TypeScript) app deployed on Netlify. React UI (mobile-first) calls Next.js API routes (Netlify Functions) that own all DB access (Prisma → Neon Postgres) and all Gemini calls (key server-side only). Colors come exclusively from CSS custom-property design tokens so the whole palette swaps in one file.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 (token-driven) · Prisma ORM · Neon/Netlify DB (Postgres) · Recharts · Zod · `@google/generative-ai` (Gemini) · Vitest (KPI math only).

## Global Constraints

- Single currency: **ILS ₪**, display only, no conversion. No currency field on input.
- **No authentication** in the POC.
- **No budgets**, no multi-currency, no bank import, no persisted insights.
- **Testing is very minimal:** only the KPI aggregation math is unit-tested. No route/UI/Gemini tests.
- Gemini API key is **server-side only** — never imported into a client component or exposed via `NEXT_PUBLIC_`.
- **Components never hardcode colors.** All colors reference CSS custom-property tokens (`--color-*`). A palette swap must be a one-file change.
- Default palette: **Sage green + warm sand.**
- Payment methods (fixed enum): `Cash`, `Credit`, `Debit`, `BankTransfer`, `Other`.
- Preset categories (seeded): Groceries, Dining, Transport, Utilities, Shopping, Health, Entertainment, Other.
- Amount must be `> 0`. Money is stored as an integer number of **agorot** (1 ₪ = 100 agorot) to avoid float rounding; UI displays ₪ with 2 decimals.

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `netlify.toml`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `vitest.config.ts`, `lib/format.ts`
- Create: `postcss.config.mjs`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `lib/format.ts`: `formatMoney(agorot: number): string` (e.g. `12345` → `"₪123.45"`), `agorotFromInput(input: string): number` (e.g. `"123.45"` → `12345`).

- [ ] **Step 1: Scaffold the Next.js app**

Run in the project root (directory already contains `docs/`, so scaffold in place):
```bash
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir=false --import-alias "@/*" --no-turbopack --yes
```
Expected: creates `app/`, `package.json`, `tsconfig.json`, Tailwind config, `app/globals.css`.

- [ ] **Step 2: Add project dependencies**

```bash
npm install prisma @prisma/client zod recharts @google/generative-ai date-fns
npm install -D vitest @vitejs/plugin-react jsdom
```
Expected: dependencies added to `package.json`.

- [ ] **Step 3: Add Netlify config**

Create `netlify.toml`:
```toml
[build]
  command = "prisma generate && next build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 4: Add env template**

Create `.env.example`:
```bash
# Neon / Netlify DB connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
# Google Gemini API key (server-side only)
GEMINI_API_KEY="your-key-here"
```
Append `.env` to `.gitignore` (verify it is ignored).

- [ ] **Step 5: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
```
Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 6: Create money formatting helpers**

Create `lib/format.ts`:
```ts
export function formatMoney(agorot: number): string {
  return `₪${(agorot / 100).toFixed(2)}`;
}

export function agorotFromInput(input: string): number {
  const value = Number.parseFloat(input);
  if (Number.isNaN(value)) return NaN;
  return Math.round(value * 100);
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: build succeeds with the default scaffold page.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with tooling and money helpers"
```

---

### Task 2: Theme token system

**Files:**
- Create: `app/theme.css`
- Modify: `app/globals.css`
- Create: `app/layout.tsx` (modify the scaffolded one)

**Interfaces:**
- Consumes: nothing app-specific.
- Produces: CSS custom properties available globally: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-accent-contrast`, `--color-chart-1` … `--color-chart-6`. Selecting a palette = setting `data-palette` on `<html>`; default (no attribute) is Sage/Sand.

- [ ] **Step 1: Create the token stylesheet**

Create `app/theme.css` (each palette defines light + dark; default = Sage/Sand):
```css
/* Default palette: Sage green + warm sand (light) */
:root {
  --color-bg: #f4f1ea;
  --color-surface: #fbf9f4;
  --color-text: #3a3f36;
  --color-text-muted: #7c8073;
  --color-border: #e3ddd0;
  --color-accent: #7a9471;
  --color-accent-contrast: #ffffff;
  --color-chart-1: #7a9471;
  --color-chart-2: #a7b8a0;
  --color-chart-3: #c9a27a;
  --color-chart-4: #9a8fb0;
  --color-chart-5: #d0b25e;
  --color-chart-6: #6f9a9a;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #23271f;
    --color-surface: #2c3129;
    --color-text: #e7e6de;
    --color-text-muted: #a3a89a;
    --color-border: #3a4034;
    --color-accent: #8fae85;
    --color-accent-contrast: #1c2018;
  }
}
/* Alternative palettes (swap by setting <html data-palette="..."> ) */
:root[data-palette="blue"] {
  --color-bg: #eef1f4; --color-surface: #f8fafb; --color-text: #333a40;
  --color-text-muted: #79838c; --color-border: #dce1e6; --color-accent: #7593ab;
  --color-accent-contrast: #ffffff; --color-chart-1: #7593ab; --color-chart-2: #a8bccb;
  --color-chart-3: #c9a27a; --color-chart-4: #9a8fb0; --color-chart-5: #6f9a9a; --color-chart-6: #d0b25e;
}
:root[data-palette="earth"] {
  --color-bg: #f2ece4; --color-surface: #faf6f0; --color-text: #40382f;
  --color-text-muted: #8a8072; --color-border: #e4dacc; --color-accent: #b17c5e;
  --color-accent-contrast: #ffffff; --color-chart-1: #b17c5e; --color-chart-2: #c9a27a;
  --color-chart-3: #8a9a6f; --color-chart-4: #9a8fb0; --color-chart-5: #d0b25e; --color-chart-6: #6f9a9a;
}
:root[data-palette="lavender"] {
  --color-bg: #f1eef4; --color-surface: #faf8fb; --color-text: #3c3742;
  --color-text-muted: #857f8c; --color-border: #e2dce6; --color-accent: #9a8fb0;
  --color-accent-contrast: #ffffff; --color-chart-1: #9a8fb0; --color-chart-2: #bcb2cb;
  --color-chart-3: #c9a27a; --color-chart-4: #7a9471; --color-chart-5: #6f9a9a; --color-chart-6: #d0b25e;
}
```

- [ ] **Step 2: Wire tokens into globals and base styles**

Replace `app/globals.css` body with token-based base styles (keep the Tailwind import line at the top):
```css
@import "tailwindcss";
@import "./theme.css";

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Set mobile-first viewport and metadata in layout**

Replace `app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spending",
  description: "Calm personal expense tracking",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify tokens render**

Replace `app/page.tsx` with a temporary swatch check:
```tsx
export default function Home() {
  return (
    <div style={{ background: "var(--color-surface)", padding: 24, borderRadius: 16, border: "1px solid var(--color-border)" }}>
      <h1 style={{ color: "var(--color-text)" }}>Theme OK</h1>
      <p style={{ color: "var(--color-text-muted)" }}>Muted text</p>
      <button style={{ background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, padding: "8px 16px", borderRadius: 12 }}>Accent</button>
    </div>
  );
}
```
Run: `npm run dev` and open the page on a narrow viewport.
Expected: sage/sand calm surface, muted text, sage accent button. Change `<html lang="en">` to `<html lang="en" data-palette="blue">` temporarily and confirm the whole page re-themes, then revert.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add token-driven themeable palette system"
```

---

### Task 3: Prisma schema, migration & seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Modify: `package.json` (prisma seed config + scripts)
- Create: `lib/db.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` from env.
- Produces:
  - `lib/db.ts` default export `prisma` (`PrismaClient` singleton).
  - Models: `Category { id, name, isDefault, sortOrder, archived }`, `Expense { id, amountAgorot, date, categoryId, category, shop, note, paymentMethod, createdAt, updatedAt }`, enum `PaymentMethod { Cash, Credit, Debit, BankTransfer, Other }`.

- [ ] **Step 1: Write the schema**

Create `prisma/schema.prisma`:
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum PaymentMethod { Cash Credit Debit BankTransfer Other }

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  isDefault Boolean   @default(false)
  sortOrder Int       @default(0)
  archived  Boolean   @default(false)
  expenses  Expense[]
}

model Expense {
  id            String        @id @default(cuid())
  amountAgorot  Int
  date          DateTime      @db.Date
  categoryId    String
  category      Category      @relation(fields: [categoryId], references: [id])
  shop          String
  note          String?
  paymentMethod PaymentMethod @default(Other)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([date])
  @@index([categoryId])
}
```

- [ ] **Step 2: Create the Prisma client singleton**

Create `lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
```

- [ ] **Step 3: Write the seed script**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const PRESETS = ["Groceries","Dining","Transport","Utilities","Shopping","Health","Entertainment","Other"];

async function main() {
  for (let i = 0; i < PRESETS.length; i++) {
    await prisma.category.upsert({
      where: { name: PRESETS[i] },
      update: {},
      create: { name: PRESETS[i], isDefault: true, sortOrder: i },
    });
  }
}
main().finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Configure seed + scripts in package.json**

Add to `package.json`:
```json
"prisma": { "seed": "npx tsx prisma/seed.ts" },
"scripts": {
  "db:push": "prisma db push",
  "db:seed": "prisma db seed"
}
```
Run: `npm install -D tsx`

- [ ] **Step 5: Push schema and seed**

Ensure `.env` has a valid `DATABASE_URL` (Neon/Netlify DB), then:
```bash
npx prisma generate
npm run db:push
npm run db:seed
```
Expected: tables created; 8 categories inserted.

- [ ] **Step 6: Verify data**

Run: `npx prisma studio` (or a quick query) and confirm 8 default categories exist with `sortOrder` 0–7.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema, seed, and db client"
```

---

### Task 4: Validation schemas

**Files:**
- Create: `lib/schemas.ts`

**Interfaces:**
- Consumes: `PaymentMethod` enum from `@prisma/client`.
- Produces:
  - `expenseCreateSchema` / `expenseUpdateSchema` (Zod). Parsed shape: `{ amountAgorot: number(int,>0), date: string (YYYY-MM-DD), categoryId: string, shop: string(1..120), note?: string, paymentMethod: PaymentMethod }`.
  - `categoryCreateSchema` `{ name: string(1..40) }`, `categoryUpdateSchema` `{ name?: string, archived?: boolean }`.
  - Types: `ExpenseCreateInput`, `ExpenseUpdateInput`, `CategoryCreateInput`, `CategoryUpdateInput`.

- [ ] **Step 1: Write the schemas**

Create `lib/schemas.ts`:
```ts
import { z } from "zod";

const paymentMethods = ["Cash","Credit","Debit","BankTransfer","Other"] as const;

export const expenseCreateSchema = z.object({
  amountAgorot: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().min(1),
  shop: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(paymentMethods),
});
export const expenseUpdateSchema = expenseCreateSchema.partial();

export const categoryCreateSchema = z.object({ name: z.string().min(1).max(40) });
export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  archived: z.boolean().optional(),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Zod validation schemas"
```

---

### Task 5: KPI aggregation logic (the one tested unit)

**Files:**
- Create: `lib/kpis.ts`, `lib/kpis.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions on plain objects).
- Produces:
  - Type `ExpenseRow = { amountAgorot: number; date: string; categoryName: string; shop: string }`.
  - `aggregateKpis(rows: ExpenseRow[]): { total: number; count: number; byCategory: {name:string; total:number}[]; byShop: {shop:string; total:number}[]; byDayOfWeek: {day:number; total:number}[] }`.
    - `byCategory` and `byShop` sorted descending by `total`. `byDayOfWeek` has exactly 7 entries, `day` 0=Sunday..6=Saturday, ordered 0→6, zero-filled.
  - `periodRange(range: "week"|"month", anchorISO: string): { start: string; end: string }` — inclusive `start`, exclusive `end`, both `YYYY-MM-DD`. Week starts Sunday.

- [ ] **Step 1: Write the failing tests**

Create `lib/kpis.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { aggregateKpis, periodRange } from "./kpis";

const rows = [
  { amountAgorot: 1000, date: "2026-07-27", categoryName: "Groceries", shop: "Shufersal" }, // Monday
  { amountAgorot: 500,  date: "2026-07-27", categoryName: "Dining",    shop: "Cafe" },      // Monday
  { amountAgorot: 2000, date: "2026-07-31", categoryName: "Groceries", shop: "Rami Levy" }, // Friday
];

describe("aggregateKpis", () => {
  it("totals amount and count", () => {
    const k = aggregateKpis(rows);
    expect(k.total).toBe(3500);
    expect(k.count).toBe(3);
  });
  it("groups by category sorted desc", () => {
    const k = aggregateKpis(rows);
    expect(k.byCategory[0]).toEqual({ name: "Groceries", total: 3000 });
    expect(k.byCategory[1]).toEqual({ name: "Dining", total: 500 });
  });
  it("groups by shop sorted desc", () => {
    const k = aggregateKpis(rows);
    expect(k.byShop[0].total).toBe(2000);
  });
  it("returns 7 day-of-week buckets, zero-filled, Sunday-first", () => {
    const k = aggregateKpis(rows);
    expect(k.byDayOfWeek).toHaveLength(7);
    expect(k.byDayOfWeek[0]).toEqual({ day: 0, total: 0 }); // Sunday
    expect(k.byDayOfWeek[1].total).toBe(1500); // Monday
    expect(k.byDayOfWeek[5].total).toBe(2000); // Friday
  });
  it("handles empty input", () => {
    const k = aggregateKpis([]);
    expect(k.total).toBe(0);
    expect(k.byDayOfWeek).toHaveLength(7);
  });
});

describe("periodRange", () => {
  it("computes a Sunday-start week", () => {
    const r = periodRange("week", "2026-07-29"); // Wednesday
    expect(r.start).toBe("2026-07-26"); // Sunday
    expect(r.end).toBe("2026-08-02");   // next Sunday (exclusive)
  });
  it("computes a calendar month", () => {
    const r = periodRange("month", "2026-07-15");
    expect(r.start).toBe("2026-07-01");
    expect(r.end).toBe("2026-08-01");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `aggregateKpis`/`periodRange` not defined.

- [ ] **Step 3: Implement the aggregation logic**

Create `lib/kpis.ts`:
```ts
export type ExpenseRow = { amountAgorot: number; date: string; categoryName: string; shop: string };

export function aggregateKpis(rows: ExpenseRow[]) {
  let total = 0;
  const cat = new Map<string, number>();
  const shop = new Map<string, number>();
  const dow = Array.from({ length: 7 }, (_, day) => ({ day, total: 0 }));

  for (const r of rows) {
    total += r.amountAgorot;
    cat.set(r.categoryName, (cat.get(r.categoryName) ?? 0) + r.amountAgorot);
    shop.set(r.shop, (shop.get(r.shop) ?? 0) + r.amountAgorot);
    const d = new Date(`${r.date}T00:00:00`).getDay(); // 0=Sun..6=Sat
    dow[d].total += r.amountAgorot;
  }
  const byCategory = [...cat].map(([name, t]) => ({ name, total: t })).sort((a, b) => b.total - a.total);
  const byShop = [...shop].map(([s, t]) => ({ shop: s, total: t })).sort((a, b) => b.total - a.total);
  return { total, count: rows.length, byCategory, byShop, byDayOfWeek: dow };
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function periodRange(range: "week" | "month", anchorISO: string) {
  const anchor = new Date(`${anchorISO}T00:00:00Z`);
  if (range === "week") {
    const start = new Date(anchor);
    start.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay()); // back to Sunday
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    return { start: iso(start), end: iso(end) };
  }
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1));
  return { start: iso(start), end: iso(end) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tested KPI aggregation and period-range logic"
```

---

### Task 6: Expenses API routes

**Files:**
- Create: `app/api/expenses/route.ts`, `app/api/expenses/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` (`lib/db.ts`), `expenseCreateSchema`/`expenseUpdateSchema` (`lib/schemas.ts`).
- Produces:
  - `GET /api/expenses` → `Expense[]` (with `category { name }`, ordered by `date` desc). Optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` filter (inclusive `from`, exclusive `to`).
  - `POST /api/expenses` → created `Expense` (201) or `{ error }` (400).
  - `PATCH /api/expenses/[id]` → updated `Expense`. `DELETE /api/expenses/[id]` → `{ ok: true }`.

- [ ] **Step 1: Implement the collection route**

Create `app/api/expenses/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { expenseCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where = from && to ? { date: { gte: new Date(from), lt: new Date(to) } } : {};
  const expenses = await prisma.expense.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { date, ...rest } = parsed.data;
  const created = await prisma.expense.create({ data: { ...rest, date: new Date(date) } });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Implement the item route**

Create `app/api/expenses/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { expenseUpdateSchema } from "@/lib/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = expenseUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { date, ...rest } = parsed.data;
  const data = date ? { ...rest, date: new Date(date) } : rest;
  const updated = await prisma.expense.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Manually verify the routes**

Run `npm run dev`, then:
```bash
curl -s localhost:3000/api/expenses | head
# create (replace CATEGORY_ID with a real seeded category id from prisma studio)
curl -s -X POST localhost:3000/api/expenses -H 'content-type: application/json' \
  -d '{"amountAgorot":1500,"date":"2026-07-27","categoryId":"CATEGORY_ID","shop":"Shufersal","paymentMethod":"Credit"}'
```
Expected: GET returns `[]` then the created row; POST returns 201 with the object. Invalid POST (missing shop) returns 400.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add expenses CRUD API routes"
```

---

### Task 7: Categories API routes

**Files:**
- Create: `app/api/categories/route.ts`, `app/api/categories/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma`, `categoryCreateSchema`/`categoryUpdateSchema`.
- Produces:
  - `GET /api/categories` → non-archived `Category[]` ordered by `sortOrder` then `name`.
  - `POST /api/categories` → created category (201).
  - `PATCH /api/categories/[id]` → updated category (rename or `archived`).

- [ ] **Step 1: Implement the collection route**

Create `app/api/categories/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { categoryCreateSchema } from "@/lib/schemas";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { archived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const parsed = categoryCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await prisma.category.create({ data: { name: parsed.data.name, sortOrder: 999 } });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Implement the item route**

Create `app/api/categories/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { categoryUpdateSchema } from "@/lib/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = categoryUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
```

- [ ] **Step 3: Manually verify**

```bash
curl -s localhost:3000/api/categories | head
curl -s -X POST localhost:3000/api/categories -H 'content-type: application/json' -d '{"name":"Travel"}'
```
Expected: 8 seeded categories, then "Travel" created (201).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add categories API routes"
```

---

### Task 8: KPIs API route

**Files:**
- Create: `app/api/kpis/route.ts`

**Interfaces:**
- Consumes: `prisma`, `aggregateKpis`, `periodRange` (`lib/kpis.ts`).
- Produces:
  - `GET /api/kpis?range=week|month&anchor=YYYY-MM-DD` → `{ range, start, end, ...aggregateKpis(...) }`. `anchor` defaults to today.

- [ ] **Step 1: Implement the route**

Create `app/api/kpis/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { aggregateKpis, periodRange, type ExpenseRow } from "@/lib/kpis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") === "month" ? "month" : "week";
  const anchor = searchParams.get("anchor") ?? new Date().toISOString().slice(0, 10);
  const { start, end } = periodRange(range, anchor);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: new Date(start), lt: new Date(end) } },
    include: { category: { select: { name: true } } },
  });
  const rows: ExpenseRow[] = expenses.map((e) => ({
    amountAgorot: e.amountAgorot,
    date: e.date.toISOString().slice(0, 10),
    categoryName: e.category.name,
    shop: e.shop,
  }));
  return NextResponse.json({ range, start, end, ...aggregateKpis(rows) });
}
```

- [ ] **Step 2: Manually verify**

```bash
curl -s "localhost:3000/api/kpis?range=month&anchor=2026-07-15"
```
Expected: JSON with `total`, `count`, `byCategory`, `byShop`, `byDayOfWeek` (7 buckets), reflecting seeded/created expenses in July 2026.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add KPIs aggregation API route"
```

---

### Task 9: Gemini categorize route

**Files:**
- Create: `lib/gemini.ts`, `app/api/gemini/categorize/route.ts`

**Interfaces:**
- Consumes: `GEMINI_API_KEY` env, category list from request.
- Produces:
  - `lib/gemini.ts`: `getModel()` returning a configured Gemini model, throwing a clear error if `GEMINI_API_KEY` is missing.
  - `POST /api/gemini/categorize` `{ shop, note?, amount?, categories: string[] }` → `{ suggestedCategory: string, confidence: number }`. On any failure returns `{ error }` with status 502 (UI falls back to manual).

- [ ] **Step 1: Create the Gemini client helper**

Create `lib/gemini.ts`:
```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export function getModel(model = "gemini-1.5-flash") {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(key).getGenerativeModel({ model });
}
```

- [ ] **Step 2: Implement the categorize route**

Create `app/api/gemini/categorize/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { shop, note, amount, categories } = await req.json();
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: "categories required" }, { status: 400 });
    }
    const model = getModel();
    const prompt =
      `Pick the single best category for this expense from the list. ` +
      `Reply ONLY as JSON {"suggestedCategory": string, "confidence": number 0-1}.\n` +
      `Categories: ${categories.join(", ")}\n` +
      `Shop: ${shop ?? ""}\nNote: ${note ?? ""}\nAmount(ILS): ${amount ?? ""}`;
    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { suggestedCategory: string; confidence: number };
    if (!categories.includes(parsed.suggestedCategory)) {
      return NextResponse.json({ suggestedCategory: categories[categories.length - 1], confidence: 0 });
    }
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "categorize failed" }, { status: 502 });
  }
}
```

- [ ] **Step 3: Manually verify**

With a valid `GEMINI_API_KEY` in `.env`:
```bash
curl -s -X POST localhost:3000/api/gemini/categorize -H 'content-type: application/json' \
  -d '{"shop":"Rami Levy","note":"weekly food","categories":["Groceries","Dining","Transport"]}'
```
Expected: `{"suggestedCategory":"Groceries","confidence":...}`. Temporarily unset the key and confirm a 502 (graceful failure), then restore.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Gemini categorize route with graceful fallback"
```

---

### Task 10: Gemini insights route

**Files:**
- Create: `app/api/gemini/insights/route.ts`

**Interfaces:**
- Consumes: `getModel` (`lib/gemini.ts`).
- Produces:
  - `POST /api/gemini/insights` `{ periodSummary: object }` → `{ insights: string[], suggestions: string[] }`. On failure returns `{ error }` status 502.

- [ ] **Step 1: Implement the insights route**

Create `app/api/gemini/insights/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { periodSummary } = await req.json();
    const model = getModel();
    const prompt =
      `You are a calm, encouraging personal finance assistant. Currency is ILS (₪). ` +
      `Given this spending summary JSON, return ONLY JSON ` +
      `{"insights": string[] (3-5 short observations), "suggestions": string[] (2-4 gentle, actionable tips)}.\n` +
      `Summary: ${JSON.stringify(periodSummary)}`;
    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { insights: string[]; suggestions: string[] };
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "insights failed" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Manually verify**

```bash
curl -s -X POST localhost:3000/api/gemini/insights -H 'content-type: application/json' \
  -d '{"periodSummary":{"total":35000,"byCategory":[{"name":"Groceries","total":30000},{"name":"Dining","total":5000}]}}'
```
Expected: JSON with `insights[]` and `suggestions[]`. Confirm 502 on missing key.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Gemini insights route with graceful fallback"
```

---

### Task 11: Shared UI primitives & API client

**Files:**
- Create: `app/ui/Card.tsx`, `app/ui/Nav.tsx`, `lib/api.ts`
- Modify: `app/page.tsx` (make it the dashboard entry — replaced fully in Task 14; here just add nav)

**Interfaces:**
- Consumes: token CSS variables.
- Produces:
  - `Card` component (themed surface container).
  - `Nav` component (links: Add `/add`, Expenses `/expenses`, Dashboard `/`).
  - `lib/api.ts`: typed fetch helpers `getJSON<T>(url)`, `postJSON<T>(url, body)`, `patchJSON<T>(url, body)`, `del(url)`.

- [ ] **Step 1: Create the API client**

Create `lib/api.ts`:
```ts
export async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} failed`);
  return r.json();
}
export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${url} failed`);
  return r.json();
}
export async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${url} failed`);
  return r.json();
}
export async function del(url: string): Promise<void> {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw new Error(`DELETE ${url} failed`);
}
```

- [ ] **Step 2: Create the Card primitive**

Create `app/ui/Card.tsx`:
```tsx
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create the Nav**

Create `app/ui/Nav.tsx`:
```tsx
import Link from "next/link";

export function Nav() {
  const link = { color: "var(--color-text-muted)", textDecoration: "none", fontSize: 14 } as const;
  return (
    <nav style={{ display: "flex", gap: 16, justifyContent: "center", padding: "12px 0 20px" }}>
      <Link href="/" style={link}>Dashboard</Link>
      <Link href="/add" style={link}>Add</Link>
      <Link href="/expenses" style={link}>Expenses</Link>
    </nav>
  );
}
```

- [ ] **Step 4: Render Nav in layout**

In `app/layout.tsx`, import `Nav` and render `<Nav />` at the top of `<main>` above `{children}`.

- [ ] **Step 5: Verify**

Run `npm run dev`; confirm the nav bar shows three muted links and re-themes with `data-palette`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add UI primitives, nav, and typed API client"
```

---

### Task 12: Add-expense page with AI suggest

**Files:**
- Create: `app/add/page.tsx`

**Interfaces:**
- Consumes: `getJSON`, `postJSON` (`lib/api.ts`), `agorotFromInput` (`lib/format.ts`), categorize + categories + expenses routes.
- Produces: a client page at `/add`.

- [ ] **Step 1: Build the form (client component)**

Create `app/add/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import { agorotFromInput } from "@/lib/format";
import { Card } from "@/app/ui/Card";

type Category = { id: string; name: string };
const METHODS = ["Cash","Credit","Debit","BankTransfer","Other"];

export default function AddPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shop, setShop] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit");
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJSON<Category[]>("/api/categories").then((c) => { setCategories(c); if (c[0]) setCategoryId(c[0].id); });
  }, []);

  async function suggest() {
    if (!shop) return;
    setSuggesting(true);
    try {
      const r = await postJSON<{ suggestedCategory: string }>("/api/gemini/categorize", {
        shop, note, amount, categories: categories.map((c) => c.name),
      });
      const match = categories.find((c) => c.name === r.suggestedCategory);
      if (match) setCategoryId(match.id);
    } catch { /* graceful: keep manual choice */ }
    finally { setSuggesting(false); }
  }

  async function save() {
    const amountAgorot = agorotFromInput(amount);
    if (!Number.isInteger(amountAgorot) || amountAgorot <= 0 || !shop || !categoryId) return;
    setSaving(true);
    try {
      await postJSON("/api/expenses", { amountAgorot, date, categoryId, shop, note: note || undefined, paymentMethod });
      router.push("/expenses");
    } finally { setSaving(false); }
  }

  const field = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", marginTop: 6 } as const;
  const label = { fontSize: 13, color: "var(--color-text-muted)" } as const;

  return (
    <Card>
      <h1 style={{ marginBottom: 16, color: "var(--color-text)" }}>Add expense</h1>
      <label style={label}>Amount (₪)<input style={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <label style={label}>Date<input style={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label style={label}>Shop<input style={field} value={shop} onChange={(e) => setShop(e.target.value)} onBlur={suggest} /></label>
      <label style={label}>Note<input style={field} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <label style={label}>Category
        <select style={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <button onClick={suggest} disabled={suggesting || !shop} style={{ marginTop: 8, fontSize: 13, background: "transparent", color: "var(--color-accent)", border: "1px solid var(--color-accent)", borderRadius: 10, padding: "6px 10px" }}>
        {suggesting ? "Thinking…" : "✨ AI suggest category"}
      </button>
      <label style={label}>Payment
        <select style={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <button onClick={save} disabled={saving} style={{ marginTop: 20, width: "100%", background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, borderRadius: 12, padding: "12px" }}>
        {saving ? "Saving…" : "Save expense"}
      </button>
    </Card>
  );
}
```

- [ ] **Step 2: Manually verify**

Run `npm run dev`, open `/add` on a narrow viewport. Enter amount `123.45`, shop `Rami Levy`, blur the shop field → category auto-selects (if Gemini configured; otherwise unchanged, no error). Save → redirected to `/expenses`, row persisted.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add expense entry page with AI category suggest"
```

---

### Task 13: Expenses list page

**Files:**
- Create: `app/expenses/page.tsx`

**Interfaces:**
- Consumes: `getJSON`, `del` (`lib/api.ts`), `formatMoney` (`lib/format.ts`), `/api/expenses`.
- Produces: a client page at `/expenses`.

- [ ] **Step 1: Build the list**

Create `app/expenses/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { getJSON, del } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";

type Expense = { id: string; amountAgorot: number; date: string; shop: string; note: string | null; category: { name: string } };

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setItems(await getJSON<Expense[]>("/api/expenses"));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    await del(`/api/expenses/${id}`);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  if (loading) return <Card>Loading…</Card>;
  if (items.length === 0) return <Card>No expenses yet. Add your first one.</Card>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((e) => (
        <Card key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--color-text)", fontWeight: 600 }}>{e.shop}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              {e.category.name} · {e.date.slice(0, 10)}{e.note ? ` · ${e.note}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{formatMoney(e.amountAgorot)}</span>
            <button onClick={() => remove(e.id)} style={{ background: "transparent", border: 0, color: "var(--color-text-muted)", cursor: "pointer" }}>✕</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

Open `/expenses`: created expenses show shop, category, date, formatted ₪ amount. Delete (✕) removes the row and it stays gone after refresh.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add expenses list page with delete"
```

---

### Task 14: Dashboard with KPIs, charts & AI insights

**Files:**
- Create: `app/ui/Charts.tsx`
- Replace: `app/page.tsx`

**Interfaces:**
- Consumes: `getJSON`, `postJSON`, `formatMoney`, `/api/kpis`, `/api/gemini/insights`, Recharts.
- Produces: the dashboard at `/`.

- [ ] **Step 1: Build themed chart components**

Create `app/ui/Charts.tsx`:
```tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CHART_COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)","var(--color-chart-6)"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function CategoryChart({ data }: { data: { name: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number) => `₪${(v / 100).toFixed(2)}`} />
        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DayOfWeekChart({ data }: { data: { day: number; total: number }[] }) {
  const shaped = data.map((d) => ({ label: DOW[d.day], total: d.total }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={shaped}>
        <XAxis dataKey="label" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(v: number) => `₪${(v / 100).toFixed(2)}`} />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="var(--color-chart-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Build the dashboard page**

Replace `app/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { getJSON, postJSON } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";
import { CategoryChart, DayOfWeekChart } from "@/app/ui/Charts";

type Kpis = {
  range: string; start: string; end: string; total: number; count: number;
  byCategory: { name: string; total: number }[];
  byShop: { shop: string; total: number }[];
  byDayOfWeek: { day: number; total: number }[];
};

export default function Dashboard() {
  const [range, setRange] = useState<"week" | "month">("month");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [insights, setInsights] = useState<{ insights: string[]; suggestions: string[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    getJSON<Kpis>(`/api/kpis?range=${range}`).then(setKpis);
  }, [range]);

  async function analyze() {
    if (!kpis) return;
    setAnalyzing(true); setAiError(false);
    try {
      const r = await postJSON<{ insights: string[]; suggestions: string[] }>("/api/gemini/insights", {
        periodSummary: { total: kpis.total, byCategory: kpis.byCategory, byShop: kpis.byShop, byDayOfWeek: kpis.byDayOfWeek },
      });
      setInsights(r);
    } catch { setAiError(true); }
    finally { setAnalyzing(false); }
  }

  const tabBtn = (active: boolean) => ({
    flex: 1, padding: "8px", borderRadius: 10, border: "1px solid var(--color-border)",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "var(--color-accent-contrast)" : "var(--color-text-muted)",
  }) as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={tabBtn(range === "week")} onClick={() => setRange("week")}>This week</button>
        <button style={tabBtn(range === "month")} onClick={() => setRange("month")}>This month</button>
      </div>

      {!kpis ? <Card>Loading…</Card> : (
        <>
          <Card>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Total spend</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>{formatMoney(kpis.total)}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{kpis.count} expenses</div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 15, color: "var(--color-text)", marginBottom: 8 }}>By category</h2>
            {kpis.byCategory.length ? <CategoryChart data={kpis.byCategory} /> : <p style={{ color: "var(--color-text-muted)" }}>No data</p>}
          </Card>

          <Card>
            <h2 style={{ fontSize: 15, color: "var(--color-text)", marginBottom: 8 }}>By day of week</h2>
            <DayOfWeekChart data={kpis.byDayOfWeek} />
          </Card>

          <Card>
            <h2 style={{ fontSize: 15, color: "var(--color-text)", marginBottom: 8 }}>Top shops</h2>
            {kpis.byShop.slice(0, 5).map((s) => (
              <div key={s.shop} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "var(--color-text)" }}>
                <span>{s.shop}</span><span>{formatMoney(s.total)}</span>
              </div>
            ))}
            {!kpis.byShop.length && <p style={{ color: "var(--color-text-muted)" }}>No data</p>}
          </Card>

          <Card>
            <button onClick={analyze} disabled={analyzing} style={{ width: "100%", background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, borderRadius: 12, padding: "12px" }}>
              {analyzing ? "Analyzing…" : "✨ Analyze my spending"}
            </button>
            {aiError && <p style={{ color: "var(--color-text-muted)", marginTop: 10 }}>Couldn't analyze right now — try again.</p>}
            {insights && (
              <div style={{ marginTop: 14 }}>
                <h3 style={{ fontSize: 14, color: "var(--color-text)" }}>Insights</h3>
                <ul style={{ color: "var(--color-text-muted)", fontSize: 14, paddingLeft: 18 }}>
                  {insights.insights.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
                <h3 style={{ fontSize: 14, color: "var(--color-text)", marginTop: 10 }}>Suggestions</h3>
                <ul style={{ color: "var(--color-text-muted)", fontSize: 14, paddingLeft: 18 }}>
                  {insights.suggestions.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Manually verify the full flow**

Run `npm run dev`. On `/`: toggle week/month (KPIs refetch), total + count correct, category and day-of-week charts render in theme colors, top shops list shows amounts. Click "Analyze my spending" → insights + suggestions render (or a friendly retry message if Gemini is off). Switch `<html data-palette="blue">` and confirm charts + UI re-theme together.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with KPIs, themed charts, and AI insights"
```

---

### Task 15: Production build & deploy readiness

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a documented, build-verified app ready to deploy to Netlify.

- [ ] **Step 1: Write the README**

Create `README.md` with: project summary, required env vars (`DATABASE_URL`, `GEMINI_API_KEY`), local setup (`npm install`, `npm run db:push`, `npm run db:seed`, `npm run dev`), test command (`npm test`), and Netlify deploy notes (set env vars in Netlify UI; `@netlify/plugin-nextjs` handles the build; provision Netlify DB / Neon and copy its connection string into `DATABASE_URL`).

- [ ] **Step 2: Run the full verification**

```bash
npm test && npx tsc --noEmit && npm run build
```
Expected: tests pass, no type errors, production build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README and finalize build readiness"
```

---

## Self-Review

**Spec coverage:**
- Mobile-first web, single user → Task 2 (viewport, 520px main), all pages. ✓
- Hosted Postgres (Netlify DB/Neon) → Tasks 1, 3, 15. ✓
- Manual entry with fields (amount, date, category, shop, note, payment method) → Task 12, schema Task 3. ✓
- Single currency ILS, integer agorot → Global Constraints, Tasks 1, 3. ✓
- Editable preset categories → Task 3 seed, Task 7 routes (create/rename/archive). ✓
- Gemini suggest-on-entry, user confirms → Task 9 + Task 12 (suggest updates a still-editable select). ✓
- Weekly/monthly views → Task 8 `periodRange`, Task 14 toggle. ✓
- KPIs by category / shop / day-of-week → Task 5 (tested), Tasks 8, 14. ✓
- On-demand insights button → Task 10 + Task 14. ✓
- Graceful AI degradation → Tasks 9, 10 (502), Task 12 (catch → keep manual), Task 14 (retry message). ✓
- Themeable, token-only colors, one-file swap, default Sage/Sand, light+dark → Task 2; charts use tokens Task 14. ✓
- Very minimal testing (KPI math only) → Task 5 only. ✓
- Calm/rounded/spacious UI, Inter → Tasks 2, 11, and every page. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code; manual-verification steps give exact commands and expected results.

**Type consistency:** `ExpenseRow`, `aggregateKpis`, `periodRange` signatures match between Tasks 5, 8. `Category`/`Expense` shapes consistent between routes and pages. `amountAgorot` used consistently everywhere. Payment method enum values identical across schema, constants, and UI.

*Note on testing:* This plan deliberately applies full TDD only to Task 5 (KPI math) per the explicit "very minimal testing" requirement; all other tasks use build/typecheck + concrete manual verification instead of automated tests.
