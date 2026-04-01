'use strict';

// middleware/uploadRateLimit.js — 20 uploads per minute per authenticated user.

const rateLimit = require('express-rate-limit');
const config    = require('../config/rateLimitConfig');

module.exports = rateLimit({
  ...config.upload,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: 'Upload rate limit exceeded. Max 20 uploads per minute.' },
});
