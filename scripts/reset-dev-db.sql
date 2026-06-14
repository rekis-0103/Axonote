-- Reset Axonote dev database (MySQL). Re-runs baseline schema from infra init.
-- Usage (XAMPP): mysql -u root < scripts/reset-dev-db.sql

SOURCE D:/AxoNote/infra/mysql/init/002_app_schema.sql;
