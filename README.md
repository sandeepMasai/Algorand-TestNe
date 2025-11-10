# Algorand Transaction Manager

A full-stack MERN application for sending and monitoring Algorand TestNet transactions with automatic confirmation tracking.

## 🚀 Features

- **Send Transactions**: Submit Algorand payments via TestNet with mnemonic or default account
- **Auto-Confirmation**: Automatically checks and updates transaction status from pending → confirmed
- **Real-time Updates**: Dashboard refreshes every 8s for pending transactions, 30s for general updates
- **Transaction History**: View all transactions with timestamps, status, and metadata
- **Modern UI**: Built with React, TypeScript, shadcn/ui, and Tailwind CSS
- **Security**: Rate limiting, CORS protection, helmet security headers
- **Database Persistence**: MongoDB storage for all transaction records

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** (local or cloud instance like MongoDB Atlas)
- **Algorand TestNet Account** (optional - can use default mnemonic from env)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ALOG
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
# Edit .env with your configuration (see .env.md for details)
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `ALGORAND_MNEMONIC` - 25-word mnemonic phrase (optional if provided in form)

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

The frontend automatically proxies API requests to `http://localhost:5000` (configured in `vite.config.ts`).

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend:**
```bash
cd backend
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Transactions
- `POST /api/algorand/send` - Send a new transaction
  ```json
  {
    "fromMnemonic": "word1 word2 ... word25", // optional
    "toAddress": "ALGOSDKZXW...",
    "amount": 0.1,
    "note": "Optional transaction note"
  }
  ```

- `GET /api/algorand/transactions` - Get all transactions
- `GET /api/algorand/status/:txId` - Check transaction status
- `POST /api/algorand/confirm/:txId` - Manually confirm a transaction

## 🗄️ Database Schema

### Transaction Model
```javascript
{
  txId: String (unique, required),
  from: String (required),
  to: String (required),
  amount: Number (required),
  status: 'pending' | 'confirmed' | 'failed',
  note: String (optional),
  createdAt: Date,
  confirmedRound: Number (optional)
}
```

## 🔒 Security Features

- **Rate Limiting**: 60 requests per minute per IP (configurable)
- **Helmet**: Security headers protection
- **CORS**: Configurable origin whitelist
- **Input Validation**: Zod schema validation on frontend, service-level validation on backend
- **Mnemonic Sanitization**: Automatic whitespace normalization

## 🎨 UI Features

- **Dark/Light Mode**: Theme toggle with system preference detection
- **Responsive Design**: Mobile-friendly layout
- **Loading States**: Skeleton loaders during data fetch
- **Toast Notifications**: Success/error feedback
- **Auto-refresh**: Background polling for pending transactions
- **Form Reset**: Automatic form clearing after successful submission

## 📝 Usage Examples

### Send a Transaction

1. Open the frontend at http://localhost:5173
2. Fill in the form:
   - **Mnemonic** (optional): Leave empty to use backend default, or provide 25-word phrase
   - **Recipient Address**: Valid Algorand address
   - **Amount**: ALGO amount (e.g., 0.1)
   - **Note** (optional): Transaction memo
3. Click "Send Transaction"
4. Form resets automatically and transaction appears in the list

### Monitor Transactions

- Transactions appear in the "Recent Transactions" panel
- Pending transactions show a badge with count in the header
- Status updates automatically every 8 seconds for pending items
- Click "Refresh" to manually reload the list

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running and `MONGODB_URI` is correct
- Verify all required environment variables are set
- Check port 5000 is not in use

### Transactions fail to send
- Ensure mnemonic is valid (25 words, all in Algorand wordlist)
- Verify recipient address is a valid Algorand address
- Check Algorand TestNet node is accessible (default: testnet-api.algonode.cloud)

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check CORS settings in backend `.env` if accessing from different origin
- Verify Vite proxy configuration in `vite.config.ts`

### Transactions stuck in "pending"
- Network may be slow - auto-refresh will update when confirmed
- Use `POST /api/algorand/confirm/:txId` to manually trigger confirmation check
- Verify Algorand TestNet node connectivity

## 📚 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Algorand SDK (algosdk)
- dotenv, helmet, cors, morgan, express-rate-limit

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui components
- React Hook Form + Zod validation
- date-fns for date formatting
- Sonner for toast notifications

## 📄 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Note**: This application is configured for Algorand TestNet. Never use mainnet credentials or real funds in development.

