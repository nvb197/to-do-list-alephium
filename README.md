# AlphTask — Web3 To-Do List on Alephium

> **Stake real ALPH on your goals. Complete them to get your funds back. Fail and pay the price.**

AlphTask is a Web3 productivity app built on the **Alephium blockchain (Testnet)**. Each task you create locks real ALPH in a smart contract. If you succeed, you get them back. If you fail, they go to the destination you chose when creating the task.

---

## 🚀 Why AlphTask? (For the Jury)

AlphTask isn't just a To-Do list; it's a **behavioral economic tool** built on Web3 primitives.
- **Accountability via Proof-of-Stake**: We use smart contracts not for DeFi yield, but to stake capital on human execution. 
- **Dynamic Asset Routing**: Failed tasks don't just "burn" tokens. Users decide if their failure benefits the open-source community ("Support the Devs") or fuels their own ultimate goals ("Super Task Pool").
- **Seamless Alephium Integration**: Fully on-chain, utilizing Alephium's stateful UTXO model (sUTXO), TxScripts, and wallet standard for a smooth, transparent, and decentralized escrow experience.
- **Production-Ready UX**: Integrated with a robust backend to handle off-chain indexing (MongoDB) while maintaining 100% on-chain custody of funds.

---

## 🧪 Testing the App — Complete Guide

This guide is for anyone who just cloned the project and wants to run it locally. No errors should occur if you follow the steps in order.

---

### Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v8 or higher (comes with Node.js)
- A **Chromium-based browser** (Chrome, Brave, Edge) — required for the Alephium wallet extension

---

### Step 1 — Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd to-do-list-alephium

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### Step 2 — Set Up the Alephium Extension Wallet

This is the only manual step. You need the Alephium wallet browser extension to sign transactions.

**Install the extension:**

