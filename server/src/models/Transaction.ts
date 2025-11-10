import mongoose, { Schema } from "mongoose";

export interface ITransaction {
  txId: string;
  from: string;
  to: string;
  amount: number;
  status: "pending" | "confirmed" | "failed";
  note?: string;
  confirmedRound?: number;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  txId: { type: String, required: true, index: true, unique: true },
  from: { type: String, required: true, index: true },
  to: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending", required: true },
  note: { type: String },
  confirmedRound: { type: Number },
  createdAt: { type: Date, default: () => new Date(), immutable: true },
});

export const TransactionModel = mongoose.models.Transaction
  || mongoose.model<ITransaction>("Transaction", TransactionSchema);


