import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../components/transaction-list";

type ApiResponse = {
    transactions: Transaction[];
};

const fetchTransactions = async (): Promise<Transaction[]> => {
    const response = await fetch("/api/algorand/transactions");
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch transactions");
    }
    const data = (await response.json()) as ApiResponse;
    return data.transactions ?? [];
};

const confirmTransaction = async (txId: string) => {
    const response = await fetch(`/api/algorand/confirm/${txId}`, { method: "POST" });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to confirm transaction");
    }
    return response.json();
};

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(
        async (options?: { silent?: boolean; confirm?: boolean }) => {
            const silent = options?.silent ?? false;
            const shouldConfirm = options?.confirm ?? true;

            if (!silent) {
                setIsLoading(true);
            }

            try {
                let result = await fetchTransactions();
                setTransactions(result);

                if (shouldConfirm) {
                    const pending = result.filter((txn) => txn.status === "pending").slice(0, 5);
                    if (pending.length) {
                        await Promise.allSettled(
                            pending.map((txn) =>
                                confirmTransaction(txn.txId).catch((error) => {
                                    if (!silent) {
                                        toast.error(
                                            error instanceof Error ? error.message : `Failed to confirm ${txn.txId}`
                                        );
                                    }
                                    throw error;
                                })
                            )
                        );
                        result = await fetchTransactions();
                        setTransactions(result);
                    }
                }

                return result;
            } catch (error) {
                if (!silent) {
                    toast.error(error instanceof Error ? error.message : "Unable to load transactions");
                }
                return [];
            } finally {
                if (!silent) {
                    setIsLoading(false);
                }
            }
        },
        []
    );

    const refresh = useCallback(() => {
        void load({ confirm: true });
    }, [load]);

    const pendingCount = useMemo(
        () => transactions.filter((txn) => txn.status === "pending").length,
        [transactions]
    );

    useEffect(() => {
        void load({ confirm: true });
    }, [load]);

    useEffect(() => {
        if (!pendingCount) {
            return;
        }

        const interval = setInterval(() => {
            void load({ silent: true, confirm: true });
        }, 8000);

        return () => clearInterval(interval);
    }, [pendingCount, load]);

    useEffect(() => {
        const interval = setInterval(() => {
            void load({ silent: true, confirm: false });
        }, 30000);

        return () => clearInterval(interval);
    }, [load]);

    return {
        transactions,
        isLoading,
        refresh,
        pendingCount
    };
}

