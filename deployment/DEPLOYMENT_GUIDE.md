# Alumni Connect Hub - Deployment Guide

## Prerequisites
- A VPS (DigitalOcean, Linode, Vultr, etc.) running Ubuntu 22.04+
- A domain name pointed to your VPS IP
- A Docker Hub account
- A GitHub repository for the project

---

## Step 1: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub access token (not password) | Generate at hub.docker.com → Account Settings → Security |
| `VPS_HOST` | Your VPS IP address | `164.92.xxx.xxx` |
| `VPS_USER` | SSH username on VPS | `deploy` or `root` |
| `VPS_SSH_KEY` | Private SSH key for VPS | Contents of `~/.ssh/id_rsa` |
| `VITE_API_URL` | Production API URL | `https://api.your-domain.com/api` |

### Generate SSH Key (if needed)
```bash
ssh-keygen -t rsa -b 4096 -C "deploy@alumni-connect"
cat ~/.ssh/id_rsa  # Copy this as VPS_SSH_KEY
cat ~/.ssh/id_rsa.pub  # Add this to VPS ~/.ssh/authorized_keys
```

---

## Step 2: Provision VPS

### Option A: DigitalOcean
1. Go to digitalocean.com → Create Droplet
2. Choose Ubuntu 22.04 LTS
3. Select plan: Basic $6/mo (1GB RAM) minimum, $12/mo recommended
4. Choose datacenter region closest to your users
5. Add your SSH key
6. Create droplet

### Option B: Linode
1. Go to linode.com → Create Linode
2. Choose Ubuntu 22.04 LTS
3. Select plan: Shared CPU 1GB minimum
4. Choose region
5. Add your SSH key
6. Create Linode

---

## Step 3: Set Up VPS

SSH into your server:
```bash
ssh root@your-vps-ip
```

Upload and run the setup script:
```bash
# From your local machine
scp deployment/setup-vps.sh root@your-vps-ip:/tmp/
ssh root@your-vps-ip "bash /tmp/setup-vps.sh"
```

---

## Step 4: Configure nginx

Copy the nginx configuration:
```bash
# From your local machine
scp deployment/nginx-site.conf root@your-vps-ip:/etc/nginx/sites-available/alumni-connect
```

On the VPS, edit the config to use your domain:
```bash
ssh root@your-vps-ip
nano /etc/nginx/sites-available/alumni-connect
# Replace "your-domain.com" with your actual domain

# Enable the site
ln -s /etc/nginx/sites-available/alumni-connect /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site

# Test and reload
nginx -t
systemctl reload nginx
```

---

## Step 5: Set Up SSL with Let's Encrypt

```bash
ssh root@your-vps-ip
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically:
- Obtain SSL certificate
- Configure nginx
- Set up auto-renewal

---

## Step 6: Deploy Application

### Upload configuration files
```bash
# From your local machine
scp docker-compose.prod.yml root@your-vps-ip:/opt/alumni-connect/
scp .env.production root@your-vps-ip:/opt/alumni-connect/
```

### Update .env.production on VPS
```bash
ssh root@your-vps-ip
nano /opt/alumni-connect/.env.production
# Update:
# - DB_HOST (your SQL Server host)
# - DB_USER / DB_PASS (your database credentials)
# - CORS_ORIGIN (https://your-domain.com)
# - DOCKER_REGISTRY (your Docker Hub username/)
```

### First deployment (manual)
```bash
ssh root@your-vps-ip
cd /opt/alumni-connect

# Login to Docker Hub
docker login

# Pull and start containers
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 7: Push to GitHub

After setting up secrets and VPS, push your code:
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

The CI/CD pipeline will:
1. Run tests
2. Build Docker images
3. Push to Docker Hub
4. Deploy to VPS

---

## Troubleshooting

### Check container logs
```bash
ssh root@your-vps-ip
cd /opt/alumni-connect
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

### Restart containers
```bash
docker compose -f docker-compose.prod.yml restart
```

### Check nginx logs
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Test health endpoints
```bash
curl http://localhost:3001/health  # Backend
curl http://localhost:3000/health  # Frontend
```

### Database connection issues
- Ensure your SQL Server allows connections from VPS IP
- Check firewall rules on SQL Server
- Verify credentials in .env.production

---

## Maintenance

### Update application
Push to main branch - CI/CD will auto-deploy

### Manual update
```bash
ssh root@your-vps-ip
cd /opt/alumni-connect
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker image prune -af  # Clean old images
```

### SSL certificate renewal
Certbot auto-renews. Test with:
```bash
certbot renew --dry-run
```

### Backup database
Set up automated SQL Server backups separately.

---

## Security Checklist

- [ ] SSH key authentication only (disable password auth)
- [ ] Firewall enabled (UFW)
- [ ] SSL/HTTPS configured
- [ ] Strong JWT secret (64+ characters)
- [ ] Database credentials secured
- [ ] Rate limiting configured in nginx
- [ ] Regular security updates: `apt update && apt upgrade`
