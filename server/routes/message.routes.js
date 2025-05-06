const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { handleMessageImageUpload } = require('../middleware/message.middleware');

// @desc    Create a new message
// @route   POST /api/messages
// @access  Private (Admin, Leader)
router.post(
  '/',
  protect,
  authorize('Admin', 'Leader'),
  handleMessageImageUpload,
  [
    check('title', 'Message title is required').not().isEmpty(),
    check('content', 'Message content is required').not().isEmpty(),
    check('targetRoles', 'Target roles must be an array').optional().isArray(),
    check('targetRegions', 'Target regions must be an array').optional().isArray(),
    check('targetCampuses', 'Target campuses must be an array').optional().isArray()
  ],
  messageController.createMessage
);

// @desc    Get all messages for current user
// @route   GET /api/messages
// @access  Private (All roles)
router.get(
  '/',
  protect,
  messageController.getMyMessages
);

// @desc    Get all sent messages
// @route   GET /api/messages/sent
// @access  Private (Admin, Leader)
router.get(
  '/sent',
  protect,
  authorize('Admin', 'Leader'),
  messageController.getSentMessages
);

// @desc    Get message by ID
// @route   GET /api/messages/:id
// @access  Private (Message recipient or sender)
router.get(
  '/:id',
  protect,
  messageController.getMessageById
);

// @desc    Delete message for current user
// @route   DELETE /api/messages/:id
// @access  Private (Message recipient)
router.delete(
  '/:id',
  protect,
  messageController.deleteMessageForUser
);

module.exports = router;