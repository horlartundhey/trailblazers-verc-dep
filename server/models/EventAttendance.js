const mongoose = require('mongoose');

const eventAttendanceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  invitedBy: {
    type: String,
    trim: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Registered', 'Checked In', 'Cancelled'],
    default: 'Registered'
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventAttendanceSchema.index({ event: 1, createdAt: -1 });
eventAttendanceSchema.index({ phone: 1, event: 1 });

module.exports = mongoose.model('EventAttendance', eventAttendanceSchema);
