<p align="center">
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR)" src="https://img.shields.io/badge/lang-Português%20(BR)-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p>

<p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p>

<h1 align="center">Abracadabra · Web3 EdTech</h1>

<p align="center">
  <strong>Learn. Practice. Chat. Evolve with confidence.</strong><br />
  The Web3 educational platform designed for everyone — from young digital natives to seniors taking their first steps in the crypto ecosystem.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-live%20production-14F195" />
  <img alt="Network" src="https://img.shields.io/badge/network-Solana%20Devnet-14F195" />
  <img alt="Chat" src="https://img.shields.io/badge/chat-Live%20WebSockets-7C3AED" />
  <img alt="Category" src="https://img.shields.io/badge/category-EdTech%20Web3-09090F" />
  <img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-black" />
</p>

---

## 🧙‍♂️ What is Abracadabra?

**Abracadabra** is a gamified EdTech platform that demystifies blockchain and crypto.

Instead of throwing users directly into exchanges and financial risk, Abracadabra provides a **100% safe practice sandbox**: everyday analogies (e.g. comparing Public Keys to instant Pix keys), anti-scam simulators, a test wallet with a free testnet faucet, and a live community chat with real people learning together in real time.

---

## ✨ Key Features

### 🧪 1. Web3 Practice Wallet (Simulated Solana Devnet)
- **Automatic Wallet Provisioning:** Every account receives a public address and a starter practice balance (2.5 Devnet SOL).
- **Free Faucet:** Request +1.0 test SOL anytime to practice without spending real money.
- **On-Chain Send Simulation:** Practice entering recipient public keys, accounting for network fees (*Gas Fees*), and viewing real-time transaction hash signatures.
- **Transaction History:** Clear breakdown of debits, credits, fees, and confirmation statuses.

### 💬 2. Live Community & Real-Time Chat
- **Real People Online:** Global WebSockets connection (MQTT over WSS via EMQX & HiveMQ + local BroadcastChannel).
- **Presence Detection (Heartbeat):** The online list displays real visitors browsing the site at that exact moment. If you're alone, the app displays a shareable invite link for classmates.
- **Instant Messaging:** Community chatroom to ask questions and share Web3 insights.

### 🛡️ 3. Anti-Scam Simulator ("Trap or Safe?")
- **Real-World Scenarios:** Phishing messages impersonating support, fake airdrop giveaways, cloned dApps, and suspicious smart contracts.
- **Actionable Takeaways:** Instant feedback explaining why a scenario is dangerous or safe, reinforcing core security habits (e.g., *“Never share your seed phrase or private key”*).

### 🎯 4. Student Mission Track
- Interactive progress bar with milestone percentages.
- Guided tasks: inspecting your public address, claiming from the faucet, making a practice transfer, passing lab quizzes, and completing security challenges.
- Rewards in **XP** and **Practice SOL**.

### 👓 5. Inclusive Accessibility (For Youth and Seniors)
- **Dynamic Font Size Controls:** One-click `Aa` toggle for Normal, Large, and Extra Large typography with persistent memory.
- **Voice Text-to-Speech:** Native speech reader in Brazilian Portuguese for activity questions and concepts (Web Speech API).
- **Everyday Analogy Translator:** Simplifies technical jargon into daily concepts:
  - *Public Key* = Your Pix address (safe to share).
  - *Private Key* = Your banking password (never share).
  - *Gas Fee* = Postal delivery or notary fee.
  - *Faucet* = A public test fountain giving play money for learning.

### 📊 6. Market Radar & Real-Time News
- Live prices for 8 top digital assets powered by [Crypto Vision News](https://cryptocurrency.cv/).
- Daily radar for top gainer, top loser, and market cap leader.
- Curated headlines with direct links to original publisher articles.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite.
- **Styling:** Modern CSS3 with custom properties, Glassmorphism, and Dark Mode.
- **Real-Time Engine:** WebSockets (MQTT Client over WSS) + `BroadcastChannel` for multi-tab sync.
- **Accessibility:** Web Speech API (Text-to-Speech) and Font Scaling.
- **Hosting & CI/CD:** Vercel with GitHub automated deployments.

---

## 🚀 Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/wSales0/abracadabra.git
cd abracadabra

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in your browser:
# http://localhost:3000
```

---

## 👥 Demo Credentials

To test the application:
- **Demo User:** `teste123`
- **Demo Password:** `123`
- Or use the **"Continuar com Google"** option on the landing page.

---

## 📄 License & Disclaimer

Abracadabra is strictly an **educational project** developed for hackathon demonstration. Market data and news are shown solely for instructional context and do not constitute financial advice.
