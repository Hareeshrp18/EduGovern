-- Add chassis_number and engine_number columns to buses table
-- Run this script to update the existing buses table

ALTER TABLE buses 
ADD COLUMN chassis_number VARCHAR(100) NULL AFTER registration_number,
ADD COLUMN engine_number VARCHAR(100) NULL AFTER chassis_number;

-- Add indexes for better query performance (optional)
CREATE INDEX idx_chassis_number ON buses(chassis_number);
CREATE INDEX idx_engine_number ON buses(engine_number);
