@echo off
echo Running database migration for academic year field...
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL (psql) is not installed or not in PATH
    echo Please install PostgreSQL and add it to your PATH
    pause
    exit /b 1
)

REM Database connection parameters
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=student_management
set DB_USER=postgres
set DB_PASSWORD=your_password_here

REM Check if migration file exists
if not exist "database\migration_add_academic_year.sql" (
    echo ERROR: Migration file not found: database\migration_add_academic_year.sql
    pause
    exit /b 1
)

echo Connecting to database: %DB_NAME% on %DB_HOST%:%DB_PORT%
echo.

REM Run the migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "database\migration_add_academic_year.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Migration completed successfully!
    echo Academic year field has been added to the student_terms table.
) else (
    echo.
    echo ERROR: Migration failed with error code %ERRORLEVEL%
    echo Please check the database connection and migration file.
)

echo.
pause
