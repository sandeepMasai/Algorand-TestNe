import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  walletType: "pera" | "trust" | null;
  connectPeraWallet: () => Promise<void>;
  connectTrustWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  balance: number | null;
  loading: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initialize PeraWallet without chainId to avoid network mismatch
// The network will be determined by the wallet's current network setting
export const peraWallet = new PeraWalletConnect();

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletType, setWalletType] = useState<"pera" | "trust" | null>(null);

  const fetchBalance = async (addr: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/algorand/account/${addr}`);
      if (response.ok) {
        const accountInfo = await response.json();
        // Convert microAlgos to ALGO
        const algoBalance = accountInfo.amount ? accountInfo.amount / 1_000_000 : 0;
        setBalance(algoBalance);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
    }
  };

  // Load saved connection from localStorage on mount
  useEffect(() => {
    const loadSavedConnection = async () => {
      try {
        const savedAddress = localStorage.getItem("wallet_address");
        const savedWalletType = localStorage.getItem("wallet_type") as "pera" | "trust" | null;
        if (savedAddress && savedWalletType) {
          setAddress(savedAddress);
          setWalletType(savedWalletType);
          await fetchBalance(savedAddress);
        }
      } catch (e) {
        console.error("Error loading saved connection:", e);
      }
    };

    loadSavedConnection();
  }, []);

  // Check PeraWallet session and sync with saved state
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0) {
          const savedAddress = localStorage.getItem("wallet_address");
          // Only update if we don't have a saved address or if it matches
          if (!savedAddress || savedAddress === accounts[0]) {
            setAddress(accounts[0]);
            setWalletType("pera");
            localStorage.setItem("wallet_address", accounts[0]);
            localStorage.setItem("wallet_type", "pera");
            await fetchBalance(accounts[0]);
          }
        }
      } catch (error) {
        // Not connected to PeraWallet, but might have Trust Wallet saved
        const savedWalletType = localStorage.getItem("wallet_type");
        if (savedWalletType !== "pera") {
          // Trust Wallet connection persists via localStorage
          return;
        }
      }
    };
    checkConnection();

    // Listen for PeraWallet disconnect
    const handleDisconnect = () => {
      setAddress(null);
      setBalance(null);
      setWalletType(null);
      localStorage.removeItem("wallet_address");
      localStorage.removeItem("wallet_type");
    };

    peraWallet.connector?.on("disconnect", handleDisconnect);
  }, []);

  const connectPeraWallet = async () => {
    try {
      setLoading(true);
      // Disconnect other wallets first
      if (walletType === "trust") {
        setAddress(null);
        setBalance(null);
        setWalletType(null);
      }

      // Clear any stale sessions before connecting
      try {
        await peraWallet.disconnect();
      } catch (e) {
        // Ignore disconnect errors if not connected
      }

      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setWalletType("pera");
        // Save to localStorage for persistence
        localStorage.setItem("wallet_address", accounts[0]);
        localStorage.setItem("wallet_type", "pera");
        await fetchBalance(accounts[0]);
      }
    } catch (error: any) {
      // Handle different error types
      if (error?.data?.type === "CONNECT_MODAL_CLOSED") {
        // User closed the modal, don't show error
        return;
      }

      // Handle network mismatch errors
      if (error?.message?.includes("Network mismatch") || 
          error?.message?.includes("network mismatch") ||
          error?.data?.message?.includes("Network mismatch") ||
          error?.data?.message?.includes("network mismatch")) {
        alert(
          "Network Mismatch Error\n\n" +
          "Your PeraWallet is connected to a different network than this dApp.\n\n" +
          "This dApp is configured for Algorand TestNet.\n\n" +
          "To fix this:\n" +
          "1. Open PeraWallet app\n" +
          "2. Go to Settings\n" +
          "3. Switch to TestNet network\n" +
          "4. Try connecting again\n\n" +
          "Or use the mnemonic option in the transaction form instead."
        );
        return;
      }

      // Handle WalletConnect errors
      if (error?.message?.includes("dApp is not responding") || 
          error?.message?.includes("Connection failed") ||
          error?.data?.message?.includes("dApp is not responding")) {
        // Clear stale session and retry
        try {
          await peraWallet.disconnect();
          localStorage.removeItem("pera-wallet-connect");
        } catch (e) {
          // Ignore cleanup errors
        }
        
        alert(
          "Connection Error: The wallet connection timed out.\n\n" +
          "Please try again:\n" +
          "1. Make sure PeraWallet app is installed\n" +
          "2. Refresh the page and try connecting again\n" +
          "3. Or use the mnemonic option in the transaction form"
        );
        return;
      }
      
      // Handle other connection errors gracefully
      const errorMessage = error?.message || error?.data?.message || "Failed to connect to PeraWallet";
      console.error("Error connecting to PeraWallet:", error);
      
      // Show user-friendly error
      alert(`Connection Error: ${errorMessage}\n\nPlease try again or use the mnemonic option in the transaction form.`);
    } finally {
      setLoading(false);
    }
  };

  const connectTrustWallet = async () => {
    try {
      setLoading(true);
      // Disconnect PeraWallet first
      if (walletType === "pera") {
        try {
          await peraWallet.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }

      // Trust Wallet connection - manual address entry
      // This avoids WalletConnect v1/v2 issues
      const trustAddress = prompt(
        "Trust Wallet Connection\n\n" +
        "To connect Trust Wallet:\n" +
        "1. Open Trust Wallet app\n" +
        "2. Copy your Algorand address\n" +
        "3. Paste it below\n\n" +
        "Or click Cancel to use PeraWallet instead.\n\n" +
        "Enter your Trust Wallet Algorand address:"
      );

      if (trustAddress && trustAddress.trim()) {
        // Validate Algorand address format
        const trimmedAddress = trustAddress.trim();
        const isValidAddress = /^[A-Z2-7]{58}$/.test(trimmedAddress);
        
        if (isValidAddress) {
          setAddress(trimmedAddress);
          setWalletType("trust");
          // Save to localStorage for persistence
          localStorage.setItem("wallet_address", trimmedAddress);
          localStorage.setItem("wallet_type", "trust");
          await fetchBalance(trimmedAddress);
        } else {
          alert("Invalid Algorand address format.\n\nAlgorand addresses are 58 characters long and contain only A-Z and 2-7.\n\nPlease check your address and try again.");
        }
      } else {
        // User cancelled, offer to connect PeraWallet
        const usePera = confirm("Would you like to connect PeraWallet instead?\n\nPeraWallet provides easier connection with QR code scanning.");
        if (usePera) {
          await connectPeraWallet();
        }
      }
    } catch (error: any) {
      console.error("Error connecting to Trust Wallet:", error);
      const errorMessage = error?.message || "Failed to connect Trust Wallet";
      alert(`Connection Error: ${errorMessage}\n\nPlease try again or use PeraWallet for easier connection.`);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (walletType === "pera") {
        await peraWallet.disconnect();
      }
      setAddress(null);
      setBalance(null);
      setWalletType(null);
      // Clear saved connection from localStorage
      localStorage.removeItem("wallet_address");
      localStorage.removeItem("wallet_type");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      // Still clear local state even if disconnect fails
      setAddress(null);
      setBalance(null);
      setWalletType(null);
      localStorage.removeItem("wallet_address");
      localStorage.removeItem("wallet_type");
    }
  };

  const refreshBalance = async () => {
    if (address) {
      await fetchBalance(address);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        walletType,
        connectPeraWallet,
        connectTrustWallet,
        disconnect,
        balance,
        loading,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
