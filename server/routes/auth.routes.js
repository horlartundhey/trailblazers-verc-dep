const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Register route
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('region', 'Region is required').not().isEmpty(),
    check('campus', 'Campus is required').not().isEmpty()
  ],
  authController.register
);

// Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  ],
  authController.login
);

// Get user profile
router.get('/me', protect, authController.getMe);

// Complete registration
router.put('/complete-registration', protect, authController.completeRegistration);

module.exports = router;