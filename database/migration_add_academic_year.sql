-- Migration script to add academic_year field to student_terms table
-- Run this script to update existing database schema

-- Add academic_year column to student_terms table
ALTER TABLE student_terms 
ADD COLUMN academic_year VARCHAR(9) NOT NULL DEFAULT '2024/2025';

-- Update existing records with default academic year
UPDATE student_terms 
SET academic_year = '2024/2025' 
WHERE academic_year IS NULL OR academic_year = '';

-- Drop old unique constraint and add new one
ALTER TABLE student_terms DROP CONSTRAINT IF EXISTS student_terms_student_id_term_number_key;
ALTER TABLE student_terms 
ADD CONSTRAINT student_terms_student_id_term_number_academic_year_key 
UNIQUE(student_id, term_number, academic_year);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_student_terms_academic_year ON student_terms(academic_year);

-- Success message
SELECT 'Migration completed: Added academic_year field to student_terms table' AS migration_status;
