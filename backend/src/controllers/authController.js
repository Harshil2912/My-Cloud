'use strict';

// controllers/authController.js
// register, login, logout, refresh, me, verifyEmail, resendVerification

const bcrypt      = require('bcrypt');
const crypto      = require('crypto');
const fs          = require('fs');
const path        = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const userModel   = require('../models/userModel');
const tokenModel  = require('../models/tokenModel');
const authService = require('../services/authService');
const bruteForce  = require('../services/bruteForceService');
const auditService= require('../services/auditService');
const emailService= require('../services/emailService');
const db          = require('../config/db');
const { nowMs, addHours } = require('../utils/timeUtils');

const BCRYPT_ROUNDS = 12;
const LOCKOUT_THRESHOLD = parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD || '5', 10);
const LOCKOUT_DURATION  = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MS || '900000', 10);
const REFRESH_DAYS      = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS || '30', 10);
const USERNAME_PATTERN  = /^[a-zA-Z0-9_.-]{3,32}$/;

const REFRESH_COOKIE = {
  httpOnly: true,
  secure:   true,
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path:     '/api/auth/refresh',
  maxAge:   REFRESH_DAYS * 86400 * 1000,
};

const AVATAR_EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function normalizeEmailPreserveDots(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

// POST /api/auth/register
async function register(req, res) {
  await body('username').isLength({ min: 3, max: 32 }).matches(USERNAME_PATTERN).run(req);
  await body('email').isEmail().run(req);
  await body('password').isLength({ min: 12 }).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const username = normalizeUsername(req.body.username);
  const email = normalizeEmailPreserveDots(req.body.email);
  const { password } = req.body;

  if (userModel.findByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  if (userModel.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId       = uuidv4();
  const status       = emailService.isEnabled() ? 'unverified' : 'active';
  const now          = nowMs();

  userModel.create({
    id: userId, username, email, passwordHash, role: 'user', status,
    storageQuota: 10 * 1024 * 1024 * 1024, createdAt: now, updatedAt: now,
  });

  if (emailService.isEnabled()) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash     = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry   = addHours(now, parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS || '24', 10));

    db.prepare(`INSERT INTO verification_tokens (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)`)
      .run(uuidv4(), userId, hash, expiry);

    const verifyUrl = `${process.env.VITE_API_BASE_URL?.replace('/api', '')}/verify?token=${rawToken}`;
    await emailService.sendVerificationEmail(email, verifyUrl).catch(() => {});
  }

  auditService.logEvent('register', req, { metadata: { userId, username } });
  res.status(201).json({ userId, username, email, status });
}

// POST /api/auth/login
async function login(req, res) {
  await body('identifier').isString().trim().notEmpty().run(req);
  await body('password').notEmpty().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const identifier = String(req.body.identifier || '').trim();
  const { password } = req.body;

  if (bruteForce.check(req.ip)) {
    return res.status(429).json({ error: 'Too many failed login attempts. Try again in 15 minutes.' });
  }

  const isEmailIdentifier = identifier.includes('@');
  const user = isEmailIdentifier
    ? userModel.findByEmail(normalizeEmailPreserveDots(identifier))
    : userModel.findByUsername(normalizeUsername(identifier));

  if (!user) {
    bruteForce.recordFail(req.ip);
    await bcrypt.compare(password, '$2b$12$invalid_hash_for_timing'); // timing safe
    auditService.logEvent('login_fail', req, { metadata: { identifier } });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.locked_until && user.locked_until > nowMs()) {
    return res.status(423).json({ error: 'Account locked. Try again later.' });
  }

  if (user.status === 'unverified') {
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    bruteForce.recordFail(req.ip);
    userModel.recordLoginFail(user.id, LOCKOUT_THRESHOLD, nowMs() + LOCKOUT_DURATION);
    auditService.logEvent('login_fail', req, { metadata: { identifier } });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  userModel.resetLoginFail(user.id);
  bruteForce.reset(req.ip);

  const { token: accessToken } = authService.issueAccessToken(user);
  const { raw, expiresAt }     = authService.issueRefreshToken(user.id);

  auditService.logEvent('login_success', req, { userId: user.id });
  res.cookie('refreshToken', raw, { ...REFRESH_COOKIE, maxAge: expiresAt - nowMs() });
  res.json({ accessToken });
}

// POST /api/auth/logout
function logout(req, res) {
  const authHeader    = req.headers['authorization'] || '';
  const rawToken      = req.cookies?.refreshToken;
  const { jti, exp }  = require('jsonwebtoken').decode(authHeader.slice(7)) || {};

  if (jti) authService.revokeAccessToken(jti, req.user.userId, exp * 1000);
  if (rawToken) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    tokenModel.deleteRefreshToken(hash);
  }

  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  auditService.logEvent('logout', req);
  res.status(204).end();
}

// POST /api/auth/refresh
function refresh(req, res) {
  const raw = req.cookies?.refreshToken;
  if (!raw) return res.status(401).json({ error: 'No refresh token' });

  const hash    = crypto.createHash('sha256').update(raw).digest('hex');
  const stored  = tokenModel.findRefreshToken(hash);

  if (!stored)             return res.status(401).json({ error: 'Invalid refresh token' });
  if (stored.expires_at < nowMs()) {
    tokenModel.deleteRefreshToken(hash);
    return res.status(401).json({ error: 'Refresh token expired' });
  }
  if (stored.is_used) {
    tokenModel.revokeTokenFamily(stored.family_id);
    return res.status(401).json({ error: 'Refresh token already used — possible replay attack' });
  }

  const user = userModel.findById(stored.user_id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const newRecord = authService.rotateRefreshToken(stored);
  const { token: accessToken } = authService.issueAccessToken(user);

  res.cookie('refreshToken', newRecord.raw, { ...REFRESH_COOKIE, maxAge: newRecord.expiresAt - nowMs() });
  res.json({ accessToken });
}

// GET /api/auth/me
function me(req, res) {
  const user = userModel.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { id, username, email, role, status, storage_used, storage_quota, created_at } = user;
  res.json({ id, username, email, role, status, storageUsed: storage_used, storageQuota: storage_quota, createdAt: created_at });
}

// GET /api/auth/avatar
async function getAvatar(req, res) {
  const userDir = path.join(process.env.UPLOADS_DIR || './data/uploads', req.user.userId, 'profile');
  const candidates = ['avatar.jpg', 'avatar.png', 'avatar.webp'];

  for (const filename of candidates) {
    const filePath = path.join(userDir, filename);
    try {
      await fs.promises.access(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.jpg'
        ? 'image/jpeg'
        : ext === '.png'
          ? 'image/png'
          : 'image/webp';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=300');
      return fs.createReadStream(filePath).pipe(res);
    } catch {
      // try next
    }
  }

  return res.status(404).json({ error: 'Avatar not set' });
}

// POST /api/auth/avatar
async function uploadAvatar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No avatar uploaded' });

  const ext = AVATAR_EXT_BY_MIME[req.file.mimetype];
  if (!ext) return res.status(400).json({ error: 'Unsupported avatar format' });

  const profileDir = path.join(process.env.UPLOADS_DIR || './data/uploads', req.user.userId, 'profile');
  await fs.promises.mkdir(profileDir, { recursive: true });

  await Promise.all(['avatar.jpg', 'avatar.png', 'avatar.webp'].map(async (name) => {
    const p = path.join(profileDir, name);
    await fs.promises.unlink(p).catch(() => {});
  }));

  const targetPath = path.join(profileDir, `avatar${ext}`);
  await fs.promises.writeFile(targetPath, req.file.buffer);

  auditService.logEvent('avatar_update', req, { metadata: { mimeType: req.file.mimetype, size: req.file.size } });
  res.json({ ok: true });
}

// DELETE /api/auth/account
async function deleteAccount(req, res) {
  const user = userModel.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const authHeader = req.headers['authorization'] || '';
  const rawToken = req.cookies?.refreshToken;
  const { jti, exp } = require('jsonwebtoken').decode(authHeader.slice(7)) || {};
  if (jti && exp) authService.revokeAccessToken(jti, req.user.userId, exp * 1000);
  if (rawToken) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    tokenModel.deleteRefreshToken(hash);
  }

  userModel.deleteById(req.user.userId);

  const userDir = path.join(process.env.UPLOADS_DIR || './data/uploads', req.user.userId);
  await fs.promises.rm(userDir, { recursive: true, force: true }).catch(() => {});

  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  auditService.logEvent('account_delete', req, { userId: req.user.userId });
  res.status(204).end();
}

// GET /api/auth/verify?token=<raw>
function verifyEmail(req, res) {
  const rawToken = req.query.token;
  if (!rawToken) return res.status(400).json({ error: 'Token required' });
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const row  = db.prepare('SELECT * FROM verification_tokens WHERE token_hash = ?').get(hash);
  if (!row || row.expires_at < nowMs()) {
    return res.status(400).json({ error: 'Invalid or expired verification link' });
  }
  userModel.updateStatus(row.user_id, 'active');
  db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(row.id);
  res.json({ message: 'Email verified. You can now log in.' });
}

// POST /api/auth/resend-verification
async function resendVerification(req, res) {
  const email = normalizeEmailPreserveDots(req.body?.email);
  const user = email ? userModel.findByEmail(email) : null;
  // Always respond 200 to avoid user enumeration
  if (!user || user.status !== 'unverified') return res.json({ message: 'If that email is unverified, a link has been sent.' });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hash     = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiry   = addHours(nowMs(), 24);
  db.prepare('DELETE FROM verification_tokens WHERE user_id = ?').run(user.id);
  db.prepare('INSERT INTO verification_tokens (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)')
    .run(uuidv4(), user.id, hash, expiry);
  const verifyUrl = `${process.env.VITE_API_BASE_URL?.replace('/api', '')}/verify?token=${rawToken}`;
  await emailService.sendVerificationEmail(email, verifyUrl).catch(() => {});
  res.json({ message: 'If that email is unverified, a link has been sent.' });
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  me,
  getAvatar,
  uploadAvatar,
  deleteAccount,
  verifyEmail,
  resendVerification,
};
