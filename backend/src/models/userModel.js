'use strict';

// models/userModel.js — users table CRUD using prepared statements.

const db = require('../config/db');

const stmtFindByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const stmtFindByUsername = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
const stmtFindById    = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtInsert      = db.prepare(`
  INSERT INTO users (id, username, email, password_hash, role, status, storage_quota, storage_used, created_at, updated_at)
  VALUES (@id, @username, @email, @passwordHash, @role, @status, @storageQuota, 0, @createdAt, @updatedAt)
`);
const stmtUpdateQuota = db.prepare(`
  UPDATE users SET storage_used = storage_used + @delta, updated_at = @now WHERE id = @userId
`);
const stmtUpdateLoginFail = db.prepare(`
  UPDATE users SET failed_login_count = failed_login_count + 1, updated_at = @now,
    locked_until = CASE WHEN failed_login_count + 1 >= @threshold THEN @lockUntil ELSE locked_until END
  WHERE id = @userId
`);
const stmtResetLoginFail  = db.prepare(`
  UPDATE users SET failed_login_count = 0, locked_until = NULL, updated_at = @now WHERE id = @userId
`);
const stmtGetStorageInfo  = db.prepare(
  'SELECT storage_used, storage_quota FROM users WHERE id = ?'
);
const stmtUpdateStatus = db.prepare(
  'UPDATE users SET status = @status, updated_at = @now WHERE id = @userId'
);
const stmtDeleteById = db.prepare('DELETE FROM users WHERE id = ?');

module.exports = {
  findByEmail:      (email) => stmtFindByEmail.get(email),
  findByUsername:   (username) => stmtFindByUsername.get(username),
  findById:         (id)    => stmtFindById.get(id),
  create:           (data)  => stmtInsert.run(data),
  updateQuota:      (userId, delta) => stmtUpdateQuota.run({ userId, delta, now: Date.now() }),
  recordLoginFail:  (userId, threshold, lockUntil) =>
    stmtUpdateLoginFail.run({ userId, threshold, lockUntil, now: Date.now() }),
  resetLoginFail:   (userId) => stmtResetLoginFail.run({ userId, now: Date.now() }),
  getStorageInfo:   (userId) => stmtGetStorageInfo.get(userId),
  updateStatus:     (userId, status) => stmtUpdateStatus.run({ userId, status, now: Date.now() }),
  deleteById:       (userId) => stmtDeleteById.run(userId),
};
