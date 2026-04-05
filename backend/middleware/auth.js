import { verifyToken } from '@clerk/backend';
import User from '../models/User.js';

/**
 * Middleware to verify Clerk session token and attach local DB user to request.
 * Uses @clerk/backend's verifyToken directly instead of clerkMiddleware + getAuth
 * for transparent error handling.
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required: no Bearer token' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token directly using Clerk's backend SDK
    let payload;
    try {
      payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      });
    } catch (verifyError) {
      console.error('Clerk token verification failed:', verifyError.message);
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        detail: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }

    const clerkId = payload.sub; // Clerk puts userId in the 'sub' claim
    if (!clerkId) {
      return res.status(401).json({ message: 'Token verified but no user ID found' });
    }

    // Look up user in our MongoDB
    const user = await User.findOne({ clerkId }).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found in database', clerkId });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Middleware to verify the authenticated user has admin role.
 * Must be used AFTER requireAuth middleware.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

/**
 * Middleware to verify the authenticated user's clerkId matches the
 * userId route parameter. Prevents users from accessing other users' data.
 * Must be used AFTER requireAuth middleware.
 */
export const requireOwnership = (req, res, next) => {
  const { userId } = req.params;
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.clerkId !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: you can only access your own data' });
  }
  next();
};
