const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['Admin', 'Leader', 'Member'],
    default: 'Member'
  },
  region: {
    type: String,
    required: function() { return this.role === 'Leader' || this.role === 'Member'; }
  },
  campus: {
    type: String,
    required: function() { return this.role === 'Leader' || this.role === 'Member'; }
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.role === 'Member'; }
  },
  profilePicture: {
    type: String, // This will store the path/URL to the image
    default: ''
  },
  registrationStatus: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  memberCode: {
    type: String,
    unique: true,
    sparse: true  // Only enforces uniqueness if the field exists
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

// Hash password before saving to database
UserSchema.pre('save', async function(next) {
  console.log('Pre-save hook running for:', this.email);
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Generate memberCode for Members if not already set
    if (this.role === 'Member' && !this.memberCode) {
      const prefix = this.region.substring(0, 2).toUpperCase();
      const suffix = Math.floor(10000 + Math.random() * 90000).toString();
      this.memberCode = `${prefix}-${suffix}`;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
// UserSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// From your User model
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add this to the User model (models/User.js)
UserSchema.methods.getPaymentSummary = async function() {
  const Payment = mongoose.model('Payment');
  
  const payments = await Payment.find({ userId: this._id });
  
  // Calculate total contributions
  const totalContributions = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Generate monthly breakdown
  const monthlyBreakdown = {};
  payments.forEach(payment => {
    monthlyBreakdown[payment.month] = payment.amount;
  });
  
  return {
    totalContributions,
    paymentCount: payments.length,
    monthlyBreakdown,
    recentPayments: payments.sort((a, b) => b.paymentDate - a.paymentDate).slice(0, 5)
  };
};

const User = mongoose.model('User', UserSchema);

module.exports = User;