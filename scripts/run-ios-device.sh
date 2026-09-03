#!/usr/bin/env bash
set -e

DEVICE_ID="00008101-001C78920169001E"
BUNDLE_ID="com.siifmart.app"

echo "📱 Checking connected iPhone..."
STATUS=$(xcrun devicectl device info details --device "$DEVICE_ID" 2>/dev/null | grep "developerModeStatus" || true)

if [[ "$STATUS" == *"disabled"* ]]; then
  echo "⚠️ Developer Mode is currently DISABLED on your iPhone."
  echo ""
  echo "👉 Please enable Developer Mode on your iPhone:"
  echo "   1. On your iPhone, open Settings -> Privacy & Security"
  echo "   2. Scroll to the bottom and tap 'Developer Mode'"
  echo "   3. Turn it ON and tap 'Restart'"
  echo "   4. After restart, unlock your iPhone and tap 'Turn On'"
  echo ""
  echo "Then run this command again!"
  exit 1
fi

echo "🚀 Building SIIFMART for your iPhone..."
npm run ios:sync

cd ios/App
xcodebuild -project App.xcodeproj -scheme App -destination "id=$DEVICE_ID" -configuration Debug build

APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphoneos -name "App.app" | head -n 1)

if [[ -z "$APP_PATH" ]]; then
  echo "❌ Could not locate built App.app"
  exit 1
fi

echo "📲 Installing SIIFMART onto Shukri Idriss’s iPhone..."
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"

echo "🎉 Launching SIIFMART on your iPhone..."
xcrun devicectl device process launch --device "$DEVICE_ID" "$BUNDLE_ID"

echo "✅ App running on your iPhone!"
