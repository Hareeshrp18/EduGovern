-- Add unique constraint to faculty table to ensure only one faculty per class-section
-- This prevents duplicate class-section assignments at the database level

USE edugovern;

-- First, check if there are any duplicate class-section assignments
SELECT class, section, COUNT(*) as count, GROUP_CONCAT(staff_id) as staff_ids
FROM faculty
WHERE class IS NOT NULL AND section IS NOT NULL
GROUP BY class, section
HAVING COUNT(*) > 1;

-- If duplicates exist, you need to resolve them manually before adding the constraint
-- For example, you can update one of the duplicates to have NULL class/section:
-- UPDATE faculty SET class = NULL, section = NULL WHERE staff_id = 'staff103@sks';

-- Add unique constraint (only run this after resolving duplicates)
-- Note: This will fail if duplicates still exist
ALTER TABLE faculty
ADD UNIQUE INDEX idx_unique_class_section (class, section);

-- To drop the constraint if needed (for testing):
-- ALTER TABLE faculty DROP INDEX idx_unique_class_section;
