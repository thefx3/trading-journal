# Risknote — trading journal

A focused, visual trading journal built with Next.js 16, React 19, TypeScript, Tailwind CSS and Supabase.

## Prerequisites

- Node.js 20+
- A Supabase project
- Supabase CLI (recommended for local migrations)

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Fill `.env.local` with the Project URL and publishable key shown in **Supabase → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never expose the service-role key to the browser.

## Database and Storage

The migrations create profiles, instruments, trades and trade images, plus indexes, validation constraints, RLS policies, the private `trade-charts` bucket, and its Storage policies. The second migration introduces the isolated `live`, `study`, and `replay` journal modes. Existing records are preserved and classified as `live`.

With a linked Supabase CLI project:

```bash
supabase link --project-ref your-project-ref
supabase db push
supabase db seed
```

Alternatively, run `supabase/migrations/202608090001_initial_schema.sql` and then `supabase/seed.sql` in the Supabase SQL editor. Enable email/password authentication in **Authentication → Providers**. Email confirmation may be disabled for faster local testing.

Uploaded charts are private, limited to PNG/JPEG/WebP and 10 MB, and stored as `{user_id}/{trade_id}/{uuid}.{extension}`. Pages receive short-lived signed URLs.

## Commands

```bash
npm run dev       # local development
npm run lint      # ESLint
npm run typecheck # TypeScript without emitting
npm run build     # production build
```

## Architecture

- `src/app/(app)` — authenticated product routes
- `src/app/actions` — authorized mutations and reliable upload/delete orchestration
- `src/components` — reusable layout, calendar, trade and UI components
- `src/lib/supabase` — server/browser clients and queries
- `src/lib/trading` — session detection, metrics and domain configuration
- `src/lib/validation` — shared Zod schemas
- `supabase` — reproducible schema, RLS, Storage policies and seed

The `trade` is the central domain object. Visibility is present now for future sharing, but community features are intentionally not implemented.

Performance metrics are always computed separately: Live only includes `journal_mode = 'live'`, Replay only includes `journal_mode = 'replay'`, and Study exposes learning counts rather than win rate or realized R.
