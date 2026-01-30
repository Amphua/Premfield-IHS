@echo off
echo Fixing student terms table...

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

REM Run the fix script
%PSQL_PATH% -U postgres -d student_management -f "database\fix-student-terms.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Student terms table fixed successfully!
) else (
    echo.
    echo ERROR: Failed to fix student terms table
    echo Please check your PostgreSQL connection and database name
)

pause
