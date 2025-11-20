// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    enum: ['NGN', 'USD'],
    default: 'NGN',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'card'],
    required: [true, 'Payment method is required']
  },
  description: {
    type: String,
    trim: true
  },
  proofOfPayment: {
    type: String,
    default: null,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorder ID is required']
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