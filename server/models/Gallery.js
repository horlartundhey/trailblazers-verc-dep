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
  // New fields for program-based gallery
  programTitle: {
    type: String,
    required: true,
  },
  programDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  testimony: {
    type: String,
    default: '',
  },
  attendees: {
    type: Number,
    default: 0,
  },
  healings: {
    type: Number,
    default: 0,
  },
  messageShared: {
    type: String,
    default: '',
  },
  isPublic: {
    type: Boolean,
    default: true,
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

// Index for faster queries
gallerySchema.index({ programTitle: 1, programDate: -1 });
gallerySchema.index({ isPublic: 1 });
gallerySchema.index({ collection: 1 });

module.exports = mongoose.model('Gallery', gallerySchema);