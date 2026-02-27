-- Migration: Remove exam_name from exams table; use exam_type only.
-- Run this on existing databases that have the exam_name column.

-- 1. Backfill exam_type from exam_name where exam_type is empty/NULL
UPDATE exams
SET exam_type = COALESCE(NULLIF(TRIM(exam_type), ''), exam_name, 'Assignment')
WHERE exam_type IS NULL OR TRIM(exam_type) = '';

-- 2. Ensure no NULLs remain
UPDATE exams SET exam_type = 'Assignment' WHERE exam_type IS NULL OR exam_type = '';

-- 3. Make exam_type NOT NULL with default (required before dropping exam_name)
ALTER TABLE exams
  MODIFY COLUMN exam_type VARCHAR(50) NOT NULL DEFAULT 'Assignment';

-- 4. Drop exam_name column
ALTER TABLE exams DROP COLUMN exam_name;
