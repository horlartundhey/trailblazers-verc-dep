// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    match: [/^(0[1-9]|1[0-2])-\d{4}$/, 'Month format should be MM-YYYY']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Card Payment', 'Mobile Money', 'Other'],
    default: 'Cash'
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  notes: {
    type: String
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate a unique receipt number
PaymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const prefix = 'TBN';
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.receiptNumber = `${prefix}-${date}-${randomDigits}`;
  }
  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;