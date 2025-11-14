export interface TransactionRequest {
    fromMnemonic?: string;
    senderMnemonic?: string;
    toAddress?: string;
    to?: string;
    amount?: string | number;
    note?: string;
}

export interface TransactionResult {
    txId: string;
    transaction: Transaction;
}

export interface Transaction {
    _id?: string;
    txId: string;
    from: string;
    to: string;
    amount: number;
    status: "pending" | "confirmed" | "failed";
    note?: string;
    confirmedRound?: number;
    createdAt: string;
}

export interface TransactionStatus {
    status: "pending" | "confirmed" | "failed";
    confirmedRound?: number;
    poolError?: string;
    transaction?: any;
}

