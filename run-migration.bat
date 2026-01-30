@echo off
echo Running database migration to add level and year fields...
echo.

REM Check if PostgreSQL is running
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL is not running. Please start PostgreSQL first.
    pause
    exit /b 1
)

REM Run the migration script
echo Executing migration script...
psql -h localhost -U postgres -d student_management -f database/migration_add_level_year.sql

if %errorlevel% equ 0 (
    echo.
    echo Migration completed successfully!
    echo Level and Year fields have been added to the students table.
) else (
    echo.
    echo Migration failed. Please check the error message above.
)

echo.
pause
