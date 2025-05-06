const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Message title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  image: {
    type: String,  // Store the image URL
    default: null
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: {
    type: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      read: {
        type: Boolean,
        default: false
      },
      readAt: {
        type: Date,
        default: null
      }
    }],
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'At least one recipient is required'
    }
  },
  targetRoles: {
    type: [String],
    enum: ['Admin', 'Leader', 'Member'],
    default: []
  },
  targetRegions: {
    type: [String],
    default: [] // Empty means sent to all regions
  },
  targetCampuses: {
    type: [String],
    default: [] // Empty means sent to all campuses
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;