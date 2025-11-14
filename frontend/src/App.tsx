import { useState } from "react";
import { WalletProvider } from "./contexts/WalletContext";
import WalletConnect from "./components/WalletConnect";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionSuccess = () => {
    // Trigger refresh of transaction list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Algorand TestNet Transaction Manager
            </h1>
            <p className="text-muted-foreground mt-2">
              Send and manage ALGO transactions on Algorand TestNet
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <WalletConnect />
            </div>
            <div className="lg:col-span-2">
              <TransactionForm onSuccess={handleTransactionSuccess} />
            </div>
          </div>

          <div key={refreshKey}>
            <TransactionList />
          </div>
        </main>

        <footer className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto">
          <div className="container mx-auto px-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              API URL: {import.meta.env.VITE_API_URL || "http://localhost:5000/api"}
            </p>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}

export default App;
