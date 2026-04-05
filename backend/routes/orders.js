import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

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

/**
 * POST /api/orders/whatsapp
 * Creates a pending WhatsApp order — works for authenticated AND guest users.
 * Returns orderNumber for the confirmation page URL.
 *
 * Deliberately has NO requireAuth so guests can also place orders.
 */
router.post('/whatsapp', [
  body('items').isArray({ min: 1 }).withMessage('Cart is empty — add items first'),
  body('items.*.name').isString().trim().notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.price').isNumeric().withMessage('Item price must be a number'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').optional().trim(),
  body('shippingAddress.addressLine1').optional().trim(),
  body('shippingAddress.city').optional().trim(),
  body('shippingAddress.state').optional().trim(),
  body('shippingAddress.postalCode').optional().trim(),
  body('shippingAddress.phone').optional().trim(),
  body('subtotal').isNumeric().withMessage('Subtotal must be a number'),
  body('customizationNote').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('userId').optional({ nullable: true }).isString(),
  body('userEmail').optional({ nullable: true }).isString(),
], handleValidationErrors, async (req, res) => {
  // DB connection guard
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, error: 'Database unavailable — please try again shortly' });
  }

  try {
    const { items, shippingAddress, subtotal, customizationNote, userId, userEmail } = req.body;

    const finalTotal = Math.max(0, Number(subtotal));

    // Build order items — product ref is optional for WhatsApp orders
    const orderItems = items.map(item => ({
      product: item.productId ? new mongoose.Types.ObjectId(String(item.productId)) : null,
      name: String(item.name),
      image: item.image || '',
      quantity: Number(item.quantity),
      size: item.size || undefined,
      price: Number(item.price),
      totalPrice: Number(item.price) * Number(item.quantity)
    }));

    const order = new Order({
      userId:   userId   || null,
      userEmail: userEmail || '',
      source: 'whatsapp',
      items: orderItems,
      shippingAddress: {
        fullName:     shippingAddress.fullName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city:         shippingAddress.city,
        state:        shippingAddress.state,
        postalCode:   shippingAddress.postalCode,
        country:      shippingAddress.country || 'India',
        phone:        shippingAddress.phone
      },
      subtotal:    finalTotal,
      totalAmount: finalTotal,
      paymentMethod: 'cod',
      orderStatus: 'pending',
      specialInstructions: customizationNote || ''
    });

    await order.save();

    // Best-effort: clear saved cart for authenticated users (don't fail order if this errors)
    if (userId) {
      try {
        await Cart.findOneAndUpdate(
          { userId },
          { $set: { items: [], totalAmount: 0, totalItems: 0, discountCode: null } }
        );
      } catch (cartErr) {
        console.warn('Cart clear failed (non-fatal):', cartErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'WhatsApp order created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      finalTotal
    });
  } catch (error) {
    console.error('Error creating WhatsApp order:', error);

    // Expose Mongoose validation errors clearly to help debugging
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Order validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    // Duplicate orderNumber — pre-save hook rare collision retry
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'Order number collision — please retry' });
    }

    return res.status(500).json({ success: false, error: 'Server error creating order', message: error.message });
  }
});


/**
 * POST /api/orders — Create new checkout order (auth required)
 *
 * Bug 14 fix: userId is now derived from req.user.clerkId (set by requireAuth),
 * NOT from the request body. Prevents users from creating orders for other users.
 *
 * Bug 9 fix: Removed explicit orderNumber assignment — the pre-save hook generates
 * a unique order number. Passing it from the route with Date.now() caused duplicates
 * on simultaneous requests within the same millisecond.
 */
