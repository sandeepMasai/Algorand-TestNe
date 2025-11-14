# Algorand TestNet Frontend

React + TypeScript frontend for the Algorand TestNet Transaction Manager.

## Features

- ✅ React 19 with TypeScript
- ✅ Vite for fast development
- ✅ Environment variable support (`.env`)
- ✅ Transaction form to send ALGO
- ✅ Transaction history list
- ✅ Real-time transaction status updates
- ✅ Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:
```env
VITE_API_URL=http://localhost:5000/api
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port specified in `VITE_PORT`).

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

- `VITE_API_URL`: Backend API URL (default: `http://localhost:5000/api`)
- `VITE_PORT`: Frontend port (default: `5173`)

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── TransactionForm.tsx
│   └── TransactionList.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript types
│   └── algorand.types.ts
├── App.tsx            # Main app component
├── App.css            # App styles
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Usage

1. Enter your 25-word mnemonic phrase
2. Enter recipient address
3. Enter amount in ALGO
4. (Optional) Add a note
5. Click "Send Transaction"

The transaction list will automatically refresh every 5 seconds to show the latest status.
