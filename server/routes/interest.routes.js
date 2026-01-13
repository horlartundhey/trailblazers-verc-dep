const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const interestController = require('../controllers/interest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public route
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('location').optional().trim(),
    body('church').optional().trim(),
    body('reason').optional().trim()
  ],
  interestController.submitInterest
);

// Protected routes (Admin, Leader)
router.use(protect);

router.get('/', authorize('Admin', 'Leader'), interestController.getAllInterests);
router.get('/:id', authorize('Admin', 'Leader'), interestController.getInterestById);
router.patch('/:id', authorize('Admin', 'Leader'), interestController.updateInterestStatus);
router.delete('/:id', authorize('Admin'), interestController.deleteInterest);

module.exports = router;
