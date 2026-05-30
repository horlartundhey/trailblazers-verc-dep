const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/emailService');

// @desc    Register a new user (for Members)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, region, campus } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Find a Leader in the same region and campus to assign
    const leader = await User.findOne({
      role: 'Leader',
      region,
      campus
    });

    if (!leader && region && campus) {
      return res.status(400).json({
        success: false,
        message: 'No leader found for the selected region and campus'
      });
    }

    // Create the user
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'Member',
      region,
      campus,
      leaderId: leader ? leader._id : null,
      registrationStatus: 'Pending'
    });

    // Return user data and token
    const token = generateToken(newUser._id, newUser.role);
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          region: newUser.region,
          campus: newUser.campus,
          memberCode: newUser.memberCode,
          registrationStatus: newUser.registrationStatus,
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user by email and select password
    const user = await User.findOne({ email }).select('+password');
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch ? "Yes" : "No");
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    user.password = undefined;

    // Return user data and token in the expected format
    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          region: user.region,
          campus: user.campus,
          memberCode: user.memberCode,
          registrationStatus: user.registrationStatus,
          profilePicture: user.profilePicture,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// @desc    Complete member registration
// @route   PUT /api/auth/complete-registration
// @access  Private (Member only)
exports.completeRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'Member') {
      return res.status(403).json({
        success: false,
        message: 'Only members can complete registration'
      });
    }
    
    if (user.registrationStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Registration already completed'
      });
    }
    
    // Update registration status
    user.registrationStatus = 'Completed';
    await user.save();

    // Generate a new token with updated status
    const token = generateToken(user._id, user.role);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          region: user.region,
          campus: user.campus,
          memberCode: user.memberCode,
          registrationStatus: user.registrationStatus
        }
      },
      message: 'Registration completed successfully'
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: error.message
    });
  }
};

// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to avoid exposing which emails are registered
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.'
      });
    }

    // Generate a cryptographically secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Always log reset link locally so you can test without email
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('\n=== Password Reset Link (also sent via email) ===');
    console.log(`User: ${user.email}`);
    console.log(`Link: ${resetUrl}`);
    console.log('=================================================\n');

    const emailResult = await sendPasswordResetEmail(user.email, resetToken);
    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
    } else {
      console.log('Email sent successfully, id:', emailResult.messageId);
    }

    res.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};