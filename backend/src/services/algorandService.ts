import algosdk from "algosdk";
import Transaction from "../models/Transaction";
import { TransactionResult, TransactionStatus } from "../types/algorand.types";

const ALGOD_SERVER = process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = process.env.ALGOD_PORT || "";
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || "";
const DEFAULT_MNEMONIC = process.env.ALGORAND_MNEMONIC || "";

const sanitizeMnemonic = (mnemonic?: string): string => {
  if (!mnemonic) return "";
  return mnemonic.trim().split(/\s+/).join(" ");
};

const badRequest = (message: string, code: string): Error & { statusCode: number; code: string } => {
  const err = new Error(message) as Error & { statusCode: number; code: string };
  err.statusCode = 400;
  err.code = code;
  return err;
};

export class AlgorandService {
  private algodClient: algosdk.Algodv2;

  constructor() {
    this.algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
  }

  
   // Send ALGO transaction
   
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

      const senderAccount = algosdk.mnemonicToSecretKey(mnemonicInput);
      const suggestedParams = await this.algodClient.getTransactionParams().do();

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  from: senderAddress, // ✅ correct
  to: receiverAddress,
  amount: amount,
  note: note ? new Uint8Array(Buffer.from(note)) : undefined,
  suggestedParams: params,
});


      const signedTxn = txn.signTxn(senderAccount.sk);
      const txResult = await this.algodClient.sendRawTransaction(signedTxn).do();
      const txId = txResult.txid; // 

      console.log(` Transaction sent: ${txId}`);

      // Save to MongoDB
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
      console.error("❌ Error sending transaction:", error.message);
      if (!error.statusCode) error.statusCode = 500;
      throw error;
    }
  }

  
   // Check transaction confirmation status
   
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
      console.error(" Error checking transaction status:", error.message);
      await Transaction.findOneAndUpdate({ txId }, { status: "failed" });
      throw new Error(error.message || "Failed to check transaction status");
    }
  }

  
   // Fetch account info from Algorand network
   
  async getAccountInfo(address: string) {
    try {
      if (!algosdk.isValidAddress(address)) throw new Error("Invalid address");
      const info = await this.algodClient.accountInformation(address).do();
      return info;
    } catch (error: any) {
      console.error(" Error getting account info:", error.message);
      throw new Error(error.message || "Failed to fetch account info");
    }
  }

  
   // Fetch all transactions from MongoDB
   
  async getTransactions() {
    try {
      return await Transaction.find().sort({ createdAt: -1 });
    } catch (error: any) {
      console.error(" Error fetching transactions:", error.message);
      throw new Error(error.message || "Failed to fetch transactions");
    }
  }
}
