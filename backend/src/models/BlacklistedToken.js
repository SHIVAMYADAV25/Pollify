const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true, index: true },
    // TTL index — MongoDB auto-deletes this document when expiresAt is reached
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true } // adds createdAt — required by grace window check in authController
);

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema);