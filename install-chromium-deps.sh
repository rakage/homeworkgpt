#!/bin/bash
# Install Chromium dependencies for Ubuntu

echo "🔧 Installing Chromium dependencies for Puppeteer..."
echo "=================================================="

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install all required dependencies for Chromium/Puppeteer
echo "📦 Installing dependencies (this may take a few minutes)..."
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  gconf-service \
  libasound2 \
  libappindicator3-1 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
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
  libxkbcommon0 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

# Install Chromium browser and use it instead of bundled Chromium
echo "📦 Installing Chromium browser..."
sudo apt install -y chromium-browser

# Check if chromium was installed
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_PATH=$(which chromium-browser)
    echo "✅ Chromium installed at: $CHROMIUM_PATH"
    
    # Add to .env.local if not already there
    if [ -f ".env.local" ]; then
        if ! grep -q "PUPPETEER_EXECUTABLE_PATH" .env.local; then
            echo "" >> .env.local
            echo "# Chromium path for Puppeteer" >> .env.local
            echo "PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH" >> .env.local
            echo "✅ Added PUPPETEER_EXECUTABLE_PATH to .env.local"
        fi
    else
        echo "⚠️  Warning: .env.local not found. Please add:"
        echo "   PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH"
    fi
else
    echo "⚠️  Warning: Chromium installation may have failed"
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "Now try again:"
echo "  node check-humanizer-auth.js login your@email.com yourpassword"
echo ""
