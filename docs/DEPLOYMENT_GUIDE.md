# Production Deployment Guide

Complete guide for deploying Alumni Connect Hub to production.

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Docker Deployment](#docker-deployment-recommended)
3. [Manual Deployment](#manual-deployment)
4. [Database Setup](#database-setup)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Environment Configuration](#environment-configuration)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Server Requirements

### Minimum Specifications

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Required Software

- Docker & Docker Compose (for Docker deployment)
- Node.js 18+ (for manual deployment)
- Nginx (reverse proxy)
- Certbot (SSL certificates)
- SQL Server 2019+ (can be on separate server)

---

## Docker Deployment (Recommended)

### Step 1: Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone Repository

```bash
cd /opt
sudo git clone <repository-url> alumni-connect
cd alumni-connect
sudo chown -R $USER:$USER .
```

### Step 3: Configure Environment

```bash
# Backend environment
cp server/.env.example server/.env
nano server/.env
```

Configure the following in `server/.env`:

```env
PORT=3001
NODE_ENV=production

# Database
DB_HOST=your-sql-server-host
DB_PORT=1433
DB_NAME=potch_gim_alumni_db
DB_USER=production_user
DB_PASS=strong_password_here

# JWT - Generate with: openssl rand -base64 64
JWT_SECRET=your-64-character-minimum-secret-here
JWT_EXPIRES_IN=7d

# CORS - Your production domains
CORS_ORIGIN=https://alumni.potchgim.co.za,https://www.alumni.potchgim.co.za
```

Create root `.env` for web frontend:

```bash
echo "VITE_API_URL=https://api.alumni.potchgim.co.za/api" > .env
```

### Step 4: Build and Start

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up --build -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 5: Configure Nginx Reverse Proxy

```bash
sudo apt install nginx -y

# Create site configuration
sudo nano /etc/nginx/sites-available/alumni-connect
```

Add the following configuration:

```nginx
# API Server
server {
    listen 80;
    server_name api.alumni.potchgim.co.za;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # File upload size limit
        client_max_body_size 10M;
    }
}

# Web Frontend
server {
    listen 80;
    server_name alumni.potchgim.co.za www.alumni.potchgim.co.za;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/alumni-connect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Manual Deployment

### Backend Deployment

```bash
cd server
npm ci --production
npm run build
npm start
```

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
cd server
pm2 start npm --name "alumni-api" -- start

# Save PM2 process list
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
# Build web frontend
npm ci
npm run build

# The dist/ folder contains static files
# Serve with Nginx or any static hosting
```

Nginx configuration for static files:

```nginx
server {
    listen 80;
    server_name alumni.potchgim.co.za;
    root /opt/alumni-connect/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Database Setup

### SQL Server Configuration

1. **Create Database:**

```sql
CREATE DATABASE potch_gim_alumni_db;
GO
```

2. **Create Application User:**

```sql
USE potch_gim_alumni_db;
GO

CREATE LOGIN alumni_app WITH PASSWORD = 'StrongPassword123!';
CREATE USER alumni_app FOR LOGIN alumni_app;
ALTER ROLE db_datareader ADD MEMBER alumni_app;
ALTER ROLE db_datawriter ADD MEMBER alumni_app;
GO
```

3. **Run Migrations:**

The backend automatically creates tables on first startup. Check server logs.

### Database Backup

```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR

# SQL Server backup using sqlcmd
sqlcmd -S localhost -U sa -P 'YourPassword' -Q "BACKUP DATABASE potch_gim_alumni_db TO DISK = '/var/opt/mssql/backup/alumni_$DATE.bak'"

# Keep only last 7 days
find $BACKUP_DIR -name "alumni_*.bak" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-db.sh") | crontab -
```

---

## SSL/TLS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificates
sudo certbot --nginx -d alumni.potchgim.co.za -d www.alumni.potchgim.co.za
sudo certbot --nginx -d api.alumni.potchgim.co.za

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot automatically configures Nginx for HTTPS.

### Certificate Renewal

Certbot sets up automatic renewal. Verify with:

```bash
sudo systemctl status certbot.timer
```

---

## Environment Configuration

### Production Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | API server port | `3001` |
| `DB_HOST` | SQL Server hostname | `db.example.com` |
| `DB_PORT` | SQL Server port | `1433` |
| `DB_NAME` | Database name | `potch_gim_alumni_db` |
| `DB_USER` | Database username | `alumni_app` |
| `DB_PASS` | Database password | `SecurePassword123!` |
| `JWT_SECRET` | JWT signing key (64+ chars) | Generate with `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed origins | `https://alumni.potchgim.co.za` |

### Generating Secure Secrets

```bash
# JWT Secret (minimum 64 characters)
openssl rand -base64 64

# Database password
openssl rand -base64 32
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/alumni-connect
            git pull origin main
            docker compose -f docker-compose.prod.yml up --build -d
```

Required GitHub Secrets:
- `SERVER_HOST`: Your server IP or domain
- `SERVER_USER`: SSH username
- `SERVER_SSH_KEY`: Private SSH key

---

## Monitoring & Logs

### Docker Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### PM2 Monitoring (Manual Deployment)

```bash
# View status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs alumni-api
```

### Health Checks

Create a simple health check script:

```bash
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash
API_URL="https://api.alumni.potchgim.co.za/api/health"
WEB_URL="https://alumni.potchgim.co.za"

# Check API
if curl -sf "$API_URL" > /dev/null; then
    echo "✓ API is healthy"
else
    echo "✗ API is down!"
    # Add alerting here (email, Slack, etc.)
fi

# Check Web
if curl -sf "$WEB_URL" > /dev/null; then
    echo "✓ Web is healthy"
else
    echo "✗ Web is down!"
fi
EOF

chmod +x /opt/health-check.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/health-check.sh >> /var/log/health-check.log 2>&1") | crontab -
```

---

## Troubleshooting

### Common Issues

#### Container won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check container status
docker ps -a

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

#### Database connection issues

```bash
# Test connection from server
sqlcmd -S your-db-host -U your-user -P 'your-password' -Q "SELECT 1"

# Check if port is open
nc -zv your-db-host 1433
```

#### Nginx 502 Bad Gateway

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Useful Commands

```bash
# Restart all Docker services
docker compose -f docker-compose.prod.yml restart

# Rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache

# Remove all containers and volumes (CAREFUL!)
docker compose -f docker-compose.prod.yml down -v

# Check disk space
df -h

# Check memory usage
free -m

# Check running processes
htop
```

---

## Security Checklist

- [ ] All `.env` files have proper permissions (`chmod 600`)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key authentication only (disable password auth)
- [ ] Regular security updates enabled
- [ ] Database accessible only from application server
- [ ] SSL/TLS configured with A+ rating
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled on API
- [ ] Regular backups configured and tested

---

*See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for a complete pre-launch verification list.*
