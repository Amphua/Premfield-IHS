@echo off
echo Adding academic_year column to database...
psql -U postgres -d student_management -c "ALTER TABLE student_terms ADD COLUMN IF NOT EXISTS academic_year VARCHAR(9);"
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: academic_year column added
) else (
    echo ERROR: Failed to add column
)
pause
