<p align="center">
<a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR )" src="https://img.shields.io/badge/lang-Português%20(BR )-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p> <p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p> <h1 align="center">Abracadabra · Web3 EdTech</h1> <p align="center">
  <strong>Learn. Practice. Chat. Evolve with confidence.</strong>  

  A Web3 education platform that turns difficult concepts into guided, safer practice.
</p> <p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-functional%20prototype-7C3AED" />
  <img alt="Network" src="https://img.shields.io/badge/network-Solana%20Devnet-14F195" />
  <img alt="Chat" src="https://img.shields.io/badge/chat-MQTT%20over%20WSS-7C3AED" />
  <img alt="Category" src="https://img.shields.io/badge/category-Web3%20EdTech-09090F" />
  <img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-black" />
</p>

> **Current status:** the project has a functional prototype for demonstration. The practice wallet, chat, presence, missions, anti-scam simulator, accessibility and social-login flows include local or simulated behavior; this is not the same as production authentication, custody, a database or production on-chain transactions.

## 🧙‍♂️ What is Abracadabra?

**Abracadabra** is a gamified EdTech platform designed to make blockchain and crypto easier to understand. Instead of starting with real financial risk, students practice in a controlled environment: everyday analogies, scam detection, guided missions, concept challenges and a live learning community.

The goal is to bring learners into Web3 with clarity and confidence without ever asking for a seed phrase or private key.

## ✨ Current features

### 🧪 1. Web3 practice wallet

- Students can receive a demo wallet with a public address and starter practice balance.

- The simulated faucet adds practice balance without moving real money.

- The simulated send flow shows destination, network fee, debit, balance and a demo transaction hash.

- History displays transactions, status and details for educational purposes.

- The modal can also detect Phantom, Solflare, Backpack and Coinbase Wallet extensions when available, with an option to paste a public address.

> The demo wallet and transaction flow must not be treated as production custody, a production wallet or proof of an on-chain transaction. Real Solana validation and integration still require a dedicated implementation.

### 💬 2. Community and real-time chat

- Global chat over MQTT on WSS.

- EMQX as the primary broker and HiveMQ as fallback.

- `BroadcastChannel` for cross-tab communication and local fallback.

- Messages are locally cached in the browser for the prototype experience.

- Presence heartbeats run every 2 seconds.

- A student is removed after 5 seconds without a signal.

- The exit sweep runs every 1 second.

- MQTT Last Will and Testament announces a disconnect when the connection drops.

- The UI provides a manual presence refresh and a shareable invite when no other peers are detected.

Presence means clients connected to the channel at that moment; it is not civil-identity verification. The public broker and chat still need authentication, moderation, rate limits and dedicated infrastructure before scaled public operation.

### 🛡️ 3. Anti-scam simulator — “Trap or Safe?”

Students review scenarios inspired by common scams, including fake support, fake airdrops, malicious links and seed-phrase requests. After answering, they receive an explanation and practical guidance. The training can also be read aloud when the browser supports the Web Speech API.

### 🎯 4. Student mission track

The track organizes guided missions with a progress bar. Steps include identifying a public key, using the practice faucet, trying a simulated transfer, answering challenges and completing the security lab. Current rewards are XP and practice SOL inside the prototype.

### 👓 5. Accessibility and plain language

- `Aa` control with Normal, Large and Extra Large sizes.

- Font preference persisted locally.

- Brazilian Portuguese text-to-speech for prompts and explanations.

- “Everyday Translator” analogies:
  - Public Key = a Pix key;
  - Private Key = a bank password;
  - Gas Fee = a delivery fee;
  - Faucet = a practice fountain for play balance.

### 📊 6. Market and news

- Market data for leading assets through the public [Crypto Vision News](https://cryptocurrency.cv/) API.

- Radar for top gainer, top loser and market-cap leader.

- Related headlines with title, publisher, date and a link to the original article.

Market data and headlines are shown for educational context and do not constitute financial advice.

### 🔑 7. Authentication

- Quick demo login.

- A quick-access flow presented as “Continue with Google”.

- The official Google window is available only when a valid Google OAuth Client ID is configured.

- Quick social access without configured OAuth is a local demonstration, not complete Google authentication.

## 📌 Latest update

The latest GitHub commit is `555ca80`, with the message `perf: presenca ultra-rapida de alunos online com Last Will no broker, heartbeat de 2s e varredura de saida a cada 1s`.

That update changed:

- `src/components/CommunityChatPanel.tsx`;

- `src/lib/communityChat.ts`;

- `src/styles.css`.

The focus was faster presence detection, MQTT Last Will support and a manual refresh action for the student list.

## 🛠️ Tech stack

- **Frontend:** React 19, TypeScript and Vite.

- **Styling:** Modern CSS with custom properties, gradients, glassmorphism and dark mode.

- **Real time:** MQTT over WSS, EMQX, HiveMQ and `BroadcastChannel`.

- **Accessibility:** Web Speech API and dynamic font scaling.

- **Market data:** Public Crypto Vision News API.

- **Hosting:** Vercel integrated with GitHub.

## ⚖️ Copyright and news usage

The API aggregates headlines and metadata from third-party publishers. A public or free API does not mean that the articles are free of copyright restrictions. Original content remains owned by the publishers.

Abracadabra should keep only what is necessary to send the user to the source:

- headline;

- publisher;

- date;

- original URL;

- visible attribution.

Do not copy or redistribute article bodies, publisher summaries, third-party images or automatic rewrites. Attribution does not replace an editorial license. Before commercial use, extended caching or large-scale redistribution, review the [API terms](https://cryptocurrency.cv/terms) and each publisher's rules.

## 🚀 Run locally

```bash
git clone https://github.com/wSales0/abracadabra.git
cd abracadabra
npm install
npm run dev
```

Then open the address shown by Vite. For a production build:

```bash
npm run build
```

## 👥 Demo credentials

```
Username: teste123
Password: 123
```

The official Google OAuth flow requires its own Google Cloud configuration. Never place secret credentials in the frontend.

## 🔮 Technical next steps

Production will require real authentication, a database, RLS, chat moderation, a private or authenticated broker, rate limiting, server-side caching, server-side XP validation and verifiable on-chain integration. Supabase Auth, Database, Storage and Edge Functions are compatible options for the planned architecture.

## 📄 License and disclaimer

Abracadabra is an educational project for hackathon demonstration. Market data and news do not constitute financial advice. API, publisher and external-broker licenses are independent from the Abracadabra code license; review their terms before commercial use.
