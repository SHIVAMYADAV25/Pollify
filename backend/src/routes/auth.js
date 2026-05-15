const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Refresh access token using httpOnly cookie
router.post('/refresh', refresh);

// Logout — clears httpOnly cookie
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

module.exports = router;