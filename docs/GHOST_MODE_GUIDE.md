# 👻 Ghost Mode (User Impersonation) - Super Admin Feature

## Overview
Ghost Mode allows Super Admins to temporarily impersonate any user in the system to view the application from their perspective. This is useful for:
- **Testing permissions** and role-based access
- **Debugging user-reported issues** by seeing exactly what they see
- **Training and demonstrations** by showing different user experiences
- **Quality assurance** by verifying role-specific workflows

## How to Use Ghost Mode

### Activating Ghost Mode
1. **Open the AI Assistant** (click the floating purple button or press `Cmd+K` / `Ctrl+K`)
2. **Type an impersonation command**:
   - `impersonate [user name]`
   - `view as [user name]`
   - `login as [user name]`

**Examples:**
```
impersonate Sara
view as John
login as warehouse manager
```

3. The AI will search for the user by name or email
4. If found, Ghost Mode activates immediately
5. A **yellow banner** appears at the top showing you're in Ghost Mode

### While in Ghost Mode
- You see **exactly what the impersonated user sees**
- Their **role, permissions, and site access** apply
- The **yellow banner** reminds you that you're impersonating
- All navigation, data, and features reflect their view

### Exiting Ghost Mode
Click the **"Exit Ghost Mode"** button in the yellow banner at the top of the screen.

## Technical Implementation

### Components Modified
1. **`contexts/CentralStore.tsx`**
   - Added `originalUser` state to store super admin session
   - Added `impersonateUser(user)` function
   - Added `stopImpersonation()` function
   - Updated `StoreContextType` interface

2. **`components/GhostModeBanner.tsx`** (NEW)
   - Displays yellow warning banner when impersonating
   - Shows target user's name and role
   - Provides "Exit Ghost Mode" button

3. **`components/Layout.tsx`**
   - Integrated `GhostModeBanner` at the top of the layout

4. **`services/ai-navigation.service.ts`**
   - Added `'impersonate'` to `NavigationIntent` action types
   - Added detection for impersonation commands
   - Returns special intent with `targetUser` parameter

5. **`components/AIAssistant.tsx`**
   - Added handler for `impersonate` action
   - Searches employees by name or email
   - Calls `impersonateUser()` with found user data

### Data Flow
```
User types "impersonate Sara"
    ↓
AI Navigation Service detects command
    ↓
Returns 'impersonate' intent with targetUser: "Sara"
    ↓
AIAssistant searches employees for "Sara"
    ↓
Calls store.impersonateUser(saraUserObject)
    ↓
CentralStore saves current user as originalUser
    ↓
CentralStore sets user to Sara
    ↓
GhostModeBanner appears (because originalUser exists)
    ↓
App re-renders with Sara's permissions and view
```

### Security Notes
- **Super Admin Only**: Ghost Mode is exclusively available to users with `role: 'super_admin'`
- **AI Assistant Restriction**: The AI Assistant (which enables Ghost Mode) only renders for super admins
- **Session Preservation**: The original super admin session is preserved in `originalUser`
- **Toast Notifications**: System shows clear warnings when entering/exiting Ghost Mode

## Use Cases

### 1. Permission Testing
```
impersonate warehouse manager
# Verify they can only see warehouse operations
```

### 2. Bug Reproduction
```
impersonate John
# See the exact error John is experiencing
```

### 3. Training
```
view as cashier
# Show trainees the POS interface
```

### 4. Site-Specific Views
```
impersonate Lensa Merga
# View data filtered to their assigned site
```

## Limitations
- Cannot impersonate another super admin (for security)
- User must exist in the employees database
- Search is case-insensitive and matches partial names/emails

## Future Enhancements
- Session history (track who was impersonated when)
- Audit logging of all impersonation events
- Time-limited impersonation sessions
- Multi-level impersonation (impersonate while impersonating)
