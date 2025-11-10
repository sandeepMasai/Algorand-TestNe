# Algorand-TestNe
# MERN + Algorand Take‑Home Challenge (Submission Guide)

## 🧭 Overview

A **MERN stack** application that sends a real **Algorand TestNet** transaction using `algosdk`, records the transaction in **MongoDB**, and displays transaction details and confirmation status in a **React (Vite + TypeScript)** frontend.

> ⚙️ **Stack:** Express + TypeScript | React + Vite + TypeScript | MongoDB | AlgoNode (TestNet) | shadcn/ui

---

## 📁 Project Structure

```
algorand-mern/
├─ server/       → Express + TypeScript backend
├─ client/       → React + Vite + TypeScript frontend
└─ README.md     → This file
```

---

## 🚀 Backend Setup (Express + TypeScript)

### 1️⃣ Environment Variables

Create a file at `server/.env` based on the example below:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/algomern

ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_PORT=
ALGOD_TOKEN=

INDEXER_SERVER=https://testnet-idx.algonode.cloud
INDEXER_PORT=
INDEXER_TOKEN=
```

### 2️⃣ Install & Run

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Server runs on **[http://localhost:5000](http://localhost:5000)**

### 3️⃣ API Endpoints

| Endpoint                     | Method | Description                    |
| ---------------------------- | ------ | ------------------------------ |
| `/api/algorand/send`         | POST   | Send ALGO transaction          |
| `/api/algorand/status/:txId` | GET    | Check transaction confirmation |
| `/api/algorand/transactions` | GET    | Fetch all saved transactions   |

**POST Example:**

```bash
curl -X POST http://localhost:5000/api/algorand/send \
 -H 'Content-Type: application/json' \
 -d '{
   "mnemonic": "<25-word TestNet mnemonic>",
   "to": "TW3A3ZK4HPAQ3FGBGGQJW6CA67U65M4TDKH3DH645EYL46P37NA2T6Z2MI",
   "amount": 0.1,
   "note": "MERN Test"
 }'
```

---

## 💻 Frontend Setup (React + Vite + TypeScript)

### 1️⃣ Environment Variables

Create a file at `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_TEST_RECIPIENT=TW3A3ZK4HPAQ3FGBGGQJW6CA67U65M4TDKH3DH645EYL46P37NA2T6Z2MI
```

### 2️⃣ Install & Run

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs on **[http://localhost:5173](http://localhost:5173)**

---

## 🧩 MongoDB Setup

* Ensure MongoDB is running locally or use a **MongoDB Atlas** connection.
* Default connection: `mongodb://127.0.0.1:27017/algomern`
* Schema fields:

  * `txId, from, to, amount, status, note, createdAt, confirmedRound`

---

## 🪙 Algorand Configuration

* **Network:** TestNet only
* **Node provider:** [AlgoNode](https://nodely.io/docs/free/start)
* **TestNet Faucet:** [https://bank.testnet.algorand.network/](https://bank.testnet.algorand.network/)

### Example Test Account

```
Address: TW3A3ZK4HPAQ3FGBGGQJW6CA67U65M4TDKH3DH645EYL46P37NA2T6Z2MI
```

Use this as the recipient when testing.

---

## 🧠 Security Awareness

✅ Mnemonics are never stored in DB or logs. Used only in memory for signing.
✅ Server validates address & amount.
✅ Helmet & CORS configured.
✅ `.env.example` provided (do not commit real keys).
✅ Uses **TestNet** only (never MainNet).

---

## ⚙️ API Validation & Error Handling

* **Validation:** via `zod` on both client and server.
* **Error Handling:** Central Express middleware returns structured `{ error, details }`.
* **UI Feedback:** Inline form errors and live transaction status updates.

---

## 🎨 UI / UX

* Minimal, clean interface using Tailwind + shadcn/ui.
* Features:

  * Form for mnemonic, recipient, amount, note.
  * Displays `txId`, `status`, and `confirmedRound`.
  * Auto-refresh transaction list every 10s.
  * Polls transaction status every 5s until confirmation.

---

## 🧾 Bonus Features

* **Indexer API** integration for advanced transaction info.
* Optional **WalletConnect / Pera Wallet** client-side signing.
* Ready for deployment to Render / Vercel.

---

## ✅ Evaluation Checklist

| Criteria           | Description                       | Points |
| ------------------ | --------------------------------- | ------ |
| Correctness        | Sends real TestNet transaction    | 3      |
| Error Handling     | Validation & safe error responses | 4      |
| Security Awareness | No mnemonic storage, proper docs  | 4      |
| UI / UX Flow       | Clean React form + feedback       | 3      |
| Database           | Transaction record keeping        | 3      |

---

## 📦 Submission

1. Push the project to **GitHub**.
2. Include:

   * `server/` & `client/` directories
   * `.env.example` files
   * This `README.md`
3. Submit GitHub link before **3:00 PM, 11 Nov 2025**.

---

## 📚 References

* Algorand SDK Docs: [https://developer.algorand.org/docs/sdks/javascript/](https://developer.algorand.org/docs/sdks/javascript/)
* AlgoNode Public Endpoints: [https://nodely.io/docs/free/start](https://nodely.io/docs/free/start)
* shadcn/ui Components: [https://ui.shadcn.com/](https://ui.shadcn.com/)

---

**Developed by:** Sandeep Kumar 🧑‍💻
**Stack:** MERN + Algorand TestNet
**Deadline:** ⏰ 3 PM, 11 Nov 2025
