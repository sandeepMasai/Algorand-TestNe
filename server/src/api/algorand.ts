import express from "express";
import algosdk from "algosdk";
import { z } from "zod/v4";
import { env } from "../env.js";
import { TransactionModel } from "../models/Transaction.js";

const router = express.Router();

function getAlgodClient(): algosdk.Algodv2 {
  const token = env.ALGOD_TOKEN || "";
  const server = env.ALGOD_SERVER;
  const port = env.ALGOD_PORT || "";
  return new algosdk.Algodv2(token, server, port);
}

const sendSchema = z.object({
  to: z.string().min(1, "Recipient address is required"),
  amount: z.number().positive("Amount must be positive"),
  mnemonic: z.string().min(1, "Sender mnemonic is required"),
  note: z.string().optional(),
});

router.post("/send", async (req, res, next) => {
  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    }
    const { to, amount, mnemonic, note } = parsed.data;

    const algod = getAlgodClient();
    const params = await algod.getTransactionParams().do();

    const senderAccount = algosdk.mnemonicToSecretKey(mnemonic);
    const senderAddr = senderAccount.addr;

    const amountMicro = Math.round(amount * 1e6);
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: senderAddr,
      to,
      amount: amountMicro,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined,
      suggestedParams: params,
    });

    const signed = txn.signTxn(senderAccount.sk);
    const { txId } = await algod.sendRawTransaction(signed).do();

    await TransactionModel.create({
      txId,
      from: senderAddr,
      to,
      amount,
      status: "pending",
      note,
    });

    res.json({ txId, from: senderAddr, to, amount, status: "pending" });
  }
  catch (error) {
    next(error);
  }
});

router.get("/status/:txId", async (req, res, next) => {
  try {
    const { txId } = req.params;
    const algod = getAlgodClient();

    const pendingInfo = await algod.pendingTransactionInformation(txId).do();

    let status: "pending" | "confirmed" | "failed" = "pending";
    let confirmedRound: number | undefined;

    if (pendingInfo["confirmed-round"] && pendingInfo["confirmed-round"] > 0) {
      status = "confirmed";
      confirmedRound = pendingInfo["confirmed-round"];
    }
    else if (pendingInfo["pool-error"] && pendingInfo["pool-error"].length > 0) {
      status = "failed";
    }

    const txDoc = await TransactionModel.findOneAndUpdate(
      { txId },
      { status, confirmedRound },
      { new: true },
    );

    res.json({
      txId,
      status,
      confirmedRound: confirmedRound ?? null,
      record: txDoc,
    });
  }
  catch (error) {
    next(error);
  }
});

router.get("/transactions", async (_req, res, next) => {
  try {
    const txs = await TransactionModel.find().sort({ createdAt: -1 }).lean();
    res.json(txs);
  }
  catch (error) {
    next(error);
  }
});

export default router;


