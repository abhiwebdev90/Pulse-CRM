# PulseCRM (Next.js + Supabase)

A multi-tenant CRM demo: auth, workspaces with roles and invites, clients, drag-and-drop pipeline,
dashboard, activity timeline, Stripe test-mode billing, and a one-click demo login.

**Stack:** Next.js 16 (App Router, Server Actions, `proxy.ts`), Supabase (Postgres + RLS + Auth),
Tailwind 4, dnd-kit, Recharts, Stripe (test mode), zod.

## Setup

1. Create a free project at <https://supabase.com>.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → Providers → Email**, turn off "Confirm email" for the demo (so signup logs in immediately).
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and service-role key
   (Project Settings → API). Pick a `DEMO_PASSWORD`.
5. Install, seed and run:

```bash
npm install
npm run seed   # creates demo@pulsecrm.dev with 40 clients; re-run any time to reset
npm run dev
```

Open <http://localhost:3000> and click **Try the demo**.

Upgrading an existing database? Run the files in `supabase/migrations/` in order (001 card order, 002 profile email + accent colour).

## Stripe (optional)

Create a test-mode product with a recurring price, set `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`, then:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints STRIPE_WEBHOOK_SECRET
```

Pay with card `4242 4242 4242 4242`. The webhook flips the workspace to Pro (unlimited clients).

## How tenancy works

Every row carries a `workspace_id`. Row-level security policies (see `schema.sql`) restrict reads and
writes to workspace members, deletes to owners/admins, and a database trigger enforces the Free plan's
25-client limit, so the rules hold even if the UI is bypassed. The service-role key is only used server-side
(seed script, Stripe actions and webhook).

## Demo notes

The demo account is shared by everyone who clicks "Try the demo". Re-run `npm run seed` before a client call
to reset it.
