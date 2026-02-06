#!/bin/bash

# Ubuntu Deployment Script for Student Management System
echo "🚀 Deploying Student Management System to Ubuntu Server..."

# Check if running as root for system packages
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Some operations require sudo privileges"
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (latest LTS)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "PostgreSQL already installed"
fi

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Setup PostgreSQL user and database
echo "🗄️  Setting up database..."
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'ilhamx019';" 2>/dev/null || echo "User already exists"
sudo -u postgres createdb student_management 2>/dev/null || echo "Database already exists"

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install
cd client && npm install && cd ..

# Setup database
echo "🗄️  Setting up database schema..."
chmod +x setup-database.sh
./setup-database.sh

# Seed database with mock data
echo "🌱 Seeding database with sample data..."
chmod +x run-mock-data.sh
./run-mock-data.sh

# Build React app for production
echo "🏗️  Building React app..."
cd client && npm run build && cd ..

# Setup PM2 configuration
echo "⚙️  Setting up PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'student-management',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Setup Nginx configuration
echo "🌐 Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/student-management << EOF
server {
    listen 80;
    server_name your-domain.com;  # Change to your domain or IP

    # React app
    location / {
        root $(pwd)/client/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/student-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup firewall
echo "🔒 Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://your-domain.com (change in Nginx config)"
echo "   API: http://your-domain.com/api"
echo ""
echo "🔧 Management commands:"
echo "   View logs: pm2 logs"
echo "   Restart app: pm2 restart student-management"
echo "   Stop app: pm2 stop student-management"
echo "   Monitor: pm2 monit"
echo ""
echo "📝 Next steps:"
echo "   1. Update server_name in /etc/nginx/sites-available/student-management"
echo "   2. Configure SSL certificate (recommended for production)"
echo "   3. Update .env file with production settings"
