import { Router } from "express";
import {
  sendTransaction,
  getTransactionStatus,
  confirmTransaction,
  getTransactions,
  checkPendingTransactions,
  getAccountInfo,
  sendSignedTransaction
} from "../controllers/algorandController";

const router: Router = Router();


 //   POST /api/algorand/send
 //    Send ALGO transaction
 
router.post("/send", sendTransaction);


 //   GET /api/algorand/status/:txId
 //   Get transaction status by txId
 
router.get("/status/:txId", getTransactionStatus);


 //  POST /api/algorand/confirm/:txId
 //  Confirm transaction status and update DB
 
router.post("/confirm/:txId", confirmTransaction);


   // GET /api/algorand/transactions
   // Get all transactions
 
router.get("/transactions", getTransactions);

   // POST /api/algorand/check-pending
   // Check and update all pending transactions
 
router.post("/check-pending", checkPendingTransactions);

   // GET /api/algorand/account/:address
   // Get account information
 
router.get("/account/:address", getAccountInfo);

   // POST /api/algorand/send-signed
   // Send signed transaction (signed by wallet)
 
router.post("/send-signed", sendSignedTransaction);

export default router;
