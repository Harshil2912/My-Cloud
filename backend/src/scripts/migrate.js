'use strict';

// scripts/migrate.js — Runs all pending DB migrations in order.
// Safe to run multiple times. Uses exclusive transaction guard.

const fs   = require('fs');
const path = require('path');
const db   = require('../config/db');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

function runMigrations() {
  // Ensure schema_migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10);
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    logger.info({ migration: file }, 'Applying migration');

    const applyMigration = db.transaction(() => {
      // Strip single-line comments, then split by semicolons
      const stripped = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      const statements = stripped
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          db.exec(stmt + ';');
        } catch (err) {
          // Ignore "already exists" errors from IF NOT EXISTS — they are safe
          if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
            throw err;
          }
        }
      }
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, Date.now());
    });

    applyMigration();
    logger.info({ migration: file }, 'Migration applied');
  }
}

module.exports = runMigrations;

// Allow running directly: node scripts/migrate.js
if (require.main === module) {
  require('../config/env');
  runMigrations();
  logger.info('All migrations complete');
  process.exit(0);
}
