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
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('age').optional({ checkFalsy: true }).isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
    body('church').optional({ checkFalsy: true }).trim(),
    body('reason').optional({ checkFalsy: true }).trim()
  ],
  interestController.submitInterest
);

// Protected routes (Admin, Leader)
router.use(protect);

router.get('/', authorize('Admin', 'Leader'), interestController.getAllInterests);
router.get('/:id', authorize('Admin', 'Leader'), interestController.getInterestById);
router.patch('/:id', authorize('Admin', 'Leader'), interestController.updateInterestStatus);
router.put('/mark-viewed', authorize('Admin', 'Leader'), interestController.markInterestsAsViewed);
router.delete('/:id', authorize('Admin'), interestController.deleteInterest);

module.exports = router;
