# 🚀 Ubuntu Deployment Checklist

Use this checklist when deploying to your Ubuntu server.

## Before You Push

- [ ] All changes committed
- [ ] `.env.local` NOT committed (should be in .gitignore)
- [ ] Tested locally with `npm run build && npm start`
- [ ] Authentication works: `node check-humanizer-auth.js`
- [ ] Test humanization job works locally

## On Ubuntu Server - First Time Setup

### 1. System Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential git

# Install PM2
sudo npm install -g pm2
```

### 2. Install Chromium Dependencies
```bash
sudo apt install -y \
  chromium-browser \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

### 3. Clone Repository
```bash
cd /var/www  # or your preferred location
git clone <your-repo-url>
cd <your-repo-name>
```

### 4. Setup Environment
```bash
# Create .env.local
nano .env.local
```

**Required variables:**
```env
NODE_ENV=production
PORT=3000

# Humanizer
HUMANIZER_CONCURRENCY=2
HUMANIZER_HEADLESS=true
HUMANIZER_MAX_RETRIES=3
HUMANIZER_JOB_TIMEOUT=120000

# QuillBot Login
LOGIN_EMAIL=your@email.com
LOGIN_PASSWORD=yourpassword

# Your other env vars
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 5. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 6. Login to QuillBot
```bash
node check-humanizer-auth.js login your@email.com yourpassword
```

### 7. Setup PM2 Startup
```bash
pm2 startup
# Run the command it suggests (with sudo)
pm2 save
```

### 8. Optional: Setup Nginx
```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/homeworkgpt
```

Paste this config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Long timeout for humanizer jobs
        proxy_read_timeout 300s;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/homeworkgpt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Optional: Setup SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 10. Setup Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Future Deployments

Simply run:
```bash
./deploy.sh
```

Or manually:
```bash
git pull origin main
npm install
cd quillbot-api && npm install && cd ..
npm run build
pm2 restart homeworkgpt
```

## Verification Steps

After deployment, verify everything works:

### 1. Check PM2 Status
```bash
pm2 status
pm2 logs homeworkgpt --lines 50
```

Expected: App should be "online"

### 2. Check Health
```bash
curl http://localhost:3000/api/humanize/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123,
  "queue": {...}
}
```

### 3. Check Authentication
```bash
curl http://localhost:3000/api/humanize/auth
```

Expected response:
```json
{
  "success": true,
  "loggedIn": true,
  "message": "User is already logged in"
}
```

Or use the helper:
```bash
node check-humanizer-auth.js
```

Expected output:
```
✅ LOGGED IN
📍 Status: User is already logged in
🌐 URL: https://quillbot.com/settings

✨ Ready to humanize text!
```

### 4. Test Humanization
```bash
# Submit a test job
curl -X POST http://localhost:3000/api/humanize \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test text."}'

# Note the jobId, then check status
curl http://localhost:3000/api/humanize/status/<jobId>

# Get result when completed
curl http://localhost:3000/api/humanize/result/<jobId>
```

Or use the test script:
```bash
node test-humanizer-integration.js
```

## Monitoring Setup

### Auto-restart on Reboot
Already handled by `pm2 startup` and `pm2 save`

### Check Auth Status Regularly
Add to crontab:
```bash
crontab -e
```

Add this line:
```
0 */6 * * * cd /var/www/your-repo && node check-humanizer-auth.js >> /var/log/humanizer-auth.log 2>&1
```

### Monitor Logs
```bash
# PM2 logs
pm2 logs homeworkgpt --lines 100

# Follow logs in real-time
pm2 logs homeworkgpt --lines 0

# System logs
sudo journalctl -u nginx -f  # If using Nginx
```

## Common Issues & Solutions

### Issue: Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart homeworkgpt
```

### Issue: Chromium not found
```bash
# Set executable path
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> .env.local
pm2 restart homeworkgpt
```

### Issue: Session expired
```bash
node check-humanizer-auth.js login your@email.com yourpassword
```

### Issue: Out of memory
```bash
# Increase memory limit in ecosystem.config.js
# Change: max_memory_restart: "2G"
pm2 restart homeworkgpt
```

### Issue: Build fails
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Issue: Permission denied for logs
```bash
mkdir -p logs
chmod 755 logs
pm2 restart homeworkgpt
```

## Performance Tuning

For 2GB RAM server:
```env
HUMANIZER_CONCURRENCY=2
```

For 4GB RAM server:
```env
HUMANIZER_CONCURRENCY=4
```

For 8GB+ RAM server:
```env
HUMANIZER_CONCURRENCY=6
```

## Backup Important Data

```bash
# Create backups directory
mkdir -p backups

# Backup session data
cp quillbot-api/session_data.db backups/session_data_$(date +%Y%m%d).db

# Backup .env
cp .env.local backups/.env.local_$(date +%Y%m%d)

# Automate with cron
crontab -e
```

Add:
```
0 2 * * * cd /var/www/your-repo && cp quillbot-api/session_data.db backups/session_data_$(date +\%Y\%m\%d).db
```

## Useful PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs homeworkgpt

# Monitor resources
pm2 monit

# Restart
pm2 restart homeworkgpt

# Stop
pm2 stop homeworkgpt

# Start
pm2 start homeworkgpt

# Delete from PM2
pm2 delete homeworkgpt

# View detailed info
pm2 info homeworkgpt

# Flush logs
pm2 flush

# Save current setup
pm2 save
```

## Security Checklist

- [ ] Firewall enabled (ufw)
- [ ] SSH key authentication (not passwords)
- [ ] .env.local has proper permissions (chmod 600)
- [ ] Regular system updates scheduled
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Database connection uses SSL
- [ ] API rate limiting enabled (if public)
- [ ] Nginx security headers configured
- [ ] Fail2ban installed (optional)

## Final Checklist

Before going live:

- [ ] App deploys successfully
- [ ] PM2 shows app as "online"
- [ ] Health check passes
- [ ] Authentication works
- [ ] Test humanization job completes
- [ ] Logs are being written
- [ ] PM2 startup configured
- [ ] Nginx configured (if using)
- [ ] SSL working (if using)
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Team knows how to deploy updates

## Quick Reference

| What | Command |
|------|---------|
| Deploy | `./deploy.sh` |
| Check logs | `pm2 logs homeworkgpt` |
| Check status | `pm2 status` |
| Restart | `pm2 restart homeworkgpt` |
| Check auth | `node check-humanizer-auth.js` |
| Login | `node check-humanizer-auth.js login <email> <password>` |
| Health check | `curl http://localhost:3000/api/humanize/health` |
| Test | `node test-humanizer-integration.js` |

---

**Need the full guide?** See `DEPLOYMENT_UBUNTU.md`
