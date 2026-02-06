# Ubuntu Server Deployment Guide

## Prerequisites
- Ubuntu 20.04+ or 22.04+
- SSH access to server
- sudo privileges

## Quick Deployment

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd personal-website
```

### 2. Run Deployment Script
```bash
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

### 3. Configure Environment
Edit `.env` file for production:
```bash
nano .env
```

Update these settings:
```env
NODE_ENV=production
DB_HOST=localhost  # or your server IP
PORT=5000
```

### 4. Update Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/student-management
```

Change `server_name` to your domain or server IP.

### 5. Restart Services
```bash
sudo systemctl reload nginx
pm2 restart student-management
```

## Manual Setup (Alternative)

### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Database Setup
```bash
# Setup database
chmod +x setup-database.sh
./setup-database.sh

# Seed with sample data
chmod +x run-mock-data.sh
./run-mock-data.sh
```

### Application Setup
```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Build React app
cd client && npm run build && cd ..

# Start with PM2
pm2 start server/index.js --name "student-management"
pm2 save
pm2 startup
```

### Nginx Configuration
Create `/etc/nginx/sites-available/student-management`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/your/project/client/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/student-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

### Development (.env)
```env
NODE_ENV=development
DB_HOST=localhost
PORT=5000
```

### Production (.env)
```env
NODE_ENV=production
DB_HOST=localhost
PORT=5000
```

## Useful Commands

### PM2 Management
```bash
pm2 list                 # List all processes
pm2 logs                 # View logs
pm2 restart app-name     # Restart application
pm2 stop app-name        # Stop application
pm2 monit               # Monitor dashboard
```

### Database Management
```bash
# Connect to database
psql -U postgres -d student_management

# Backup database
pg_dump -U postgres student_management > backup.sql

# Restore database
psql -U postgres student_management < backup.sql
```

### Nginx Management
```bash
sudo nginx -t           # Test configuration
sudo systemctl reload nginx  # Reload configuration
sudo systemctl status nginx   # Check status
```

## Security Recommendations

1. **Firewall Setup**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

2. **SSL Certificate** (Recommended)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **Database Security**
- Change default PostgreSQL password
- Restrict database access to localhost
- Use environment variables for sensitive data

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

2. **Database connection failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
psql -U postgres -l
```

3. **Nginx 502 Bad Gateway**
```bash
# Check if Node.js app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

4. **Permission denied errors**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/project
chmod +x *.sh
```

## Monitoring

### Application Logs
```bash
# PM2 logs
pm2 logs student-management

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System Monitoring
```bash
# System resources
htop
df -h
free -h

# PM2 monitoring
pm2 monit
```
