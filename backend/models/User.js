import mongoose from 'mongoose';

/**
 * @module models/User
 * @description Mongoose schema defining the application User. Integrates with Clerk authentication 
 * via clerkId, supports role-based access control, tracks shipping addresses, and manages user preferences.
 */
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    default: 'India',
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true // Allow null values for non-Clerk users
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.clerkId; // Password required only for non-Clerk users
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  addresses: [addressSchema],
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    smsUpdates: {
      type: Boolean,
      default: false
    },
    emailUpdates: {
      type: Boolean,
      default: true
    },
    favoriteCategories: [{
      type: String,
      enum: ['Posters', 'Tees', 'Tote Bags', 'Accessories']
    }]
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  orderCount: {
    type: Number,
    default: 0,
    min: [0, 'Order count cannot be negative']
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  recentlyViewed: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date,
  metadata: {
    source: String, // How they found us
    referralCode: String,
    notes: String
  }
}, {
  timestamps: true
});

// NOTE: Bug 21 fix — removed broken addressSchema.pre('save') hook.
// this.parent() is unreliable on embedded subdocuments in Mongoose 8.x.
// Single-default enforcement is handled in each route handler.

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for better performance
userSchema.index({ 'addresses.isDefault': 1 });

export default mongoose.model('User', userSchema);