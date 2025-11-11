import algosdk, { SuggestedParams, Transaction as AlgoTransaction } from "algosdk";
import Transaction, { ITransaction } from "../models/Transaction.js"; // ensure model has types
import type { Document } from "mongoose";

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
    this.algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
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
      let senderAccount: { addr: string; sk: Uint8Array };
      try {
        senderAccount = algosdk.mnemonicToSecretKey(mnemonicInput);
      } catch {
        throw badRequest(
          "Invalid mnemonic phrase: ensure all 25 words belong to the Algorand word list and are in the correct order.",
          "INVALID_MNEMONIC"
        );
      }

      // --- Get network parameters ---
      const suggestedParams: SuggestedParams = await this.algodClient.getTransactionParams().do();

      // --- Build transaction ---
      const txn: AlgoTransaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: toAddress,
        amount: Math.round(numericAmount * 1_000_000), // ALGO → microAlgos
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams,
      });

      // --- Sign and send ---
      const signedTxn = txn.signTxn(senderAccount.sk);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

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

      return { txId, transaction: dbTransaction };
    } catch (error: any) {
      console.error(" Error sending transaction:", error.message);
      const err: ServiceError = error;
      if (!err.statusCode) err.statusCode = 500;
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

      if (pendingInfo["confirmed-round"]) {
        const confirmedRound = pendingInfo["confirmed-round"];
        await Transaction.findOneAndUpdate(
          { txId },
          { status: "confirmed", confirmedRound }
        );
        return { status: "confirmed", confirmedRound, transaction: pendingInfo };
      }

      if (pendingInfo["pool-error"]) {
        await Transaction.findOneAndUpdate({ txId }, { status: "failed" });
        return { status: "failed", transaction: pendingInfo };
      }

      return { status: "pending", transaction: pendingInfo };
    } catch (error: any) {
      console.error(" Error checking transaction status:", error.message);
      await Transaction.findOneAndUpdate({ txId }, { status: "failed" });
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
      return info;
    } catch (error: any) {
      console.error(" Error getting account info:", error.message);
      throw new Error(error.message || "Failed to fetch account info");
    }
  }

  /**
   * Fetch all transactions from database
   */
  async getTransactions(): Promise<ITransaction[]> {
    try {
      return await Transaction.find().sort({ createdAt: -1 });
    } catch (error: any) {
      console.error(" Error fetching transactions:", error.message);
      throw new Error(error.message || "Failed to fetch transactions");
    }
  }
}
