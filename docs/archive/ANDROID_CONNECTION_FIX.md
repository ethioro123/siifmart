# 🔧 ANDROID APP CONNECTION FIX

## Issue
Android app shows "Webpage not available - Connection refused"

## Root Cause
The app is trying to connect to `http://10.0.2.2:3000` which:
- ✅ Works in Android **Emulator** (10.0.2.2 = localhost)
- ❌ Doesn't work on **Real Device** (no localhost access)

---

## 🎯 SOLUTIONS

### **Solution 1: Connect to Your Computer's Local Server** (Recommended for Development)

#### **Step 1: Find Your Computer's IP Address**

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```cmd
ipconfig
```

**On Linux:**
```bash
hostname -I
```

**Example Output:**
```
inet 192.168.1.100
```

#### **Step 2: Start the Web App**
```bash
cd /Users/shukriidriss/Downloads/siifmart\ 80
npm run dev
```

**Make sure it's accessible on network:**
```bash
# Should show:
# Local:   http://localhost:3000
# Network: http://192.168.1.100:3000
```

If it doesn't show Network URL, start with:
```bash
npm run dev -- --host
```

#### **Step 3: Update MainActivity.kt**

Change line 23 to use your computer's IP:

```kotlin
private val webAppUrl = "http://192.168.1.100:3000" // Replace with YOUR IP
```

#### **Step 4: Ensure Same WiFi Network**
- ✅ Computer and Android device on **same WiFi**
- ✅ Firewall allows port 3000
- ✅ Web app running

#### **Step 5: Rebuild and Test**
```bash
cd android-app
./gradlew clean
./gradlew installDebug
```

---

### **Solution 2: Use Production URL** (Recommended for Production)

#### **Step 1: Deploy Web App**

**Option A: Vercel (Free)**
```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Netlify (Free)**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Option C: Your Own Server**
```bash
npm run build
# Upload dist/ folder to your server
```

#### **Step 2: Update MainActivity.kt**

```kotlin
private val webAppUrl = "https://your-app.vercel.app" // Your deployed URL
```

#### **Step 3: Rebuild App**
```bash
cd android-app
./gradlew clean
./gradlew assembleRelease
```

---

### **Solution 3: Dynamic URL Configuration** (Best for Both)

Update MainActivity.kt to support both:

```kotlin
package com.siifmart.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    
    // CONFIGURE YOUR URL HERE:
    private val webAppUrl = getWebAppUrl()
    
    private fun getWebAppUrl(): String {
        // Option 1: Use production URL (recommended)
        val productionUrl = "https://siifmart-app.vercel.app"
        
        // Option 2: Use local development server
        // Replace 192.168.1.100 with YOUR computer's IP address
        val developmentUrl = "http://192.168.1.100:3000"
        
        // Option 3: Use emulator localhost
        val emulatorUrl = "http://10.0.2.2:3000"
        
        // AUTO-DETECT: Use production by default
        // Change to developmentUrl or emulatorUrl for testing
        return productionUrl
        
        // OR use BuildConfig to switch automatically:
        // return if (BuildConfig.DEBUG) developmentUrl else productionUrl
    }
    
    // ... rest of the code stays the same
}
```

---

## 🧪 TESTING

### **Test 1: Check Web App is Running**

**On your computer:**
```bash
cd /Users/shukriidriss/Downloads/siifmart\ 80
npm run dev -- --host
```

**Should see:**
```
VITE v6.4.1  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.100:3000/
```

**Test in browser:**
```
http://192.168.1.100:3000
```

If it works in browser, it will work in Android app!

### **Test 2: Check Firewall**

**Mac:**
```bash
sudo lsof -i :3000
```

**Allow port 3000 in firewall:**
- System Preferences → Security & Privacy → Firewall → Firewall Options
- Allow incoming connections for Node/npm

### **Test 3: Ping from Android**

**Install Network Tools app on Android**
- Ping your computer's IP: `192.168.1.100`
- If ping fails, check WiFi/firewall

---

## 📱 QUICK FIX STEPS

### **For Real Device (Development):**

1. **Find your IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example: 192.168.1.100
   ```

2. **Start web app:**
   ```bash
   npm run dev -- --host
   ```

3. **Update MainActivity.kt line 23:**
   ```kotlin
   private val webAppUrl = "http://192.168.1.100:3000"
   ```

4. **Rebuild:**
   ```bash
   cd android-app
   ./gradlew installDebug
   ```

### **For Emulator:**

1. **Start web app:**
   ```bash
   npm run dev
   ```

2. **MainActivity.kt line 23:**
   ```kotlin
   private val webAppUrl = "http://10.0.2.2:3000"
   ```

3. **Rebuild:**
   ```bash
   cd android-app
   ./gradlew installDebug
   ```

### **For Production:**

1. **Deploy web app:**
   ```bash
   vercel
   ```

2. **Update MainActivity.kt:**
   ```kotlin
   private val webAppUrl = "https://your-app.vercel.app"
   ```

3. **Build release:**
   ```bash
   cd android-app
   ./gradlew assembleRelease
   ```

---

## 🔍 TROUBLESHOOTING

### **Issue: Still "Connection Refused"**

**Check:**
1. ✅ Web app is running (`npm run dev -- --host`)
2. ✅ Computer and phone on same WiFi
3. ✅ Correct IP address in MainActivity.kt
4. ✅ Firewall allows port 3000
5. ✅ Can access in phone's browser first

**Test in phone browser:**
```
http://192.168.1.100:3000
```

If it works in browser but not in app:
- Rebuild the app
- Clear app data
- Reinstall app

### **Issue: "ERR_CLEARTEXT_NOT_PERMITTED"**

**Fix:** Already handled in AndroidManifest.xml:
```xml
android:usesCleartextTraffic="true"
```

If still issues, add to `res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

---

## 📊 URL OPTIONS COMPARISON

| Option | Use Case | Pros | Cons |
|--------|----------|------|------|
| **10.0.2.2:3000** | Emulator only | Works out of box | Only emulator |
| **192.168.x.x:3000** | Real device dev | Fast, local | Same WiFi needed |
| **Production URL** | Production | Always works | Requires deployment |

---

## ✅ RECOMMENDED SETUP

### **Development:**
```kotlin
private val webAppUrl = "http://192.168.1.100:3000" // Your IP
```

### **Production:**
```kotlin
private val webAppUrl = "https://siifmart-app.vercel.app" // Deployed
```

### **Smart (Auto-detect):**
```kotlin
private val webAppUrl = if (BuildConfig.DEBUG) {
    "http://192.168.1.100:3000" // Development
} else {
    "https://siifmart-app.vercel.app" // Production
}
```

---

## 🚀 NEXT STEPS

1. **Find your computer's IP address**
2. **Start web app with `npm run dev -- --host`**
3. **Update MainActivity.kt with your IP**
4. **Rebuild Android app**
5. **Test on device**

**Status:** ✅ **READY TO FIX!**

Let me know your computer's IP address and I'll update the MainActivity.kt file for you!
