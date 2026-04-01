-- ============================================================
-- MIGRATION 002: AUDIT LOG + BACKUP MANIFEST
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT    NOT NULL,
    user_id     TEXT,
    file_id     TEXT,
    ip_address  TEXT    NOT NULL,
    user_agent  TEXT,
    metadata    TEXT,
    timestamp   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event     ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_file      ON audit_log(file_id);

CREATE TABLE IF NOT EXISTS backup_manifest (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_type     TEXT    NOT NULL CHECK(backup_type IN ('db','files')),
    filename        TEXT    NOT NULL,
    filepath        TEXT    NOT NULL,
    sha256_checksum TEXT    NOT NULL,
    size_bytes      INTEGER NOT NULL,
    started_at      INTEGER NOT NULL,
    completed_at    INTEGER NOT NULL,
    duration_ms     INTEGER NOT NULL,
    status          TEXT    NOT NULL CHECK(status IN ('success','failed')),
    error_message   TEXT
);
