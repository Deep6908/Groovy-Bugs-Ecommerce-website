import express from 'express';
import { body, param, validationResult } from 'express-validator';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose'; // Import mongoose to check for valid ObjectIds

const router = express.Router();

// Middleware to handle validation errors
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

// Helper function to populate cart items and filter out deleted products
// Async only if you need it for other async calls (not for populate anymore)
const populateAndFilterCart = async (cart) => {
    if (!cart) return null;

    // 1. No need to populate items.product anymore
    // 2. Filter out items where product is null (for deleted products)
    cart.items = cart.items.filter(item => item.product);

    // 3. Ensure cart-level fields are initialized if not present
    if (cart.specialInstructions === undefined) {
        cart.specialInstructions = '';
    }
    if (cart.discountCode === undefined) {
        cart.discountCode = null;
    }
    if (cart.shippingAddress === undefined) {
        cart.shippingAddress = null;
    } else if (cart.shippingAddress === null) {
        // do nothing
    } else {
        // Ensure object structure for address
        cart.shippingAddress = {
            street: cart.shippingAddress.street || '',
            apartment: cart.shippingAddress.apartment || '',
            city: cart.shippingAddress.city || '',
            state: cart.shippingAddress.state || '',
            postalCode: cart.shippingAddress.postalCode || '',
            country: cart.shippingAddress.country || '',
            landmark: cart.shippingAddress.landmark || ''
        };
    }

    // 4. Optionally recalculate totals if you want (recommended)
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save(); // Save any updates made here
    return cart;
};

// --- GET /api/cart/:userId - Get user's cart ---
router.get('/:userId', [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId });

        if (!cart) {
            // Return an empty cart structure if not found
            return res.json({
                userId: req.params.userId,
                items: [],
                totalAmount: 0,
                totalItems: 0,
                specialInstructions: '',
                discountCode: null,
                shippingAddress: null
            });
        }

        cart = await populateAndFilterCart(cart); // Use the helper to populate and clean

        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
});

// --- POST /api/cart/:userId/add - Add item to cart ---
router.post('/:userId/add', [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('productId').isMongoId().withMessage('Valid Product ID is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('size').optional().isString().trim().withMessage('Size must be a string'),
    body('customization').optional().isObject().withMessage('Customization must be an object')
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId, quantity = 1, size, customization } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (!product.inStock) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            (item.size === size || (!item.size && !size)) // Handles cases where size might be undefined/null
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
            // Optionally update price if product price has changed
            cart.items[existingItemIndex].price = product.price;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                size,
                customization,
                price: product.price
            });
        }

        await cart.save();
        cart = await populateAndFilterCart(cart); // Populate and clean after save

        res.json({
            message: 'Item added to cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
});

// --- PUT /api/cart/:userId - Update entire cart (items array) ---
// This endpoint is used by syncCartItemsToAPI in the frontend
router.put('/:userId', [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.product').isMongoId().withMessage('Each item must have a valid product ID'),
    body('items.*.quantity').isInt({ min: 0 }).withMessage('Each item quantity must be a non-negative integer'), // Allow 0 to enable removal
    body('items.*.price').isFloat({ min: 0 }).withMessage('Each item price must be a non-negative float'),
    body('items.*.size').optional({ nullable: true }).isString().trim().withMessage('Size must be a string or null'),
    body('items.*.name').isString().trim().notEmpty().withMessage('Item name is required'),
    body('items.*.image').isString().trim().notEmpty().withMessage('Item image is required'),
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;
        const { items } = req.body; // Only expecting 'items' here for this endpoint

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId });
        }

        // Filter out items with quantity 0 or less, as they are effectively removed
        const validItems = items.filter(item => item.quantity > 0);

        // Verify all products in the validItems array still exist and are valid
        const productIds = validItems.map(item => new mongoose.Types.ObjectId(item.product)); // Convert to ObjectId for query
        const products = await Product.find({ _id: { $in: productIds } }).select('_id price inStock');

        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const updatedItems = [];
        for (const item of validItems) {
            const productData = productMap.get(item.product);
            if (!productData) {
                // If product is not found, skip this item or throw an error based on desired behavior
                console.warn(`Product ID ${item.product} not found, skipping from cart update.`);
                continue;
            }
            // Ensure product is in stock (optional, depending on whether you allow adding out-of-stock)
            if (!productData.inStock) {
                 console.warn(`Product ID ${item.product} is out of stock, skipping from cart update.`);
                 continue; // Or handle as an error if you want strict stock checking here
            }

            // Update price from current product data to ensure consistency and prevent tampering
            updatedItems.push({
                product: item.product,
                quantity: item.quantity,
                size: item.size || undefined, // Store undefined if size is not provided
                customization: item.customization,
                name: item.name, // Keep these for convenience/display
                image: item.image,
                price: productData.price // Always use the current product price from DB
            });
        }

        cart.items = updatedItems;

        await cart.save();
        cart = await populateAndFilterCart(cart); // Populate and clean after save

        res.json({
            message: 'Cart items updated successfully',
            cart
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
});


