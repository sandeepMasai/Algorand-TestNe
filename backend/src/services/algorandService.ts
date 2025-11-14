import algosdk, { SuggestedParams, Transaction as AlgoTransaction } from "algosdk";
import Transaction, { ITransaction } from "../models/Transaction"; // ensure model has types
import type { Document } from "mongoose";
import { serializeBigInt } from "../utils/serializeBigInt";

interface ServiceError extends Error {
  statusCode?: number;
  code?: string;
}

// --- Algorand TestNet configuration ---
const ALGOD_SERVER = process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = process.env.ALGOD_PORT || "";
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || "";
const DEFAULT_MNEMONIC = process.env.ALGORAND_MNEMONIC || "";

const sanitizeMnemonic = (mnemonic: string): string => {
  if (!mnemonic) return "";
  return mnemonic.trim().split(/\s+/).join(" ");
};

const badRequest = (message: string, code: string): ServiceError => {
  const err = new Error(message) as ServiceError;
  err.statusCode = 400;
  err.code = code;
  return err;
};

export class AlgorandService {
  private algodClient: algosdk.Algodv2;

  constructor() {
    // algosdk.Algodv2 expects: (token, server, port)
    // Based on algosdk source, it constructs URLs internally and needs protocol
    // So we should pass the full URL with protocol, or just hostname with proper format
    let server = ALGOD_SERVER.trim();
    let port: string | number | undefined;
    
    // Log original value for debugging
    console.log(`[DEBUG] Original ALGOD_SERVER: "${server}"`);
    
    // Check if server already has protocol
    const hasProtocol = /^https?:\/\//i.test(server);
    
    // Extract hostname and determine protocol
    let hostname = server;
    let protocol = "https";
    
    if (hasProtocol) {
      // Extract protocol
      if (server.toLowerCase().startsWith("https://")) {
        protocol = "https";
        hostname = server.replace(/^https:\/\//i, "");
      } else {
        protocol = "http";
        hostname = server.replace(/^http:\/\//i, "");
      }
    }
    
    // Remove any path after hostname (everything after first /)
    const pathIndex = hostname.indexOf("/");
    if (pathIndex !== -1) {
      hostname = hostname.substring(0, pathIndex);
    }
    
    // Extract port from hostname if present (e.g., hostname:443)
    const urlPortMatch = hostname.match(/:(\d+)$/);
    if (urlPortMatch) {
      port = parseInt(urlPortMatch[1], 10);
      hostname = hostname.replace(/:\d+$/, "");
    } else if (ALGOD_PORT && ALGOD_PORT.trim() !== "") {
      // Use explicit port from env
      port = parseInt(ALGOD_PORT, 10) || ALGOD_PORT;
    } else {
      // Default port based on protocol
      if (protocol === "https") {
        port = 443;
      } else {
        port = 80;
      }
    }
    
    // Final cleanup: trim hostname
    hostname = hostname.trim().replace(/[/\\]+$/, "").replace(/^[/\\]+/, "");
    
    // Validate hostname is not empty
    if (!hostname || hostname.length === 0) {
      throw new Error(`Invalid ALGOD_SERVER configuration: "${ALGOD_SERVER}"`);
    }
    
    // Log cleaned values for debugging
    console.log(`[DEBUG] Using hostname: "${hostname}", port: ${port}, protocol: ${protocol}`);
    
    // algosdk internally constructs URLs and needs protocol
    // Try passing the full URL as server parameter (some versions support this)
    // If that doesn't work, we'll pass hostname and port separately
    try {
      // First try: pass full URL as server (some algosdk versions support this)
      const fullUrl = `${protocol}://${hostname}:${port}`;
      console.log(`[DEBUG] Attempting with full URL: "${fullUrl}"`);
      this.algodClient = new algosdk.Algodv2(ALGOD_TOKEN || "", fullUrl);
      console.log(`✓ Algorand client initialized with full URL: ${fullUrl}`);
    } catch (error: any) {
      // Fallback: pass hostname and port separately
      console.log(`[DEBUG] Full URL failed, trying hostname + port separately`);
      // Ensure hostname is absolutely clean (no slashes, no special chars)
      const cleanHostname = hostname.replace(/[\/\\]/g, "").trim();
      this.algodClient = new algosdk.Algodv2(ALGOD_TOKEN || "", cleanHostname, port);
      console.log(`✓ Algorand client initialized: ${cleanHostname}:${port} (${protocol})`);
    }
  }

  /**
   * Test connection to Algorand network
   */
  private async testConnection(): Promise<void> {
    try {
      const status = await this.algodClient.status().do();
      console.log(`✓ Algorand network connection successful. Last round: ${status.lastRound}`);
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      const errorStack = error.stack || "";
      console.error(`✗ Algorand network connection failed:`);
      console.error(`  Error: ${errorMessage}`);
      console.error(`  Server: ${ALGOD_SERVER}`);
      console.error(`  Stack: ${errorStack}`);
      
      // Provide more specific error messages
      if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED")) {
        throw new Error(
          `Network connection failed. Cannot reach Algorand node at ${ALGOD_SERVER}. ` +
          `This could be due to: network connectivity issues, firewall restrictions, or incorrect server configuration. ` +
          `Please verify ALGOD_SERVER is correct and accessible.`
        );
      }
      
      throw new Error(
        `Cannot connect to Algorand network (${ALGOD_SERVER}). ` +
        `Error: ${errorMessage}`
      );
    }
  }

  /**
   * Send ALGO transaction
   */
  async sendTransaction(
    fromMnemonic: string,
    toAddress: string,
    amount: number | string,
    note?: string
  ): Promise<{ txId: string; transaction: Document<ITransaction> }> {
    try {
      // --- Validation ---
      const mnemonicInput = sanitizeMnemonic(fromMnemonic || DEFAULT_MNEMONIC);

      if (!mnemonicInput) {
        throw badRequest(
          "Mnemonic is required. Provide fromMnemonic in the request body or set ALGORAND_MNEMONIC.",
          "MISSING_MNEMONIC"
        );
      }

      const mnemonicWords = mnemonicInput.split(" ");
      if (mnemonicWords.length !== 25) {
        throw badRequest("Mnemonic must contain exactly 25 words", "INVALID_MNEMONIC_WORD_COUNT");
      }

      if (!algosdk.isValidAddress(toAddress)) {
        throw badRequest("Invalid recipient address", "INVALID_RECIPIENT");
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw badRequest("Amount must be a positive number", "INVALID_AMOUNT");
      }

      // --- Recover sender account ---
      let senderAccount: algosdk.Account;
      try {
        senderAccount = algosdk.mnemonicToSecretKey(mnemonicInput);
      } catch {
        throw badRequest(
          "Invalid mnemonic phrase: ensure all 25 words belong to the Algorand word list and are in the correct order.",
          "INVALID_MNEMONIC"
        );
      }

      // --- Test connection and get network parameters ---
      await this.testConnection();
      const suggestedParams: SuggestedParams = await this.algodClient.getTransactionParams().do();

      // --- Build transaction ---
      const txn: AlgoTransaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAccount.addr,
        receiver: toAddress,
        amount: Math.round(numericAmount * 1_000_000), // ALGO → microAlgos
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams,
      });

      // --- Sign and send ---
      const signedTxn = txn.signTxn(senderAccount.sk);
      const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
      const txId = txid;

      console.log(` Transaction sent: ${txId}`);

      // --- Save to database ---
      const dbTransaction = new Transaction({
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
          await Transaction.findOneAndUpdate(
            { txId },
            { status: "confirmed", confirmedRound }
          );
          console.log(`✅ Transaction confirmed in round ${confirmedRound}`);
          // Update the transaction object
          dbTransaction.status = "confirmed";
          dbTransaction.confirmedRound = confirmedRound;
        }
      } catch (confirmError: any) {
        console.warn(`⚠️ Auto-confirmation failed for ${txId}:`, confirmError.message);
        // Transaction is still pending, will be checked later
      }

      return { txId, transaction: dbTransaction as Document<ITransaction> };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("❌ Error sending transaction:", errorMessage);
      
      // Provide more helpful error messages
      if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
        const networkError = new Error(
          `Network connection failed. Cannot reach Algorand node at ${ALGOD_SERVER}. ` +
          `Please check your internet connection and ALGOD_SERVER configuration.`
        ) as ServiceError;
        networkError.statusCode = 503;
        networkError.code = "NETWORK_ERROR";
        throw networkError;
      }
      
