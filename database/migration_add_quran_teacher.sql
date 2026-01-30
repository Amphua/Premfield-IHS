-- Migration: Add quran_teacher column to students table
-- This migration adds the missing quran_teacher field to the students table

-- Add quran_teacher column to students table
ALTER TABLE students ADD COLUMN quran_teacher VARCHAR(255);

-- Update existing records with default value (optional)
-- UPDATE students SET quran_teacher = '' WHERE quran_teacher IS NULL;

-- Add comment to document the new column
COMMENT ON COLUMN students.quran_teacher IS 'Name of the Quran teacher for the student';
