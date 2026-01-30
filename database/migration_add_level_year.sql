-- Migration script to add level and year fields to students table
-- Run this script to update existing database

-- Add level and year columns to students table
ALTER TABLE students 
ADD COLUMN level INTEGER CHECK (level IN (1, 2, 3)),
ADD COLUMN year VARCHAR(20);

-- Update existing records with default values
UPDATE students 
SET level = 2, year = 'Year 4' 
WHERE class IN ('10A', '10B');

-- Update existing records based on class mapping
UPDATE students 
SET level = CASE 
    WHEN class IN ('10A', '10B') THEN 2
    WHEN class IN ('11A', '11B') THEN 3
    ELSE 1
END,
year = CASE
    WHEN class = '10A' THEN 'Year 4'
    WHEN class = '10B' THEN 'Year 5'
    WHEN class = '11A' THEN 'Year 6'
    WHEN class = '11B' THEN 'Year 7'
    ELSE 'Year 1'
END;

-- Make columns NOT NULL after updating existing records
ALTER TABLE students 
ALTER COLUMN level SET NOT NULL,
ALTER COLUMN year SET NOT NULL;

-- Add unique constraint for full_name (if duplicates don't exist)
-- This will fail if there are duplicate names, which is expected
DO $$
BEGIN
    ALTER TABLE students ADD CONSTRAINT unique_student_name UNIQUE (full_name);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Unique constraint already exists or duplicate names found';
END $$;
