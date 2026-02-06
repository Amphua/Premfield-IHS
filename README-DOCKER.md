# Docker Deployment Guide

## Overview

This Student Management System can be deployed using Docker and Docker Compose for easy setup and management across different environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- At least 4GB disk space

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd personal-website
```

### 2. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## Docker Services

### 1. PostgreSQL Database
- **Container**: `student-management-db`
- **Image**: `postgres:15-alpine`
- **Port**: `5432:5432`
- **Volume**: `postgres_data` (persistent data)
- **Initialization**: Automatically runs schema and mock data

### 2. Backend API
- **Container**: `student-management-api`
- **Build**: Multi-stage Node.js build
- **Port**: `5000:5000`
- **Health Check**: `/api/health`
- **Depends on**: PostgreSQL

### 3. Frontend Web
- **Container**: `student-management-web`
- **Build**: React app + Nginx
- **Port**: `80:80`
- **Health Check**: HTTP request to localhost
- **Depends on**: Backend

## Configuration

### Environment Variables
The application uses `.env.docker` for Docker-specific configuration. Key variables:

```env
DB_HOST=postgres
DB_NAME=student_management
DB_USER=postgres
DB_PASSWORD=ilhamx019
NODE_ENV=production
PORT=5000
```

### Custom Configuration
To customize settings:

1. Copy `.env.docker` to `.env`:
```bash
cp .env.docker .env
```

2. Edit `.env` with your values:
```bash
nano .env
```

3. Restart services:
```bash
docker-compose down
docker-compose up -d
```

## Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend

# Check service status
docker-compose ps

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d student_management
```

### Development Mode
```bash
# Start with hot reload (development)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or run individual services
docker-compose up postgres
docker-compose up backend
docker-compose up frontend
```

### Production Mode
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=2
```

## Data Management

### Database Backup
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres student_management > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres student_management < backup.sql
```

### Persistent Data
- Database data is stored in Docker volume `postgres_data`
- Uploaded files are mounted to `./server/uploads`
- Volume persists across container restarts

## Monitoring

### Health Checks
All services include health checks:
```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect student-management-api | grep Health -A 10
```

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Log levels
docker-compose logs --tail=100 backend

# Export logs
docker-compose logs > app.log
```

## Security

### Network Security
- Services communicate via isolated Docker network
- Only necessary ports exposed to host
- Database not accessible from outside Docker network

### Environment Variables
- Sensitive data stored in environment variables
- `.env` file not included in Docker build context
- Use secrets management in production

## Troubleshooting

### Common Issues

1. **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :80
netstat -tulpn | grep :5432

# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Change frontend port
  - "5433:5432" # Change database port
```

2. **Database Connection Issues**
```bash
# Check database container
docker-compose logs postgres

# Test database connection
docker-compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  user: 'postgres',
  password: 'ilhamx019',
  database: 'student_management'
});
pool.query('SELECT NOW()').then(console.log).catch(console.error);
"
```

3. **Build Failures**
```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

4. **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./server/uploads
chmod -R 755 ./server/uploads
```

### Debug Mode
```bash
# Run with debug output
docker-compose up --build

# Enter container for debugging
docker-compose exec backend sh
docker-compose exec postgres sh
```

## Performance Optimization

### Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Caching
- Nginx configured with gzip compression
- Static assets cached for 1 year
- Database connection pooling enabled

## Production Deployment

### Environment Setup
1. **Server Requirements**:
   - Ubuntu 20.04+ or CentOS 8+
   - Docker Engine installed
   - Docker Compose installed
   - Firewall configured

2. **Domain Setup**:
   - Configure DNS A record
   - Set up SSL certificate
   - Configure reverse proxy if needed

### Deployment Steps
```bash
# 1. Prepare server
sudo apt update && sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 2. Clone and deploy
git clone <your-repo-url>
cd personal-website
cp .env.docker .env
# Edit .env with production values
docker-compose up -d

# 3. Setup SSL (optional)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### Monitoring and Maintenance
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/docker-containers

# Setup monitoring
docker run -d \
  --name=cadvisor \
  -p 8080:8080 \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:rw \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor:latest
```

## Advanced Configuration

### Multi-Stage Build Optimization
The Dockerfile uses multi-stage builds for:
- Smaller final image size
- Better security (no build tools in production)
- Faster deployment times

### Custom Docker Compose Files
- `docker-compose.yml` - Base configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production optimizations

### External Services
For production, consider:
- External database (AWS RDS, Google Cloud SQL)
- Object storage for files (AWS S3, Google Cloud Storage)
- CDN for static assets (Cloudflare, AWS CloudFront)
- Load balancer (AWS ELB, Nginx Plus)
