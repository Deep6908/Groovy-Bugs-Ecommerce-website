import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

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

// POST /api/orders - Create new order
router.post('/', [
  body('userId').isString().trim().notEmpty(),
  body('userEmail').isEmail().normalizeEmail(),
  body('items').isArray().isLength({ min: 1 }).withMessage('Order must contain at least one item'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').trim().isLength({ min: 1 }),
  body('shippingAddress.addressLine1').trim().isLength({ min: 1 }),
  body('shippingAddress.city').trim().isLength({ min: 1 }),
  body('shippingAddress.state').trim().isLength({ min: 1 }),
  body('shippingAddress.postalCode').trim().isLength({ min: 1 }),
  body('shippingAddress.phone').trim().isLength({ min: 1 }),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'cod', 'bank_transfer'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      items,
      shippingAddress,
      paymentMethod,
      paymentId,
      specialInstructions,
    } = req.body;

    // Validate products exist and calculate totals
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Some products not found' });
    }

    // Calculate order totals
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

    // Calculate shipping (free over ₹1500)
    // const shippingCost = subtotal >= 1500 ? 0 : 100;
    
    // Calculate tax (18% GST)
    // const tax = Math.round(subtotal * 0.18);
    
    // Apply discount
    // let discountAmount = 0;
    // if (discountCode) {
    //   if (discountCode.toLowerCase() === 'groovy20') {
    //     discountAmount = Math.round(subtotal * 0.2);
    //   } else if (discountCode.toLowerCase() === 'welcome10') {
    //     discountAmount = Math.round(subtotal * 0.1);
    //   }
    // }

    const totalAmount = subtotal; //tax, //shippingCost, //discountAmount will be taken care of later

    // Create order
    const order = new Order({
      orderNumber: `ORD-${Date.now()}`, // Unique order number
      userId,
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
    // await Cart.findOneAndUpdate(
    //   { userId },
    //   { $set: { items: [] } }
    // );

    // ***** since its in tsting mode, we won't clear the cart

    // Update user's order count and total spent
    await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $inc: { 
          orderCount: 1, 
          totalSpent: totalAmount,
          loyaltyPoints: Math.floor(totalAmount / 100) // 1 point per ₹100
        }
      }
    );

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// GET /api/orders/user/:userId - Get orders by user ID
router.get('/user/:userId', [
  param('userId').isString().trim().notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
], handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.params;
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
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// GET /api/orders/:id - Get single order by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid order ID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// GET /api/orders/number/:orderNumber - Get order by order number
router.get('/number/:orderNumber', [
  param('orderNumber').isString().trim().notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product', 'name image category');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', [
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
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.orderStatus = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (shippingCarrier) {
      order.shippingCarrier = shippingCarrier;
    }

    // Add to order history
    order.orderHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status changed to ${status}`,
      updatedBy: 'admin' // In real app, get from authenticated admin user
    });

    // Set delivery dates
    if (status === 'shipped' && !order.estimatedDelivery) {
      order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
    
    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// PUT /api/orders/:id/payment-status - Update payment status
router.put('/:id/payment-status', [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
  body('paymentId').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    
    if (paymentId) {
      order.paymentId = paymentId;
    }

    // If payment is successful and order is still pending, confirm it
    if (paymentStatus === 'paid' && order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
      order.orderHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Order confirmed after successful payment'
      });
    }

    await order.save();

    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
});

// GET /api/orders - Get all orders (Admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
  query('search').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search
    } = req.query;

    const filter = {};
    
    if (status) {
      filter.orderStatus = status;
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    
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
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

export default router;