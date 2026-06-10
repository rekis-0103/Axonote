-- Google Sign-In columns for users table.
-- Run manually on existing dev DB if tables were created before this migration.

USE axonote;

ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;

SET @schema_name = DATABASE();

SET @add_auth_provider = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT ''local''',
    'SELECT ''auth_provider already exists'''
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'auth_provider'
);
PREPARE stmt FROM @add_auth_provider;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_google_sub = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) NULL',
    'SELECT ''google_sub already exists'''
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'google_sub'
);
PREPARE stmt FROM @add_google_sub;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_google_sub_index = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD UNIQUE INDEX uq_users_google_sub (google_sub)',
    'SELECT ''uq_users_google_sub already exists'''
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'uq_users_google_sub'
);
PREPARE stmt FROM @add_google_sub_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
