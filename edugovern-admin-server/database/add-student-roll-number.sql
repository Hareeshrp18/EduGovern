-- Add roll_no column to students table
-- This supports the new roll number format: STUD{class}{rollno}@sks

USE edugovern;

-- Add roll_no column if it doesn't exist
ALTER TABLE students
ADD COLUMN IF NOT EXISTS roll_no VARCHAR(50) NULL AFTER student_id;

-- Add index on roll_no for better query performance
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);

-- Add composite index on class and roll_no for uniqueness checking
CREATE INDEX IF NOT EXISTS idx_students_class_roll ON students(class, roll_no);

-- Verify the column was added
DESCRIBE students;

-- Show sample data
SELECT student_id, roll_no, name, class, section FROM students LIMIT 10;