      const err: ServiceError = error;
      if (!err.statusCode) err.statusCode = 500;
      if (!err.code) err.code = "TRANSACTION_ERROR";
      throw err;
    }
  }

  /**
   * Check transaction confirmation status
   */
  async checkTransactionStatus(
    txId: string
  ): Promise<{ status: string; confirmedRound?: number; transaction?: any }> {
    try {
      if (!txId) throw new Error("Transaction ID is required");

      const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();

      if (pendingInfo.confirmedRound) {
        const confirmedRound = Number(pendingInfo.confirmedRound);
        await Transaction.findOneAndUpdate(
          { txId },
          { status: "confirmed", confirmedRound }
        );
        return { status: "confirmed", confirmedRound, transaction: serializeBigInt(pendingInfo) };
      }

      if (pendingInfo.poolError) {
        await Transaction.findOneAndUpdate({ txId }, { status: "failed" });
        return { status: "failed", transaction: serializeBigInt(pendingInfo) };
      }

      return { status: "pending", transaction: serializeBigInt(pendingInfo) };
    } catch (error: any) {
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
  async getAccountInfo(address: string): Promise<any> {
    try {
      if (!algosdk.isValidAddress(address)) throw new Error("Invalid address");
      const info = await this.algodClient.accountInformation(address).do();
      return serializeBigInt(info);
    } catch (error: any) {
      console.error(" Error getting account info:", error.message);
      throw new Error(error.message || "Failed to fetch account info");
    }
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForConfirmation(
    txId: string,
    timeout = 10
  ): Promise<algosdk.modelsv2.PendingTransactionResponse> {
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
  async checkPendingTransactions(): Promise<{
    checked: number;
    confirmed: number;
    failed: number;
  }> {
    try {
      const pendingTransactions = await Transaction.find({ status: "pending" });
      let confirmed = 0;
      let failed = 0;

      for (const tx of pendingTransactions) {
        try {
          const status = await this.checkTransactionStatus(tx.txId);
          if (status.status === "confirmed") {
            confirmed++;
          } else if (status.status === "failed") {
            failed++;
          }
        } catch (error: any) {
          console.error(`Error checking transaction ${tx.txId}:`, error.message);
        }
      }

      return {
        checked: pendingTransactions.length,
        confirmed,
        failed,
      };
    } catch (error: any) {
      console.error("Error checking pending transactions:", error.message);
      throw new Error(error.message || "Failed to check pending transactions");
    }
  }

  /**
   * Fetch all transactions from database
   */
  async getTransactions(): Promise<ITransaction[]> {
    try {
      const transactions = await Transaction.find().sort({ createdAt: -1 });
      return transactions.map(tx => tx.toObject());
    } catch (error: any) {
      console.error("Error fetching transactions:", error.message);
      throw new Error(error.message || "Failed to fetch transactions");
    }
  }

  /**
   * Send a signed transaction (signed by wallet)
   */
  async sendSignedTransaction(
    signedTxnBase64: string,
    fromAddress: string,
    toAddress: string,
    amount: number | string,
    note?: string
  ): Promise<{ txId: string; transaction: Document<ITransaction> }> {
    try {
      // --- Validation ---
      if (!algosdk.isValidAddress(fromAddress)) {
        throw badRequest("Invalid sender address", "INVALID_SENDER");
      }

      if (!algosdk.isValidAddress(toAddress)) {
        throw badRequest("Invalid recipient address", "INVALID_RECIPIENT");
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw badRequest("Amount must be a positive number", "INVALID_AMOUNT");
      }

      // --- Decode and verify signed transaction ---
      let signedTxn: Uint8Array;
      try {
        signedTxn = new Uint8Array(Buffer.from(signedTxnBase64, "base64"));
      } catch {
        throw badRequest("Invalid signed transaction format", "INVALID_SIGNED_TXN");
      }

      // --- Send signed transaction ---
      const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
      const txId = txid;

      console.log(`✅ Signed transaction sent: ${txId}`);

      // --- Save to database ---
      const dbTransaction = new Transaction({
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
          await Transaction.findOneAndUpdate(
            { txId },
            { status: "confirmed", confirmedRound }
          );
          console.log(`✅ Transaction confirmed in round ${confirmedRound}`);
          // Update the transaction object
          dbTransaction.status = "confirmed";
          dbTransaction.confirmedRound = confirmedRound;
        }
      } catch (confirmError: any) {
        console.warn(`⚠️ Auto-confirmation failed for ${txId}:`, confirmError.message);
        // Transaction is still pending, will be checked later
      }

      return { txId, transaction: dbTransaction as Document<ITransaction> };
    } catch (error: any) {
      console.error("❌ Error sending signed transaction:", error.message);
      const err: ServiceError = error;
      if (!err.statusCode) err.statusCode = 500;
      throw err;
    }
  }
}
