import algosdk, { SuggestedParams } from "algosdk";
import Transaction from "../models/Transaction";
import { TransactionResult, TransactionStatus } from "../types/algorand.types";

const ALGOD_SERVER = process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = process.env.ALGOD_PORT || "";
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || "";
const DEFAULT_MNEMONIC = process.env.ALGORAND_MNEMONIC || "";

/**
 * Sanitize mnemonic input (remove extra spaces)
 */
const sanitizeMnemonic = (mnemonic?: string): string => {
  if (!mnemonic) return "";
  return mnemonic.trim().split(/\s+/).join(" ");
};

/**
 * Create a formatted Bad Request error
 */
const badRequest = (message: string, code: string): Error & { statusCode: number; code: string } => {
  const err = new Error(message) as Error & { statusCode: number; code: string };
  err.statusCode = 400;
  err.code = code;
  return err;
};

/**
 * Wait for a transaction confirmation
 */
async function waitForConfirmation(
  algodClient: algosdk.Algodv2,
  txId: string,
  timeout = 10
): Promise<algosdk.modelsv2.PendingTransactionResponse> {
  console.log(`⏳ Waiting for confirmation: ${txId}`);

  const startRound = (await algodClient.status().do())["last-round"] + 1;
  let currentRound = startRound;

  while (currentRound < startRound + timeout) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();

    if (pendingInfo["confirmed-round"] && pendingInfo["confirmed-round"] > 0) {
      console.log(`✅ Transaction confirmed in round ${pendingInfo["confirmed-round"]}`);
      return pendingInfo;
    } else if (pendingInfo["pool-error"]) {
      throw new Error(`Transaction Pool Error: ${pendingInfo["pool-error"]}`);
    }

    await algodClient.statusAfterBlock(currentRound).do();
    currentRound++;
  }

  throw new Error(`Transaction not confirmed after ${timeout} rounds`);
}

/**
 * Algorand Service Class
 */
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
    amount: number,
    note?: string
  ): Promise<TransactionResult> {
    try {
      const mnemonicInput = sanitizeMnemonic(fromMnemonic || DEFAULT_MNEMONIC);

      if (!mnemonicInput) {
        throw badRequest(
          "Mnemonic is required. Provide fromMnemonic in the request body or set ALGORAND_MNEMONIC.",
          "MISSING_MNEMONIC"
        );
      }

      if (!algosdk.isValidAddress(toAddress)) {
        throw badRequest("Invalid recipient address", "INVALID_RECIPIENT");
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw badRequest("Amount must be a positive number", "INVALID_AMOUNT");
      }

      // 🔹 Recover sender account
      const senderAccount = algosdk.mnemonicToSecretKey(mnemonicInput);
      const suggestedParams: SuggestedParams = await this.algodClient.getTransactionParams().do();

      // ✅ Correct field names for Algorand SDK v3.5.2
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: toAddress,
        amount: Math.round(numericAmount * 1_000_000), // ALGO → microAlgos
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams,
      });

      // 🔹 Sign and send transaction
      const signedTxn = txn.signTxn(senderAccount.sk);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      console.log(`🚀 Transaction sent: ${txId}`);

      // 🔹 Wait for confirmation
      const confirmedTxn = await waitForConfirmation(this.algodClient, txId, 10);

      // 🔹 Save transaction record to MongoDB
      const dbTransaction = new Transaction({
        txId,
        from: senderAccount.addr,
        to: toAddress,
        amount: numericAmount,
        status: "confirmed",
        note,
        confirmedRound: confirmedTxn["confirmed-round"],
        createdAt: new Date(),
      });

      await dbTransaction.save();

      return { txId, transaction: dbTransaction };
    } catch (error: any) {
      console.error("❌ Error sending transaction:", error.message);
      if (!error.statusCode) error.statusCode = 500;
      throw error;
    }
  }

  /**
   * Check transaction confirmation status
   */
  async checkTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      if (!txId) throw new Error("Transaction ID is required");

      const pendingInfo: any = await this.algodClient.pendingTransactionInformation(txId).do();

      if (pendingInfo.confirmedRound) {
        const confirmedRound = pendingInfo.confirmedRound;
        await Transaction.findOneAndUpdate({ txId }, { status: "confirmed", confirmedRound });
        return { status: "confirmed", confirmedRound, transaction: pendingInfo };
      }

      if (pendingInfo.poolError) {
        await Transaction.findOneAndUpdate({ txId }, { status: "failed" });
        return { status: "failed", transaction: pendingInfo };
      }

      return { status: "pending", transaction: pendingInfo };
    } catch (error: any) {
      console.error("⚠️ Error checking transaction status:", error.message);
      await Transaction.findOneAndUpdate({ txId }, { status: "failed" });
      throw new Error(error.message || "Failed to check transaction status");
    }
  }

  /**
   * Fetch account info from Algorand network
   */
  async getAccountInfo(address: string) {
    try {
      if (!algosdk.isValidAddress(address)) throw new Error("Invalid address");
      const info = await this.algodClient.accountInformation(address).do();
      return info;
    } catch (error: any) {
      console.error("⚠️ Error getting account info:", error.message);
      throw new Error(error.message || "Failed to fetch account info");
    }
  }

  /**
   * Fetch all transactions from MongoDB
   */
  async getTransactions() {
    try {
      return await Transaction.find().sort({ createdAt: -1 });
    } catch (error: any) {
      console.error("⚠️ Error fetching transactions:", error.message);
      throw new Error(error.message || "Failed to fetch transactions");
    }
  }
}
