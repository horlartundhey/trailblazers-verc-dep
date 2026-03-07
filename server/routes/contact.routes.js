const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const contactController = require('../controllers/contact.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public route
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email format required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  contactController.submitContact
);

// Protected routes (Admin)
router.use(protect);
router.use(authorize('Admin'));

router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.patch('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
