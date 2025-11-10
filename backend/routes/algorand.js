import { Router } from 'express';
import {
  sendTransaction,
  getTransactionStatus,
  getTransactions,
  confirmTransaction
} from '../controllers/algorandController.js';

const router = Router();

router.post('/send', sendTransaction);
router.get('/status/:txId', getTransactionStatus);
router.post('/confirm/:txId', confirmTransaction);
router.get('/transactions', getTransactions);

export default router;