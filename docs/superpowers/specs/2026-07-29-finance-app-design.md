# Self-Managing Finance App — Design Spec

**Date:** 2026-07-29
**Status:** Approved (design phase)
**Owner:** Ofir

## Overview

A mobile-first web app for organizing personal spending. In the POC phase,
expenses are entered manually, categorized (with AI assistance), and analyzed
through weekly/monthly views and KPIs. Google Gemini assists with
auto-categorization and on-demand insights/suggestions.

Single user, single currency, analytics-only (no budget tracking) in the POC.

## Goals

- Fast, pleasant manual expense entry on a phone.
- Clean categorization, assisted by Gemini (suggest-on-entry, user confirms).
- Weekly and monthly spending views.
- KPIs sliced by category, by shop, and by day of week.
- On-demand Gemini insights and suggestions.
- A calm, beautiful, fully themeable UI.

## Non-Goals (POC)

- No multi-currency (single currency: ILS ₪, display only, no conversion).
- No budgets / budget-vs-actual tracking (Gemini may still *suggest* targets in advice).
- No authentication (single user, unlisted URL; simple password can be added later).
- No automatic bank/statement import (manual entry only).
- No multi-user / accounts.

## Users & Platform

- **Platform:** Mobile-first responsive web app (also usable on desktop).
- **Users:** Single user (the owner).

## Architecture

A single **Next.js (App Router, React)** application deployed on **Netlify**.

- **UI:** Mobile-first React pages (add expense, expense list, dashboard).
  Charts via **Recharts**.
- **Backend:** Next.js API routes, which run as **Netlify Functions**. All DB
  access and all Gemini calls happen here. The Gemini API key is server-side only.
- **Database:** **Netlify DB (serverless Postgres, powered by Neon)**, accessed
  via **Prisma** ORM.
- **AI:** Google **Gemini** API, called only from server routes.
- **Validation:** Shared **Zod** schemas for input validation.

```
[Mobile browser] → [Next.js UI] → [/api/* Netlify Functions] → [Prisma] → [Neon Postgres]
                                              └────────→ [Gemini API]
```

Host choice (Netlify) does not leak into application code; the app is a standard
Next.js app and remains portable.

## Data Model

### Expense
| Field         | Type      | Notes                                        |
|---------------|-----------|----------------------------------------------|
| id            | uuid/cuid | Primary key                                  |
| amount        | decimal   | Must be > 0. Currency implicitly ILS.        |
| date          | date      | Date the expense occurred. Defaults to today.|
| categoryId    | fk        | References Category                          |
| shop          | string    | Merchant / shop name                         |
| note          | string?   | Optional free-text description               |
| paymentMethod | enum      | Cash, Credit, Debit, Bank transfer, Other    |
| createdAt     | timestamp |                                              |
| updatedAt     | timestamp |                                              |

### Category
| Field     | Type    | Notes                                    |
|-----------|---------|------------------------------------------|
| id        | uuid    | Primary key                              |
| name      | string  | Unique (among non-archived)              |
| isDefault | boolean | True for seeded preset categories        |
| sortOrder | int     | Display ordering                         |
| archived  | boolean | Hidden from pickers, preserved for history |

- **Seeded presets:** Groceries, Dining, Transport, Utilities, Shopping, Health,
  Entertainment, Other. User can add, rename, and archive categories.
- **PaymentMethod** is a fixed enum stored on Expense (no separate table).
- **Insights are not persisted** — generated on demand and rendered transiently.

## Features & Flows

### Add Expense
- Form fields: amount, date (defaults today), shop, note, payment method, category.
- **AI suggest:** when shop/note are filled, an "AI suggest" action calls
  `/api/gemini/categorize` and proposes a category. User accepts or overrides
  before saving. Saving never depends on AI succeeding.

### Expense List
- Recent expenses, most recent first.
- Filter (by category/date range), edit, and delete.

### Dashboard
- **Time range toggle:** "This week" / "This month", with prev/next navigation to
  move across periods.
- **Summary:** total spend and expense count for the selected period.
- **KPIs:**
  - Spend **by category**.
  - Spend **by shop** (top shops).
  - Spend **by day of week** (aggregated across the period, e.g. "most on Fridays").
- **Charts** (Recharts, themed): category breakdown (bar or donut), day-of-week
  bar, top-shops bar.

### AI Insights
- **"Analyze my spending"** button → `/api/gemini/insights` sends an aggregated
  summary of the current period → returns 3–5 insights + suggestions, rendered as
  cards. Not persisted.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/expenses` | GET, POST | List / create expenses |
| `/api/expenses/[id]` | PATCH, DELETE | Update / delete an expense |
| `/api/categories` | GET, POST | List / create categories |
| `/api/categories/[id]` | PATCH | Rename / archive a category |
| `/api/kpis?range=week\|month&anchor=<date>` | GET | Server-side aggregation: totals by category, shop, day-of-week |
| `/api/gemini/categorize` | POST | `{shop, note, amount, categories[]}` → `{suggestedCategory, confidence}` |
| `/api/gemini/insights` | POST | `{periodSummary}` → `{insights[], suggestions[]}` |

## Visual Design & Aesthetics

- **Mood:** soft, calm, uncluttered — spa-like, not spreadsheet-like. Generous
  white space, rounded corners, gentle shadows, smooth micro-transitions.
- **Typography:** clean friendly sans (Inter), comfortable sizes for phone reading.

### Themeable by design (key requirement)
- **All colors come from semantic design tokens** (CSS custom properties):
  `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`,
  `--color-accent`, `--color-border`, `--color-chart-1 … --color-chart-n`, etc.
- **Components never hardcode colors** — they reference tokens only. Swapping a
  palette is a **one-file change** with no component edits.
- **Multiple relaxing palettes shipped** as token sets:
  - Sage green + warm sand **(default)**
  - Soft blue + misty gray
  - Warm earthy neutrals
  - Lavender + soft gray
- **Light + dark** are handled through the same token system; each palette defines
  both. Dark theme stays soft (deep desaturated tones, never harsh black/white).
- **Charts read from the chart-color tokens**, so re-theming updates charts too.
- Palette can be switched centrally now, and optionally exposed as a settings
  toggle later.

Execution during build will use the **frontend-design** and **dataviz** skills for polish.

## Error Handling

- **Gemini degrades gracefully:** if categorize fails, user picks manually; if
  insights fail, show a retry message. The app never blocks on AI.
- **Input validation** (Zod): amount > 0, valid date, category exists,
  valid payment method.
- API routes return clear error responses; UI surfaces friendly messages.

## Testing

Keep it **very minimal** for the POC — no comprehensive coverage.

- A **couple of unit tests** for the KPI aggregation math (by category / shop /
  day-of-week) only, since that's the one place a bug would silently produce
  wrong numbers.
- That's it — no route/integration tests, no UI tests, no Gemini tests in the POC.
- Manual testing covers the rest.

## Open Questions / Future (post-POC)

- Optional simple auth (password) before any public exposure.
- Budgets and budget-vs-actual tracking.
- Bank/statement import.
- Persisted insight history / weekly digest.
- User-facing palette switcher in settings.
