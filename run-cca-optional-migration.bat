@echo off
echo Adding CCA Optional field to database...
psql -U postgres -d student_management -f database/migration_add_cca_optional.sql
echo Migration completed!
pause
