'use strict';

// scripts/verify-backup.js — CLI tool to verify backup checksums.
// Usage: node verify-backup.js [backup-filename]
// Re-computes SHA-256 for all (or one) backup files and compares against manifest.

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

require('../config/env');
const logger = require('../utils/logger');

const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../../../backups'));
const MANIFEST   = path.join(BACKUP_DIR, 'backup_manifest.json');

async function main() {
  const [,, targetFile] = process.argv;

  if (!fs.existsSync(MANIFEST)) {
    logger.error({ MANIFEST }, 'Backup manifest not found');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  if (!Array.isArray(manifest) || manifest.length === 0) {
    logger.warn('Manifest is empty — nothing to verify');
    process.exit(0);
  }

  const entries = targetFile
    ? manifest.filter(e => e.filename === targetFile || e.filename.includes(targetFile))
    : manifest;

  if (entries.length === 0) {
    logger.error({ targetFile }, 'No matching entries in manifest');
    process.exit(1);
  }

  let pass = 0;
  let fail = 0;
  let missing = 0;

  for (const entry of entries) {
    const filePath = path.join(BACKUP_DIR, entry.filename);

    if (!fs.existsSync(filePath)) {
      logger.warn({ filename: entry.filename }, 'MISSING — file not found on disk');
      missing++;
      continue;
    }

    const buf      = fs.readFileSync(filePath);
    const computed = crypto.createHash('sha256').update(buf).digest('hex');

    if (computed === entry.checksum) {
      logger.info({ filename: entry.filename }, 'OK');
      pass++;
    } else {
      logger.error({ filename: entry.filename, expected: entry.checksum, computed }, 'FAIL — checksum mismatch');
      fail++;
    }
  }

  console.log(`\nVerification complete: ${pass} passed, ${fail} failed, ${missing} missing`);

  if (fail > 0 || missing > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  logger.error(err, 'Verify-backup failed');
  process.exit(1);
});
