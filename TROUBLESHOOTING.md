# 🔧 Troubleshooting Guide

## Common Deployment Issues

### ❌ Issue: "libatk-1.0.so.0: cannot open shared object file"

**Error:**
```
Failed to launch the browser process!
libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

**Cause:** Missing Chromium dependencies

**Solution:**
```bash
# Quick fix - Run the dependency installer
chmod +x install-chromium-deps.sh
./install-chromium-deps.sh

# Or install manually
sudo apt update
sudo apt install -y \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  chromium-browser

# Test again
node check-humanizer-auth.js
```

---

### ❌ Issue: "Session expired"

**Error:**
```
❌ Session found but expired. Last updated: 2025-10-02 01:54:55
❌ Job failed: Not logged in
```

**Cause:** QuillBot session expired (typically after 24-48 hours)

**Solution:**
```bash
# Re-login
node check-humanizer-auth.js login your@email.com yourpassword

# Verify
node check-humanizer-auth.js
```

---

### ❌ Issue: "Port 3000 already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Another process is using port 3000

**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or restart PM2
pm2 restart homeworkgpt

# Or change port in .env.local
echo "PORT=3001" >> .env.local
pm2 restart homeworkgpt
```

---

### ❌ Issue: "Chromium not found"

**Error:**
```
Error: Could not find Chromium
```

**Cause:** Puppeteer can't find Chromium executable

**Solution:**
```bash
# Option 1: Install Chromium
sudo apt install -y chromium-browser

# Option 2: Tell Puppeteer where to find it
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> .env.local
pm2 restart homeworkgpt

# Option 3: Use system Chrome (if installed)
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome" >> .env.local
pm2 restart homeworkgpt
```

---

### ❌ Issue: "npm ERR! code ELIFECYCLE"

**Error:**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Cause:** Build failed, usually due to memory or TypeScript errors

**Solution:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or add to .env.local
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env.local

# Check for TypeScript errors
npx tsc --noEmit

# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

### ❌ Issue: "Module not found"

**Error:**
```
Error: Cannot find module 'X'
```

**Cause:** Missing dependencies

**Solution:**
```bash
# Reinstall dependencies
npm install

# Also install quillbot-api dependencies
cd quillbot-api
npm install
cd ..

# Restart
pm2 restart homeworkgpt
```

---

### ❌ Issue: "Permission denied"

**Error:**
```
EACCES: permission denied
```

**Cause:** Insufficient file permissions

**Solution:**
```bash
# Fix .env.local permissions
chmod 600 .env.local

# Fix logs directory
mkdir -p logs
chmod 755 logs

# Fix Chrome profile
chmod -R 755 quillbot-api/chrome_profile/

# If installed packages globally with sudo
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER node_modules
```

---

### ❌ Issue: "Database connection failed"

**Error:**
```
Error: connect ETIMEDOUT
```

**Cause:** Can't connect to database

**Solution:**
```bash
# Check DATABASE_URL is set
grep DATABASE_URL .env.local

# Test connection
npm run test:db  # if you have this script

# Check firewall
sudo ufw status

# If database is on different server, allow outbound
sudo ufw allow out to <database-ip> port 5432  # PostgreSQL
```

---

### ❌ Issue: PM2 not starting app

**Error:**
```
Error: Script not found
```

**Cause:** PM2 can't find the startup script

**Solution:**
```bash
# Check if ecosystem.config.js exists
ls -la ecosystem.config.js

# Start with full path
pm2 start /full/path/to/ecosystem.config.js --env production

# Or delete and recreate
pm2 delete homeworkgpt
pm2 start ecosystem.config.js --env production
pm2 save
```

---

### ❌ Issue: "NEXT_PUBLIC_ variables not working"

**Cause:** Client-side variables not being loaded

**Solution:**
```bash
# NEXT_PUBLIC_ vars must be set at build time
# Add them to .env.local BEFORE building
nano .env.local

# Rebuild
npm run build
pm2 restart homeworkgpt
```

---

### ❌ Issue: Humanizer jobs timing out

**Error:**
```
Job timeout: Max attempts reached
```

**Cause:** Jobs taking longer than timeout setting

