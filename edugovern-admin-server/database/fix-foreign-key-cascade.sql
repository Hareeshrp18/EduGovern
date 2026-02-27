-- Fix foreign key constraint to allow student_id updates with CASCADE
-- This script will enable editing of student_id field

USE edugovern;

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE student_feedback 
DROP FOREIGN KEY fk_feedback_student;

-- Step 2: Recreate the foreign key with CASCADE UPDATE
ALTER TABLE student_feedback
ADD CONSTRAINT fk_feedback_student
FOREIGN KEY (student_id) 
REFERENCES students(student_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Step 3: Verify the change
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    UPDATE_RULE,
    DELETE_RULE
FROM
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE
    CONSTRAINT_SCHEMA = 'edugovern'
    AND CONSTRAINT_NAME = 'fk_feedback_student';

-- Success message
SELECT 'Foreign key updated successfully! Student ID is now editable.' AS Status;
