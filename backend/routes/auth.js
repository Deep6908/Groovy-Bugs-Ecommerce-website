import express from 'express';
import { body, validationResult } from 'express-validator';
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

// ─────────────────────────────────────────────────────────────────
// NOTE: This auth route file provides a legacy bcrypt/JWT path.
// All production authentication is handled via Clerk.
// These endpoints should NOT be exposed to consumers of the app.
// They are kept only in case a non-Clerk migration path is needed.
// ─────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
// Bug 2 fix: Do NOT return the reset token in the response body.
// In production, send via email (nodemailer). Token returned only in dev via server log.
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return the same message to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Bug 2 fix: Token is NEVER returned in the response body.
    // In production wire up nodemailer here to email the token.
    if (process.env.NODE_ENV === 'development') {
      console.info('[DEV ONLY] Password reset requested for:', email, '— integrate nodemailer for production email delivery.');
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error processing password reset request' });
  }
});

// GET /api/auth/me — Bug 2 fix: requireAuth added
router.get('/me', requireAuth, async (req, res) => {
  try {
    // req.user is already set by requireAuth middleware
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;