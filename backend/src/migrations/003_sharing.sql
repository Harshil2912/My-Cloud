-- ============================================================
-- MIGRATION 003: FILE SHARING
-- ============================================================

CREATE TABLE IF NOT EXISTS file_shares (
    id              TEXT    PRIMARY KEY,
    file_id         TEXT    NOT NULL
                    REFERENCES files(id) ON DELETE CASCADE,
    owner_id        TEXT    NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    TEXT    NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    permission      TEXT    NOT NULL
                    CHECK(permission IN ('view','download')),
    is_revoked      INTEGER NOT NULL DEFAULT 0,
    revoked_at      INTEGER,
    expires_at      INTEGER NOT NULL,
    created_at      INTEGER NOT NULL,
    UNIQUE(file_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_file      ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_owner     ON file_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_recipient ON file_shares(recipient_id);
CREATE INDEX IF NOT EXISTS idx_shares_expires   ON file_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_shares_revoked   ON file_shares(is_revoked);
