import { Router } from "express";
import {
  sendTransaction,
  getTransactionStatus,
  confirmTransaction,
  getTransactions
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

export default router;
