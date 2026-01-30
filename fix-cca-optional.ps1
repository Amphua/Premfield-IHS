$env:PGPASSWORD = "postgres"
& psql -U postgres -d student_management -c "ALTER TABLE students ADD COLUMN IF NOT EXISTS cca_optional VARCHAR(20);"
& psql -U postgres -d student_management -c "UPDATE students SET cca_optional = 'none' WHERE cca_optional IS NULL;"
Write-Host "CCA Optional column added and updated!"
