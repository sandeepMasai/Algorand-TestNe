"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorandService = void 0;
const algosdk_1 = __importDefault(require("algosdk"));
const Transaction_1 = __importDefault(require("../models/Transaction")); // ensure model has types
const serializeBigInt_1 = require("../utils/serializeBigInt");
// --- Algorand TestNet configuration ---
const ALGOD_SERVER = process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = process.env.ALGOD_PORT || "";
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || "";
const DEFAULT_MNEMONIC = process.env.ALGORAND_MNEMONIC || "";
const sanitizeMnemonic = (mnemonic) => {
    if (!mnemonic)
        return "";
    return mnemonic.trim().split(/\s+/).join(" ");
};
const badRequest = (message, code) => {
    const err = new Error(message);
    err.statusCode = 400;
    err.code = code;
    return err;
};
class AlgorandService {
    constructor() {
        this.algodClient = new algosdk_1.default.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    }
    /**
     * Send ALGO transaction
     */
    async sendTransaction(fromMnemonic, toAddress, amount, note) {
        try {
            // --- Validation ---
            const mnemonicInput = sanitizeMnemonic(fromMnemonic || DEFAULT_MNEMONIC);
            if (!mnemonicInput) {
                throw badRequest("Mnemonic is required. Provide fromMnemonic in the request body or set ALGORAND_MNEMONIC.", "MISSING_MNEMONIC");
            }
            const mnemonicWords = mnemonicInput.split(" ");
            if (mnemonicWords.length !== 25) {
                throw badRequest("Mnemonic must contain exactly 25 words", "INVALID_MNEMONIC_WORD_COUNT");
            }
            if (!algosdk_1.default.isValidAddress(toAddress)) {
                throw badRequest("Invalid recipient address", "INVALID_RECIPIENT");
            }
            const numericAmount = Number(amount);
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                throw badRequest("Amount must be a positive number", "INVALID_AMOUNT");
            }
            // --- Recover sender account ---
            let senderAccount;
            try {
                senderAccount = algosdk_1.default.mnemonicToSecretKey(mnemonicInput);
            }
            catch {
                throw badRequest("Invalid mnemonic phrase: ensure all 25 words belong to the Algorand word list and are in the correct order.", "INVALID_MNEMONIC");
            }
            // --- Get network parameters ---
            const suggestedParams = await this.algodClient.getTransactionParams().do();
            // --- Build transaction ---
            const txn = algosdk_1.default.makePaymentTxnWithSuggestedParamsFromObject({
                sender: senderAccount.addr,
                receiver: toAddress,
                amount: Math.round(numericAmount * 1000000), // ALGO → microAlgos
                note: note ? new TextEncoder().encode(note) : undefined,
                suggestedParams,
            });
            // --- Sign and send ---
            const signedTxn = txn.signTxn(senderAccount.sk);
            const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
            const txId = txid;
            console.log(` Transaction sent: ${txId}`);
            // --- Save to database ---
            const dbTransaction = new Transaction_1.default({
                txId,
                from: senderAccount.addr,
                to: toAddress,
                amount: numericAmount,
                status: "pending",
                note,
                createdAt: new Date(),
            });
            await dbTransaction.save();
            // --- Auto-confirm transaction (wait for confirmation) ---
            try {
                const confirmedTxn = await this.waitForConfirmation(txId, 10);
                if (confirmedTxn.confirmedRound) {
                    const confirmedRound = Number(confirmedTxn.confirmedRound);
                    await Transaction_1.default.findOneAndUpdate({ txId }, { status: "confirmed", confirmedRound });
                    console.log(`✅ Transaction confirmed in round ${confirmedRound}`);
                    // Update the transaction object
                    dbTransaction.status = "confirmed";
                    dbTransaction.confirmedRound = confirmedRound;
                }
            }
            catch (confirmError) {
                console.warn(`⚠️ Auto-confirmation failed for ${txId}:`, confirmError.message);
                // Transaction is still pending, will be checked later
            }
            return { txId, transaction: dbTransaction };
        }
        catch (error) {
            console.error(" Error sending transaction:", error.message);
            const err = error;
            if (!err.statusCode)
                err.statusCode = 500;
            throw err;
        }
    }
    /**
     * Check transaction confirmation status
     */
    async checkTransactionStatus(txId) {
        try {
            if (!txId)
                throw new Error("Transaction ID is required");
            const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();
            if (pendingInfo.confirmedRound) {
                const confirmedRound = Number(pendingInfo.confirmedRound);
                await Transaction_1.default.findOneAndUpdate({ txId }, { status: "confirmed", confirmedRound });
                return { status: "confirmed", confirmedRound, transaction: (0, serializeBigInt_1.serializeBigInt)(pendingInfo) };
            }
            if (pendingInfo.poolError) {
                await Transaction_1.default.findOneAndUpdate({ txId }, { status: "failed" });
                return { status: "failed", transaction: (0, serializeBigInt_1.serializeBigInt)(pendingInfo) };
            }
            return { status: "pending", transaction: (0, serializeBigInt_1.serializeBigInt)(pendingInfo) };
        }
        catch (error) {
            // Only mark as failed if it's a real error (not just pending)
            if (error.message && !error.message.includes("not found")) {
                console.error(" Error checking transaction status:", error.message);
                // Don't auto-mark as failed on network errors, just return pending
                return { status: "pending", transaction: null };
            }
            throw new Error(error.message || "Failed to check transaction status");
        }
    }
    /**
     * Fetch account info from Algorand network
     */
    async getAccountInfo(address) {
        try {
            if (!algosdk_1.default.isValidAddress(address))
                throw new Error("Invalid address");
            const info = await this.algodClient.accountInformation(address).do();
            return (0, serializeBigInt_1.serializeBigInt)(info);
        }
        catch (error) {
            console.error(" Error getting account info:", error.message);
            throw new Error(error.message || "Failed to fetch account info");
        }
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForConfirmation(txId, timeout = 10) {
        const status = await this.algodClient.status().do();
        const startRound = Number(status.lastRound) + 1;
        let currentRound = startRound;
        while (currentRound < startRound + timeout) {
            const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();
            if (pendingInfo.confirmedRound) {
                return pendingInfo;
            }
            if (pendingInfo.poolError) {
                throw new Error(`Transaction Pool Error: ${pendingInfo.poolError}`);
            }
            await this.algodClient.statusAfterBlock(currentRound).do();
            currentRound++;
        }
        throw new Error(`Transaction not confirmed after ${timeout} rounds`);
    }
    /**
     * Check and update all pending transactions
     */
    async checkPendingTransactions() {
        try {
            const pendingTransactions = await Transaction_1.default.find({ status: "pending" });
            let confirmed = 0;
            let failed = 0;
            for (const tx of pendingTransactions) {
                try {
                    const status = await this.checkTransactionStatus(tx.txId);
                    if (status.status === "confirmed") {
                        confirmed++;
                    }
                    else if (status.status === "failed") {
                        failed++;
                    }
                }
                catch (error) {
                    console.error(`Error checking transaction ${tx.txId}:`, error.message);
                }
            }
            return {
                checked: pendingTransactions.length,
                confirmed,
                failed,
            };
        }
        catch (error) {
            console.error("Error checking pending transactions:", error.message);
            throw new Error(error.message || "Failed to check pending transactions");
        }
    }
    /**
     * Fetch all transactions from database
     */
    async getTransactions() {
        try {
            const transactions = await Transaction_1.default.find().sort({ createdAt: -1 });
            return transactions.map(tx => tx.toObject());
        }
        catch (error) {
            console.error("Error fetching transactions:", error.message);
            throw new Error(error.message || "Failed to fetch transactions");
        }
    }
    /**
     * Send a signed transaction (signed by wallet)
     */
    async sendSignedTransaction(signedTxnBase64, fromAddress, toAddress, amount, note) {
        try {
            // --- Validation ---
            if (!algosdk_1.default.isValidAddress(fromAddress)) {
                throw badRequest("Invalid sender address", "INVALID_SENDER");
            }
            if (!algosdk_1.default.isValidAddress(toAddress)) {
                throw badRequest("Invalid recipient address", "INVALID_RECIPIENT");
            }
            const numericAmount = Number(amount);
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                throw badRequest("Amount must be a positive number", "INVALID_AMOUNT");
            }
            // --- Decode and verify signed transaction ---
            let signedTxn;
            try {
                signedTxn = new Uint8Array(Buffer.from(signedTxnBase64, "base64"));
            }
            catch {
                throw badRequest("Invalid signed transaction format", "INVALID_SIGNED_TXN");
            }
            // --- Send signed transaction ---
            const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
            const txId = txid;
            console.log(`✅ Signed transaction sent: ${txId}`);
            // --- Save to database ---
            const dbTransaction = new Transaction_1.default({
                txId,
                from: fromAddress,
                to: toAddress,
                amount: numericAmount,
                status: "pending",
                note,
                createdAt: new Date(),
            });
            await dbTransaction.save();
            // --- Auto-confirm transaction (wait for confirmation) ---
            try {
                const confirmedTxn = await this.waitForConfirmation(txId, 10);
                if (confirmedTxn.confirmedRound) {
                    const confirmedRound = Number(confirmedTxn.confirmedRound);
                    await Transaction_1.default.findOneAndUpdate({ txId }, { status: "confirmed", confirmedRound });
                    console.log(`✅ Transaction confirmed in round ${confirmedRound}`);
                    // Update the transaction object
                    dbTransaction.status = "confirmed";
                    dbTransaction.confirmedRound = confirmedRound;
                }
            }
            catch (confirmError) {
                console.warn(`⚠️ Auto-confirmation failed for ${txId}:`, confirmError.message);
                // Transaction is still pending, will be checked later
            }
            return { txId, transaction: dbTransaction };
        }
        catch (error) {
            console.error("❌ Error sending signed transaction:", error.message);
            const err = error;
            if (!err.statusCode)
                err.statusCode = 500;
            throw err;
        }
    }
}
exports.AlgorandService = AlgorandService;