// --- NEW: PATCH /api/cart/:userId/details - Update specific cart details ---
// This endpoint is used by updateSpecialInstructions, applyDiscountCode, updateShippingAddress in the frontend
router.patch('/:userId/details', [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    // Optional validations for the specific fields that can be updated
    body('specialInstructions').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('Special instructions must be a string up to 500 characters'),
    body('discountCode').optional({ nullable: true }).isObject().withMessage('Discount code must be an object or null'),
    body('discountCode.code').optional().isString().trim().notEmpty().withMessage('Discount code string is required'),
    body('discountCode.discount').optional().isFloat({ min: 0 }).withMessage('Discount value must be a non-negative number'),
    body('discountCode.discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be "percentage" or "fixed"'),
    body('shippingAddress').optional({ nullable: true }).isObject().withMessage('Shipping address must be an object or null'),
    // Add more specific validations for shippingAddress fields if necessary
    body('shippingAddress.street').optional().isString().trim().notEmpty(),
    body('shippingAddress.city').optional().isString().trim().notEmpty(),
    body('shippingAddress.state').optional().isString().trim().notEmpty(),
    body('shippingAddress.postalCode').optional().isString().trim().notEmpty(),
    body('shippingAddress.country').optional().isString().trim().notEmpty(),
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body; // This will contain fields like specialInstructions, discountCode, shippingAddress

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // If cart doesn't exist, create it before applying updates
            cart = new Cart({ userId });
        }

        // Apply updates dynamically
        // Using Object.assign or direct assignment for specific fields is safer
        if (updates.specialInstructions !== undefined) {
            cart.specialInstructions = updates.specialInstructions;
        }
        if (updates.discountCode !== undefined) {
            // Basic validation for discountCode structure. More complex validation 
            // and application logic for discount codes should be handled carefully.
            // Consider integrating with a dedicated discount service/logic.
            cart.discountCode = updates.discountCode;
        }
        if (updates.shippingAddress !== undefined) {
            cart.shippingAddress = updates.shippingAddress;
        }

        await cart.save(); // The pre('save') hook will handle total calculation

        cart = await populateAndFilterCart(cart); // Populate and clean after save

      res.json({
            success: true,
            message: 'Cart details updated successfully',
            cart
        });
    } catch (error) {
        console.error('Error updating cart details:', error);
        res.status(500).json({ message: 'Error updating cart details', error: error.message });
    }
});


// --- DELETE /api/cart/:userId/remove/:itemId - Remove item from cart ---
router.delete('/:userId/remove/:itemId', [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    param('itemId').isMongoId().withMessage('Valid Item ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { userId, itemId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const initialLength = cart.items.length;
        cart.items.pull({ _id: itemId }); // Mongoose's pull method for subdocuments

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await cart.save();
        cart = await populateAndFilterCart(cart); // Populate and clean after save

        res.json({
            message: 'Item removed from cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});

// --- DELETE /api/cart/:userId/clear - Clear entire cart ---
router.delete('/:userId/clear', [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Clear all fields related to the cart
        cart.items = [];
        cart.specialInstructions = '';
        cart.discountCode = null; // Set to null or undefined based on your schema default
        cart.shippingAddress = null; // Set to null or undefined based on your schema default

        await cart.save();

        res.json({
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
});

export default router;