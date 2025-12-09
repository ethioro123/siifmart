# HQ Products Cleanup Instructions

## Keyboard Shortcut
Press **Ctrl+Shift+H** (or **Cmd+Shift+H** on Mac) to trigger the HQ products cleanup.

## What it does:
- Finds all products assigned to the HQ site
- Deletes them from the database
- Updates the local state
- Shows a success notification with the count of removed products

## How to use:
1. Open the application in your browser
2. Press **Ctrl+Shift+H** (Windows/Linux) or **Cmd+Shift+H** (Mac)
3. The cleanup will run automatically
4. You'll see a notification showing how many products were removed

## Via Browser Console:
You can also run this from the browser console:
```javascript
// Access the cleanup function from the window object (if exposed)
// Or call it directly from the DataContext if you have access
```

## Note:
- This is a one-time cleanup utility
- Only Super Admins should use this
- HQ should never have inventory products (it's administrative only)
- All future products will default to WH-001 (warehouse) instead of HQ
