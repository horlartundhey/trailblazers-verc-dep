const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message
    });
  }
};

// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is a Leader for a specific region and campus
// Check if user is a Leader for a specific region and campus
exports.isLeaderForRegionCampus = (req, res, next) => {
  // Get region and campus from params or query
  const regionId = req.params.regionId || req.query.region;
  const campusId = req.params.campusId || req.query.campus;

  if (req.user.role === 'Admin') {
    // Admin can access any region/campus - no restrictions
    return next();
  }

  if (req.user.role === 'Leader') {
    // For Leaders, verify they're only accessing their assigned region and campus
    if (req.user.region !== regionId || req.user.campus !== campusId) {
      return res.status(403).json({
        success: false,
        message: 'Leaders can only access data for their assigned region and campus'
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Not authorized to access data for this region and campus'
  });
};