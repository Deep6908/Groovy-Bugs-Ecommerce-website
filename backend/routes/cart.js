import express from 'express';
import { body, param, validationResult } from 'express-validator';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { requireAuth, requireOwnership } from '../middleware/auth.js';

const router = express.Router();

// Middleware to handle validation errors
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
 * Bug 8 fix: Removed cart.save() from this helper.
 * The helper is now purely a read/transform helper — each route saves explicitly
 * before calling this. Previously, calling save() here with the pre-save hook
 * active would re-apply discounts on every GET, causing double-discount.
 *
 * Bug 15 fix: Actually populate items.product so we can filter truly deleted products.
 */
const populateAndFilterCart = async (cart) => {
    if (!cart) return null;

    // Populate product refs so we can detect deleted products (null after populate)
    await cart.populate('items.product', '_id name price inStock image');

    // Filter out items where product was deleted from DB (populate returns null)
    cart.items = cart.items.filter(item => item.product !== null);

    // Ensure cart-level fields are initialized
    if (cart.specialInstructions === undefined) {
        cart.specialInstructions = '';
    }
    if (cart.shippingAddress === undefined) {
        cart.shippingAddress = null;
    } else if (cart.shippingAddress !== null) {
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

    // Recalculate display totals based on current items (does NOT save)
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return cart;
};

// --- GET /api/cart/:userId ---
router.get('/:userId', requireAuth, requireOwnership, [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId });

        if (!cart) {
            return res.json({
                success: true,
                userId: req.params.userId,
                items: [],
                totalAmount: 0,
                totalItems: 0,
                specialInstructions: '',
                shippingAddress: null
            });
        }

        cart = await populateAndFilterCart(cart);
        // Save only if items were filtered (deleted products removed)
        await cart.save();

        res.json({ success: true, ...cart.toObject() });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, message: 'Error fetching cart' });
    }
});

// --- POST /api/cart/:userId/add ---
router.post('/:userId/add', requireAuth, requireOwnership, [
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
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (!product.inStock) {
            return res.status(400).json({ success: false, message: 'Product is out of stock' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            (item.size === size || (!item.size && !size))
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].price = product.price;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                size,
                customization,
                price: product.price,
                name: product.name,
                image: product.image
            });
        }

        await cart.save();
        cart = await populateAndFilterCart(cart);

        res.json({
            success: true,
            message: 'Item added to cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ success: false, message: 'Error adding item to cart' });
    }
});

// --- PUT /api/cart/:userId - Update entire cart (items array) ---
router.put('/:userId', requireAuth, requireOwnership, [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.product').isMongoId().withMessage('Each item must have a valid product ID'),
    body('items.*.quantity').isInt({ min: 0 }).withMessage('Each item quantity must be a non-negative integer'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Each item price must be a non-negative float'),
    body('items.*.size').optional({ nullable: true }).isString().trim(),
    body('items.*.name').isString().trim().notEmpty().withMessage('Item name is required'),
    body('items.*.image').isString().trim().notEmpty().withMessage('Item image is required'),
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;
        const { items } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId });
        }

        // Filter out items with quantity 0 or less
        const validItems = items.filter(item => item.quantity > 0);

        // Verify all products still exist and re-stamp price from DB (prevents price tampering)
        const productIds = validItems.map(item => new mongoose.Types.ObjectId(item.product));
        const products = await Product.find({ _id: { $in: productIds } }).select('_id price inStock name image');
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const updatedItems = [];
        for (const item of validItems) {
            const productData = productMap.get(item.product);
            if (!productData) {
                console.warn(`Product ID ${item.product} not found; removing from cart.`);
                continue;
            }
            if (!productData.inStock) {
                console.warn(`Product ID ${item.product} is out of stock; skipping.`);
                continue;
            }
            updatedItems.push({
                product: item.product,
                quantity: item.quantity,
                size: item.size || undefined,
                customization: item.customization,
                name: item.name,
                image: item.image,
                price: productData.price // Always use DB price (prevents frontend tampering)
            });
        }

        cart.items = updatedItems;
        await cart.save();
        cart = await populateAndFilterCart(cart);

        res.json({
            success: true,
            message: 'Cart items updated successfully',
            cart
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
});

// --- PATCH /api/cart/:userId/details ---
router.patch('/:userId/details', requireAuth, requireOwnership, [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('specialInstructions').optional({ nullable: true }).isString().isLength({ max: 500 }),
    body('shippingAddress').optional({ nullable: true }).isObject(),
    body('shippingAddress.street').optional().isString().trim().notEmpty(),
    body('shippingAddress.city').optional().isString().trim().notEmpty(),
    body('shippingAddress.state').optional().isString().trim().notEmpty(),
    body('shippingAddress.postalCode').optional().isString().trim().notEmpty(),
    body('shippingAddress.country').optional().isString().trim().notEmpty(),
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId });
        }

        if (updates.specialInstructions !== undefined) {
            cart.specialInstructions = updates.specialInstructions;
        }
        if (updates.shippingAddress !== undefined) {
            cart.shippingAddress = updates.shippingAddress;
        }

        await cart.save();
        cart = await populateAndFilterCart(cart);

        res.json({
            success: true,
            message: 'Cart details updated successfully',
            cart
        });
    } catch (error) {
        console.error('Error updating cart details:', error);
        res.status(500).json({ success: false, message: 'Error updating cart details' });
    }
});

// --- DELETE /api/cart/:userId/remove/:itemId ---
// Bug 7 fix: Changed `const cart` to `let cart` so it can be reassigned after populateAndFilterCart.
router.delete('/:userId/remove/:itemId', requireAuth, requireOwnership, [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    param('itemId').isMongoId().withMessage('Valid Item ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { userId, itemId } = req.params;

        let cart = await Cart.findOne({ userId }); // Bug 7: `let` not `const`
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const initialLength = cart.items.length;
        cart.items.pull({ _id: itemId });

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        await cart.save();
        cart = await populateAndFilterCart(cart); // Bug 7: now works because cart is `let`

        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false, message: 'Error removing item from cart' });
    }
});

// --- DELETE /api/cart/:userId/clear ---
router.delete('/:userId/clear', requireAuth, requireOwnership, [
    param('userId').isString().trim().notEmpty().withMessage('User ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = [];
        cart.specialInstructions = '';
        cart.shippingAddress = null;

        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, message: 'Error clearing cart' });
    }
});


export default router;