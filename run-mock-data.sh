#!/bin/bash

# Script to populate database with mock data
# Compatible with Ubuntu/Linux systems
echo "Populating database with mock data..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Database connection parameters
DB_NAME=${DB_NAME:-student_management}
DB_USER=${DB_USER:-postgres}

# Run the mock data SQL script
psql -d "$DB_NAME" -U "$DB_USER" -f database/create-mock-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Mock data successfully inserted!"
    echo ""
    echo "📊 Database Summary:"
    echo "   Users: 3 (admin, teacher1, teacher2)"
    echo "   Students: 24"
    echo "   Academic Records: 72"
    echo "   Announcements: 5"
    echo "   Events: 5"
    echo ""
    echo "🔑 Login Credentials:"
    echo "   Username: admin"
    echo "   Password: password"
    echo ""
    echo "   Username: teacher1"
    echo "   Password: password"
    echo ""
    echo "   Username: teacher2" 
    echo "   Password: password"
else
    echo "❌ Error inserting mock data"
    echo "   Please check:"
    echo "   - Database exists: createdb $DB_NAME"
    echo "   - User has permissions"
    echo "   - PostgreSQL is running"
    exit 1
fi
