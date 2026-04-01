'use strict';

// scripts/restore-files.js — CLI tool to restore a file archive backup.
// Usage: node restore-files.js <archive.tar.zst>
// Verifies SHA-256 from manifest, extracts .tar.zst to data/uploads/.

const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const { pipeline } = require('stream/promises');
const tar      = require('tar-stream');
const zstd     = require('@mongodb-js/zstd');

require('../config/env');
const logger = require('../utils/logger');

const DATA_DIR   = path.resolve(process.env.DATA_DIR   || path.join(__dirname, '../../../data'));
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../../../backups'));
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const MANIFEST   = path.join(BACKUP_DIR, 'backup_manifest.json');

async function main() {
  const [,, archiveFile] = process.argv;
  if (!archiveFile) {
    console.error('Usage: node restore-files.js <archive.tar.zst>');
    process.exit(1);
  }

  const srcPath = path.isAbsolute(archiveFile) ? archiveFile : path.join(BACKUP_DIR, archiveFile);

  if (!fs.existsSync(srcPath)) {
    logger.error({ srcPath }, 'Archive file not found');
    process.exit(1);
  }

  // Verify checksum from manifest
  if (fs.existsSync(MANIFEST)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    const baseName  = path.basename(srcPath);
    const entry     = manifest.find(e => e.filename === baseName);

    if (!entry) {
      logger.warn({ baseName }, 'Archive not in manifest — skipping checksum verification');
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

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  logger.info({ srcPath, UPLOAD_DIR }, 'Extracting archive...');

  let count = 0;

  await new Promise((resolve, reject) => {
    const readStream    = fs.createReadStream(srcPath);
    const decompressor  = zstd.createDecompressStream();
    const extract       = tar.extract();

    extract.on('entry', (header, stream, next) => {
      const outPath = path.join(UPLOAD_DIR, header.name);
      const outDir  = path.dirname(outPath);

      fs.mkdirSync(outDir, { recursive: true });

      if (header.type === 'directory') {
        stream.resume();
        return next();
      }

      const writeStream = fs.createWriteStream(outPath);
      stream.pipe(writeStream);
      writeStream.on('finish', () => { count++; next(); });
      writeStream.on('error', reject);
      stream.on('error', reject);
    });

    extract.on('finish', resolve);
    extract.on('error', reject);

    readStream.pipe(decompressor).pipe(extract);
    readStream.on('error', reject);
    decompressor.on('error', reject);
  });

  logger.info({ count }, 'Archive extraction complete');
  process.exit(0);
}

main().catch(err => {
  logger.error(err, 'Restore-files failed');
  process.exit(1);
});
