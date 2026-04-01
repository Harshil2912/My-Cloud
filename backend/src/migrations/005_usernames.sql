-- ============================================================
-- MIGRATION 005: USERNAMES
-- add unique username support for login/profile
-- ============================================================

ALTER TABLE users ADD COLUMN username TEXT;

UPDATE users
SET username = 'user_' || substr(replace(id, '-', ''), 1, 10)
WHERE username IS NULL OR trim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
ON users(username COLLATE NOCASE);
