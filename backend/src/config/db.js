'use strict';

// ============================================================
// config/db.js — Single SQLite connection for entire backend.
// NEVER open a second connection elsewhere.
// All model files import `db` from this module only.
// ============================================================

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Order matters: journal_mode must be set before busy_timeout
db.pragma('journal_mode = WAL');      // readers never block writer
db.pragma('synchronous  = NORMAL');   // safe + faster than FULL
db.pragma('foreign_keys = ON');       // enforce FK constraints
db.pragma('temp_store   = MEMORY');   // temp tables in RAM
db.pragma('cache_size   = -8000');    // 8MB shared page cache
db.pragma('busy_timeout = 5000');     // wait up to 5s on SQLITE_BUSY

module.exports = db;
