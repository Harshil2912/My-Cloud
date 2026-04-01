'use strict';

// services/authService.js
// JWT RS256 token issuance, rotation, and revocation.

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const tokenModel     = require('../models/tokenModel');
const { nowMs, addDays } = require('../utils/timeUtils');

const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');
const ACCESS_TTL  = parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY        || '900',  10); // 15 min secs
const REFRESH_DAYS= parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS  || '30',   10);

function issueAccessToken(user) {
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: ACCESS_TTL }
  );
  return { token, jti, expiresAt: nowMs() + ACCESS_TTL * 1000 };
}

function issueRefreshToken(userId, familyId = uuidv4()) {
  const raw       = crypto.randomBytes(64).toString('hex');
  const hash      = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = addDays(nowMs(), REFRESH_DAYS);
  tokenModel.insertRefreshToken({
    id: uuidv4(), userId, tokenHash: hash, familyId, createdAt: nowMs(), expiresAt,
  });
  return { raw, hash, familyId, expiresAt };
}

function rotateRefreshToken(existing) {
  tokenModel.markTokenUsed(existing.id);
  return issueRefreshToken(existing.user_id, existing.family_id);
}

function revokeAccessToken(jti, userId, expiresAt) {
  tokenModel.blacklistToken({ jti, userId, revokedAt: nowMs(), expiresAt });
}

module.exports = { issueAccessToken, issueRefreshToken, rotateRefreshToken, revokeAccessToken };