router.post('/', requireAuth, [
  body('userEmail').isEmail().normalizeEmail(),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Each item must have a valid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').trim().isLength({ min: 1 }),
  body('shippingAddress.addressLine1').trim().isLength({ min: 1 }),
  body('shippingAddress.city').trim().isLength({ min: 1 }),
  body('shippingAddress.state').trim().isLength({ min: 1 }),
  body('shippingAddress.postalCode').trim().isLength({ min: 1 }),
  body('shippingAddress.phone').trim().isLength({ min: 1 }),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'cod', 'bank_transfer'])
], handleValidationErrors, async (req, res) => {
  // Bug 14 fix: always use the authenticated user's clerkId, never the body
  const userId = req.user.clerkId;

  try {
    const {
      userEmail,
      items,
      shippingAddress,
      paymentMethod,
      paymentId,
      specialInstructions,
    } = req.body;

    // Validate all products exist
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select('_id name image price inStock');

    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'One or more products not found' });
    }

    // Check stock for all items
    const outOfStock = products.filter(p => !p.inStock);
    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following items are out of stock: ${outOfStock.map(p => p.name).join(', ')}`
      });
    }

    // Calculate order totals using DB prices (prevents price tampering from frontend)
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product);
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      return {
        product: product._id,
        name: product.name,
        image: product.image,
        quantity: item.quantity,
        size: item.size,
        customization: item.customization,
        price: product.price,
        totalPrice: itemTotal
      };
    });

    const totalAmount = subtotal;

    // Bug 9 fix: Do NOT set orderNumber — let the pre-save hook generate it.
    const order = new Order({
      userId,       // Bug 14: from req.user.clerkId
      userEmail,
      items: orderItems,
      shippingAddress,
      billingAddress: shippingAddress,
      subtotal,
      totalAmount,
      paymentMethod,
      paymentId,
      specialInstructions
    });

    await order.save();

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalAmount: 0, totalItems: 0, discountCode: null } }
    );

    // Decrement product inventory
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { inventory: -item.quantity } }
      );
    }

    // Update user stats
    await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $inc: {
          orderCount: 1,
          totalSpent: totalAmount,
          loyaltyPoints: Math.floor(totalAmount / 100)
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

/**
 * GET /api/orders/user/:userId — Get orders by user ID
 *
 * Bug 22 fix: Added ownership check — authenticated user can only see their own orders.
 */
router.get('/user/:userId', requireAuth, [
  param('userId').isString().trim().notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
], handleValidationErrors, async (req, res) => {
  const { userId } = req.params;

  // Bug 22 fix: ownership check
  if (req.user.clerkId !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: you can only view your own orders' });
  }

  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status) {
      filter.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.product', 'name image category'),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

/**
 * GET /api/orders/:id — Get single order by ID
 *
 * Bug 3 fix: Added requireAuth + ownership check. Previously completely public.
 */
router.get('/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid order ID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ownership check: only the order's owner or admin can view it
    if (order.userId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
});

/**
 * GET /api/orders/number/:orderNumber — Get order by order number
 *
 * Bug 3 fix: Added requireAuth + ownership check. Previously completely public.
 */
router.get('/number/:orderNumber', requireAuth, [
  param('orderNumber').isString().trim().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
});

// PUT /api/orders/:id/status — Update order status (Admin only)
router.put('/:id/status', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  body('note').optional().isString().trim(),
  body('trackingNumber').optional().isString().trim(),
  body('shippingCarrier').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { status, note, trackingNumber, shippingCarrier } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = status;

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingCarrier) order.shippingCarrier = shippingCarrier;

    order.orderHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status changed to ${status}`,
      updatedBy: req.user.clerkId
    });

    if (status === 'shipped' && !order.estimatedDelivery) {
      order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// PUT /api/orders/:id/payment-status (Admin only)
router.put('/:id/payment-status', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
  body('paymentId').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;

    if (paymentStatus === 'paid' && order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
      order.orderHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Order confirmed after successful payment'
      });
    }

    await order.save();

    res.json({ success: true, message: 'Payment status updated successfully', order });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, message: 'Error updating payment status' });
  }
});

// GET /api/orders — Get all orders (Admin only)
router.get('/', requireAuth, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
  query('search').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { userEmail: new RegExp(search, 'i') },
        { 'shippingAddress.fullName': new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.product', 'name image category'),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

export default router;