'use strict';

// middleware/uploadAbuse.js
// Enforces per-user hourly/daily/total upload limits.
// Uses node-cache for in-memory counters per user.
// Returns 429 if any limit is exceeded.

const NodeCache = require('node-cache');
const db        = require('../config/db');

const MAX_DAILY = parseInt(process.env.UPLOAD_MAX_DAILY        || '100',   10);
const MAX_HOURLY= parseInt(process.env.UPLOAD_MAX_HOURLY       || '20',    10);
const MAX_TOTAL = parseInt(process.env.UPLOAD_MAX_FILES_TOTAL  || '10000', 10);

const cache = new NodeCache({ useClones: false });

const stmtCount = db.prepare(
  'SELECT COUNT(*) AS cnt FROM files WHERE user_id = ? AND is_deleted = 0'
);

function getBucket(userId, period) {
  const now  = new Date();
  const slot = period === 'hour'
    ? `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDate()}${now.getUTCHours()}`
    : `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDate()}`;
  return `upload:${period}:${userId}:${slot}`;
}

async function uploadAbuse(req, res, next) {
  const userId = req.user?.userId;
  if (!userId) return next();

  const hourKey  = getBucket(userId, 'hour');
  const dayKey   = getBucket(userId, 'day');

  const hourCount= (cache.get(hourKey) || 0) + 1;
  const dayCount = (cache.get(dayKey)  || 0) + 1;

  if (hourCount > MAX_HOURLY) {
    return res.status(429).json({
      error: 'Hourly upload limit reached',
      limit: MAX_HOURLY,
      resetsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
  }
  if (dayCount > MAX_DAILY) {
    return res.status(429).json({
      error: 'Daily upload limit reached',
      limit: MAX_DAILY,
      resetsAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
    });
  }

  const { cnt } = stmtCount.get(userId);
  if (cnt >= MAX_TOTAL) {
    return res.status(429).json({
      error: 'Total file limit reached for this account',
      limit: MAX_TOTAL,
    });
  }

  // Commit counters after passing checks
  cache.set(hourKey, hourCount, 3600);
  cache.set(dayKey,  dayCount,  86400);

  next();
}

module.exports = uploadAbuse;
