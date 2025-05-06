const mongoose = require('mongoose');

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
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required']
  },
  image: {
    type: String,  // Store the image URL
    default: null
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
        type: String,
        required: true
      },
      phone: {
        type: String
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

// Methods to manage registration
EventSchema.methods.registerMember = function(memberId) {
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
    return existingRegistration.status; // Already registered
  }

   // Add to guestRegistrations count for capacity check
   const guestConfirmedCount = this.guestRegistrations.filter(
    guest => guest.status === 'Confirmed'
  ).length;
  
  const totalConfirmed = confirmedCount + guestConfirmedCount;

  // Check if at capacity
  let status = 'Confirmed';
  if (totalConfirmed >= this.capacity) {
    status = 'Waitlisted';
  }
  
  // New registration  
  this.registeredMembers.push({
    memberId,
    status,
    registrationDate: Date.now()
  });
  
  return status;
};

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;