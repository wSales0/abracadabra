# Backend Integration Handoff

This document outlines the guidelines, architecture, database schemas, and checklist for the future backend integration of **Abracadabra** (using TypeScript, Supabase, and Vercel), while maintaining the current standalone frontend prototype.

---

> ### 📌 Current Decision
> **No Database Required for Now:** The project is running in standalone/prototype mode using the demo user (`teste123` / `123`) and client-side storage (`sessionStorage`/`localStorage`). No database connection is required at this stage to run, test, or demonstrate the application.

---

## 1. Current Frontend Context

The frontend is already built and working:

- **Demo Authentication:** Local login with `teste123` / `123` via `src/lib/demoAuth.ts`;
- **Official Google / Gmail OAuth Login:** Integrated via Google Identity Services (`src/lib/googleAuth.ts`) with automatic practice wallet creation;
- **Web3 Practice Wallet (Simulated / Devnet):** Automatic student practice wallet engine (`src/lib/practiceWallet.ts`) with starting 2.50 SOL balance, interactive Faucet (+1.0 SOL), transfer simulator with gas fee deduction and on-chain signature generation, transaction history, and Learn & Earn rewards (+0.05 SOL per quiz correct answer);
- **Post-login Dashboard:** Navigation across Market, Practice Wallet, Activities, and Profile tabs, with live balance badge in the header;
- **Editable Profile:** Name, bio, preferences, avatar updates, and detailed practice wallet card;
- **Crypto Market:** Live market data via public API (`src/lib/cryptoApi.ts`) with top gainers/losers/market cap radar and on-demand news headlines;
- **Activities & Gamification:** Procedural questions with shuffled options, levels, streak tracking, XP awards, and simulated SOL rewards (`src/lib/activityEngine.ts`);
- **Local Persistence:** Client-side state persisted in `sessionStorage` / `localStorage`.

---

## 2. Roadmap & Architecture for Future Supabase Integration

When transitioning to a real backend, follow these specifications:

### 2.1 Authentication (Supabase Auth)
- **Flows:** `signUp`, `signInWithPassword`, `signOut`, and password recovery.
- **Sessions:** Automatic JWT refresh and token persistence with `@supabase/supabase-js`.
- **Route Protection:** Protect `/app` routes based on active auth session.
- **Demo Mode:** Maintain demo access alongside real user accounts for quick testing.

### 2.2 Proposed Database Schema (PostgreSQL / Supabase)

#### `profiles` Table
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  focus text default 'Fundamentos de Web3',
  weekly_digest boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### `activity_progress` Table
```sql
create table public.activity_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer default 0 check (xp >= 0),
  level text default 'Iniciante',
  streak integer default 0 check (streak >= 0),
  completed_activities integer default 0 check (completed_activities >= 0),
  correct_answers integer default 0 check (correct_answers >= 0),
  answered_questions integer default 0 check (answered_questions >= 0),
  last_activity_at timestamptz,
  updated_at timestamptz default now()
);
```

#### `activity_attempts` Table
```sql
create table public.activity_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  difficulty text not null check (difficulty in ('iniciante', 'intermediario', 'avancado')),
  selected_answer integer not null,
  is_correct boolean not null,
  xp_awarded integer not null default 0,
  created_at timestamptz default now()
);
```

#### `question_catalog` Table (Optional if kept in code)
```sql
create table public.question_catalog (
  id text primary key,
  category text not null,
  difficulty text not null check (difficulty in ('iniciante', 'intermediario', 'avancado')),
  prompt text not null,
  options jsonb not null,
  answer_index integer not null,
  explanation text not null,
  xp_reward integer not null default 10,
  published boolean default true,
  version integer default 1,
  created_at timestamptz default now()
);
```

---

## 3. Security & Row Level Security (RLS)

- Enable RLS across all tables (`alter table ... enable row level security;`).
- Restrict read/write in `profiles` and `activity_progress` to the owner (`auth.uid() = id`).
- Only allow attempt insertion for authenticated user ID.
- **Server-Side XP Calculation:** Clients must never directly modify XP values. Answers and XP grants should be processed via protected Edge Functions or RPCs.
- **Web3 Safety:** Never collect or store seed phrases, private keys, or wallet secrets.

---

## 4. Endpoints & Server-Side Functions

### Profile
- `GET /profile` — Fetch authenticated user profile.
- `PATCH /profile` — Update display name, bio, and preferences.
- Avatar upload to Supabase Storage with size and MIME type validation.

### Activities
- `POST /activities/answer` — Validate submitted answer and award XP server-side.
- Prevent replay attacks / duplicate attempts.

### Market & News
- Move external API calls (`https://cryptocurrency.cv/`) to an Edge Function to enable rate limiting and server caching.

---

## 5. News Integration & Copyright Compliance

The public news API aggregates third-party content:
- Display only **title**, **publisher name**, **date**, and **original link**.
- Maintain visible attribution linking directly to the source.
- Do not store or reproduce full article bodies, summaries, or third-party images.
- Clearly state that market data does not constitute financial advice.

---

## 6. Wallet & Solana Integration — Future Phase

- Use `@solana/wallet-adapter-react`.
- Connect to **Solana Devnet** first.
- Store only public keys, network, and transaction signatures for achievement validation.

---

## 7. Acceptance Criteria

- [ ] Real users can register, verify email, and sign in.
- [ ] `/app` route validates session.
- [ ] Profile and avatar persist in Supabase / Storage.
- [ ] XP and attempts are verified and recorded on the server.
- [ ] Secrets and service keys are protected in environment variables.
- [ ] Vercel build and deployment pass cleanly.
