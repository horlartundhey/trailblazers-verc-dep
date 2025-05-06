const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create a new message
// @route   POST /api/messages
// @access  Private (Admin, Leader)
exports.createMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, content, targetRoles, targetRegions, targetCampuses, image } = req.body;

    // Find recipients based on criteria
    const recipientQuery = {};
    
    // Filter by roles if specified
    if (targetRoles && targetRoles.length > 0) {
      recipientQuery.role = { $in: targetRoles };
    }
    
    // Filter by regions if specified
    if (targetRegions && targetRegions.length > 0) {
      recipientQuery.region = { $in: targetRegions };
    }
    
    // Filter by campuses if specified
    if (targetCampuses && targetCampuses.length > 0) {
      recipientQuery.campus = { $in: targetCampuses };
    }
    
    // Additional restrictions for Leaders
    if (req.user.role === 'Leader') {
      // Leaders can only send to Members in their region and campus
      recipientQuery.role = 'Member';
      recipientQuery.region = req.user.region;
      recipientQuery.campus = req.user.campus;
    }
    
    const recipients = await User.find(recipientQuery).select('_id');
    
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found matching the criteria'
      });
    }
    
    // Create message
    const message = await Message.create({
      title,
      content,
      image,
      senderId: req.user._id,
      recipients: recipients.map(r => ({ userId: r._id })),
      targetRoles: targetRoles || [],
      targetRegions: targetRegions || [],
      targetCampuses: targetCampuses || []
    });
    
    res.status(201).json({
      success: true,
      data: message,
      recipientCount: recipients.length
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: error.message
    });
  }
};

// @desc    Get all messages for current user
// @route   GET /api/messages
// @access  Private (All roles)
exports.getMyMessages = async (req, res) => {
  try {
    // Find messages where the user is a recipient
    const messages = await Message.find({
      'recipients.userId': req.user._id
    })
    .populate('senderId', 'name email role')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

// @desc    Get all sent messages
// @route   GET /api/messages/sent
// @access  Private (Admin, Leader)
exports.getSentMessages = async (req, res) => {
  try {
    // Find messages sent by the user
    const messages = await Message.find({
      senderId: req.user._id
    })
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sent messages',
      error: error.message
    });
  }
};

// @desc    Get message by ID
// @route   GET /api/messages/:id
// @access  Private (Message recipient or sender)
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('senderId', 'name email role');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is either sender or recipient
    const isSender = message.senderId._id.toString() === req.user._id.toString();
    const isRecipient = message.recipients.some(r => r.userId.toString() === req.user._id.toString());
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this message'
      });
    }
    
    // If user is recipient, mark as read if not already
    if (isRecipient) {
      const recipientObj = message.recipients.find(r => r.userId.toString() === req.user._id.toString());
      if (!recipientObj.read) {
        recipientObj.read = true;
        recipientObj.readAt = Date.now();
        await message.save();
      }
    }
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Get message by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message',
      error: error.message
    });
  }
};

// @desc    Delete message for current user
// @route   DELETE /api/messages/:id
// @access  Private (Message recipient)
exports.deleteMessageForUser = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Find the recipient object for this user
    const recipientIndex = message.recipients.findIndex(
      r => r.userId.toString() === req.user._id.toString()
    );
    
    if (recipientIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }
    
    // Remove the recipient from the array
    message.recipients.splice(recipientIndex, 1);
    
    // If no recipients left, delete the message completely
    if (message.recipients.length === 0) {
      await message.remove();
      return res.json({
        success: true,
        message: 'Message deleted completely'
      });
    }
    
    // Otherwise save the updated recipients list
    await message.save();
    
    res.json({
      success: true,
      message: 'Message deleted for user'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};