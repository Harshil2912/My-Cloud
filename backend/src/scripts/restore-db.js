'use strict';

// scripts/restore-db.js — CLI tool to restore a database backup.
// Usage: node restore-db.js <backup-file.sqlite>
// Verifies SHA-256 checksum from backup manifest before overwriting.

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

require('../config/env');
const logger = require('../utils/logger');

const DATA_DIR    = path.resolve(process.env.DATA_DIR   || path.join(__dirname, '../../../data'));
const BACKUP_DIR  = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../../../backups'));
const DB_PATH     = path.join(DATA_DIR, 'database.sqlite');
const MANIFEST    = path.join(BACKUP_DIR, 'backup_manifest.json');

async function main() {
  const [,, backupFile] = process.argv;
  if (!backupFile) {
    console.error('Usage: node restore-db.js <backup-file.sqlite>');
    process.exit(1);
  }

  const srcPath = path.isAbsolute(backupFile) ? backupFile : path.join(BACKUP_DIR, backupFile);

  if (!fs.existsSync(srcPath)) {
    logger.error({ srcPath }, 'Backup file not found');
    process.exit(1);
  }

  // Verify checksum from manifest
  if (fs.existsSync(MANIFEST)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    const baseName  = path.basename(srcPath);
    const entry     = manifest.find(e => e.filename === baseName);

    if (!entry) {
      logger.warn({ baseName }, 'File not found in manifest — skipping checksum verification');
    } else {
      const buf      = fs.readFileSync(srcPath);
      const computed = crypto.createHash('sha256').update(buf).digest('hex');
      if (computed !== entry.checksum) {
        logger.error({ expected: entry.checksum, computed }, 'Checksum mismatch — aborting restore!');
        process.exit(1);
      }
      logger.info('Checksum verified OK');
    }
  } else {
    logger.warn('Manifest not found — skipping checksum verification');
  }

  // Make a safety copy of the current DB if it exists
  if (fs.existsSync(DB_PATH)) {
    const safeName = `${DB_PATH}.pre-restore-${Date.now()}`;
    fs.copyFileSync(DB_PATH, safeName);
    logger.info({ safeName }, 'Existing database backed up');
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.copyFileSync(srcPath, DB_PATH);
  logger.info({ DB_PATH }, 'Database restored from backup');

  // Run migrations on restored DB to ensure it is up-to-date
  const runMigrations = require('./migrate');
  runMigrations();
  logger.info('Migrations applied to restored database');
  process.exit(0);
}

main().catch(err => {
  logger.error(err, 'Restore failed');
  process.exit(1);
});
