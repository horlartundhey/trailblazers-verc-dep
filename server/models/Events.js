const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  }
}, { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Event start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'Event end time is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required']
  },
  spotsBooked: {
    type: Number,
    default: 0
  },
  image: {
    type: String,  // Store the image URL
    default: null
  },
  registrationStartDate: {
    type: Date,
    required: [true, 'Registration start date is required']
  },
  registrationEndDate: {
    type: Date,
    required: [true, 'Registration end date is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendance: [AttendanceSchema],
  checkInOpen: {
    type: Boolean,
    default: false
  },
  regions: {
    type: [String],
    default: []  // Empty array means open to all regions
  },
  campuses: {
    type: [String],
    default: []  // Empty array means open to all campuses
  },
  registeredMembers: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Waitlisted', 'Cancelled'],
      default: 'Confirmed'
    }
  }],
  // New field for guest registrations
  guestRegistrations: [
    {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String
      },
      phone: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['Confirmed', 'Waitlisted', 'Cancelled'],
        default: 'Confirmed'
      },
      registrationDate: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Access control for registration
  registrationAccessControl: {
    type: String,
    enum: ['Public', 'Members', 'Leaders'],
    default: 'Public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for checking if event is at capacity
EventSchema.virtual('isAtCapacity').get(function() {
  return this.registeredMembers.filter(m => m.status === 'Confirmed').length >= this.capacity;
});

// Virtual to check if registration is open
EventSchema.virtual('registrationStatus').get(function() {
  const now = new Date();
  if (now < this.registrationStartDate) {
    return 'NOT_STARTED';
  } else if (now > this.registrationEndDate) {
    return 'CLOSED';
  } else {
    return 'OPEN';
  }
});

// Virtual to check if event is full
EventSchema.virtual('isFull').get(function() {
  return this.attendance.length >= this.capacity;
});

// Methods to manage registration
EventSchema.methods.registerMember = function(memberId) {
  // First, check if registration is open
  const now = new Date();
  if (now < this.registrationStartDate) {
    throw new Error('Registration has not started yet');
  }
  if (now > this.registrationEndDate) {
    throw new Error('Registration is closed');
  }

  // Check if already registered
  const existingRegistration = this.registeredMembers.find(
    m => m.memberId.toString() === memberId.toString()
  );
  
  if (existingRegistration) {
    if (existingRegistration.status === 'Cancelled') {
      existingRegistration.status = this.isAtCapacity ? 'Waitlisted' : 'Confirmed';
      existingRegistration.registrationDate = Date.now();
      return existingRegistration.status;
    }
    throw new Error('You are already registered for this event');
  }

  // Check confirmed registrations
  const confirmedMembers = this.registeredMembers.filter(
    m => m.status === 'Confirmed'
  ).length;
  
  const guestConfirmed = this.guestRegistrations.filter(
    guest => guest.status === 'Confirmed'
  ).length;
  
  const totalConfirmed = confirmedMembers + guestConfirmed;

  // Check if at capacity
  let status = 'Confirmed';
  if (totalConfirmed >= this.capacity) {
    status = 'Waitlisted';
  }
  
  // Add new registration  
  this.registeredMembers.push({
    memberId,
    status,
    registrationDate: Date.now()
  });
  
  return status;
};

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;