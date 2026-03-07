import mongoose from 'mongoose';


const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Street cannot exceed 100 characters']
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
    },
    postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: [10, 'Postal code cannot exceed 10 characters']
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: 'India', // Given your current location, a sensible default
        maxlength: [50, 'Country cannot exceed 50 characters']
    },
    // Optional fields for more detail
    apartment: {
        type: String,
        trim: true,
        maxlength: [50, 'Apartment/Suite cannot exceed 50 characters']
    },
    landmark: {
        type: String,
        trim: true,
        maxlength: [100, 'Landmark cannot exceed 100 characters']
    }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  size: {
    type: String,
    trim: true
  },
  customization: {
    text: String,
    color: String,
    notes: String
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  } 
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: String, // Clerk user ID
    required: true,

  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  totalItems: {
    type: Number,
    default: 0,
    min: [0, 'Total items cannot be negative']
  },
  discountCode: {
    code: String,
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  shippingAddress: {
        type: addressSchema,
      }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Apply discount if exists
  if (this.discountCode && this.discountCode.discount) {
    if (this.discountCode.discountType === 'percentage') {
      this.totalAmount = this.totalAmount * (1 - this.discountCode.discount / 100);
    } else {
      this.totalAmount = Math.max(0, this.totalAmount - this.discountCode.discount);
    }
  }
  
  next();
});

// Index for faster queries
cartSchema.index({ userId: 1 }, { unique: true });
cartSchema.index({ 'items.product': 1 });

export default mongoose.model('Cart', cartSchema);