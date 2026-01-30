-- Complete Database Setup for Student Management System
-- Run this to create all required tables

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS student_terms;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- Users table for authentication and role management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table with all fields
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    class VARCHAR(10),
    level INTEGER,
    year VARCHAR(10),
    status VARCHAR(20) DEFAULT 'active',
    sports_house VARCHAR(20),
    cca VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student terms table for academic records
CREATE TABLE student_terms (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_number INTEGER NOT NULL CHECK (term_number IN (1, 2, 3)),
    academic_year VARCHAR(9) NOT NULL,
    attendance INTEGER NOT NULL CHECK (attendance >= 0 AND attendance <= 100),
    academic_score INTEGER NOT NULL CHECK (academic_score >= 0 AND academic_score <= 100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, term_number, academic_year)
);

-- Create indexes for better performance
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_student_terms_student_id ON student_terms(student_id);
CREATE INDEX idx_student_terms_term_number ON student_terms(term_number);
CREATE INDEX idx_student_terms_academic_year ON student_terms(academic_year);
CREATE INDEX idx_users_role ON users(role);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_terms_updated_at BEFORE UPDATE ON student_terms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@school.com', '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQ', 'admin'),
('teacher1', 'teacher1@school.com', '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQ', 'teacher');

-- Insert sample students
INSERT INTO students (full_name, date_of_birth, class, level, year, status, sports_house, cca) VALUES
('John Doe', '2005-03-15', '10A', 2, 'Year 4', 'active', 'yellow', 'silat'),
('Jane Smith', '2005-07-22', '10A', 2, 'Year 4', 'active', 'green', 'taekwondo'),
('Mike Johnson', '2005-11-08', '10B', 2, 'Year 5', 'active', 'blue', 'silat'),
('Sarah Williams', '2005-01-30', '10B', 2, 'Year 5', 'inactive', 'yellow', 'taekwondo');

-- Insert sample term data with multiple academic years
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

-- Success message
SELECT 'Complete database setup finished successfully!' AS setup_status;
