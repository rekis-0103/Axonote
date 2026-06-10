-- Google Sign-In columns for users table.
-- Run manually on existing dev DB if tables were created before this migration.

USE axonote;

ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) NULL;
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS uq_users_google_sub (google_sub);
