'use strict';

// models/tokenModel.js — refresh_tokens + token_blacklist tables.

const db = require('../config/db');

// Refresh tokens
const stmtInsertRT   = db.prepare(`
  INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, is_used, created_at, expires_at)
  VALUES (@id, @userId, @tokenHash, @familyId, 0, @createdAt, @expiresAt)
`);
const stmtFindRT     = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?');
const stmtMarkUsed   = db.prepare('UPDATE refresh_tokens SET is_used = 1 WHERE id = ?');
const stmtDeleteRT   = db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?');
const stmtRevokeFamily= db.prepare('DELETE FROM refresh_tokens WHERE family_id = ?');
const stmtDeleteExpired=db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?');

// Token blacklist
const stmtBlacklist  = db.prepare(`
  INSERT OR IGNORE INTO token_blacklist (jti, user_id, revoked_at, expires_at)
  VALUES (@jti, @userId, @revokedAt, @expiresAt)
`);
const stmtPurgeBlacklist = db.prepare('DELETE FROM token_blacklist WHERE expires_at < ?');

module.exports = {
  insertRefreshToken:    (data)  => stmtInsertRT.run(data),
  findRefreshToken:      (hash)  => stmtFindRT.get(hash),
  markTokenUsed:         (id)    => stmtMarkUsed.run(id),
  deleteRefreshToken:    (hash)  => stmtDeleteRT.run(hash),
  revokeTokenFamily:     (familyId) => stmtRevokeFamily.run(familyId),
  deleteExpiredTokens:   ()      => stmtDeleteExpired.run(Date.now()),
  blacklistToken:        (data)  => stmtBlacklist.run(data),
  purgeBlacklist:        ()      => stmtPurgeBlacklist.run(Date.now()),
};
