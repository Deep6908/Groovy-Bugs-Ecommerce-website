import express from 'express';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ----- COMPLETE PROFILE ROUTE -----
router.post("/profile-details", [
  body('clerkId').notEmpty().withMessage('Clerk ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('gender').notEmpty().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Valid gender required'),
  body('dateOfBirth').notEmpty().isISO8601().withMessage('Valid date of birth required'),
  body('address').isObject().withMessage('Address is required'),
  body('address.fullName').notEmpty(),
  body('address.addressLine1').notEmpty(),
  body('address.city').notEmpty(),
  body('address.state').notEmpty(),
  body('address.postalCode').notEmpty(),
  body('address.country').notEmpty(),
  body('address.phone').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  const { clerkId, email, firstName, lastName, gender, dateOfBirth, preferences, address } = req.body;
  try {
    await User.updateOne(
      { clerkId },
      {
        $set: {
          email,
          firstName,
          lastName,
          gender,
          dateOfBirth,
          preferences,
          addresses: [address]
        }
      },
      { upsert: false }
    );
    res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

router.get('/profile-details/:clerkId', async (req, res) => {
  const { clerkId } = req.params;
  try {
    const user = await User.findOne({ clerkId })
      .select('firstName lastName email gender dateOfBirth addresses preferences');
    if (!user) {
      return res.status(404).json({ message: "User not found", user: null });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching profile",
      error: err.message
    });
  }
});

// ----- CLERK SYNC ROUTE -----
router.post("/clerk-sync", [
  body('clerkId').notEmpty().withMessage('Clerk ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('image').optional().isURL().withMessage('Valid image URL is required')

], handleValidationErrors, async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, image } = req.body;
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) return res.status(200).json(existingUser);

    const newUser = new User({ clerkId, email, firstName, lastName, image });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: "Failed to sync user" });
  }
});

// ----- CREATE USER ROUTE FOR CLERK -----
router.post('/', [
  body('clerkId').notEmpty().withMessage('Clerk ID is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
], handleValidationErrors, async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, phone, dateOfBirth, gender } = req.body;
    const existingUser = await User.findOne({ $or: [{ clerkId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({
      clerkId,
      email,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      isActive: true,
      lastLoginAt: new Date()
    });
    await user.save();
    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// ----- GET USER BY DB ID -----
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wishlist', 'name image price category')
      .populate('recentlyViewed.product', 'name image price category');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// ----- GET USER BY CLERK ID -----
router.get('/clerk/:clerkId', [
  param('clerkId').notEmpty().withMessage('Clerk ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId })
      .select('-password')
      .populate('wishlist', 'name image price category')
      .populate('recentlyViewed.product', 'name image price category');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by Clerk ID:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// ----- UPDATE USER PROFILE (token-protected) -----
router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updateData = req.body;
    delete updateData.clerkId;
    delete updateData.password;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// ----- ADDRESS MANAGEMENT ROUTES (All token-protected) -----

// Add new address
router.post('/:id/addresses', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('fullName').trim().isLength({ min: 1 }).withMessage('Full name is required'),
  body('addressLine1').trim().isLength({ min: 1 }).withMessage('Address line 1 is required'),
  body('city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('postalCode').trim().isLength({ min: 1 }).withMessage('Postal code is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('type').optional().isIn(['home', 'work', 'other'])
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAddress = req.body;
    // If first address or marked as default, make it default
    if (user.addresses.length === 0 || newAddress.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      newAddress.isDefault = true;
    }
    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json({
      message: 'Address added successfully',
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
});

// Update address
router.put('/:id/addresses/:addressId', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  param('addressId').isMongoId().withMessage('Invalid address ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId, addressId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    Object.assign(address, req.body);

    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
});

// Delete address
router.delete('/:id/addresses/:addressId', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  param('addressId').isMongoId().withMessage('Invalid address ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId, addressId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

// ----- WISHLIST MANAGEMENT -----
router.post('/:id/wishlist', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('productId').isMongoId().withMessage('Valid product ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { productId } = req.body;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    user.wishlist.push(productId);
    await user.save();
    res.json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
  }
});

router.delete('/:id/wishlist/:productId', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  param('productId').isMongoId().withMessage('Invalid product ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId, productId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.wishlist.pull(productId);
    await user.save();
    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
  }
});

export default router;