export type Transaction = {
    _id: string;
    txId: string;
    from: string;
    to: string;
    amount: number;
    status: "pending" | "confirmed" | "failed";
    note?: string | null;
    createdAt: string;
    confirmedRound?: number;
};
type TransactionListProps = {
    transactions: Transaction[];
};
export declare function TransactionList({ transactions }: TransactionListProps): import("react/jsx-runtime").JSX.Element;
export {};
