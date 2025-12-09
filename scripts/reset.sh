#!/bin/bash

echo "🧹 Cleaning up browser cache and restarting dev server..."

# Kill the dev server
echo "Stopping dev server..."
pkill -f "vite"

# Clear node modules cache
echo "Clearing Vite cache..."
rm -rf node_modules/.vite

# Restart dev server
echo "Starting dev server..."
npm run dev &

echo ""
echo "✅ Done! Please:"
echo "1. Go to http://localhost:3003"
echo "2. Open DevTools (F12)"
echo "3. Go to Application tab → Storage → Clear site data"
echo "4. Refresh the page"
echo "5. Try logging in with:"
echo "   Email: admin@siifmart.com"
echo "   Password: Admin123!"
