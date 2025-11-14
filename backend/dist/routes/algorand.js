"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const algorandController_1 = require("../controllers/algorandController");
const router = (0, express_1.Router)();
//   POST /api/algorand/send
//    Send ALGO transaction
router.post("/send", algorandController_1.sendTransaction);
//   GET /api/algorand/status/:txId
//   Get transaction status by txId
router.get("/status/:txId", algorandController_1.getTransactionStatus);
//  POST /api/algorand/confirm/:txId
//  Confirm transaction status and update DB
router.post("/confirm/:txId", algorandController_1.confirmTransaction);
// GET /api/algorand/transactions
// Get all transactions
router.get("/transactions", algorandController_1.getTransactions);
// POST /api/algorand/check-pending
// Check and update all pending transactions
router.post("/check-pending", algorandController_1.checkPendingTransactions);
// GET /api/algorand/account/:address
// Get account information
router.get("/account/:address", algorandController_1.getAccountInfo);
// POST /api/algorand/send-signed
// Send signed transaction (signed by wallet)
router.post("/send-signed", algorandController_1.sendSignedTransaction);
exports.default = router;
