import mongoose, { Schema, Document, Model } from "mongoose";


 // Interface for a Transaction document.
 // Defines the TypeScript structure of the transaction data.
 
export interface ITransaction extends Document {
  txId: string;
  from: string;
  to: string;
  amount: number;
  status: "pending" | "confirmed" | "failed";
  note?: string;
  createdAt: Date;
  confirmedRound?: number;
}


 // Mongoose Schema for the Transaction collection.
 
const TransactionSchema: Schema<ITransaction> = new Schema<ITransaction>(
  {
    txId: { type: String, required: true, unique: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    note: { type: String },
    createdAt: { type: Date, default: Date.now },
    confirmedRound: { type: Number },
  },
  {
    versionKey: false, 
  }
);


 // Mongoose Model for transactions.
 
const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

export default Transaction;
