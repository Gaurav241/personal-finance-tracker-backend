# Backend Deployment Guide

This guide covers deploying the Personal Finance Tracker backend API to production environments.

## 🏗️ Deployment Architecture

```
Internet → Load Balancer → Nginx → Node.js App → PostgreSQL
                                              → Redis
```

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ (recommended) or CentOS 8+
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum SSD
- **Network**: Stable internet connection

### Software Requirements
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Nginx 1.18+
- PM2 (Process Manager)
- Git

## 🚀 Production Deployment

### 1. Server Setup

#### Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential

# Create application user
sudo adduser --system --group --home /opt/finance-tracker finance-app
sudo usermod -aG sudo finance-app
```

#### Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE finance_tracker;
CREATE USER finance_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE finance_tracker TO finance_user;
ALTER USER finance_user CREATEDB;
\q
EOF
```

#### Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Uncomment and set: requirepass YOUR_REDIS_PASSWORD

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Set up PM2 startup script
pm2 startup
# Follow the instructions provided by the command
```

### 2. Application Deployment

#### Clone and Setup Application

```bash
# Switch to application user
sudo su - finance-app

# Clone repository
cd /opt/finance-tracker
git clone https://github.com/Gaurav241/personal-finance-tracker.git .

# Navigate to backend
cd backend

# Install dependencies (production only)
npm ci --only=production

# Create production environment file
cp .env.example .env
```

#### Configure Environment Variables

Edit `/opt/finance-tracker/backend/.env`:

```env
# Production Environment Configuration

# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://finance_user:CHANGE_THIS_PASSWORD@localhost:5432/finance_tracker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=finance_user
DB_PASSWORD=CHANGE_THIS_PASSWORD

# Redis
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT Secrets (Generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://your-domain.com

# API Configuration
API_BASE_URL=https://api.your-domain.com

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=your-csrf-secret-key-32-characters-long

# Rate Limiting (Production values)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
GENERAL_RATE_LIMIT_WINDOW_MS=3600000
GENERAL_RATE_LIMIT_MAX_REQUESTS=1000
TRANSACTION_RATE_LIMIT_MAX_REQUESTS=100
ANALYTICS_RATE_LIMIT_MAX_REQUESTS=50

# Cache TTL (in seconds)
CACHE_TTL_ANALYTICS=900
CACHE_TTL_CATEGORIES=3600

# Logging
LOG_LEVEL=info
LOG_FILE=/opt/finance-tracker/logs/app.log
```

#### Build Application

```bash
# Build TypeScript
npm run build

# Run database migrations
npm run migrate

# Optionally seed initial data
npm run seed
```

#### Create PM2 Ecosystem File

Create `/opt/finance-tracker/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'finance-tracker-api',
    script: './dist/index.js',
    cwd: '/opt/finance-tracker/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/opt/finance-tracker/logs/err.log',
    out_file: '/opt/finance-tracker/logs/out.log',
    log_file: '/opt/finance-tracker/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

#### Create Log Directory

```bash
# Create logs directory
mkdir -p /opt/finance-tracker/logs
chown finance-app:finance-app /opt/finance-tracker/logs
```

#### Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions to enable auto-start on boot
```

### 3. Nginx Configuration

#### Create Nginx Configuration

Create `/etc/nginx/sites-available/finance-tracker-api`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upstream backend
upstream finance_api {
    least_conn;
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Logging
    access_log /var/log/nginx/finance-api-access.log;
    error_log /var/log/nginx/finance-api-error.log;

    # Health check endpoint (no rate limiting)
    location = /health {
        proxy_pass http://finance_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }

    # API documentation (rate limited)
    location /api-docs {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://finance_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Authentication endpoints (strict rate limiting)
    location ~ ^/api/v1/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://finance_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # API endpoints (general rate limiting)
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://finance_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|config)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

#### Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/finance-tracker-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 5. Database Security and Optimization

#### PostgreSQL Security Configuration

Edit `/etc/postgresql/13/main/postgresql.conf`:

```conf
# Connection settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
log_min_duration_statement = 1000

# Security
ssl = on
password_encryption = scram-sha-256
```

Edit `/etc/postgresql/13/main/pg_hba.conf`:

```conf
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

#### Database Backup Strategy

Create backup script `/opt/finance-tracker/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
DB_NAME="finance_tracker"
DB_USER="finance_user"
BACKUP_DIR="/opt/finance-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/finance_tracker_$DATE.sql.gz

# Remove old backups
find $BACKUP_DIR -name "finance_tracker_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "$(date): Database backup completed - finance_tracker_$DATE.sql.gz" >> /opt/finance-tracker/logs/backup.log
```

Make executable and schedule:

```bash
chmod +x /opt/finance-tracker/scripts/backup-db.sh

# Add to crontab for daily backups at 2 AM
echo "0 2 * * * /opt/finance-tracker/scripts/backup-db.sh" | crontab -
```

### 6. Monitoring and Logging

#### Log Rotation Configuration

Create `/etc/logrotate.d/finance-tracker`:

```conf
/opt/finance-tracker/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 finance-app finance-app
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### System Monitoring Script

Create `/opt/finance-tracker/scripts/health-check.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="https://api.your-domain.com/health"
LOG_FILE="/opt/finance-tracker/logs/health-check.log"
EMAIL="admin@your-domain.com"

# Function to log messages
log_message() {
    echo "$(date): $1" >> $LOG_FILE
}

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -eq 200 ]; then
    log_message "API health check passed"
