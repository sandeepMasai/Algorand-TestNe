
 // Represents the input data for sending a transaction.
 
export interface TransactionRequest {
  fromMnemonic?: string;
  senderMnemonic?: string;
  toAddress?: string;
  to?: string;
  amount?: string | number;
  note?: string;
}


 // Represents the result returned after sending a transaction.
 
export interface TransactionResult {
  txId: string;
  transaction: any; 
}


 // Represents the transaction status response.
 
export interface TransactionStatus {
  status: "pending" | "confirmed" | "failed";
  confirmedRound?: number;
  poolError?: string;
  transaction?: any; 
}
