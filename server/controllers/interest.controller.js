const Interest = require('../models/Interest');
const { validationResult } = require('express-validator');

// @desc    Submit interest form
// @route   POST /api/interest
// @access  Public
exports.submitInterest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, phone, age, location, church, reason } = req.body;

    // Check if phone already exists
    const existingInterest = await Interest.findOne({ phone });
    if (existingInterest) {
      return res.status(400).json({
        success: false,
        message: 'An interest form with this phone number has already been submitted'
      });
    }

    const interest = new Interest({
      name,
      email,
      phone,
      age,
      location,
      church,
      reason
    });

    await interest.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your interest! We will review your submission and get back to you soon.',
      data: {
        id: interest._id
      }
    });
  } catch (error) {
    console.error('Submit interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit interest form',
      error: error.message
    });
  }
};

// @desc    Get all interest submissions
// @route   GET /api/interest
// @access  Private (Admin, Leader)
exports.getAllInterests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const interests = await Interest.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: interests
    });
  } catch (error) {
    console.error('Get interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interest submissions',
      error: error.message
    });
  }
};

// @desc    Get single interest submission
// @route   GET /api/interest/:id
// @access  Private (Admin, Leader)
exports.getInterestById = async (req, res) => {
  try {
    const interest = await Interest.findById(req.params.id)
      .populate('reviewedBy', 'name email');

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest submission not found'
      });
    }

    res.json({
      success: true,
      data: interest
    });
  } catch (error) {
    console.error('Get interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interest submission',
      error: error.message
    });
  }
};

// @desc    Update interest submission status
// @route   PATCH /api/interest/:id
// @access  Private (Admin, Leader)
exports.updateInterestStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const interest = await Interest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest submission not found'
      });
    }

    if (status) {
      interest.status = status;
      interest.reviewedBy = req.user.id;
      interest.reviewedAt = new Date();
    }

    if (notes !== undefined) {
      interest.notes = notes;
    }

    await interest.save();

    res.json({
      success: true,
      message: 'Interest submission updated successfully',
      data: interest
    });
  } catch (error) {
    console.error('Update interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interest submission',
      error: error.message
    });
  }
};

// @desc    Delete interest submission
// @route   DELETE /api/interest/:id
// @access  Private (Admin)
exports.deleteInterest = async (req, res) => {
  try {
    const interest = await Interest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest submission not found'
      });
    }

    await interest.deleteOne();

    res.json({
      success: true,
      message: 'Interest submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interest submission',
      error: error.message
    });
  }
};
