const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  src: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['worship', 'baptism', 'community', 'youth', 'missions'],
  },
  caption: {
    type: String,
    required: true,
  },
  collection: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Gallery', gallerySchema);