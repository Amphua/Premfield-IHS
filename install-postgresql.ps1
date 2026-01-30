# PostgreSQL Installation Helper Script
# This script helps install PostgreSQL on Windows

Write-Host "=== PostgreSQL Installation Guide ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Choose your installation method:" -ForegroundColor Yellow
Write-Host "1. Download from official website (Recommended)"
Write-Host "2. Check if already installed"
Write-Host "3. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Opening PostgreSQL download page..." -ForegroundColor Green
        Start-Process "https://www.postgresql.org/download/windows/"
        Write-Host ""
        Write-Host "Installation Instructions:" -ForegroundColor Yellow
        Write-Host "1. Download and run the installer"
        Write-Host "2. Set a password for the 'postgres' user (REMEMBER THIS!)"
        Write-Host "3. Keep port 5432 as default"
        Write-Host "4. Make sure to 'Add PostgreSQL to PATH'"
        Write-Host "5. Complete installation"
        Write-Host ""
        Write-Host "After installation, run this script again and choose option 2"
    }
    
    "2" {
        Write-Host "Checking for PostgreSQL installation..." -ForegroundColor Green
        
        # Check if psql is available
        try {
            $psqlVersion = psql --version 2>$null
            if ($psqlVersion) {
                Write-Host "✅ PostgreSQL is installed!" -ForegroundColor Green
                Write-Host "Version: $psqlVersion"
                
                # Check if service is running
                $services = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
                if ($services) {
                    Write-Host "✅ PostgreSQL service found:" -ForegroundColor Green
                    $services | ForEach-Object {
                        $status = if ($_.Status -eq "Running") { "✅ Running" } else { "❌ Stopped" }
                        Write-Host "  - $($_.Name): $status"
                    }
                } else {
                    Write-Host "❌ PostgreSQL service not found" -ForegroundColor Red
                }
                
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Yellow
                Write-Host "1. Create database: psql -U postgres -c 'CREATE DATABASE student_management;'"
                Write-Host "2. Run schema: psql -U postgres -d student_management -f database/schema.sql"
                Write-Host "3. Update .env file with your database password"
                
            } else {
                throw "psql not found"
            }
        } catch {
            Write-Host "❌ PostgreSQL is not installed or not in PATH" -ForegroundColor Red
            Write-Host ""
            Write-Host "To install PostgreSQL:" -ForegroundColor Yellow
            Write-Host "1. Visit: https://www.postgresql.org/download/windows/"
            Write-Host "2. Download and run the installer"
            Write-Host "3. Make sure to check 'Add PostgreSQL to PATH'"
        }
    }
    
    "3" {
        Write-Host "Goodbye!" -ForegroundColor Green
    }
    
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
