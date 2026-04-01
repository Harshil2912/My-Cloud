-- ============================================================
-- MIGRATION 001: CORE TABLES
-- users, files, refresh_tokens, token_blacklist
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                  TEXT    PRIMARY KEY,
    email               TEXT    NOT NULL UNIQUE,
    password_hash       TEXT    NOT NULL,
    role                TEXT    NOT NULL DEFAULT 'user'
                        CHECK(role IN ('admin','user')),
    status              TEXT    NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active','unverified','suspended')),
    storage_quota       INTEGER NOT NULL DEFAULT 10737418240,
    storage_used        INTEGER NOT NULL DEFAULT 0,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        INTEGER,
    created_at          INTEGER NOT NULL,
    updated_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
    id                      TEXT    PRIMARY KEY,
    user_id                 TEXT    NOT NULL
                            REFERENCES users(id) ON DELETE CASCADE,
    original_filename       TEXT    NOT NULL,
    stored_filename         TEXT    NOT NULL UNIQUE,
    mime_type               TEXT    NOT NULL,
    original_size_bytes     INTEGER NOT NULL,
    compressed_size_bytes   INTEGER,
    compression_algorithm   TEXT,
    compression_status      TEXT    NOT NULL DEFAULT 'pending'
                            CHECK(compression_status IN
                                  ('pending','compressed','skipped','error')),
    encryption_iv           TEXT    NOT NULL,
    encryption_auth_tag     TEXT    NOT NULL,
    is_deleted              INTEGER NOT NULL DEFAULT 0,
    created_at              INTEGER NOT NULL,
    updated_at              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_user     ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted  ON files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_comp     ON files(compression_status);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT    NOT NULL UNIQUE,
    family_id   TEXT    NOT NULL,
    is_used     INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rt_user    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_family  ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_rt_expires ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS token_blacklist (
    jti         TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL,
    revoked_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bl_expires ON token_blacklist(expires_at);

CREATE TABLE IF NOT EXISTS schema_migrations (
    version     INTEGER PRIMARY KEY,
    applied_at  INTEGER NOT NULL
);
