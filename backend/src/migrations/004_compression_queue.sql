-- ============================================================
-- MIGRATION 004: COMPRESSION TASK QUEUE + EMAIL VERIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS compression_tasks (
    file_id         TEXT    PRIMARY KEY
                    REFERENCES files(id) ON DELETE CASCADE,
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','processing','done','skipped','error')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at INTEGER,
    error_message   TEXT,
    created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ct_status ON compression_tasks(status);

-- Reset any tasks stuck as 'processing' from a previous crash.
-- Run on server startup in compressionQueue.js before polling begins:
-- UPDATE compression_tasks SET status='pending' WHERE status='processing';

-- Email verification tokens (optional — set EMAIL_VERIFICATION_REQUIRED=true)
CREATE TABLE IF NOT EXISTS verification_tokens (
    id          TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT    NOT NULL UNIQUE,
    expires_at  INTEGER NOT NULL
);
