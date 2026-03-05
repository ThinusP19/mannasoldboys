#!/bin/bash
# VPS Setup Script for Alumni Connect Hub
# Run this script on a fresh Ubuntu 22.04+ VPS
# Usage: sudo bash setup-vps.sh

set -e

echo "============================================"
echo "  Alumni Connect Hub - VPS Setup"
echo "============================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Update system
echo ""
echo ">>> Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo ""
echo ">>> Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "Docker already installed"
fi

# Install Docker Compose plugin
echo ""
echo ">>> Installing Docker Compose..."
apt install -y docker-compose-plugin

# Install nginx
echo ""
echo ">>> Installing nginx..."
apt install -y nginx

# Install Certbot for SSL
echo ""
echo ">>> Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create application directory
echo ""
echo ">>> Creating application directory..."
mkdir -p /opt/alumni-connect
mkdir -p /opt/alumni-connect/logs
mkdir -p /opt/alumni-connect/backups

# Set up firewall
echo ""
echo ">>> Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Create deploy user
echo ""
echo ">>> Creating deploy user..."
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  echo "User 'deploy' created and added to docker group"
else
  echo "User 'deploy' already exists"
fi

# Set permissions
chown -R deploy:deploy /opt/alumni-connect

echo ""
echo "============================================"
echo "  VPS Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Copy docker-compose.prod.yml to /opt/alumni-connect/"
echo "2. Copy .env.production to /opt/alumni-connect/"
echo "3. Configure nginx: sudo nano /etc/nginx/sites-available/alumni-connect"
echo "4. Enable site: sudo ln -s /etc/nginx/sites-available/alumni-connect /etc/nginx/sites-enabled/"
echo "5. Get SSL cert: sudo certbot --nginx -d your-domain.com"
echo "6. Start app: cd /opt/alumni-connect && docker compose -f docker-compose.prod.yml up -d"
echo ""