- **Chrome / Brave / Edge** → [Chrome Web Store — Alephium Extension Wallet](https://chromewebstore.google.com/detail/alephium-extension-wallet/gdokollfgkmoabodnkdbbhcmkemfgnci)
- **Firefox** → [Firefox Add-ons — Alephium Extension Wallet](https://addons.mozilla.org/en-US/firefox/addon/alephium-extension-wallet/)

**Create a new wallet:**

1. Click the Alephium icon in your browser toolbar
2. Click **"New Wallet"**
3. **Write down your 24-word seed phrase** and keep it safe
4. Set a password and confirm it

**Switch to Testnet:**

1. In the extension, click the network icon (top right — shows "Mainnet")
2. Select **"Testnet"**

> ⚠️ The app is configured for **Testnet only**. Do not use real ALPH (Mainnet).

---

### Step 3 — Get Free Testnet ALPH (Faucet)

1. Copy your wallet address from the extension (click on it to copy)
2. Go to [https://faucet.testnet.alephium.org](https://faucet.testnet.alephium.org)
3. Paste your address and click **"Request"**
4. You will receive ~100 free testnet ALPH within a few seconds ✅

---

### Step 4 — Run the App (One Command)

We optimized the developer experience. You can run both the Frontend and the Backend simultaneously with a single command.

Open **one terminal** in the project root:

```bash
cd /path/to/to-do-list-alephium
npm run dev
```

You should see logs from both `[dev:backend]` and `[dev:frontend]` appearing in the same terminal. Make sure you see:
- `🚀 Registrar Server running on port 3001`
- `🟢 MongoDB Connected!`
- `VITE ready in ...ms`

**Open your browser** and navigate to: **http://localhost:5173**

---

### Step 5 — Use the App

#### Connect your wallet

Click the **wallet icon** in the top-right corner of the app. The Alephium extension will open — click **"Connect"**.

#### Create a normal Task

1. Click **"+ Create a New Task"**
2. Fill in:
   - **Title** — what you want to accomplish
   - **Deadline** — pick a date
   - **ALPH to lock** — how much to stake (e.g. `1`)
   - **Failure Mode** — what happens to your ALPH if you fail:
     - 🏆 **Super Task Pool** — funds go to your Super Task reward pool
     - 🔥 **Support the Devs** — funds go to the project creators
3. Click **"Create Task"** — your wallet will ask you to **sign the transaction**
4. ⏳ Wait ~15-30 seconds for blockchain confirmation (this is normal)
5. The task appears in your list ✅

#### Mark a Task as Completed (Success)

- Click **"✅ Success"** on an active task
- Sign the transaction in your wallet
- Your ALPH are **returned to your wallet**

#### Declare a Task as Failed

- Click **"❌ Declare Fail"** on an active task
- Sign the transaction in your wallet
- Your ALPH are **sent to the failure destination** you chose

#### Super Task (Ultimate Goal)

The Super Task is your big overarching goal. ALPH from tasks that failed in "Super Task Pool" mode accumulate in a reward pool.

1. Click **"Set Super Task"** and enter your ultimate goal
2. When you complete it, click **"🏆 Goal Achieved!"** — the accumulated pool is sent back to you automatically (no signature needed — the backend sends it)
3. If you fail, click **"❌ Mark as Failed"** — the pool is lost

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)             │
│   - Creates & deploys HackathonEscrow contracts         │
│   - Signs withdraw() / forfeit() via wallet extension   │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Backend (Express)     │
          │   - Registers tasks     │
          │   - Awards points       │
          │   - Releases pool funds │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   MongoDB Atlas (cloud) │
          │   - Task registry       │
          │   - User points         │
          └────────────────────────-┘
                       │
          ┌────────────▼────────────┐
          │   Alephium Testnet      │
          │   - HackathonEscrow.ral │
          │   - WithdrawScript.ral  │
          │   - ForfeitScript.ral   │
          └─────────────────────────┘
```

### Smart Contracts (Ralph)

| Contract | Role |
|---|---|
| `HackathonEscrow` | Locks ALPH for a task. Has `withdraw()` (success) and `forfeit()` (failure). |
| `WithdrawScript` | TxScript called on task success — transfers ALPH back to owner |
| `ForfeitScript` | TxScript called on task failure — transfers ALPH to beneficiary |

---

## 📁 Project Structure

```
to-do-list-alephium/
├── contracts/          # Ralph smart contracts (.ral)
├── artifacts/          # Compiled contract JSON + TypeScript wrappers
├── scripts/            # Deployment scripts
├── server.ts           # Express backend
├── .env                # Backend environment variables
└── frontend/
    ├── src/
    │   ├── components/ # React UI components
    │   ├── hooks/      # useTaskContract — central state & logic
    │   ├── services/   # contractApi.js — blockchain interactions
    │   └── App.jsx
    └── .env            # Frontend environment variables
```

---

## ⚙️ Environment Variables

The `.env` files are already pre-configured for the testnet deployment. You should not need to change anything.

**Root `.env`** (backend):
```
ADMIN_PRIVATE_KEY=...     # Admin wallet used for deploying & releasing pool funds
PORT=3001
MONGO_URI=...             # MongoDB Atlas connection string (shared cloud DB)
DEV_WALLET_ADDRESS=...    # Destination for "Support the Devs" penalty
CAGNOTTE_POOL_ADDRESS=... # Admin wallet that accumulates reward pool funds
```

**`frontend/.env`**:
```
VITE_BACKEND_URL=http://localhost:3001
VITE_CAGNOTTE_ADDRESS=...  # Same as CAGNOTTE_POOL_ADDRESS
VITE_DEVS_ADDRESS=...      # Same as DEV_WALLET_ADDRESS
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Alephium (Testnet) |
| Smart Contracts | Ralph (Alephium native language) |
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas |
| Wallet | Alephium Extension Wallet |

---

## ❓ Troubleshooting

| Issue | Solution |
|---|---|
| **"Wallet not connected"** | Click the wallet icon in the app and approve the connection in your browser extension |
| **"No seed"** in wallet | Your wallet has no seed phrase — go to the extension and finish creating your wallet |
| **Transaction taking long** (~30s) | Normal — waiting for blockchain confirmation. Do not close the tab. |
| **"Contract does not exist"** | The task was created before our fixes. Create a fresh task and it will work. |
| **Super Task pool shows 0 ALPH** | You need to fail at least one task in "Super Task Pool" mode first |
| **Backend not starting** | Make sure port 3001 is free: `kill $(lsof -ti:3001)` then retry |

---

## 📝 Notes

- All transactions happen on **Alephium Testnet** — no real money is involved
- Contract addresses are deterministic — the same contract can be re-used across test sessions
- The MongoDB database is shared — tasks from all testers are visible in the same DB

---

*Built with ❤️ on Alephium — AlphTask © 2026*
