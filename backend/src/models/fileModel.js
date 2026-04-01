'use strict';

// models/fileModel.js — files table CRUD + soft delete.

const db = require('../config/db');

const stmtInsert = db.prepare(`
  INSERT INTO files
    (id, user_id, original_filename, stored_filename, mime_type,
     original_size_bytes, compression_status, encryption_iv,
     encryption_auth_tag, is_deleted, created_at, updated_at)
  VALUES
    (@id, @userId, @originalFilename, @storedFilename, @mimeType,
     @originalSizeBytes, 'pending', @encryptionIv,
     @encryptionAuthTag, 0, @createdAt, @updatedAt)
`);
const stmtFindById = db.prepare(
  'SELECT * FROM files WHERE id = ? AND is_deleted = 0'
);
const stmtFindByUser = db.prepare(`
  SELECT * FROM files
  WHERE user_id = ? AND is_deleted = 0
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`);
const stmtCountByUser = db.prepare(
  'SELECT COUNT(*) AS cnt FROM files WHERE user_id = ? AND is_deleted = 0'
);
const stmtSoftDelete = db.prepare(
  'UPDATE files SET is_deleted = 1, updated_at = @now WHERE id = @id AND user_id = @userId'
);
const stmtUpdateCompression = db.prepare(`
  UPDATE files SET
    stored_filename       = @storedFilename,
    compression_status    = @compressionStatus,
    compression_algorithm = @compressionAlgorithm,
    compressed_size_bytes = @compressedSizeBytes,
    encryption_iv         = @encryptionIv,
    encryption_auth_tag   = @encryptionAuthTag,
    updated_at            = @now
  WHERE id = @id
`);

module.exports = {
  create:             (data)  => stmtInsert.run(data),
  findById:           (id)    => stmtFindById.get(id),
  findByUser:         (userId, limit, offset) => stmtFindByUser.all(userId, limit, offset),
  countByUser:        (userId) => stmtCountByUser.get(userId).cnt,
  softDelete:         (id, userId) => stmtSoftDelete.run({ id, userId, now: Date.now() }),
  updateCompression:  (data)  => stmtUpdateCompression.run({ ...data, now: Date.now() }),
};
