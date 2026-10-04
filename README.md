<p align="center">
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR)" src="https://img.shields.io/badge/lang-Portugu%C3%AAs%20(BR)-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p>

<p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p>

<h1 align="center">Abracadabra</h1>

<p align="center">
  <strong>Learn. Practice. Interact. Prove.</strong><br/>
  A gamified learning platform that takes people from "what is a wallet?" to on-chain builders on Solana.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-in%20structuring-7C3AED" />
  <img alt="Network" src="https://img.shields.io/badge/network-Solana%20Devnet-14F195" />
  <img alt="Category" src="https://img.shields.io/badge/category-EdTech-09090F" />
</p>

> **Status:** project in structuring, built for the Superteam Brasil / Colosseum hackathon.
> The sections below describe the planned direction, not finished features.

---

## The problem

Web3 has a steep learning curve. Wallets, transactions, accounts and programs feel disconnected when learned only through documentation and long videos. Most beginners read about blockchain but never actually use it.

## What Abracadabra does

Abracadabra turns Web3 education into a guided, hands-on journey:

1. **Assess.** A short knowledge assessment sets the user's starting level.
2. **Learn.** A personalized learning path with short lessons.
3. **Practice.** Interactive quests and challenges.
4. **Interact.** The user connects a wallet and performs real actions on Solana Devnet.
5. **Prove.** The app verifies the on-chain activity, grants XP and unlocks achievements.

Abracadabra is closer to a guided journey than a course catalog: people learn Web3 by using it, step by step.

## How Solana is used

Solana is part of the learning loop, not just the subject matter:

- The user connects a wallet (Solana Wallet Adapter).
- Quests ask for real Devnet actions, such as receiving test SOL and sending a first transaction.
- Abracadabra verifies the activity by address and transaction signature before granting XP.
- Achievements (for example **First Spell**) are unlocked from verified on-chain activity.

On-chain credentials and a custom Anchor program are **planned**, not part of the current prototype.

## Example flow (demo target)

```
Continue as Test User
  -> create username
  -> knowledge assessment (starting level)
  -> dashboard shows the first quest
  -> learn about wallets and transactions
  -> connect wallet
  -> get Devnet SOL
  -> send the first transaction
  -> Abracadabra verifies it
  -> +XP and the "First Spell" achievement
  -> next quest unlocked
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Solana | `@solana/web3.js`, Solana Wallet Adapter, Devnet |
| On-chain programs | Anchor (planned, only if needed) |
| Persistence (prototype) | Client-side storage (`localStorage`) for the Test User |
| Backend | Intentionally open / TBD |
| Deploy | Vercel |

## Architecture

```
            ABRACADABRA
                 |
      +----------+-----------+
   Frontend                Backend
  Next.js / TS            (TBD, decoupled)
      |
  Learning | Gamification | Wallet / Auth
      |
  Solana integration
      |
  Wallet | Devnet | Programs (future)
```

- The frontend is decoupled from any backend. Storage lives behind small modules (`userStorage`, `progressStorage`, `questStorage`, `achievementStorage`), so the local persistence can be replaced by an API later without rewriting the UI.
- Authentication is planned behind an `AuthProvider` interface with `guest` and `authenticated` modes.
- Off-chain: lessons, quizzes, XP, progress, streaks, quest catalog. On-chain: wallet address, challenge transactions, verifiable activity, achievements (when implemented).

## Security notes

- The app never asks for or stores a seed phrase or private key.
- Educational activity runs on Devnet with test funds.
- The user is told clearly whenever a transaction is about to be signed.
- Rewards must be granted only after verifying the transaction server-side or on-chain, never from client-reported data alone.

## Getting started

Repository: [github.com/wSales0/abracadabra](https://github.com/wSales0/abracadabra)

The repository is still being structured. Setup instructions will be added once the first version of the app is committed.

## Suggested repository structure

The structure can start smaller than this.

```
abracadabra/
├── apps/web/          # Next.js app (onboarding, dashboard, learn, quests, achievements, profile)
├── programs/          # Anchor programs (future)
├── packages/          # shared types and config
├── content/           # lessons and quests (fundamentals, wallets, solana, development)
└── README.md
```

## Design

| Token | Value |
| --- | --- |
| Primary | `#7C3AED` (purple) |
| Accent | `#14F195` (green, Solana-inspired) |
| Background | `#09090F` |

## Team

- [wSales0](https://github.com/wSales0)
- [gsoares0017](https://github.com/gsoares0017)
- [001zk](https://github.com/001zk)
- [higomvp](https://github.com/higomvp)

## License

To be defined by the team. This section will be updated when a `LICENSE` file is added.
