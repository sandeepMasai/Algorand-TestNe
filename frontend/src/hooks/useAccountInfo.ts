import { useState, useEffect } from "react";
import { algorandAPI } from "@/services/api";

interface AccountInfo {
  address: string;
  amount: number; // in microAlgos
  amountWithoutPendingRewards: number;
  pendingRewards: number;
  rewards: number;
  round: number;
  status: string;
  assets?: Array<{
    amount: number;
    assetId: number;
    creator: string;
    isFrozen: boolean;
  }>;
}

export function useAccountInfo(address: string | null, autoRefresh: boolean = true) {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setAccountInfo(null);
      return;
    }

    const fetchAccountInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const info = await algorandAPI.getAccountInfo(address);
        // Ensure assets is an array - Algorand API returns assets as an array
        const normalizedInfo = {
          ...info,
          address,
          assets: Array.isArray(info?.assets) ? info.assets : [],
        };
        setAccountInfo(normalizedInfo);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Failed to fetch account info");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountInfo();
    
    if (!autoRefresh) return;
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchAccountInfo, 10000);
    return () => clearInterval(interval);
  }, [address, autoRefresh]);

  return { accountInfo, loading, error, refetch: async () => {
    if (address) {
      try {
        const info = await algorandAPI.getAccountInfo(address);
        // Ensure assets is an array
        const normalizedInfo = {
          ...info,
          address,
          assets: Array.isArray(info?.assets) ? info.assets : [],
        };
        setAccountInfo(normalizedInfo);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Failed to fetch account info");
      }
    }
  }};
}

