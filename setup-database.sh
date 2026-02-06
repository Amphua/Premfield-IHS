#!/bin/bash

# Database setup script for Ubuntu/Linux
echo "Setting up Student Management System Database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "   Install with: sudo apt update && sudo apt install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Starting..."
    sudo systemctl start postgresql
    sleep 3
fi

# Database configuration
DB_NAME=${DB_NAME:-student_management}
DB_USER=${DB_USER:-postgres}

# Create database if it doesn't exist
echo "Creating database: $DB_NAME"
sudo -u postgres createdb "$DB_NAME" 2>/dev/null || echo "Database already exists"

# Setup complete database schema
echo "Setting up database schema..."
psql -d "$DB_NAME" -U "$DB_USER" -f database/setup-complete-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Run: ./run-mock-data.sh (to populate with sample data)"
    echo "   2. Start server: npm run server"
    echo "   3. Start client: npm run client"
else
    echo "❌ Database setup failed"
    exit 1
fi
