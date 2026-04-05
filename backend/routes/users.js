import express from 'express';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ─── COMPLETE PROFILE ROUTE ───────────────────────────────────────
// Bug 5 fix: Added requireAuth. clerkId is taken from req.user.clerkId,
// NOT from the body — prevents one user from overwriting another's profile.
router.post('/profile-details', requireAuth, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('firstName').notEmpty().withMessage('First name is required').escape(),
  body('lastName').notEmpty().withMessage('Last name is required').escape(),
  body('gender').notEmpty().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Valid gender required'),
  body('dateOfBirth').notEmpty().isISO8601().withMessage('Valid date of birth required'),
  body('address').isObject().withMessage('Address is required'),
  body('address.fullName').notEmpty().escape(),
  body('address.addressLine1').notEmpty().escape(),
  body('address.city').notEmpty().escape(),
  body('address.state').notEmpty().escape(),
  body('address.postalCode').notEmpty().escape(),
  body('address.country').notEmpty().escape(),
  body('address.phone').notEmpty().escape(),
  handleValidationErrors
], async (req, res) => {
  // Bug 5 fix: Use authenticated user's clerkId, never trust client-supplied clerkId
  const clerkId = req.user.clerkId;
  const { email, firstName, lastName, gender, dateOfBirth, preferences, address } = req.body;

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
    res.status(200).json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// Bug 5 fix: Added requireAuth + ownership check
router.get('/profile-details/:clerkId', requireAuth, [
  param('clerkId').notEmpty().withMessage('Clerk ID is required')
], handleValidationErrors, async (req, res) => {
  const { clerkId } = req.params;

  // Ownership: users can only fetch their own profile (admin can fetch any)
  if (req.user.clerkId !== clerkId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const user = await User.findOne({ clerkId })
      .select('firstName lastName email gender dateOfBirth addresses preferences');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', user: null });
    }
    return res.status(200).json({ success: true, ...user.toObject() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

// ─── CLERK SYNC ROUTE ─────────────────────────────────────────────
// Bug 6 fix: Added requireAuth. clerkId sourced from req.user.clerkId (verified by Clerk),
// not the request body — prevents creation of arbitrary User documents.
router.post('/clerk-sync', requireAuth, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('firstName').notEmpty().withMessage('First name is required').escape(),
  body('lastName').notEmpty().withMessage('Last name is required').escape(),
  body('image').optional().isURL().withMessage('Valid image URL is required')
], handleValidationErrors, async (req, res) => {
  try {
    // Bug 6: use verified clerkId from token, not from body
    const clerkId = req.user.clerkId;
    const { email, firstName, lastName, image } = req.body;

    const existingUser = await User.findOne({ clerkId });
    if (existingUser) return res.status(200).json({ success: true, user: existingUser });

    const newUser = new User({ clerkId, email, firstName, lastName, image });
    await newUser.save();
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('Error syncing Clerk user:', err);
    res.status(500).json({ success: false, message: 'Failed to sync user' });
  }
});

// ─── CREATE USER (admin / webhook only) ───────────────────────────
router.post('/', requireAuth, requireAuth, [
  body('clerkId').notEmpty().withMessage('Clerk ID is required').escape(),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required').escape(),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required').escape(),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
], handleValidationErrors, async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, phone, dateOfBirth, gender } = req.body;
    const existingUser = await User.findOne({ $or: [{ clerkId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = new User({ clerkId, email, firstName, lastName, phone, dateOfBirth, gender, isActive: true, lastLoginAt: new Date() });
    await user.save();
    res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
});

// ─── GET USER BY DB ID ────────────────────────────────────────────
// Bug 4 fix: Added requireAuth
router.get('/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    // Ownership check
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wishlist', 'name image price category')
      .populate('recentlyViewed.product', 'name image price category');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// ─── GET USER BY CLERK ID ─────────────────────────────────────────
// Bug 4 fix: Added requireAuth + ownership
router.get('/clerk/:clerkId', requireAuth, [
  param('clerkId').notEmpty().withMessage('Clerk ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { clerkId } = req.params;
    // Ownership: only the user themselves or admin
    if (req.user.clerkId !== clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findOne({ clerkId })
      .select('-password')
      .populate('wishlist', 'name image price category')
      .populate('recentlyViewed.product', 'name image price category');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user by Clerk ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// ─── UPDATE USER PROFILE ──────────────────────────────────────────
router.put('/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().isLength({ min: 1 }).escape(),
  body('lastName').optional().trim().isLength({ min: 1 }).escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const updateData = { ...req.body };
    delete updateData.clerkId;
    delete updateData.password;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// ─── ADDRESS MANAGEMENT ───────────────────────────────────────────

router.post('/:id/addresses', requireAuth, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('fullName').trim().isLength({ min: 1 }).escape(),
  body('addressLine1').trim().isLength({ min: 1 }).escape(),
  body('city').trim().isLength({ min: 1 }).escape(),
  body('state').trim().isLength({ min: 1 }).escape(),
  body('postalCode').trim().isLength({ min: 1 }).escape(),
  body('phone').isMobilePhone(),
  body('type').optional().isIn(['home', 'work', 'other'])
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newAddress = req.body;
    if (user.addresses.length === 0 || newAddress.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      newAddress.isDefault = true;
    }
    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json({ success: true, message: 'Address added successfully', address: user.addresses[user.addresses.length - 1] });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, message: 'Error adding address' });
  }
});

router.put('/:id/addresses/:addressId', requireAuth, [
  param('id').isMongoId(),
  param('addressId').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId, addressId } = req.params;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    Object.assign(address, req.body);
    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) addr.isDefault = false;
      });
    }
    await user.save();
    res.json({ success: true, message: 'Address updated successfully', address });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Error updating address' });
  }
});

router.delete('/:id/addresses/:addressId', requireAuth, [
  param('id').isMongoId(),
  param('addressId').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId, addressId } = req.params;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Error deleting address' });
  }
});

// ─── WISHLIST ─────────────────────────────────────────────────────

router.post('/:id/wishlist', requireAuth, [
  param('id').isMongoId(),
  body('productId').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { productId } = req.body;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }
    user.wishlist.push(productId);
    await user.save();
    res.json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Error adding to wishlist' });
  }
});

router.delete('/:id/wishlist/:productId', requireAuth, [
  param('id').isMongoId(),
  param('productId').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId, productId } = req.params;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.wishlist.pull(productId);
    await user.save();
    res.json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Error removing from wishlist' });
  }
});

export default router;