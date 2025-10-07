# Deployment Guide for Ubuntu Server

This guide covers deploying your Next.js app with the integrated Humanizer API to an Ubuntu server.

## Prerequisites

- Ubuntu Server (18.04 or later)
- SSH access to the server
- Domain name (optional, but recommended)
- Root or sudo access

## Quick Deployment Steps

### 1. Prepare Your Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or later)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 18.x or later
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install build essentials (needed for some npm packages)
sudo apt install -y build-essential

# Install Chromium dependencies (for Puppeteer)
sudo apt install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget \
  libgbm1

# Install Chromium browser
sudo apt install -y chromium-browser

# Install Git
sudo apt install -y git
```

### 2. Clone Your Repository

```bash
# Navigate to your web directory
cd /var/www  # or wherever you want to deploy

# Clone your repository
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Or if using existing directory
# cd /path/to/your/project
# git pull origin main
```

### 3. Setup Environment Variables

```bash
# Create .env.local file
nano .env.local
```

Add your environment variables:
```env
# Node Environment
NODE_ENV=production

# Humanizer Queue Configuration
HUMANIZER_CONCURRENCY=2
HUMANIZER_HEADLESS=true
HUMANIZER_MAX_RETRIES=3
HUMANIZER_JOB_TIMEOUT=120000

# QuillBot Credentials (REQUIRED for auto-login)
LOGIN_EMAIL=your@email.com
LOGIN_PASSWORD=yourpassword

# Next.js
PORT=3000

# Your other environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
# ... add all your other vars
```

Save and exit (Ctrl+X, then Y, then Enter)

### 4. Install Dependencies & Build

```bash
# Install dependencies
npm install

# Install quillbot-api dependencies
cd quillbot-api
npm install
cd ..

# Build the Next.js application
npm run build

# Test the build
npm start
# Press Ctrl+C after verifying it works
```

### 5. Setup PM2 for Production

Your `ecosystem.config.js` is already configured. Let's use it:

```bash
# Start the app with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (will give you a command to run with sudo)

# Check status
pm2 status
pm2 logs homeworkgpt  # or your app name
```

### 6. Login to QuillBot

```bash
# Check if logged in
node check-humanizer-auth.js

# Login (required for humanizer to work)
node check-humanizer-auth.js login your@email.com yourpassword

# Verify it worked
node check-humanizer-auth.js
```

### 7. Setup Nginx as Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/homeworkgpt
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Change this

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running humanizer jobs
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/homeworkgpt /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is setup automatically
# Test renewal
sudo certbot renew --dry-run
```

### 9. Setup Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## PM2 Management Commands

```bash
# View logs
pm2 logs homeworkgpt

# Restart app
pm2 restart homeworkgpt

# Stop app
pm2 stop homeworkgpt

# Start app
pm2 start homeworkgpt

# Monitor
pm2 monit

# Delete app from PM2
pm2 delete homeworkgpt

# View detailed info
pm2 info homeworkgpt
```

## Updating Your Application

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install
cd quillbot-api && npm install && cd ..

# Rebuild
npm run build

# Restart with PM2
pm2 restart homeworkgpt

# Check logs
pm2 logs homeworkgpt
```

## Monitoring & Maintenance

### Setup Cron Job for Auth Check

```bash
# Edit crontab
crontab -e
```

Add this line to check auth every 6 hours:
```cron
0 */6 * * * cd /var/www/your-repo && node check-humanizer-auth.js >> /var/log/humanizer-auth.log 2>&1
```

### Setup Cron Job for Auto Re-login

```bash
crontab -e
```

Add this to auto-login if session expires:
```cron
0 */12 * * * cd /var/www/your-repo && node check-humanizer-auth.js || node check-humanizer-auth.js login >> /var/log/humanizer-auth.log 2>&1
```

### Monitor Logs

```bash
# PM2 logs
pm2 logs homeworkgpt --lines 100

# System logs
sudo journalctl -u nginx -f

# Humanizer auth logs (if using cron)
tail -f /var/log/humanizer-auth.log
```

## Troubleshooting

### Puppeteer "Chrome not found"

```bash
# Set Puppeteer to use system Chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Add to .env.local
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> .env.local
```

### Port 3000 already in use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in ecosystem.config.js
```

### Build fails due to memory

