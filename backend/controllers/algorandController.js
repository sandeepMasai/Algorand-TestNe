import { AlgorandService } from '../services/algorandService.js';

const algorandService = new AlgorandService();

export const sendTransaction = async (req, res) => {
  try {
    // Support both naming styles
    const {
      fromMnemonic,
      senderMnemonic,
      toAddress,
      to,
      amount,
      note
    } = req.body;

    // Pick correct values
    const mnemonic = fromMnemonic || senderMnemonic;
    const recipient = toAddress || to;

    // Validation
    if (!mnemonic || !recipient || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: mnemonic (fromMnemonic/senderMnemonic), toAddress (or to), and amount'
      });
    }

    const result = await algorandService.sendTransaction(
      mnemonic,
      recipient,
      parseFloat(amount),
      note
    );

    res.json({
      success: true,
      txId: result.txId,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Send transaction error:', error);
    const status = error.statusCode || error.status || 500;
    res.status(status).json({
      error: error.message || 'Failed to send transaction',
      code: error.code
    });
  }
};

export const getTransactionStatus = async (req, res) => {
  try {
    const { txId } = req.params;

    if (!txId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const status = await algorandService.checkTransactionStatus(txId);
    res.json({ txId, ...status });
  } catch (error) {
    console.error('Get transaction status error:', error);
    const status = error.statusCode || error.status || 500;
    res.status(status).json({
      error: error.message || 'Failed to get transaction status',
      code: error.code
    });
  }
};

export const confirmTransaction = async (req, res) => {
  try {
    const { txId } = req.params;
    if (!txId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Check on-chain status and update DB accordingly
    const status = await algorandService.checkTransactionStatus(txId);
    return res.json({ txId, ...status });
  } catch (error) {
    console.error('Confirm transaction error:', error);
    const status = error.statusCode || error.status || 500;
    res.status(status).json({
      error: error.message || 'Failed to confirm transaction',
      code: error.code
    });
  }
};
export const getTransactions = async (req, res) => {
  try {
    const transactions = await algorandService.getTransactions();
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    const status = error.statusCode || error.status || 500;
    res.status(status).json({
      error: error.message || 'Failed to get transactions',
      code: error.code
    });
  }
};
