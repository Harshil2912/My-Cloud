'use strict';

// middleware/csrfProtection.js — CSRF double-submit cookie pattern via csrf-csrf.

const { doubleCsrf } = require('csrf-csrf');

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret:      () => process.env.CSRF_SECRET,
  cookieName:     process.env.CSRF_COOKIE_NAME || '__Host-csrf',
  cookieOptions:  {
    httpOnly: false,   // Frontend must read this cookie value
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure:   process.env.NODE_ENV === 'production',
    path:     '/',
  },
  size:           64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

module.exports = { doubleCsrfProtection, generateToken };