**Solution:**
```bash
# Increase timeout in .env.local
nano .env.local
# Add: HUMANIZER_JOB_TIMEOUT=300000  # 5 minutes

# Restart
pm2 restart homeworkgpt

# Or check if logged out
node check-humanizer-auth.js
```

---

### ❌ Issue: High memory usage

**Symptom:** Server running out of memory

**Solution:**
```bash
# Reduce browser concurrency
nano .env.local
# Change: HUMANIZER_CONCURRENCY=1  # Or lower number

# Increase PM2 memory restart limit
nano ecosystem.config.js
# Change: max_memory_restart: "2G"

# Restart
pm2 restart homeworkgpt

# Monitor memory
pm2 monit
free -h
```

---

### ❌ Issue: SSL certificate errors

**Error:**
```
Error: certificate has expired
```

**Solution:**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# If renewal fails, force renewal
sudo certbot renew --force-renewal

# Test auto-renewal
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

---

### ❌ Issue: Nginx 502 Bad Gateway

**Error:** Browser shows "502 Bad Gateway"

**Cause:** Next.js app not running or Nginx can't reach it

**Solution:**
```bash
# Check if app is running
pm2 status

# Start if stopped
pm2 start homeworkgpt

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

---

### ❌ Issue: "Module did not self-register"

**Error:**
```
Error: Module did not self-register
```

**Cause:** Native modules compiled for wrong Node version

**Solution:**
```bash
# Rebuild native modules
npm rebuild

# Or clean and reinstall
rm -rf node_modules package-lock.json
npm install

# For quillbot-api
cd quillbot-api
rm -rf node_modules package-lock.json
npm install
cd ..
```

---

## Debugging Tips

### Check Logs

```bash
# PM2 logs
pm2 logs homeworkgpt --lines 100

# Follow logs in real-time
pm2 logs homeworkgpt --lines 0

# System logs
sudo journalctl -xe

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Status

```bash
# PM2 status
pm2 status
pm2 info homeworkgpt

# Server resources
free -h        # Memory
df -h          # Disk
top            # CPU & processes

# Network
sudo netstat -tlnp  # Listening ports
```

### Test Components

```bash
# Test Next.js directly
npm start

# Test health endpoint
curl http://localhost:3000/api/humanize/health

# Test auth
curl http://localhost:3000/api/humanize/auth

# Test with full script
node test-humanizer-integration.js
```

### Enable Debug Mode

```bash
# Run with debug output
DEBUG=* npm start

# PM2 with more logging
pm2 start ecosystem.config.js --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
```

## Performance Issues

### Slow Build Times

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build

# Use more CPU cores (if available)
npm run build -- --max-old-space-size=8192
```

### Slow App Performance

```bash
# Check resources
pm2 monit

# Reduce browser concurrency
# Edit .env.local: HUMANIZER_CONCURRENCY=2

# Check database performance
# Optimize queries, add indexes

# Enable Next.js production optimizations
# Ensure NODE_ENV=production in .env.local
```

## Getting Help

If issues persist:

1. **Check logs first**
   ```bash
   pm2 logs homeworkgpt --lines 200
   ```

2. **Verify environment**
   ```bash
   node --version  # Should be 18+
   npm --version
   pm2 --version
   ```

3. **Test components individually**
   ```bash
   node check-humanizer-auth.js
   curl http://localhost:3000/api/humanize/health
   ```

4. **Check system resources**
   ```bash
   free -h
   df -h
   ```

5. **Review documentation**
   - `DEPLOYMENT_UBUNTU.md` - Full deployment guide
   - `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
   - `HUMANIZER_AUTH_SETUP.md` - Auth issues

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Missing dependencies | `./install-chromium-deps.sh` |
| Session expired | `node check-humanizer-auth.js login <email> <pass>` |
| Port in use | `pm2 restart homeworkgpt` |
| Chromium not found | `sudo apt install chromium-browser` |
| Build fails | `export NODE_OPTIONS="--max-old-space-size=4096"` |
| Module not found | `npm install` |
| Permission denied | `chmod 755 logs && chmod 600 .env.local` |
| High memory | Reduce `HUMANIZER_CONCURRENCY` |
| 502 error | `pm2 restart homeworkgpt && sudo systemctl restart nginx` |

---

**Still stuck?** Check the full deployment guide in `DEPLOYMENT_UBUNTU.md`
