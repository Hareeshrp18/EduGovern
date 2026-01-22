-- Migration script to add photo column to faculty table
-- Run this if the faculty table already exists without the photo column
-- Note: This will fail if the column already exists, which is safe

ALTER TABLE faculty 
ADD COLUMN photo VARCHAR(255) NULL 
AFTER joining_date;