else
    log_message "API health check failed - HTTP $response"
    # Send alert email (requires mail setup)
    echo "API health check failed at $(date)" | mail -s "Finance Tracker API Alert" $EMAIL
    
    # Restart application if needed
    pm2 restart finance-tracker-api
    log_message "Application restarted due to health check failure"
fi

# Check disk space
disk_usage=$(df /opt/finance-tracker | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    log_message "Disk usage warning: ${disk_usage}%"
    echo "Disk usage is at ${disk_usage}% on $(hostname)" | mail -s "Disk Space Warning" $EMAIL
fi

# Check memory usage
memory_usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$memory_usage > 90" | bc -l) )); then
    log_message "Memory usage warning: ${memory_usage}%"
fi
```

Schedule health checks:

```bash
chmod +x /opt/finance-tracker/scripts/health-check.sh
echo "*/5 * * * * /opt/finance-tracker/scripts/health-check.sh" | crontab -
```

### 7. Security Hardening

#### Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

#### Fail2Ban Configuration

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create custom configuration
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 8. Performance Optimization

#### Node.js Optimization

Add to ecosystem.config.js:

```javascript
env: {
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=1024',
  UV_THREADPOOL_SIZE: 16
}
```

#### Redis Optimization

Edit `/etc/redis/redis.conf`:

```conf
# Memory optimization
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence (adjust based on needs)
save 900 1
save 300 10
save 60 10000

# Network optimization
tcp-keepalive 300
timeout 300
```

### 9. Deployment Automation

#### Deployment Script

Create `/opt/finance-tracker/scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

# Configuration
APP_DIR="/opt/finance-tracker"
BACKUP_DIR="/opt/finance-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting deployment at $(date)"

# Create backup
echo "Creating database backup..."
pg_dump -U finance_user -h localhost finance_tracker | gzip > $BACKUP_DIR/pre_deploy_$DATE.sql.gz

# Pull latest code
echo "Pulling latest code..."
cd $APP_DIR
git pull origin main

# Install dependencies
echo "Installing dependencies..."
cd backend
npm ci --only=production

# Build application
echo "Building application..."
npm run build

# Run migrations
echo "Running database migrations..."
npm run migrate

# Restart application
echo "Restarting application..."
pm2 restart finance-tracker-api

# Wait for application to start
echo "Waiting for application to start..."
sleep 10

# Health check
echo "Performing health check..."
if curl -f http://localhost:5000/health; then
    echo "Deployment successful!"
else
    echo "Health check failed, rolling back..."
    pm2 restart finance-tracker-api
    exit 1
fi

echo "Deployment completed at $(date)"
```

Make executable:

```bash
chmod +x /opt/finance-tracker/scripts/deploy.sh
```

## 🔧 Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review application logs
   - Check disk space and memory usage
   - Verify backup integrity

2. **Monthly**:
   - Update system packages
   - Review security logs
   - Optimize database (VACUUM, ANALYZE)
   - Review and rotate logs

3. **Quarterly**:
   - Update Node.js and dependencies
   - Review and update SSL certificates
   - Performance testing and optimization
   - Security audit

### Troubleshooting Commands

```bash
# Check application status
pm2 status
pm2 logs finance-tracker-api

# Check system resources
htop
df -h
free -h

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check Redis status
redis-cli info
redis-cli monitor

# Check Nginx status
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/finance-api-error.log

# Check SSL certificate
openssl x509 -in /etc/letsencrypt/live/api.your-domain.com/cert.pem -text -noout
```

## 📞 Support

For deployment issues:
1. Check application logs: `pm2 logs finance-tracker-api`
2. Check system logs: `sudo journalctl -u nginx -f`
3. Review this deployment guide
4. Contact support with specific error messages and logs

Remember to replace all placeholder values (passwords, domains, etc.) with your actual production values before deployment.