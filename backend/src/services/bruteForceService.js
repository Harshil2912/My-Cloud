'use strict';

// services/bruteForceService.js
// In-memory IP-based fail counter with TTL.
// For multi-instance deployments: replace with Redis.

const WINDOW_MS   = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 min
const MAX_FAILS   = parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10',     10);

const failMap = new Map(); // ip -> { count, firstFailAt }

function check(ip) {
  const entry = failMap.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstFailAt > WINDOW_MS) {
    failMap.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILS;
}

function recordFail(ip) {
  const now   = Date.now();
  const entry = failMap.get(ip);
  if (!entry || now - entry.firstFailAt > WINDOW_MS) {
    failMap.set(ip, { count: 1, firstFailAt: now });
  } else {
    entry.count++;
  }
}

function reset(ip) {
  failMap.delete(ip);
}

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of failMap) {
    if (now - entry.firstFailAt > WINDOW_MS) failMap.delete(ip);
  }
}, WINDOW_MS);

module.exports = { check, recordFail, reset };