```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or modify package.json build script
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

### Database connection issues

```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
npm run test:db  # if you have this script

# Check firewall isn't blocking database port
sudo ufw status
```

### Humanizer jobs failing

```bash
# Check auth status
node check-humanizer-auth.js

# Re-login
node check-humanizer-auth.js login your@email.com yourpassword

# Check PM2 logs
pm2 logs homeworkgpt

# Check browser profile permissions
ls -la quillbot-api/chrome_profile/
chmod -R 755 quillbot-api/chrome_profile/
```

## Performance Optimization

### 1. Adjust Concurrency Based on Server Resources

```bash
# Edit .env.local
nano .env.local
```

For servers with:
- **2GB RAM**: `HUMANIZER_CONCURRENCY=2`
- **4GB RAM**: `HUMANIZER_CONCURRENCY=4`
- **8GB+ RAM**: `HUMANIZER_CONCURRENCY=6-8`

### 2. Enable Compression in Nginx

Add to your Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### 3. Setup Logrotate

```bash
sudo nano /etc/logrotate.d/homeworkgpt
```

Add:
```
/var/www/your-repo/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use SSH keys** instead of passwords
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Use firewall**: Enable ufw
5. **Regular backups** of database and session data
6. **Monitor logs** regularly
7. **Use HTTPS** with Let's Encrypt
8. **Set proper file permissions**:
   ```bash
   chmod 600 .env.local
   chmod 755 quillbot-api/chrome_profile/
   ```

## Backup & Restore

### Backup Session Data

```bash
# Backup session database
cp quillbot-api/session_data.db backups/session_data_$(date +%Y%m%d).db
cp quillbot-api/humanizer_data.db backups/humanizer_data_$(date +%Y%m%d).db

# Backup Chrome profile
tar -czf backups/chrome_profile_$(date +%Y%m%d).tar.gz quillbot-api/chrome_profile/
```

### Restore Session Data

```bash
# Restore session database
cp backups/session_data_YYYYMMDD.db quillbot-api/session_data.db

# Restore Chrome profile
tar -xzf backups/chrome_profile_YYYYMMDD.tar.gz
```

## Health Checks

```bash
# Check if app is running
curl http://localhost:3000/api/humanize/health

# Check auth status
curl http://localhost:3000/api/humanize/auth

# Check queue stats
curl http://localhost:3000/api/humanize/queue
```

## Complete Deployment Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying application..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd quillbot-api && npm install && cd ..

# Build
echo "🔨 Building application..."
npm run build

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart homeworkgpt

# Check auth
echo "🔐 Checking authentication..."
node check-humanizer-auth.js

echo "✅ Deployment complete!"
echo "📊 Check logs: pm2 logs homeworkgpt"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Quick Reference

| Task | Command |
|------|---------|
| View logs | `pm2 logs homeworkgpt` |
| Restart app | `pm2 restart homeworkgpt` |
| Check status | `pm2 status` |
| Monitor | `pm2 monit` |
| Check auth | `node check-humanizer-auth.js` |
| Login | `node check-humanizer-auth.js login <email> <password>` |
| Update app | `./deploy.sh` or `git pull && npm run build && pm2 restart homeworkgpt` |
| Nginx restart | `sudo systemctl restart nginx` |
| View Nginx logs | `sudo tail -f /var/log/nginx/error.log` |

## Post-Deployment Checklist

- [ ] Server packages updated
- [ ] Node.js and npm installed
- [ ] Chromium and dependencies installed
- [ ] Repository cloned
- [ ] .env.local configured
- [ ] Dependencies installed
- [ ] Application built
- [ ] PM2 configured and running
- [ ] Logged into QuillBot
- [ ] Nginx configured (if using)
- [ ] SSL certificate installed (if using)
- [ ] Firewall configured
- [ ] Health check passing
- [ ] Test humanization job
- [ ] Cron jobs setup (optional)
- [ ] Monitoring setup

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs homeworkgpt`
2. Check system logs: `sudo journalctl -xe`
3. Verify environment variables: `cat .env.local`
4. Check auth status: `node check-humanizer-auth.js`
5. Test API health: `curl http://localhost:3000/api/humanize/health`

---

**Your application should now be running on Ubuntu!** 🎉

Access it at: `http://your-server-ip:3000` or `https://yourdomain.com` (if using Nginx+SSL)
