-- Migration script to add sports_house and cca fields to students table
-- Run this script to update existing database schema

-- Add new columns to students table
ALTER TABLE students 
ADD COLUMN sports_house VARCHAR(20),
ADD COLUMN cca VARCHAR(20);

-- Update existing students with default values (optional)
UPDATE students 
SET sports_house = 'yellow', 
    cca = 'silat' 
WHERE sports_house IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_students_sports_house ON students(sports_house);
CREATE INDEX IF NOT EXISTS idx_students_cca ON students(cca);

-- Success message
SELECT 'Migration completed: Added sports_house and cca fields to students table' AS migration_status;
