const path = require('path');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fetch regions and campuses
exports.getRegionsAndCampuses = async (req, res) => {
  try {
    const leaders = await User.find({ role: 'Leader' });
    const regions = [...new Set(leaders.map(leader => leader.region))];
    const campuses = [...new Set(leaders.map(leader => leader.campus))];
    res.status(200).json({ success: true, regions, campuses });
  } catch (error) {
    console.error('Fetch regions and campuses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regions and campuses' });
  }
};


// Fetch leaders by region and campus (public)
exports.getLeadersByRegionCampus = async (req, res) => {
  try {
    const { region, campus } = req.query;

    if (!region || !campus) {
      return res.status(400).json({
        success: false,
        message: 'Region and campus are required',
      });
    }

    const leaders = await User.find({
      role: 'Leader',
      region,
      campus,
    }).select('name email');

    res.status(200).json({
      success: true,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    console.error('Fetch leaders by region and campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaders',
      error: error.message,
    });
  }
};

// Public member registration
exports.registerMemberPublic = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, region, campus } = req.body;

    // Validate region and campus against existing values
    const leaders = await User.find({ role: 'Leader' });
    const validRegions = [...new Set(leaders.map(leader => leader.region))];
    const validCampuses = [...new Set(leaders.map(leader => leader.campus))];

    if (!validRegions.includes(region)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region selected.',
      });
    }

    if (!validCampuses.includes(campus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campus selected.',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const leader = await User.findOne({
      role: 'Leader',
      region,
      campus,
    });

    if (!leader) {
      return res.status(400).json({
        success: false,
        message: 'No leader found for the selected region and campus',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'Member',
      region,
      campus,
      leaderId: leader._id,
      registrationStatus: 'Completed',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Welcome to Trailblazer!',
          html: `
            <h1>Welcome, ${user.name}!</h1>
            <p>Thank you for registering as a member of Trailblazer. Your registration is complete!</p>
            <p>Please log in to access your dashboard and upcoming events.</p>
            <p>Best regards,<br/>The Trailblazer Team</p>
          `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    } else {
      console.warn('Email credentials not provided. Skipping welcome email.');
    }

    res.status(201).json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
        campus: user.campus,
        memberCode: user.memberCode,
        registrationStatus: user.registrationStatus,
      },
    });
  } catch (error) {
    console.error('Public member registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register member',
      error: error.message,
    });
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)


exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, role, region, campus } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // For Member role, find a Leader in the same region and campus
    let leaderId = null;
    if (role === 'Member' && region && campus) {
      const leader = await User.findOne({
        role: 'Leader',
        region,
        campus
      });

      if (leader) {
        leaderId = leader._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'No leader found for the selected region and campus'
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      region: role === 'Admin' ? undefined : region,
      campus: role === 'Admin' ? undefined : campus,
      leaderId: role === 'Member' ? leaderId : undefined,
      registrationStatus: role === 'Member' ? 'Pending' : 'Completed'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
        campus: user.campus,
        memberCode: user.memberCode,
        registrationStatus: user.registrationStatus
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};



// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// @desc    Get users by region and campus (Leader & Admin)
// @route   GET /api/users/region/:regionId/campus/:campusId
// @access  Private (Admin & Leader for their region/campus)
// @desc    Get users by region and campus (Leader & Admin)
// @route   GET /api/users/region/:regionId/campus/:campusId
// @access  Private (Admin & Leader for their region/campus)
exports.getUsersByRegionCampus = async (req, res) => {
  try {
    const { regionId, campusId } = req.params;
    
    // For Leaders, validate they're only accessing their own region/campus
    if (req.user.role === 'Leader' && 
        (req.user.region !== regionId || req.user.campus !== campusId)) {
      return res.status(403).json({
        success: false,
        message: 'Leaders can only access members in their assigned region and campus'
      });
    }
    
    // Find members in the region and campus
    const members = await User.find({
      role: 'Member',
      region: regionId,
      campus: campusId
    }).select('-password');
    
    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Get members by region campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get members',
      error: error.message
    });
  }
};

