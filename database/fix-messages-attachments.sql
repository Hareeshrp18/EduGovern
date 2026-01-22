-- Quick fix: Add attachment columns to messages table
-- Run this script to fix the "Unknown column 'attachment_path'" error
-- If a column already exists, you'll get an error - that's okay, just ignore it

ALTER TABLE messages ADD COLUMN attachment_path VARCHAR(255) NULL AFTER is_replied;
ALTER TABLE messages ADD COLUMN attachment_type VARCHAR(100) NULL AFTER attachment_path;
ALTER TABLE messages ADD COLUMN attachment_name VARCHAR(255) NULL AFTER attachment_type;
ALTER TABLE messages ADD COLUMN attachment_size BIGINT NULL AFTER attachment_name;
