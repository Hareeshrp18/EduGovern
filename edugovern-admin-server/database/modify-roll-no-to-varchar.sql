-- Modify roll_no column from INT to VARCHAR(50) to support format STUD{class}{rollno}@sks
-- This migration should be run if roll_no was previously created as INT

USE edugovern;

-- Check current column type
DESCRIBE students;

-- Modify roll_no column to VARCHAR(50)
ALTER TABLE students
MODIFY COLUMN roll_no VARCHAR(50) NULL;

-- Verify the change
DESCRIBE students;

-- Show sample data
SELECT id, student_id, roll_no, name, class, section FROM students LIMIT 10;
