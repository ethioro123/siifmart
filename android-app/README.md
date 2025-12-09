# SIIFMART Android App

Hybrid Android application for SIIFMART Retail & Warehouse Operations System.

## Features

- **WebView Integration**: Loads the SIIFMART web application
- **Cyber Theme**: Consistent dark theme matching the web app
- **PDA Optimized**: Touch-friendly interface for warehouse operations
- **Offline Support**: Handles network connectivity gracefully
- **Barcode Scanning Ready**: Camera permissions configured

## Setup

1. Open the project in Android Studio
2. Update `webAppUrl` in `MainActivity.kt` with your web app URL
3. Sync Gradle files
4. Build and run

## Configuration

### Web App URL
Update the URL in `MainActivity.kt`:
```kotlin
private val webAppUrl = "https://your-web-app-url.com"
```

### Theme Colors
Colors are defined in `app/src/main/res/values/colors.xml` and match the web app:
- Primary: `#00FF9D` (Cyber Green)
- Background: `#050505` (Cyber Black)
- Accent: `#00CC7D`

## Build

```bash
./gradlew assembleDebug    # Debug build
./gradlew assembleRelease  # Release build
```

## Requirements

- Android Studio Hedgehog or later
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
- Kotlin 1.9.20+

## Notes

- The app uses a WebView to load the web application
- PDA mode optimizations are injected via JavaScript
- Screen stays on during operations (useful for PDAs)
- Portrait orientation locked for consistency

