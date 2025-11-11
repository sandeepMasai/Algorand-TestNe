import { Request, Response } from "express";
import { AlgorandService } from '../services/algorandService';
import { TransactionRequest, TransactionResult, TransactionStatus } from "../types/algorand.types";

const algorandService = new AlgorandService();

//  Send Transaction
export const sendTransaction = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      fromMnemonic,
      senderMnemonic,
      toAddress,
      to,
      amount,
      note
    }: TransactionRequest = req.body;

    const mnemonic = fromMnemonic || senderMnemonic;
    const recipient = toAddress || to;

    if (!mnemonic || !recipient || !amount) {
      return res.status(400).json({
        error: "Missing required fields: mnemonic (fromMnemonic/senderMnemonic), toAddress (or to), and amount"
      });
    }

    const result: TransactionResult = await algorandService.sendTransaction(
      mnemonic,
      recipient,
      parseFloat(amount as string),
      note
    );

    return res.json({
      success: true,
      txId: result.txId,
      transaction: result.transaction
    });
  } catch (error: any) {
    console.error("Send transaction error:", error);
    const status = error.statusCode || error.status || 500;
    return res.status(status).json({
      error: error.message || "Failed to send transaction",
      code: error.code
    });
  }
};

//  Get Transaction Status
export const getTransactionStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { txId } = req.params;

    if (!txId) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const status: TransactionStatus = await algorandService.checkTransactionStatus(txId);
    return res.json({ txId, ...status });
  } catch (error: any) {
    console.error("Get transaction status error:", error);
    const status = error.statusCode || error.status || 500;
    return res.status(status).json({
      error: error.message || "Failed to get transaction status",
      code: error.code
    });
  }
};

//  Confirm Transaction
export const confirmTransaction = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { txId } = req.params;
    if (!txId) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const status: TransactionStatus = await algorandService.checkTransactionStatus(txId);
    return res.json({ txId, ...status });
  } catch (error: any) {
    console.error("Confirm transaction error:", error);
    const status = error.statusCode || error.status || 500;
    return res.status(status).json({
      error: error.message || "Failed to confirm transaction",
      code: error.code
    });
  }
};

//  Get All Transactions
export const getTransactions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const transactions = await algorandService.getTransactions();
    return res.json({ transactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    const status = error.statusCode || error.status || 500;
    return res.status(status).json({
      error: error.message || "Failed to get transactions",
      code: error.code
    });
  }
};
