<p align="center">
<a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR )" src="https://img.shields.io/badge/lang-Português%20(BR )-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p> <p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p> <h1 align="center">Abracadabra</h1> <p align="center">
  <strong>Learn. Practice. Interact. Prove.</strong>  

  A gamified experience for learning Web3 by doing, from first concepts to early on-chain decisions.
</p> <p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-hackathon%20prototype-7C3AED" />
  <img alt="Network" src="https://img.shields.io/badge/network-Solana%20Devnet-14F195" />
  <img alt="Category" src="https://img.shields.io/badge/category-EdTech-09090F" />
</p>

> **Current status:** the frontend now includes a public landing page, demo login, student dashboard, editable profile, crypto market data, related headlines and an initial activity system with XP. Wallets, backend services, real authentication and on-chain actions are not integrated yet.

## The product

Abracadabra turns Web3 learning into a practical, progressive journey. Users enter, follow market context, answer questions, receive feedback and earn XP while building a foundation in Web3 concepts and security.

The current experience is a functional visual prototype for a hackathon. It is not a production-ready platform and it is not a financial advice tool.

## Implemented today

- Public landing page and separate student area.

- Local demo login with `teste123` / `123`.

- Dashboard tabs for Market, Profile and Activities.

- Editable profile with name, bio, preferences and locally persisted avatar.

- Market cards with price, 24-hour change, rank and market cap.

- Radar with top gainer, top loser and market-cap leader.

- Related headlines loaded only after the user selects an asset.

- Activities covering concepts, security and reasoning.

- Beginner, intermediate and advanced difficulty.

- XP, levels, accuracy, answered questions and immediate feedback.

- Procedural question generation with shuffled choices and unique local IDs.

## Market and news integration

The prototype uses the public [Crypto Vision News / cryptocurrency.cv](https://cryptocurrency.cv/) API:

```
GET https://cryptocurrency.cv/api/market/coins?limit=8
GET https://cryptocurrency.cv/api/news?category=bitcoin&limit=5
GET https://cryptocurrency.cv/api/news?search=CoinName Symbol&limit=5
```

The integration lives in `src/lib/cryptoApi.ts`. No API key is currently placed in the frontend.

### Copyright and attribution

The API aggregates metadata and headlines from third-party publishers. Original content remains the property of the relevant publishers. A public or free API **does not mean that every article is free of copyright restrictions**.

Therefore Abracadabra should:

- display only the headline, publisher, date and original URL;

- keep visible attribution to the source;

- send users to the original article;

- never reproduce the article body, publisher summary or an automatic rewrite;

- never copy third-party images;

- never present publisher content as Abracadabra content;

- show that market information is not financial advice.

For commercial use or large-scale publication, review the [API terms](https://cryptocurrency.cv/terms) again and, where necessary, confirm rights directly with publishers. Attribution alone does not replace an editorial license.

The API also documents usage limits. The frontend makes a small number of requests: market data when the dashboard opens and news only after an asset is selected. Do not add aggressive polling without caching and rate-limit control.

## Backend handoff: information to collect first

> 📄 **Complete Handoff Document:** See [HANDOFF.md](./HANDOFF.md) for complete SQL schemas, Edge Functions specifications, RLS rules, copyright guidance, and acceptance criteria.
>
> 📌 *Current Decision: The frontend operates completely standalone with the demo test user (`teste123` / `123`), without requiring a database connection at this moment.*

Before replacing the prototype with Supabase or another backend, the backend owner should decide and obtain:

### 1. Authentication

- selected provider: Supabase Auth or another service;

- signup, login, logout and password recovery flows;

- session format and token refresh rules;

- email confirmation requirements;

- private-route access rules;

- migration path from the demo user to real accounts.

### 2. Database

Create and document tables equivalent to:

- `profiles`: user, display name, bio, avatar, focus and preferences;

- `activity_progress`: XP, level, answers, correct answers and streak;

- `activity_attempts`: question, selected choice, correctness, XP and timestamp;

- `question_catalog`: versioned question bank;

- `news_cache`: only allowed metadata and short-lived cache, if the terms allow it;

- `wallet_connections`: public address, network and connection date, never a seed phrase or private key.

Define keys, indexes, timestamps, deletion policy and retention policy as well.

### 3. Security and RLS

- enable Row Level Security;

- allow each user to read and edit only their own profile;

- prevent clients from granting XP directly;

- validate answers, attempts and rewards server-side;

- never store seed phrases or private keys;

- keep service keys in server-side environment variables only;

- add rate limiting and error logs.

### 4. Market and news API

- move `cryptoApi.ts` calls to an Edge Function or server-side API;

- add caching and per-user/IP limits;

- define fallback behavior when the source is unavailable;

- store only permitted fields: title, source, date and URL;

- review each publisher's terms before monetizing or redistributing content;

- validate URLs and prevent injected content from reaching the UI.

### 5. Activities and XP

- decide whether questions stay in code, move to a table or use a CMS;

- version questions and correct answers on the server;

- create an endpoint to start an activity;

- create an endpoint to submit an answer and calculate XP server-side;

- prevent repetition per user using attempt history;

- define difficulty, streak, daily limits and level rules;

- record only the analytics events that are actually needed.

### 6. Wallet and Solana

- choose Wallet Adapter and supported wallets;

- define Devnet/Mainnet per environment;

- verify signatures and transactions server-side;

- confirm RPC, rate limits, confirmations and pending-transaction handling;

- grant achievements only after verifiable on-chain activity;

- define what is stored: public address, signature, network and status.

## Current frontend structure

```
src/
├── data/mockNews.ts              # previous demonstration data
├── lib/activityEngine.ts         # question generation, XP and levels
├── lib/cryptoApi.ts              # market and external headlines
├── lib/demoAuth.ts               # local auth and profile persistence
├── pages/DashboardPage.tsx       # Market, Profile and Activities
├── main.tsx                      # frontend entry and navigation
├── styles.css                    # visual system and responsive layout
└── types.ts                      # domain types
```

## Run locally

```bash
npm install
npm run dev
```

The project uses Vite, React and TypeScript and can be deployed to Vercel as a static frontend. The current prototype stores login state, profile data, question counter and progress in browser `localStorage`.

## Prototype security notes

- Never enter a seed phrase or private key.

- Do not treat the dashboard as financial advice.

- Client-side XP is not valid proof for production rewards.

- Never publish secret keys in frontend code.

- Do not store third-party article bodies, summaries or images.

## Team

- [wSales0](https://github.com/wSales0)

- [gsoares0017](https://github.com/gsoares0017)

- [001zk](https://github.com/001zk)

- [higomvp](https://github.com/higomvp)

## License

To be defined by the team. External source and publisher licenses are independent from the Abracadabra code license.
