-- Enable CASCADE UPDATE for student_id foreign key relationships
-- This allows student_id to be updated while automatically updating all related records

USE edugovern;

-- First, check if student_feedback table exists and has the foreign key
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_NAME = 'students'
    AND REFERENCED_COLUMN_NAME = 'student_id';

-- Drop existing foreign key constraint if it exists
-- Replace 'fk_feedback_student' with the actual constraint name from the query above
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'edugovern' 
    AND TABLE_NAME = 'student_feedback' 
    AND REFERENCED_TABLE_NAME = 'students'
    AND REFERENCED_COLUMN_NAME = 'student_id'
    LIMIT 1
);

SET @drop_fk = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE student_feedback DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No foreign key to drop"');

PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Recreate the foreign key with CASCADE UPDATE
-- This will automatically update student_id in student_feedback when it changes in students table
ALTER TABLE student_feedback
ADD CONSTRAINT fk_feedback_student_cascade
FOREIGN KEY (student_id) 
REFERENCES students(student_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Verify the new constraint
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    UPDATE_RULE,
    DELETE_RULE
FROM
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE
    CONSTRAINT_SCHEMA = 'edugovern'
    AND REFERENCED_TABLE_NAME = 'students';

-- Show success message
SELECT 'Foreign key constraint updated successfully with CASCADE UPDATE' AS Status;
