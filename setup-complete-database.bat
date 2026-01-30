@echo off
echo Setting up complete database schema...

REM Try common PostgreSQL paths in order of preference
set PSQL_PATH="C:\Program Files\PostgreSQL\18\bin\psql.exe"
if exist %PSQL_PATH% goto :found

set PSQL_PATH="C:\Program Files\PostgreSQL\16\bin\psql.exe"
if exist %PSQL_PATH% goto :found

set PSQL_PATH="C:\Program Files\PostgreSQL\15\bin\psql.exe"
if exist %PSQL_PATH% goto :found

set PSQL_PATH="C:\Program Files\PostgreSQL\14\bin\psql.exe"
if exist %PSQL_PATH% goto :found

echo ERROR: PostgreSQL psql not found in PATH
echo Please install PostgreSQL or add it to your PATH
echo Common locations:
echo   - "C:\Program Files\PostgreSQL\18\bin\psql.exe"
echo   - "C:\Program Files\PostgreSQL\16\bin\psql.exe"
echo   - "C:\Program Files\PostgreSQL\15\bin\psql.exe"
echo   - "C:\Program Files\PostgreSQL\14\bin\psql.exe"
pause
exit /b 1

:found
echo Found PostgreSQL at: %PSQL_PATH%

REM Run the complete setup script
"%PSQL_PATH%" -U postgres -d student_management -f "database\setup-complete-database.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Complete database setup finished!
    echo All tables created with sample data.
    echo You can now start the server.
) else (
    echo.
    echo ERROR: Database setup failed with error code %ERRORLEVEL%
    echo Please check PostgreSQL connection and permissions.
)

echo.
pause
