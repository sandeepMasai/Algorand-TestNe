import type { Transaction } from "../components/transaction-list";
export declare function useTransactions(): {
    transactions: Transaction[];
    isLoading: boolean;
    refresh: () => void;
    pendingCount: number;
};
