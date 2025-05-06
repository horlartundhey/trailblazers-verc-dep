// routes/payment.routes.js
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Record a new payment (Admin only)
router.post(
  '/',
  protect,
  authorize('Admin'),
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('month', 'Month is required in MM-YYYY format').matches(/^(0[1-9]|1[0-2])-\d{4}$/),
    check('paymentMethod', 'Valid payment method is required').isIn(['Cash', 'Bank Transfer', 'Card Payment', 'Mobile Money', 'Other'])
  ],
  paymentController.recordPayment
);

// Get all payments (Admin only)
router.get(
  '/',
  protect,
  authorize('Admin'),
  paymentController.getAllPayments
);

// Get payment statistics (Admin only)
router.get(
  '/statistics',
  protect,
  authorize('Admin'),
  paymentController.getPaymentStatistics
);

// Get my payments (for logged-in user)
router.get(
  '/me',
  protect,
  paymentController.getMyPayments
);

// Get payments by user ID (Admin or the User themselves)
router.get(
  '/user/:userId',
  protect,
  paymentController.getUserPayments
);

// Update payment record (Admin only)
router.put(
  '/:id',
  protect,
  authorize('Admin'),
  [
    check('amount', 'Amount must be a positive number').optional().isFloat({ min: 0 }),
    check('paymentMethod', 'Valid payment method is required').optional().isIn(['Cash', 'Bank Transfer', 'Card Payment', 'Mobile Money', 'Other'])
  ],
  paymentController.updatePayment
);

// Delete payment record (Admin only)
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  paymentController.deletePayment
);

module.exports = router;