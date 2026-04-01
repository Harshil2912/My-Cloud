'use strict';

// services/backupService.js
// node-cron scheduled backups: DB snapshot (daily) + file archive (weekly).
// Writes SHA-256 checksums to backup_manifest table and JSON file.

const fs      = require('fs');
const path    = require('path');
const cron    = require('node-cron');
const db      = require('../config/db');
const backupModel   = require('../models/backupModel');
const auditService  = require('./auditService');
const { checksumFile } = require('../utils/checksum');
const logger    = require('../utils/logger');

const BACKUP_DIR       = process.env.BACKUP_DIR      || path.join(__dirname, '../../backups');
const UPLOADS_DIR      = process.env.UPLOADS_DIR     || path.join(__dirname, '../../data/uploads');
const DB_PATH          = process.env.DB_PATH          || path.join(__dirname, '../../data/database.sqlite');
const KEEP_COUNT       = parseInt(process.env.BACKUP_KEEP_COUNT || '7', 10);
const BACKUP_ENABLED   = process.env.BACKUP_ENABLED !== 'false';

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

async function backupDatabase() {
  const startedAt  = Date.now();
  const filename   = `db-${dateStamp()}.sqlite`;
  const destDir    = path.join(BACKUP_DIR, 'db');
  const dest       = path.join(destDir, filename);
  fs.mkdirSync(destDir, { recursive: true });

  logger.info({ filename }, 'DB backup starting');
  db.pragma('wal_checkpoint(TRUNCATE)');
  await fs.promises.copyFile(DB_PATH, dest);

  const sha256      = await checksumFile(dest);
  const stat        = await fs.promises.stat(dest);
  const completedAt = Date.now();

  backupModel.insert({
    backupType: 'db', filename, filepath: dest, sha256Checksum: sha256,
    sizeBytes: stat.size, startedAt, completedAt, durationMs: completedAt - startedAt,
    status: 'success', errorMessage: null,
  });

  backupModel.pruneOldest('db', KEEP_COUNT);
  logger.info({ filename, durationMs: completedAt - startedAt }, 'DB backup complete');
}

async function backupFiles() {
  const startedAt = Date.now();
  logger.info('Files backup starting');

  const filename = `files-${dateStamp()}.tar.zst`;
  const destDir  = path.join(BACKUP_DIR, 'files');
  const dest     = path.join(destDir, filename);
  fs.mkdirSync(destDir, { recursive: true });

  const { createCompressStream } = require('@mongodb-js/zstd');
  const tar = require('tar-stream');
  const pack = tar.pack();
  const zstdStream = createCompressStream({ level: 3 });
  const writeStream = fs.createWriteStream(dest);

  await new Promise((resolve, reject) => {
    const { pipeline } = require('stream');
    pipeline(pack, zstdStream, writeStream, (err) => err ? reject(err) : resolve());
    packDirectory(pack, UPLOADS_DIR, UPLOADS_DIR);
  });

  const sha256      = await checksumFile(dest);
  const stat        = await fs.promises.stat(dest);
  const completedAt = Date.now();

  backupModel.insert({
    backupType: 'files', filename, filepath: dest, sha256Checksum: sha256,
    sizeBytes: stat.size, startedAt, completedAt, durationMs: completedAt - startedAt,
    status: 'success', errorMessage: null,
  });

  backupModel.pruneOldest('files', 4);
  logger.info({ filename, durationMs: completedAt - startedAt }, 'Files backup complete');
}

async function packDirectory(pack, baseDir, currentDir) {
  const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath   = path.join(currentDir, entry.name);
    const archivePath= path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      await packDirectory(pack, baseDir, fullPath);
    } else {
      const stat   = await fs.promises.stat(fullPath);
      const stream = fs.createReadStream(fullPath);
      await new Promise((resolve, reject) => {
        const entry = pack.entry({ name: archivePath, size: stat.size }, (err) => err ? reject(err) : resolve());
        stream.pipe(entry);
      });
    }
  }
}

function startScheduler() {
  if (!BACKUP_ENABLED) return logger.info('Backup scheduler disabled');

  const dbCron    = process.env.BACKUP_CRON_DB    || '0 2 * * *';
  const filesCron = process.env.BACKUP_CRON_FILES || '0 3 * * 0';

  cron.schedule(dbCron,    () => backupDatabase().catch(err => logger.error({ err }, 'DB backup failed')));
  cron.schedule(filesCron, () => backupFiles().catch(err => logger.error({ err }, 'Files backup failed')));
  logger.info({ dbCron, filesCron }, 'Backup scheduler started');
}

module.exports = { startScheduler, backupDatabase, backupFiles };
