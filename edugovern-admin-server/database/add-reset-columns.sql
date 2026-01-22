-- Add password reset columns to existing admins table
-- Run this if you have an existing admins table without reset_token columns

USE edugovern;

-- Add reset_token column if it doesn't exist
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL;

-- Add reset_token_expiry column if it doesn't exist
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME DEFAULT NULL;

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'edugovern' 
  AND TABLE_NAME = 'admins'
  AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry');

