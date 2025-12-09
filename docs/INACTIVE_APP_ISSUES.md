# Potential Issues When App Stays Inactive

## Critical Issues Identified ⚠️

### 1. **Session Expiration (CRITICAL)**
**Problem:** Supabase sessions expire after 1 hour by default. If a user leaves the app open but inactive, their session will expire, but the app won't automatically detect this until they try to perform an action.

**Impact:**
- User appears logged in but API calls fail
- Data operations silently fail
- Poor user experience

**Solution Needed:**
- Implement automatic session refresh
- Add session expiration detection
- Show warning before session expires
- Auto-logout on session expiration

### 2. **Stale Data**
**Problem:** The app loads data once on mount but doesn't refresh automatically. If left open for hours, inventory levels, sales data, etc. become outdated.

**Impact:**
- Incorrect stock levels shown
- Missed sales/orders
- Inventory discrepancies

**Solution Needed:**
- Implement periodic data refresh (every 5-10 minutes)
- Use Supabase Realtime subscriptions for critical data
- Add "Last Updated" timestamp display

### 3. **Memory Leaks**
**Problem:** Long-running React apps can accumulate memory if event listeners, intervals, or subscriptions aren't properly cleaned up.

**Impact:**
- Browser tab becomes slow
- Eventual crash on low-memory devices

**Current Status:** ✅ Good - Auth subscription is properly cleaned up in `CentralStore.tsx`

### 4. **LocalStorage Overflow**
**Problem:** System logs are stored in localStorage (see `systemLogs.service.ts`). If the app runs for days/weeks, logs will accumulate.

**Impact:**
- localStorage quota exceeded (5-10MB limit)
- App crashes or fails to save data

**Solution Needed:**
- Implement log rotation (keep last 1000 entries)
- Move logs to Supabase database
- Add periodic cleanup

### 5. **Network Disconnection**
**Problem:** If the network drops and reconnects, the app doesn't detect this or retry failed requests.

**Impact:**
- Silent failures
- Data loss
- User confusion

**Solution Needed:**
- Add network status detection
- Implement retry logic for failed requests
- Show offline indicator

## Recommended Fixes (Priority Order)

### 🔴 HIGH PRIORITY
1. **Session Auto-Refresh**
2. **Session Expiration Warning**
3. **LocalStorage Log Rotation**

### 🟡 MEDIUM PRIORITY
4. **Periodic Data Refresh**
5. **Network Status Detection**

### 🟢 LOW PRIORITY
6. **Realtime Subscriptions** (nice-to-have for live updates)

## Quick Wins
The most critical issue is **session expiration**. This can be fixed in ~30 minutes by:
1. Adding a session refresh interval
2. Detecting expired sessions
3. Auto-logging out users with a notification
