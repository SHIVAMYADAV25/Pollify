const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

// Short-lived access token — 15 minutes
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

// Long-lived refresh token with unique jti for blocklisting
const signRefreshToken = (id) => {
  const jti = nanoid(16);
  const token = jwt.sign({ id, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { token, jti };
};

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
    process.env.NODE_ENV === 'production'
      ? 'none'
      : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });
    const user = await User.create({ name, email, password });
    const accessToken = signAccessToken(user._id);
    const { token: refreshToken } = signRefreshToken(user._id);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.status(201).json({ success: true, accessToken, user });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const accessToken = signAccessToken(user._id);
    const { token: refreshToken } = signRefreshToken(user._id);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({ success: true, accessToken, user: user.toJSON() });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }

    // Reject if this jti has been explicitly blocklisted (i.e. user logged out)
    const blocked = await BlacklistedToken.findOne({ jti: decoded.jti });
    if (blocked) {
      return res.status(401).json({ success: false, message: 'Token has been revoked. Please log in again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });

    // Issue a fresh access token only — the refresh cookie stays unchanged until logout.
    // No rotation here prevents the page-reload-logout bug where every reload
    // would blocklist the jti and lock the user out on the next visit.
    const newAccessToken = signAccessToken(user._id);

    res.json({ success: true, accessToken: newAccessToken, user });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        // Blocklist on logout so this jti can never be used again
        await BlacklistedToken.create({
          jti: decoded.jti,
          expiresAt: new Date(decoded.exp * 1000),
        });
      } catch {
        // Token already expired — nothing to blocklist
      }
    }
    res.clearCookie('refreshToken', COOKIE_OPTS);
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};