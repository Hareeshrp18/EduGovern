-- Script to identify and fix duplicate faculty class-section assignments
-- Run this before adding the unique constraint

USE edugovern;

-- Step 1: Identify all duplicate class-section assignments
SELECT 
    class, 
    section, 
    COUNT(*) as faculty_count,
    GROUP_CONCAT(staff_id ORDER BY staff_id) as staff_ids,
    GROUP_CONCAT(staff_name ORDER BY staff_id) as staff_names
FROM faculty
WHERE class IS NOT NULL AND section IS NOT NULL
GROUP BY class, section
HAVING COUNT(*) > 1;

-- Step 2: For each duplicate, decide which faculty to keep as class in-charge
-- Option A: Keep the first faculty (lowest staff_id) and remove class assignment from others
-- Uncomment and modify the staff_id values based on your needs:

-- Example: If staff101@sks and staff103@sks are both assigned to Class 10, Section A
-- Keep staff101@sks and remove the assignment from staff103@sks:
-- UPDATE faculty SET class = NULL, section = NULL WHERE staff_id = 'staff103@sks';

-- Step 3: Verify no duplicates remain
SELECT 
    class, 
    section, 
    COUNT(*) as faculty_count
FROM faculty
WHERE class IS NOT NULL AND section IS NOT NULL
GROUP BY class, section
HAVING COUNT(*) > 1;

-- If the above query returns no rows, you're ready to add the unique constraint
