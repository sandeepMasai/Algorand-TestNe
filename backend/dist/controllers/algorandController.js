"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTransaction = sendTransaction;
exports.getTransactionStatus = getTransactionStatus;
exports.confirmTransaction = confirmTransaction;
exports.getTransactions = getTransactions;
exports.checkPendingTransactions = checkPendingTransactions;
exports.getAccountInfo = getAccountInfo;
exports.sendSignedTransaction = sendSignedTransaction;
const algorandService_1 = require("../services/algorandService");
const serializeBigInt_1 = require("../utils/serializeBigInt");
const algorandService = new algorandService_1.AlgorandService();
/**
 * Send ALGO transaction
 */
async function sendTransaction(req, res) {
    try {
        const { fromMnemonic, senderMnemonic, toAddress, to, amount, note } = req.body;
        const mnemonic = fromMnemonic || senderMnemonic;
        const recipient = toAddress || to;
        if (!mnemonic) {
            return res.status(400).json({
                error: "Mnemonic is required. Provide fromMnemonic or senderMnemonic in the request body.",
                code: "MISSING_MNEMONIC",
            });
        }
        if (!recipient) {
            return res.status(400).json({
                error: "Recipient address is required. Provide toAddress or to in the request body.",
                code: "MISSING_RECIPIENT",
            });
        }
        if (!amount) {
            return res.status(400).json({
                error: "Amount is required.",
                code: "MISSING_AMOUNT",
            });
        }
        const result = await algorandService.sendTransaction(mnemonic, recipient, amount, note);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("❌ Error in sendTransaction controller:", error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            error: error.message || "Failed to send transaction",
            code: error.code || "INTERNAL_ERROR",
        });
    }
}
/**
 * Get transaction status by txId
 */
async function getTransactionStatus(req, res) {
    try {
        const { txId } = req.params;
        if (!txId) {
            return res.status(400).json({ error: "Transaction ID is required", code: "MISSING_TX_ID" });
        }
        const status = await algorandService.checkTransactionStatus(txId);
        res.status(200).json((0, serializeBigInt_1.serializeBigInt)(status));
    }
    catch (error) {
        console.error("⚠️ Error in getTransactionStatus controller:", error.message);
        res.status(500).json({
            error: error.message || "Failed to get transaction status",
            code: "INTERNAL_ERROR",
        });
    }
}
/**
 * Confirm transaction status and update DB
 */
async function confirmTransaction(req, res) {
    try {
        const { txId } = req.params;
        if (!txId) {
            return res.status(400).json({ error: "Transaction ID is required", code: "MISSING_TX_ID" });
        }
        const status = await algorandService.checkTransactionStatus(txId);
        res.status(200).json((0, serializeBigInt_1.serializeBigInt)(status));
    }
    catch (error) {
        console.error("⚠️ Error in confirmTransaction controller:", error.message);
        res.status(500).json({
            error: error.message || "Failed to confirm transaction",
            code: "INTERNAL_ERROR",
        });
    }
}
/**
* Get all transactions (with auto-check of pending transactions)
*/
async function getTransactions(req, res) {
    try {
        // Auto-check pending transactions before returning
        try {
            await algorandService.checkPendingTransactions();
        }
        catch (checkError) {
            console.warn("⚠️ Error auto-checking pending transactions:", checkError.message);
            // Continue even if auto-check fails
        }
        const transactions = await algorandService.getTransactions();
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error("⚠️ Error in getTransactions controller:", error.message);
        res.status(500).json({
            error: error.message || "Failed to fetch transactions",
            code: "INTERNAL_ERROR",
        });
    }
}
/**
* Check and update all pending transactions
*/
async function checkPendingTransactions(req, res) {
    try {
        const result = await algorandService.checkPendingTransactions();
        res.status(200).json({
            message: "Pending transactions checked",
            ...result,
        });
    }
    catch (error) {
        console.error("⚠️ Error in checkPendingTransactions controller:", error.message);
        res.status(500).json({
            error: error.message || "Failed to check pending transactions",
            code: "INTERNAL_ERROR",
        });
    }
}
/**
* Get account information
*/
async function getAccountInfo(req, res) {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({ error: "Address is required", code: "MISSING_ADDRESS" });
        }
        const accountInfo = await algorandService.getAccountInfo(address);
        res.status(200).json((0, serializeBigInt_1.serializeBigInt)(accountInfo));
    }
    catch (error) {
        console.error("⚠️ Error in getAccountInfo controller:", error.message);
        res.status(500).json({
            error: error.message || "Failed to get account info",
            code: "INTERNAL_ERROR",
        });
    }
}
/**
 * Send signed transaction (signed by wallet)
 */
async function sendSignedTransaction(req, res) {
    try {
        const { signedTxn, fromAddress, toAddress, amount, note } = req.body;
        if (!signedTxn) {
            return res.status(400).json({
                error: "Signed transaction is required",
                code: "MISSING_SIGNED_TXN",
            });
        }
        if (!fromAddress) {
            return res.status(400).json({
                error: "Sender address is required",
                code: "MISSING_SENDER",
            });
        }
        if (!toAddress) {
            return res.status(400).json({
                error: "Recipient address is required",
                code: "MISSING_RECIPIENT",
            });
        }
        if (!amount) {
            return res.status(400).json({
                error: "Amount is required",
                code: "MISSING_AMOUNT",
            });
        }
        const result = await algorandService.sendSignedTransaction(signedTxn, fromAddress, toAddress, amount, note);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("❌ Error in sendSignedTransaction controller:", error.message);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            error: error.message || "Failed to send signed transaction",
            code: error.code || "INTERNAL_ERROR",
        });
    }
}
