'use strict';

// middleware/authenticate.js
// Verifies RS256 JWT Bearer token on every protected route.
// Checks JTI against token_blacklist table.
// Attaches req.user = { userId, email, role } on success.

const jwt  = require('jsonwebtoken');
const fs   = require('fs');
const path = require('path');
const db   = require('../config/db');

const PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');

const stmtBlacklist = db.prepare(
  'SELECT jti FROM token_blacklist WHERE jti = ?'
);

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check token blacklist (logout / revoked tokens)
  const blacklisted = stmtBlacklist.get(payload.jti);
  if (blacklisted) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  req.user = { userId: payload.sub, email: payload.email, role: payload.role };
  next();
}

module.exports = authenticate;
