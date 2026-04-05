import mongoose from 'mongoose';

/**
 * @module models/Order
 * @description Mongoose schema for Orders. Supports both authenticated and guest
 * WhatsApp orders. All fields from WhatsApp flow are optional/defaulted to avoid
 * validation failures blocking the customer order path.
 */

// ─── Order Item ───────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  // Optional ref — WhatsApp orders may not have a DB product ID
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
    default: null
  },
  name: {
    type: String,
    required: true
  },
  // Not required: some products (posters) might have no image URL at order time
  image: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  size: String,
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  totalPrice: {
    type: Number,
    min: [0, 'Total price cannot be negative'],
    default: 0
  }
});

// ─── Shipping Address ─────────────────────────────────────────────────────────
const shippingAddressSchema = new mongoose.Schema({
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
    trim: true,
    default: ''
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
  // Not required: defaults to India so WhatsApp orders don't fail if country isn't sent
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// ─── Status History ───────────────────────────────────────────────────────────
const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  note: String
}, { _id: false });

// ─── Order ────────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  // Clerk userId — null for guest WhatsApp orders
  userId: {
    type: String,
    default: null
  },
  // Guest identifier for unauthenticated WhatsApp orders
  guestId: {
    type: String,
    default: null
  },
  // Order channel
  source: {
    type: String,
    enum: ['whatsapp', 'checkout'],
    default: 'whatsapp'
  },
  // Not required — guests don't have an email
  userEmail: {
    type: String,
    required: false,
    default: '',
    trim: true,
    lowercase: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  billingAddress: {
    type: shippingAddressSchema,
    required: false
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  // Payment method defaults to cod for WhatsApp orders
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card', 'netbanking', 'wallet', 'other'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  specialInstructions: {
    type: String,
    default: '',
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  statusHistory: [statusHistorySchema],
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// ─── Pre-validate: Generate GRV-YYYY-NNNNN order number ──────────────────────────
orderSchema.pre('validate', function (next) {
  if (this.isNew && !this.orderNumber) {
    const year   = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000); // 5-digit
    this.orderNumber = `GRV-${year}-${random}`;
  }
  next();
});

// ─── Pre-save: Append to status history on status change ─────────────────────
orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus') && !this.isNew) {
    this.statusHistory.push({ status: this.orderStatus, timestamp: new Date() });
  }
  next();
});

export default mongoose.model('Order', orderSchema);