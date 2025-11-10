import mongoose from 'mongoose';

const { Schema } = mongoose;

const TransactionSchema = new Schema({
  txId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
  },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
  confirmedRound: { type: Number },
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
