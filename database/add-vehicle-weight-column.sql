-- Add vehicle_weight column to buses table
-- Run this script to update the existing buses table

ALTER TABLE buses 
ADD COLUMN vehicle_weight DECIMAL(10, 2) NULL AFTER capacity;

-- Add index for better query performance (optional)
CREATE INDEX idx_vehicle_weight ON buses(vehicle_weight);
