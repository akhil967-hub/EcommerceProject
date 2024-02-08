const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
     
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;