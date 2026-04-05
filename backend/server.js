import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';

// Load environment variables FIRST
dotenv.config();

// ─── Startup env validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var "${key}". Check backend/.env`);
    process.exit(1);
  }
}

// Import routes
import productRoutes from './routes/products.js';
import cartRoutes    from './routes/cart.js';
import orderRoutes   from './routes/orders.js';
import userRoutes    from './routes/users.js';
import authRoutes    from './routes/auth.js';
// Note: discountRoutes removed — discount system has been removed
// import discountRoutes from './routes/discounts.js';

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later.'
});

// ─── CORS — explicitly allow Authorization header ─────────────────────────────
// Bug fix: allowedHeaders must include 'Authorization' otherwise the Clerk Bearer
// token sent by the Axios interceptor is stripped by the browser's CORS preflight.
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin Vite proxy, Postman, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(helmet({
  // Allow Clerk's inline scripts and Vite HMR
  contentSecurityPolicy: false,
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Clerk middleware — attaches auth info but does NOT block unauthenticated ─
// The middleware only blocks if you use requireAuth() in individual routes.
// Bug fix: previously missing proper key configuration logging.
try {
  app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey:      process.env.CLERK_SECRET_KEY,
  }));
  console.log('Clerk middleware initialised.');
} catch (err) {
  console.error('Failed to initialise Clerk middleware:', err.message);
  // Don't crash — unauthenticated routes still need to work
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS:     10000,
  maxPoolSize:              10,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected. Reconnecting...'));
mongoose.connection.on('reconnected',  () => console.log('MongoDB reconnected.'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/auth',     authRoutes);
// Discount routes removed from here

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Groovy Bugs API is running',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    error:   process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;