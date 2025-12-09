#!/bin/bash

# 🚀 Start SIIFMART Web App for Android Development
# This script starts the web app accessible on your local network

echo "🚀 Starting SIIFMART Web App..."
echo ""
echo "📱 Your Android device can connect to:"
echo "   http://192.168.0.241:3000"
echo ""
echo "⚠️  Make sure:"
echo "   1. Your Android device is on the SAME WiFi network"
echo "   2. Firewall allows port 3000"
echo "   3. Android app is rebuilt with new IP address"
echo ""
echo "🔧 To rebuild Android app:"
echo "   cd android-app"
echo "   ./gradlew clean installDebug"
echo ""
echo "Starting server..."
echo ""

npm run dev -- --host
