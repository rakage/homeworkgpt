#!/bin/bash
# Deployment script for Ubuntu server

set -e  # Exit on error

echo "🚀 Starting deployment..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Warning: .env.local not found!${NC}"
    echo -e "${YELLOW}Please create .env.local with required environment variables${NC}"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Install quillbot-api dependencies
echo -e "${YELLOW}📦 Installing quillbot-api dependencies...${NC}"
cd quillbot-api
npm install
cd ..

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed${NC}"
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Restart application with PM2
echo -e "${YELLOW}🔄 Restarting application with PM2...${NC}"

# Check if app is already running
if pm2 list | grep -q "homeworkgpt"; then
    echo "App is running, restarting..."
    pm2 restart homeworkgpt
else
    echo "Starting app for the first time..."
    pm2 start ecosystem.config.js --env production
    pm2 save
fi

# Wait a moment for app to start
sleep 3

# Check if app is running
if pm2 list | grep -q "homeworkgpt.*online"; then
    echo -e "${GREEN}✅ Application is running!${NC}"
else
    echo -e "${RED}❌ Application failed to start${NC}"
    echo "Check logs with: pm2 logs homeworkgpt"
    exit 1
fi

# Check authentication status
echo -e "${YELLOW}🔐 Checking QuillBot authentication...${NC}"
if node check-humanizer-auth.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Authentication is valid${NC}"
else
    echo -e "${RED}❌ Not authenticated to QuillBot${NC}"
    echo -e "${YELLOW}Please login with: node check-humanizer-auth.js login <email> <password>${NC}"
fi

# Display useful information
echo ""
echo "================================"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "================================"
echo ""
echo "📊 Useful commands:"
echo "  View logs:      pm2 logs homeworkgpt"
echo "  Monitor:        pm2 monit"
echo "  Status:         pm2 status"
echo "  Restart:        pm2 restart homeworkgpt"
echo "  Stop:           pm2 stop homeworkgpt"
echo ""
echo "🔐 Authentication:"
echo "  Check status:   node check-humanizer-auth.js"
echo "  Login:          node check-humanizer-auth.js login <email> <password>"
echo ""
echo "🌐 API Health:"
echo "  Health check:   curl http://localhost:3000/api/humanize/health"
echo "  Auth status:    curl http://localhost:3000/api/humanize/auth"
echo ""

# Show current status
echo "Current PM2 status:"
pm2 status

exit 0
