#!/bin/bash
# Install Chromium dependencies for Ubuntu

echo "🔧 Installing Chromium dependencies for Puppeteer..."
echo "=================================================="

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install all required dependencies for Chromium/Puppeteer
echo "📦 Installing dependencies..."
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
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
  lsb-release \
  wget \
  xdg-utils

# Also install Chromium browser (optional, but helpful)
echo "📦 Installing Chromium browser..."
sudo apt install -y chromium-browser

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "Now try again:"
echo "  node check-humanizer-auth.js"
echo ""
