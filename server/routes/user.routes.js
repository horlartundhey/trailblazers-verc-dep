const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize, isLeaderForRegionCampus } = require('../middleware/auth.middleware');
const upload = require('../utils/upload');


router.get('/regions-and-campuses', userController.getRegionsAndCampuses);


// Public route to fetch leaders by region and campus
router.get('/leaders', userController.getLeadersByRegionCampus);

// Public route for member registration
router.post(
  '/register',
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    check('email')
      .isEmail()
      .withMessage('Please include a valid email')
      .normalizeEmail(),
    check('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*)'),
    check('region')
      .not()
      .isEmpty()
      .withMessage('Region is required'),
    check('campus')
      .not()
      .isEmpty()
      .withMessage('Campus is required'),
  ],
  userController.registerMemberPublic
);



// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
router.post(
  '/',
  protect,
  authorize('Admin'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['Admin', 'Leader', 'Member']),
    check('region', 'Region is required for Leaders and Members').if(
      check('role').isIn(['Leader', 'Member'])
    ).not().isEmpty(),
    check('campus', 'Campus is required for Leaders and Members').if(
      check('role').isIn(['Leader', 'Member'])
    ).not().isEmpty(),
  ],
  userController.createUser
);

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
router.get(
  '/',
  protect,
  authorize('Admin'),
  userController.getUsers
);


// @desc    Update current user profile
// @route   PATCH /api/users/me
// @access  Private (All roles)
router.patch(
  '/me',
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('phone', 'Please include a valid phone number').optional().isMobilePhone(),
  ],
  userController.updateMyProfile
);


// @desc    Update current user's profile picture
// @route   PATCH /api/users/me/profile-picture
// @access  Private (All roles)
router.patch(
  '/me/profile-picture',
  protect,
  (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File too large',
            error: `File size should be less than ${upload.limits.fileSize / (1024 * 1024)}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      next();
    });
  },
  userController.updateProfilePicture
);

// @desc    Get users by region and campus (Leader & Admin)
// @route   GET /api/users/region/:regionId/campus/:campusId
// @access  Private (Admin & Leader for their region/campus)
router.get(
  '/region/:regionId/campus/:campusId',
  protect,
  authorize('Admin', 'Leader'),
  isLeaderForRegionCampus,  // This middleware now correctly handles both roles
  userController.getUsersByRegionCampus
);

// @desc    Create a new member (Leader only for their region/campus)
// @route   POST /api/users/members
// @access  Private (Admin & Leader)
router.post(
  '/members',
  protect,
  authorize('Admin', 'Leader'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('region', 'Region is required').not().isEmpty(),
    check('campus', 'Campus is required').not().isEmpty(),
  ],
  userController.createMember
);




// @desc    Filter users (Admin & Leader for their region/campus)
// @route   GET /api/users/filter
// @access  Private (Admin & Leader)
router.get(
  '/filter',
  protect,
  authorize('Admin', 'Leader'),
  userController.filterUsers
);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin & Leader for their members)
router.get(
  '/:id',
  protect,
  authorize('Admin', 'Leader'),
  userController.getUserById
);

// In routes/user.routes.js or similar
router.get(
  '/verify/:memberCode',
  userController.verifyMemberByCode
);

module.exports = router;

