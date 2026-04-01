'use strict';

// models/shareModel.js — file_shares table CRUD.

const db = require('../config/db');

const stmtCreate = db.prepare(`
  INSERT INTO file_shares
    (id, file_id, owner_id, recipient_id, permission, is_revoked, expires_at, created_at)
  VALUES
    (@id, @fileId, @ownerId, @recipientId, @permission, 0, @expiresAt, @createdAt)
`);
const stmtFindActive = db.prepare(`
  SELECT fs.*, f.original_filename, f.mime_type, f.original_size_bytes, u.email AS owner_email
  FROM file_shares fs
  JOIN files f ON fs.file_id = f.id
  JOIN users u ON fs.owner_id = u.id
  WHERE fs.recipient_id = ? AND fs.is_revoked = 0 AND fs.expires_at > ? AND f.is_deleted = 0
`);
const stmtFindById   = db.prepare(`
  SELECT fs.*, f.original_filename, f.stored_filename, f.mime_type,
         f.original_size_bytes, f.compression_status, f.encryption_iv, f.encryption_auth_tag,
         f.user_id AS file_owner_id
  FROM file_shares fs
  JOIN files f ON fs.file_id = f.id
  WHERE fs.id = ?
`);
const stmtFindByOwner= db.prepare(`
  SELECT fs.*, f.original_filename, f.mime_type, u.email AS recipient_email
  FROM file_shares fs
  JOIN files f  ON fs.file_id      = f.id
  JOIN users u  ON fs.recipient_id = u.id
  WHERE fs.owner_id = ? AND f.is_deleted = 0
  ORDER BY fs.created_at DESC
`);
const stmtRevoke     = db.prepare(`
  UPDATE file_shares SET is_revoked = 1, revoked_at = @now WHERE id = @id
`);
const stmtCheckDuplicate = db.prepare(`
  SELECT id FROM file_shares
  WHERE file_id = ? AND recipient_id = ? AND is_revoked = 0 AND expires_at > ?
`);

module.exports = {
  create:          (data)  => stmtCreate.run(data),
  findActiveForUser:(userId) => stmtFindActive.all(userId, Date.now()),
  findById:        (id)    => stmtFindById.get(id),
  findByOwner:     (ownerId) => stmtFindByOwner.all(ownerId),
  revoke:          (id)    => stmtRevoke.run({ id, now: Date.now() }),
  checkDuplicate:  (fileId, recipientId) => stmtCheckDuplicate.get(fileId, recipientId, Date.now()),
};
