-- Add student_password field to students table
-- Student password will be in ddmmyy format (date of birth), bcrypt-hashed

USE edugovern;

-- Add student_password column if it doesn't exist
ALTER TABLE students
ADD COLUMN IF NOT EXISTS student_password VARCHAR(255) NULL AFTER student_id;

-- Add index on student_password for authentication queries
CREATE INDEX IF NOT EXISTS idx_students_password ON students(student_password);

-- Verify the column was added
DESCRIBE students;

-- Show sample data
SELECT id, student_id, student_password, name, date_of_birth FROM students LIMIT 5;

-- Success message
SELECT 'Student password column added successfully!' AS Status;