import axios from "axios";
import type {
    TransactionRequest,
    TransactionResult,
    Transaction,
    TransactionStatus,
} from "../types/algorand.types";

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// API Service
export const algorandAPI = {
    /**
     * Send ALGO transaction
     */
    async sendTransaction(data: TransactionRequest): Promise<TransactionResult> {
        const response = await api.post<TransactionResult>("/algorand/send", data);
        return response.data;
    },

    /**
     * Get transaction status by txId
     */
    async getTransactionStatus(txId: string): Promise<TransactionStatus> {
        const response = await api.get<TransactionStatus>(
            `/algorand/status/${txId}`
        );
        return response.data;
    },

    /**
     * Confirm transaction status and update DB
     */
    async confirmTransaction(txId: string): Promise<TransactionStatus> {
        const response = await api.post<TransactionStatus>(
            `/algorand/confirm/${txId}`
        );
        return response.data;
    },

    /**
     * Get all transactions
     */
    async getTransactions(): Promise<Transaction[]> {
        const response = await api.get<Transaction[]>("/algorand/transactions");
        return response.data;
    },

    /**
     * Health check
     */
    async healthCheck(): Promise<{ ok: boolean; uptime: number }> {
        const response = await api.get<{ ok: boolean; uptime: number }>("/health");
        return response.data;
    },

    /**
     * Get account information
     */
    async getAccountInfo(address: string): Promise<any> {
        const response = await api.get(`/algorand/account/${address}`);
        return response.data;
    },

    /**
     * Send signed transaction (signed by wallet)
     */
    async sendSignedTransaction(data: {
        signedTxn: string;
        fromAddress: string;
        toAddress: string;
        amount: number | string;
        note?: string;
    }): Promise<TransactionResult> {
        const response = await api.post<TransactionResult>("/algorand/send-signed", data);
        return response.data;
    },
};

export default api;

