# 🚀 Quick Deployment Guide

## TL;DR - Deploy to Ubuntu in 5 Minutes

```bash
# 1. On Ubuntu server - Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential git chromium-browser
sudo npm install -g pm2

# 2. Clone and setup
git clone <your-repo>
cd <your-repo>
nano .env.local  # Add your environment variables

# 3. Deploy!
chmod +x deploy.sh
./deploy.sh

# 4. Login to QuillBot
node check-humanizer-auth.js login your@email.com yourpassword

# 5. Done! Check status
pm2 status
```

## 📁 New Files Added for Deployment

| File | Purpose |
|------|---------|
| `DEPLOYMENT_UBUNTU.md` | Complete Ubuntu deployment guide |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |
| `deploy.sh` | Automated deployment script |
| `check-humanizer-auth.js` | Auth management tool |
| `HUMANIZER_AUTH_SETUP.md` | Authentication setup guide |
| `ecosystem.config.js` | PM2 configuration (updated) |

## 🎯 What You Need to Deploy

### On Ubuntu Server:
1. **Node.js 18+** - JavaScript runtime
2. **PM2** - Process manager
3. **Chromium** - For Puppeteer/browser automation
4. **Nginx** (optional) - Reverse proxy
5. **Your code** - Git clone your repo

### Environment Variables (.env.local):
```env
NODE_ENV=production
PORT=3000

# Humanizer
HUMANIZER_CONCURRENCY=2
HUMANIZER_HEADLESS=true
HUMANIZER_MAX_RETRIES=3
HUMANIZER_JOB_TIMEOUT=120000

# QuillBot (REQUIRED)
LOGIN_EMAIL=your@email.com
LOGIN_PASSWORD=yourpassword

# Your database, Supabase, etc.
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
# ... other vars
```

## 📋 Deployment Options

### Option 1: Use the Automated Script (Recommended)
```bash
./deploy.sh
```

### Option 2: Manual Deployment
```bash
git pull origin main
npm install
cd quillbot-api && npm install && cd ..
npm run build
pm2 restart homeworkgpt
node check-humanizer-auth.js
```

### Option 3: First Time Deployment
Follow the complete guide in `DEPLOYMENT_CHECKLIST.md`

## 🔐 Authentication is Required!

**IMPORTANT:** You MUST login to QuillBot before the humanizer will work.

```bash
# Check if logged in
node check-humanizer-auth.js

# Login
node check-humanizer-auth.js login your@email.com yourpassword
```

Sessions expire after ~24-48 hours, so you may need to re-login periodically.

## ✅ Verify Deployment

### 1. Check PM2
```bash
pm2 status
```
Should show: `homeworkgpt │ online`

### 2. Check Health
```bash
curl http://localhost:3000/api/humanize/health
```
Should return: `{"status":"healthy",...}`

### 3. Check Auth
```bash
node check-humanizer-auth.js
```
Should show: `✅ LOGGED IN`

### 4. Test Humanization
```bash
node test-humanizer-integration.js
```
All tests should pass

## 🔄 Updating Your App

After pushing changes to GitHub:

```bash
# On Ubuntu server
cd /path/to/your/repo
./deploy.sh
```

That's it! The script handles:
- Pulling latest code
- Installing dependencies
- Building the app
- Restarting PM2
- Checking auth status

## 📊 Monitoring

### View Logs
```bash
pm2 logs homeworkgpt
```

### Monitor Resources
```bash
pm2 monit
```

### Check Queue Status
```bash
curl http://localhost:3000/api/humanize/queue
```

## 🐛 Common Issues

### "Session expired"
```bash
node check-humanizer-auth.js login your@email.com yourpassword
```

### "Port 3000 in use"
```bash
pm2 restart homeworkgpt
```

### "Chromium not found"
```bash
sudo apt install -y chromium-browser
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> .env.local
pm2 restart homeworkgpt
```

### Build fails
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

## 📚 Documentation Structure

```
DEPLOYMENT_UBUNTU.md        ← Complete guide (detailed)
DEPLOYMENT_CHECKLIST.md     ← Step-by-step checklist
README_DEPLOYMENT.md         ← This file (quick reference)
HUMANIZER_AUTH_SETUP.md     ← Authentication guide
deploy.sh                   ← Automated deployment script
check-humanizer-auth.js     ← Auth management tool
```

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| **Deploy** | `./deploy.sh` |
| **Check Status** | `pm2 status` |
| **View Logs** | `pm2 logs homeworkgpt` |
| **Restart** | `pm2 restart homeworkgpt` |
| **Check Auth** | `node check-humanizer-auth.js` |
| **Login** | `node check-humanizer-auth.js login <email> <pass>` |
| **Test** | `node test-humanizer-integration.js` |
| **Health** | `curl http://localhost:3000/api/humanize/health` |
| **Update** | `git pull && ./deploy.sh` |

## 🔒 Security Reminders

- ✅ Never commit `.env.local` to git
- ✅ Use SSH keys, not passwords
- ✅ Enable firewall: `sudo ufw enable`
- ✅ Setup SSL with Let's Encrypt
- ✅ Keep system updated: `sudo apt update && sudo apt upgrade`
- ✅ Use strong passwords for QuillBot
- ✅ Backup session data regularly

## 🚦 Deployment Stages

### Development (Local)
```bash
npm run dev
```

### Production (Ubuntu Server)
```bash
npm run build
pm2 start ecosystem.config.js --env production
```

## 💡 Tips

1. **Before pushing to server**: Test locally with `npm run build && npm start`
2. **After deployment**: Always check auth status
3. **Set up monitoring**: Use PM2 monitoring or external services
4. **Backup session data**: Schedule regular backups of `session_data.db`
5. **Use deploy script**: It handles everything automatically

## 🎓 Learn More

- **Full Ubuntu Guide**: See `DEPLOYMENT_UBUNTU.md`
- **Step-by-Step**: See `DEPLOYMENT_CHECKLIST.md`
- **Auth Issues**: See `HUMANIZER_AUTH_SETUP.md`
- **API Documentation**: See `HUMANIZER_API_INTEGRATION.md`
- **Quick Start**: See `HUMANIZER_QUICK_START.md`

## 🆘 Need Help?

1. Check PM2 logs: `pm2 logs homeworkgpt`
2. Check auth: `node check-humanizer-auth.js`
3. Test health: `curl http://localhost:3000/api/humanize/health`
4. Review documentation in the files above
5. Check system logs: `sudo journalctl -xe`

---

## 🎉 You're Ready to Deploy!

**Next steps:**
1. Push your code to GitHub
2. Follow `DEPLOYMENT_CHECKLIST.md` on your Ubuntu server
3. Run `./deploy.sh`
4. Login to QuillBot
5. Test it!

**Your app will be live at:**
- Local: `http://localhost:3000`
- Server IP: `http://your-server-ip:3000`
- Domain: `https://yourdomain.com` (if Nginx + SSL configured)

Good luck! 🚀
