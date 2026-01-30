-- Fix student_terms table to support academic years properly

-- Drop existing table if it has old structure
DROP TABLE IF EXISTS student_terms CASCADE;

-- Create new student_terms table with proper structure
CREATE TABLE student_terms (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_number INTEGER NOT NULL CHECK (term_number IN (1, 2, 3)),
    academic_year VARCHAR(9) NOT NULL DEFAULT '2024/2025', -- Format: 2024/2025, 2025/2026
    attendance INTEGER NOT NULL CHECK (attendance >= 0 AND attendance <= 100),
    academic_score INTEGER NOT NULL CHECK (academic_score >= 0 AND academic_score <= 100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, term_number, academic_year)
);

-- Create indexes for better performance
CREATE INDEX idx_student_terms_student_id ON student_terms(student_id);
CREATE INDEX idx_student_terms_term_number ON student_terms(term_number);
CREATE INDEX idx_student_terms_academic_year ON student_terms(academic_year);

-- Create trigger for updated_at
CREATE TRIGGER update_student_terms_updated_at 
    BEFORE UPDATE ON student_terms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO student_terms (student_id, term_number, academic_year, attendance, academic_score, remarks) VALUES
(1, 1, '2024/2025', 95, 88, 'Excellent performance'),
(1, 2, '2024/2025', 92, 85, 'Consistent progress'),
(1, 3, '2024/2025', 94, 90, 'Outstanding results'),
(2, 1, '2024/2025', 88, 92, 'Very good academic performance'),
(2, 2, '2024/2025', 90, 89, 'Maintaining good standards'),
(3, 1, '2025/2026', 85, 78, 'Needs improvement in attendance'),
(4, 1, '2025/2026', 78, 82, 'Fair performance, room for growth'),
(1, 1, '2025/2026', 92, 85, 'Excellent performance in new year'),
(2, 2, '2025/2026', 88, 90, 'Strong performance'),
(3, 2, '2025/2026', 85, 92, 'Good improvement from previous year'),
(4, 3, '2025/2026', 78, 88, 'Consistent effort');

SELECT 'Student terms table fixed successfully!' AS status;