// @desc    Create a new member (Leader only for their region/campus)
// @route   POST /api/users/members
// @access  Private (Admin & Leader)
exports.createMember = async (req, res) => {
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

    // Set leader ID (if created by leader, use their ID, otherwise find a leader)
    let leaderId;
    if (req.user.role === 'Leader') {
      // If created by a leader, ensure the region and campus match the leader's
      if (req.user.region !== region || req.user.campus !== campus) {
        return res.status(403).json({
          success: false,
          message: 'Leaders can only create members for their own region and campus'
        });
      }
      leaderId = req.user._id;
    } else {
      // If created by admin, find a leader for the region and campus
      const leader = await User.findOne({
        role: 'Leader',
        region,
        campus
      });

      if (!leader) {
        return res.status(400).json({
          success: false,
          message: 'No leader found for the selected region and campus'
        });
      }
      leaderId = leader._id;
    }

    // Create member
    const member = await User.create({
      name,
      email,
      password,
      role: 'Member',
      region,
      campus,
      leaderId,
      registrationStatus: 'Completed'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        region: member.region,
        campus: member.campus,
        memberCode: member.memberCode,
        registrationStatus: member.registrationStatus
      }
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create member',
      error: error.message
    });
  }
};

// @desc    Filter users (Admin & Leader for their region/campus)
// @route   GET /api/users/filter
// @access  Private (Admin & Leader)
exports.filterUsers = async (req, res) => {
  try {
    const { role, region, campus, registrationStatus } = req.query;
    
    // Build query object
    const queryObj = {};
    
    // Admin can filter by all fields
    if (req.user.role === 'Admin') {
      if (role) queryObj.role = role;
      if (region) queryObj.region = region;
      if (campus) queryObj.campus = campus;
      if (registrationStatus) queryObj.registrationStatus = registrationStatus;
    } 
    // Leaders can only filter for their region and campus
    else if (req.user.role === 'Leader') {
      queryObj.region = req.user.region;
      queryObj.campus = req.user.campus;
      
      if (role) {
        if (role !== 'Member') {
          return res.status(403).json({
            success: false,
            message: 'Leaders can only filter members'
          });
        }
        queryObj.role = role;
      }
      
      if (registrationStatus) queryObj.registrationStatus = registrationStatus;
    }
    
    const users = await User.find(queryObj).select('-password');
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Filter users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter users',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin & Leader for their members)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if Leader has permission to view this user
    if (req.user.role === 'Leader' && 
        (user.role !== 'Member' || 
         user.leaderId.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};


// @desc    Get my financial status summary (for logged-in user)
// @route   GET /api/users/me/financial-status
// @access  Private
exports.getMyFinancialStatus = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    
    // Get user's payments
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ month: -1 });
    
    // Calculate total contributions
    const totalContributions = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get most recent payment
    const latestPayment = payments.length > 0 ? payments[0] : null;
    
    // Check if current month payment exists
    const currentDate = new Date();
    const currentMonth = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    const currentMonthPaid = payments.some(payment => payment.month === currentMonth);
    
    // Get payment history by year
    const paymentsByYear = {};
    payments.forEach(payment => {
      const year = payment.month.split('-')[1];
      if (!paymentsByYear[year]) {
        paymentsByYear[year] = 0;
      }
      paymentsByYear[year] += payment.amount;
    });
    
    res.json({
      success: true,
      data: {
        totalContributions,
        paymentStatus: currentMonthPaid ? 'Current' : 'Due',
        latestPayment: latestPayment ? {
          amount: latestPayment.amount,
          month: latestPayment.month,
          date: latestPayment.createdAt
        } : null,
        paymentsByYear,
        paymentCount: payments.length
      }
    });
  } catch (error) {
    console.error('Get financial status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial status',
      error: error.message
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    // Filter out fields that shouldn't be updated
    const { password, role, ...updateData } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Update user's profile picture
// @route   PATCH /api/users/me/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const cloudinary = require('../utils/cloudinary');
    let imageUrl;

    try {
      if (process.env.NODE_ENV === 'production') {
        // Upload buffer to Cloudinary in production
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'trailblazer/profile-pictures',
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        imageUrl = result.secure_url;
      } else {
        // In development, upload local file to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'trailblazer/profile-pictures',
          resource_type: 'auto'
        });
        imageUrl = result.secure_url;
        // Clean up local file
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }

      // Update user in database with Cloudinary URL
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { profilePicture: imageUrl },
        { new: true }
      ).select('-password');

      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      throw new Error('Failed to upload image to cloud storage');
    }
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture',
      error: error.message
    });
  }
};

// @desc    Verify member by memberCode
// @route   GET /api/members/verify/:memberCode
// @access  Public
exports.verifyMemberByCode = async (req, res) => {
  try {
    const user = await User.findOne({ memberCode: req.params.memberCode });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }
    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
    });
  } catch (error) {
    console.error('Verify member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify member',
      error: error.message,
    });
  }
};