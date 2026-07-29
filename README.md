# Richel Finance App

A mobile-first personal finance app built with Next.js, Prisma, and Google Gemini AI. Track expenses in Israeli Shekels (₪) with AI-powered category suggestions and analytics by category, shop, and day-of-week.

## Features

### Core Functionality
- **Expense Tracking**: Manually log expenses with amount, date, category, shop name, payment method, and optional notes
- **8 Preset Categories**: Groceries, Dining, Transport, Utilities, Shopping, Health, Entertainment, Other
- **Editable Categories**: Create, rename, and archive categories as needed
- **Single Currency**: All amounts tracked in Israeli Shekels (₪) as integer agorot (1 shekel = 100 agorot)
- **Multiple Payment Methods**: Cash, Credit, Debit, Bank Transfer, Other

### Analytics (Read-Only)
- **Weekly & Monthly Views**: Toggle between 7-day and 30-day time periods
- **Key Performance Indicators**:
  - Total spending
  - Average transaction
  - Spending by category (ranked)
  - Spending by shop (ranked)
  - Spending by day-of-week patterns
- **On-Demand Insights**: Generate AI-powered spending insights with a single button click

### AI Integration
- **Category Suggestions**: Google Gemini AI suggests expense categories as you type shop names
- **Smart Insights**: Analyze spending patterns and receive actionable insights
- **Graceful Degradation**: App remains fully functional if AI is unavailable or API fails

### Design
- **Mobile-First**: Optimized for 520px+ screens
- **Responsive Layout**: Works on tablets and desktops
- **Themeable UI**: Light and dark mode with brand-agnostic token-based colors
- **Calm & Spacious**: Rounded corners, generous spacing, Inter font for readability

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: PostgreSQL via Prisma 6.19.3 (Neon or Netlify DB)
- **Charts**: Recharts 3 for data visualization
- **Validation**: Zod 4 for runtime schema validation
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **Styling**: Tailwind CSS 4 with token-based colors
- **Testing**: Vitest with minimal coverage (KPI math unit tests only)

## Prerequisites

- Node.js 18+ and npm
- A Neon PostgreSQL database (or Netlify DB)
- A Google AI Studio API key for Gemini

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
```bash
cp .env.example .env
```

Edit `.env` with:
- **`DATABASE_URL`**: PostgreSQL connection string from Neon or Netlify DB
  - Example: `postgresql://user:password@host/database?sslmode=require`
- **`GEMINI_API_KEY`**: Google AI Studio API key
  - Get yours at [aistudio.google.com](https://aistudio.google.com)
  - **Note**: Confirm or update the default model in `lib/gemini.ts` to a current Gemini model when you add your key

### 3. Set Up Database
```bash
npm run db:push
```
This creates the database tables.

### 4. Seed Preset Categories
```bash
npm run db:seed
```
This creates the 8 default expense categories.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development

### Run Development Server
```bash
npm run dev
```
The app auto-reloads as you edit files.

### Run Tests
```bash
npm test
```
Runs the Vitest unit tests (KPI aggregation math only). The project uses minimal testing by design; functionality is verified through manual testing and type checking.

### Type Checking
```bash
npx tsc --noEmit
```
Verifies TypeScript types without emitting files.

### Build Production Bundle
```bash
npm run build
```
Creates an optimized production build at `.next/`.

### Run Production Build Locally
```bash
npm start
```

## Deployment

### Deploying to Netlify

1. **Create Netlify Site**: Push your repository to GitHub, GitLab, or Bitbucket, then link it to Netlify.

2. **Set Environment Variables**:
   - In Netlify UI, go to **Site Settings** → **Environment** → **Environment variables**
   - Add:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `GEMINI_API_KEY`: Your Google AI Studio API key

3. **Provision Database**:
   - **Option A** (Recommended): Use Netlify DB (powered by Neon)
     - In Netlify UI, go to **Integrations** → **Database** → **Create**
     - Copy the provided connection string to `DATABASE_URL`
   - **Option B**: Use existing Neon project
     - Get connection string from [neon.tech](https://neon.tech)
     - Paste into `DATABASE_URL`

4. **Build & Deploy**:
   - The `@netlify/plugin-nextjs` plugin in `netlify.toml` automatically handles the build
   - Build command runs: `prisma generate && next build`
   - Deployments happen automatically on every push to your main branch

5. **Seed Categories on First Deploy**:
   - After first deployment, run the seed script to populate the 8 default categories:
     ```bash
     curl https://your-site.netlify.app/api/seed
     ```
   - Or use Netlify CLI:
     ```bash
     netlify functions:invoke db:seed
     ```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string from Neon or Netlify DB |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key (server-side only) |

See `.env.example` for format examples.

## Project Structure

```
.
├── app/                        # Next.js App Router
│   ├── page.tsx               # Dashboard (weekly/monthly analytics)
│   ├── layout.tsx             # Root layout with theme provider
│   ├── api/
│   │   ├── expenses/          # Expense CRUD endpoints
│   │   ├── categories/        # Category management endpoints
│   │   └── insights/          # AI insights generation
│   └── entries/               # Expense entry form page
├── lib/
│   ├── gemini.ts              # Gemini AI configuration
│   ├── kpi.ts                 # KPI calculation logic (tested)
│   ├── prisma.ts              # Prisma client singleton
│   └── utils.ts               # Helper functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed 8 default categories
├── public/                    # Static assets
├── .env.example               # Environment variable template
├── netlify.toml               # Netlify deployment config
└── next.config.ts             # Next.js configuration
```

## Architecture

### Data Flow
1. **Entry**: User logs expense via form with AI category suggestions
2. **Storage**: Prisma saves to PostgreSQL
3. **Analytics**: KPI engine aggregates by category, shop, day-of-week
4. **Visualization**: Recharts renders interactive charts
5. **Insights**: On-demand Gemini AI analyzes patterns

### AI Integration
- **Category Suggestions**: Streamed to the form as user types
- **Insights**: Generated on-demand via button click
- **Fallback**: If Gemini is unavailable, app remains fully functional

## Constraints & Scope

- **Single User**: No authentication (POC)
- **Single Currency**: Israeli Shekels (₪) only
- **Analytics-Only**: Read-only insights, no budget planning
- **Minimal Testing**: Unit tests only for KPI math; other functionality validated through type checking and manual testing

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct and accessible
- Check that Neon/Netlify DB network is not blocking your IP
- Ensure `prisma db push` completes without errors

### Gemini API Issues
- Confirm `GEMINI_API_KEY` is valid and not expired
- Verify the model ID in `lib/gemini.ts` is available in your region
- Check Google AI Studio quota and rate limits

### Build Failures
- Run `npm install` to ensure dependencies are fresh
- Clear `.next` cache: `rm -rf .next`
- Verify TypeScript: `npx tsc --noEmit`

## License

MIT

---

Built with ❤️ for personal finance tracking.
