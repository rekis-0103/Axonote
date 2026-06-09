-- Bootstrap database for local dev container.
-- Application tables are owned by migrations (added when features land).

CREATE DATABASE IF NOT EXISTS axonote
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
