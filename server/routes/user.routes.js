const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize, isLeaderForRegionCampus } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/user.middleware');


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
    check('phone', 'Phone number is optional').optional(),
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
  protect,
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('phone', 'Please include a valid phone number').optional().isMobilePhone(),
  ],
  userController.updateMyProfile
);

// @desc    Update current user profile picture
// @route   PATCH /api/users/me/profile-picture
// @access  Private (All roles)
router.patch(
  '/me/profile-picture',
  protect,
  upload.single('profilePicture'),
  userController.updateProfilePicture
);


// Profile routes
router.route('/profile')
  .get(protect, userController.getProfile)
  .put(protect, userController.updateProfile);

// Profile picture update route
router.put(
  '/profile-picture',
  protect,
  upload.single('profilePicture'),
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

// @desc    Create a new member (Admin only)
// @route   POST /api/users/members
// @access  Private (Admin only)
router.post(
  '/members',
  protect,
  authorize('Admin'),
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

// @desc    Get members assigned to the logged-in leader
// @route   GET /api/users/assigned-members
// @access  Private (Leader)
router.get(
  '/assigned-members',
  protect,
  authorize('Leader'),
  userController.getAssignedMembers
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

// @desc    Delete user by ID (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  userController.deleteUser
);

// @desc    Reassign user to different region/campus (Admin only)
// @route   PATCH /api/users/:id/reassign
// @access  Private (Admin only)
router.patch(
  '/:id/reassign',
  protect,
  authorize('Admin'),
  [
    check('region', 'Region is required').not().isEmpty(),
    check('campus', 'Campus is required').not().isEmpty(),
  ],
  userController.reassignUser
);

// @desc    Change user role (Admin only)
// @route   PATCH /api/users/:id/role
// @access  Private (Admin only)
router.patch(
  '/:id/role',
  protect,
  authorize('Admin'),
  [
    check('role', 'Role is required').isIn(['Admin', 'Leader', 'Member']),
  ],
  userController.changeUserRole
);

// In routes/user.routes.js or similar
router.get(
  '/verify/:memberCode',
  userController.verifyMemberByCode
);

// Leader position and training management routes
router.patch(
  '/me',
  [
    protect,
    authorize('Leader'),
    check('position').notEmpty().withMessage('Position is required')
  ],
  userController.updatePosition
);

router.post(
  '/me/trainings',
  [
    protect,
    authorize('Leader'),
    check('title').notEmpty().withMessage('Training title is required'),
    check('completionDate').notEmpty().withMessage('Completion date is required')
  ],
  userController.addTraining
);

router.delete(
  '/me/trainings/:trainingId',
  [
    protect,
    authorize('Leader')
  ],
  userController.deleteTraining
);

// @desc    Assign a leader to a member (Admin only)
// @route   PATCH /api/users/:id/assign-leader
// @access  Private (Admin only)
router.patch(
  '/:id/assign-leader',
  protect,
  authorize('Admin'),
  userController.assignLeader
);

module.exports = router;

