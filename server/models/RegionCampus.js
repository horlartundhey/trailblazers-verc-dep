const mongoose = require('mongoose');

const RegionCampusSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Region', 'Campus'],
    required: [true, 'Type is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentRegion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegionCampus',
    required: function() {
      return this.type === 'Campus';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique names per type
RegionCampusSchema.index({ name: 1, type: 1 }, { unique: true });

// Virtual to get users count
RegionCampusSchema.virtual('usersCount', {
  ref: 'User',
  localField: 'name',
  foreignField: function() {
    return this.type === 'Region' ? 'region' : 'campus';
  },
  count: true
});

module.exports = mongoose.model('RegionCampus', RegionCampusSchema);
