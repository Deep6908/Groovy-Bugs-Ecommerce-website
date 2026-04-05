import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

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

// GET /api/products - Get all products with filtering, sorting, and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().trim().escape(),
  query('featured').optional().isBoolean(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['name', 'price', 'createdAt', 'rating']).escape(),
  query('order').optional().isIn(['asc', 'desc']).escape(),
  query('search').optional().isString().trim().escape()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { inStock: true };
    
    if (category) {
      filter.category = new RegExp(category, 'i');
    }
    
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-reviews'),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ featured: true, inStock: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-reviews');
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Error fetching featured products', error: error.message });
  }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', async (req, res) => {
  const category = req.params.category;

  try {
    const products = await Product.find({ category }); // Make sure category field exists and is indexed
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});



// GET /api/products/admin/all - Get all products for admin dashboard (ignores inStock)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid product ID')
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'firstName lastName');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', requireAuth, requireAdmin, [
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').isString().trim().isLength({ min: 1, max: 1000 }),
  body('price').isFloat({ min: 0 }),
  body('category').isIn(['Posters', 'Tees', 'Tote Bags', 'Accessories', 'Pouch Bags', 'Crop Tops']),
  body('image').optional().isString(),
  body('featured').optional().isBoolean(),
  body('inventory').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', requireAuth, requireAdmin, [
  param('id').isMongoId(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ min: 1, max: 1000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['Posters', 'Tees', 'Tote Bags', 'Accessories', 'Pouch Bags', 'Crop Tops']),
  body('image').optional().isString(),
  body('featured').optional().isBoolean(),
  body('inStock').optional().isBoolean(),
  body('inventory').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', requireAuth, requireAdmin, [
  param('id').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// PATCH /api/products/:id/stock — Toggle inStock (Admin only)
// Allows the admin to flip a product in/out of stock without touching code.
router.patch('/:id/stock', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid product ID')
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('name inStock');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    product.inStock = !product.inStock;
    await product.save();
    res.json({
      success: true,
      message: `${product.name} is now ${product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}`,
      productId: product._id,
      inStock: product.inStock
    });
  } catch (error) {
    console.error('Error toggling stock:', error);
    res.status(500).json({ success: false, message: 'Error toggling stock', error: error.message });
  }
});

export default router;