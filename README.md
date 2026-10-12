<p align="center">
<a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR )" src="https://img.shields.io/badge/lang-Português%20(BR )-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p> <p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p> <h1 align="center">Abracadabra · Web3 EdTech</h1> <p align="center">
  <strong>Learn. Practice. Chat. Evolve with confidence.</strong>  

  A gamified platform that turns Web3 and Solana concepts into guided practice.
</p> <p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-live%20production-14F195" />
  <img alt="Network" src="https://img.shields.io/badge/network-Solana%20Devnet-14F195" />
  <img alt="Backend" src="https://img.shields.io/badge/backend-MongoDB%20Atlas-47A248" />
  <img alt="Chat" src="https://img.shields.io/badge/chat-MQTT%20over%20WSS-7C3AED" />
  <img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-black" />
</p>

## What is Abracadabra?

**Abracadabra** is a gamified learning platform for people who want to understand Web3, wallets, security, crypto markets and Solana through practical experiences. It combines guided learning tracks, interactive activities, missions, rewards, community features and a practice environment connected to the Solana ecosystem.

The product takes learners from first concepts such as public keys, seed phrases and gas fees to more advanced experiences such as practice transfers, swaps, staking, transaction reading and security challenges.

## Features

### Solana practice wallet

- Educational wallet with a public address, starter balance and transaction history.

- Practice SOL faucet for learning without using real funds.

- Practice SOL sending and receiving with network-fee calculation and demonstration signatures.

- QR code, address copying and transaction explorer flows.

- Visual, sound and voice alerts when practice crypto is received.

- Practice tokens including SOL, USDC, ABRA and BTC.

### Swap, staking and conversion

- Educational swaps between SOL, USDC and ABRA.

- Proof-of-Stake staking vault with practice balance and learning rewards.

- Currency converter for connecting crypto values with traditional currencies.

- These flows are designed to explain Web3 concepts and user actions step by step.

### Community and live chat

- Community room with backend-persisted messages.

- Real-time communication through MQTT over WSS, online presence and multi-tab synchronization.

- MongoDB Atlas persistence for chat history, presence and transfer events.

- Alerts when a practice transfer reaches another learner.

### Class leaderboard

- Persistent leaderboard connected to MongoDB Atlas.

- Visual podium for the top three learners and a list of the remaining participants.

- Scores combine XP, answered activities, completed missions and individual progress.

- Ties are resolved by completed activities and then by learner name.

- The ranking returns the top 25 participants and highlights the current user.

### Learning track, activities and safety

- Guided missions with progress, XP and practice SOL rewards.

- Questions generated from concepts, scenarios and three difficulty levels: beginner, intermediate and advanced.

- Anti-scam lab covering phishing, fake airdrops, seed phrase requests and unrealistic profit promises.

- Interactive challenge for arranging a 12-word seed phrase.

- Diagnostics lab for analyzing common network and transaction failures.

- Activity progress stored with history, correct answers, response counts and XP.

### Badges and certificate

- Badge gallery organized around learning, practice and security milestones.

- Completion certificate prepared for the learner journey.

- Profile with photo, display name, bio, learning focus, weekly digest and accessibility preferences.

### Market context and accessible learning

- Updated asset prices and SOL price data.

- Radar for the top gainer, top loser and market-cap leader.

- Related headlines with source, date and a link to the original article.

- Three font-size options and Brazilian Portuguese read-aloud support.

- Everyday analogies that make technical concepts easier to understand.

## Backend and architecture

The frontend is built with React, TypeScript and Vite. Serverless functions in `api/` run on Vercel and connect the product to MongoDB Atlas.

Current routes include:

- `api/user`: profiles, presence, practice transfers and leaderboard data.

- `api/activities`: answers, history, accuracy and XP.

- `api/missions`: learner mission completion.

- `api/chat`: community message history and persistence.

The client uses the service layer in `src/lib/mongoDbService.ts`, keeping the interface decoupled from backend routes. The leaderboard consolidates user, activity and mission data to rank learners by progress.

## Tech stack

- **Frontend:** React 19, TypeScript and Vite.

- **Backend:** Vercel Serverless Functions, Node.js and MongoDB Atlas.

- **Database:** MongoDB collections for users, activities, missions and messages.

- **Real time:** MQTT over WSS, secure broker connectivity and `BroadcastChannel`.

- **Web3:** Educational Solana Devnet concepts and practice flows.

- **Accessibility:** Web Speech API and dynamic font scaling.

- **Deployment:** Vercel integrated with GitHub.

## Running locally

```bash
git clone https://github.com/wSales0/abracadabra.git
cd abracadabra
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. To create a production build:

```bash
npm run build
```

To run the backend locally, configure the MongoDB environment variables used by the serverless functions and use a Vercel-compatible local environment.

## Demo credentials

```
Username: teste123
Password: 123
```

The interface also includes a fast access flow with Google.

## Copyright and disclaimer

Abracadabra is the final hackathon version of the project. Market data and headlines are used as learning context, with attribution and links to original sources. Editorial content belongs to its respective publishers and should not be reproduced without permission. Market data does not constitute financial advice.
