'use strict';

// models/backupModel.js — backup_manifest table read/write.

const db = require('../config/db');

const stmtInsert = db.prepare(`
  INSERT INTO backup_manifest
    (backup_type, filename, filepath, sha256_checksum, size_bytes,
     started_at, completed_at, duration_ms, status, error_message)
  VALUES
    (@backupType, @filename, @filepath, @sha256Checksum, @sizeBytes,
     @startedAt, @completedAt, @durationMs, @status, @errorMessage)
`);
const stmtFindAll     = db.prepare('SELECT * FROM backup_manifest ORDER BY started_at DESC');
const stmtFindById    = db.prepare('SELECT * FROM backup_manifest WHERE id = ?');
const stmtLatestByType= db.prepare(
  'SELECT * FROM backup_manifest WHERE backup_type = ? AND status = ? ORDER BY started_at DESC LIMIT 1'
);
const stmtDeleteOld   = db.prepare(`
  DELETE FROM backup_manifest
  WHERE id IN (
    SELECT id FROM backup_manifest
    WHERE backup_type = ?
    ORDER BY started_at DESC
    LIMIT -1 OFFSET ?
  )
`);

module.exports = {
  insert:        (data) => stmtInsert.run(data),
  findAll:       ()     => stmtFindAll.all(),
  findById:      (id)   => stmtFindById.get(id),
  latestByType:  (type) => stmtLatestByType.get(type, 'success'),
  pruneOldest:   (type, keepCount) => stmtDeleteOld.run(type, keepCount),
};
