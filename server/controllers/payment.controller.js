// controllers/payment.controller.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Record a new payment
// @route   POST /api/payments
// @access  Private (Admin only)
exports.recordPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      message: errors.array()[0].msg || 'Validation error'
    });
  }

  try {
    console.log('Received payment data:', req.body);
    const { userId, amount, currency, date, description, paymentMethod } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: 'Currency is required'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Payment date is required'
      });
    }

    if (!paymentMethod || paymentMethod.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const paymentData = {
      userId,
      amount: parseFloat(amount),
      currency,
      date: new Date(date),
      paymentMethod: paymentMethod.toLowerCase().trim(),
      description: description?.trim() || '',
      recordedBy: req.user.id
    };

    // Add proof of payment if file was uploaded
    if (req.file) {
      // If using Cloudinary, upload the file and use the secure_url
      // For now, store the file path
      paymentData.proofOfPayment = `/uploads/payment-proofs/${req.file.filename}`;
    }

    console.log('Creating payment with data:', paymentData);

    // Create new payment record
    const payment = await Payment.create(paymentData);

    console.log('Payment created successfully:', payment);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Record payment error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to record payment';
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      errorMessage = validationErrors.join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid user ID format';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      }
    });
  }
};

// @desc    Get all payments (Admin only)
// @route   GET /api/payments
// @access  Private (Admin only)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email memberCode')
      .populate('recordedBy', 'name');

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
};

// @desc    Get payments by user ID
// @route   GET /api/payments/user/:userId
// @access  Private (Admin or Owner)
exports.getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow admins or the user themselves to view their payments
    if (req.user.role !== 'Admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these payments'
      });
    }

    const payments = await Payment.find({ userId })
      .sort({ date: -1 })
      .populate('recordedBy', 'name');

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

// @desc    Get my payments (for logged-in user)
// @route   GET /api/payments/me
// @access  Private
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('recordedBy', 'name')
      .sort({ month: -1 });

    // Calculate total contributions
    const totalContributions = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Generate monthly breakdown
    const monthlyBreakdown = {};
    payments.forEach(payment => {
      monthlyBreakdown[payment.month] = payment.amount;
    });

    res.json({
      success: true,
      count: payments.length,
      totalContributions,
      monthlyBreakdown,
      data: payments
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
};

// @desc    Update payment record (Admin only)
// @route   PUT /api/payments/:id
// @access  Private (Admin only)
exports.updatePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { amount, paymentMethod, notes } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    // Update fields
    payment.amount = amount || payment.amount;
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    payment.notes = notes !== undefined ? notes : payment.notes;
    
    // Save updated payment
    await payment.save();
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

// @desc    Delete payment record (Admin only)
// @route   DELETE /api/payments/:id
// @access  Private (Admin only)
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    await payment.remove();
    
    res.json({
      success: true,
      message: 'Payment record deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

// @desc    Get payment statistics (Admin only)
// @route   GET /api/payments/statistics
// @access  Private (Admin only)
exports.getPaymentStatistics = async (req, res) => {
  try {
    // Total payments amount
    const totalPaymentsResult = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly totals for the current year
    const currentYear = new Date().getFullYear();
    const monthlyTotals = await Payment.aggregate([
      {
        $match: {
          month: { $regex: `-${currentYear}$` }
        }
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Payments by region/campus
    const paymentsByRegion = await Payment.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: { region: "$user.region", campus: "$user.campus" },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.region": 1, "_id.campus": 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalPayments: totalPaymentsResult[0] ? totalPaymentsResult[0].total : 0,
        totalCount: totalPaymentsResult[0] ? totalPaymentsResult[0].count : 0,
        monthlyTotals,
        paymentsByRegion
      }
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment statistics',
      error: error.message
    });
  }
};