-- Add CCA Optional field to students table
-- Migration to add optional CCA field for badminton, swimming, or none

ALTER TABLE students 
ADD COLUMN cca_optional VARCHAR(20);

-- Add comment to document the field
COMMENT ON COLUMN students.cca_optional IS 'Optional CCA: badminton, swimming, none, or NULL';

-- Update existing students to have 'none' as default for optional CCA
UPDATE students 
SET cca_optional = 'none' 
WHERE cca_optional IS NULL;
