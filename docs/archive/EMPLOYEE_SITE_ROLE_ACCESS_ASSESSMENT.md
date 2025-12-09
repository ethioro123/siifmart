# Employee Site & Role Access Assessment

**Generated:** 2025-11-26  
**Purpose:** Assess employee location display, site linkage, and role-based web section access

---

## 1. EMPLOYEE LOCATION DISPLAY

### Where Location is Shown
**File:** `pages/Employees.tsx`  
**Line:** 1145

```tsx
<div className="flex items-center gap-2 text-xs text-cyber-primary">
    <MapPin size={12} />
    <span className="font-bold">
        {sites.find(s => s.id === employee.siteId || s.id === employee.site_id)?.name || 'Headquarters'}
    </span>
</div>
```

### Display Logic
- **Primary Field:** `employee.siteId` (camelCase)
- **Fallback Field:** `employee.site_id` (snake_case for Supabase compatibility)
- **Default Value:** "Headquarters" (if no site match found)
- **Visual Indicator:** MapPin icon with cyber-primary color

### Location Display Locations
1. **Employee Directory Cards** (line 1145) - Main employee listing
2. **Employee Creation Wizard** (line 1510) - Review step shows assigned location
3. **Employee Details Modal** (line 1675) - Full profile view

---

## 2. SITE LINKAGE VERIFICATION

### Database Schema
**Table:** `employees`  
**Site Reference Field:** `site_id` (UUID, foreign key to `sites.id`)

### Employee Type Definition
**File:** `types.ts` (lines 321-340)

```typescript
export interface Employee {
  id: string;
  siteId: string;              // Application layer
  site_id?: string;            // Supabase compatibility
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';
  joinDate: string;
  department: string;
  avatar: string;
  performanceScore: number;
  // ... other fields
}
```

### Site Assignment Process

#### 1. During Employee Creation
**File:** `pages/Employees.tsx` (lines 1375-1389)

```tsx
{/* Site Selection - Admin/HR Only */}
{(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'hr') && (
    <div>
        <label className="text-xs text-cyber-primary uppercase font-bold mb-2 block flex items-center gap-2">
            <MapPin size={14} /> Assign Workplace
        </label>
        <select
            className="w-full bg-cyber-primary/10 border border-cyber-primary/30 text-white rounded-lg px-3 py-3 outline-none"
            value={newEmpData.siteId}
            onChange={e => setNewEmpData({ ...newEmpData, siteId: e.target.value })}
        >
            {sites.map(s => (
                <option key={s.id} value={s.id} className="text-black">
                    {s.name} ({s.type})
                </option>
            ))}
        </select>
        <p className="text-[10px] text-gray-500 mt-1">
            Employee will only see data for this location.
        </p>
    </div>
)}
```

**Key Points:**
- Only `admin`, `super_admin`, and `hr` roles can assign sites
- Defaults to active site if not specified
- Clear messaging: "Employee will only see data for this location"

#### 2. During Authentication
**File:** `services/auth.service.ts` (lines 192-220)

```typescript
async getCurrentAuthUser(): Promise<AuthUser | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const employee = await employeesService.getByEmail(user.email!);
    
    return {
        id: user.id,
        email: user.email!,
        name: employee.name,
        role: employee.role as UserRole,
        siteId: employee.siteId || employee.site_id,  // ✅ Site linked here
        avatar: employee.avatar
    };
}
```

#### 3. In DataContext
**File:** `contexts/DataContext.tsx` (lines 212-239)

```typescript
// Sync user's site when user logs in
useEffect(() => {
    if (user?.siteId && sites.length > 0) {
        const userSite = sites.find(s => s.id === user.siteId);
        
        if (!userSite) {
            console.error(`❌ User's siteId "${user.siteId}" not found in sites list!`);
            return;
        }
        
        if (activeSiteId !== user.siteId) {
            console.log(`🔄 Syncing active site: "${activeSiteId || 'none'}" → "${userSite.name}" (${user.siteId})`);
            setActiveSiteId(user.siteId);
        }
    }
}, [user, sites, activeSiteId]);
```

**Result:** ✅ **Employee's siteId is properly linked and synced to active site**

---

## 3. ROLE-BASED WEB SECTION ACCESS

### Permission System
**File:** `services/auth.service.ts` (lines 282-329)

```typescript
export const ROLE_PERMISSIONS = {
    super_admin: ['*'], // CEO - Full access to everything
    
    admin: [
        'dashboard', 'settings', 'employees'  // System admin - technical/IT access only
    ],
    
    manager: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers', 'pricing'  
        // Store operations only (NO warehouse, NO procurement)
    ],
    
    warehouse_manager: [
        'dashboard', 'inventory', 'warehouse', 'procurement'
    ],
    
    dispatcher: [
        'dashboard', 'inventory', 'warehouse', 'procurement'
    ],
    
    finance_manager: [
        'dashboard', 'finance', 'sales', 'procurement', 'employees'
    ],
    
    procurement_manager: [
        'dashboard', 'procurement', 'inventory', 'warehouse', 'finance'
    ],
    
    cs_manager: [
        'dashboard', 'customers', 'sales'
    ],
    
    it_support: [
        'dashboard', 'settings', 'employees'
    ],
    
    store_supervisor: [
        'dashboard', 'pos', 'inventory', 'sales', 'customers'  // Added inventory
    ],
    
    inventory_specialist: [
        'dashboard', 'inventory', 'warehouse'
    ],
    
    pos: [
        'dashboard', 'pos', 'customers', 'inventory'  // Added inventory (read-only)
    ],
    
    picker: [
        'dashboard', 'warehouse', 'inventory'  // Added inventory (read-only)
    ],
    
    hr: [
        'dashboard', 'employees', 'finance'  // HR - employee and payroll management
    ],
    
    auditor: [
        'dashboard', 'sales', 'inventory', 'finance'  // Auditor - read-only financial oversight
    ],
    
    driver: [
        'dashboard', 'warehouse'
    ]
};
```

### Access Control Function
**File:** `services/auth.service.ts` (lines 331-341)

```typescript
export function canAccessRoute(userRole: UserRole, route: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    
    // Super admin has access to everything
    if (permissions.includes('*')) return true;
    
    // Check if route is in permissions
    return permissions.some(permission =>
        route.toLowerCase().includes(permission.toLowerCase())
    );
}
```

---

## 4. VERIFICATION CHECKLIST

### ✅ Employee Location Display
- [x] Location shown in employee directory cards
- [x] Location shown in employee creation wizard
- [x] Location shown in employee detail modal
- [x] Fallback to "Headquarters" if no site found
- [x] Visual indicator (MapPin icon) present

### ✅ Site Linkage
- [x] `siteId` field exists in Employee type
- [x] `site_id` snake_case compatibility for Supabase
- [x] Site assigned during employee creation
- [x] Site synced to `user.siteId` during authentication
- [x] Active site automatically set to user's assigned site
- [x] Only authorized roles can assign sites (admin, super_admin, hr)

### ✅ Role-Based Access
- [x] `ROLE_PERMISSIONS` mapping defined for all 16 roles
- [x] `canAccessRoute()` function implemented
- [x] Super admin has wildcard access (`*`)
- [x] Each role has appropriate section permissions
- [x] Warehouse roles (warehouse_manager, dispatcher, picker) have warehouse access
- [x] Store roles (manager, pos, store_supervisor) have POS/sales access
- [x] Finance roles have finance/procurement access
- [x] HR has employee management access

---

## 5. ROLE-TO-SECTION MAPPING ANALYSIS

### Warehouse Roles
| Role | Sections | Warehouse Access | Procurement Access |
|------|----------|------------------|-------------------|
| `warehouse_manager` | dashboard, inventory, warehouse, procurement | ✅ YES | ✅ YES |
| `dispatcher` | dashboard, inventory, warehouse, procurement | ✅ YES | ✅ YES |
| `picker` | dashboard, warehouse, inventory | ✅ YES | ❌ NO |
| `inventory_specialist` | dashboard, inventory, warehouse | ✅ YES | ❌ NO |

### Store Roles
| Role | Sections | POS Access | Inventory Access |
|------|----------|------------|------------------|
| `manager` | dashboard, pos, inventory, sales, customers, pricing | ✅ YES | ✅ YES |
| `store_supervisor` | dashboard, pos, inventory, sales, customers | ✅ YES | ✅ YES |
| `pos` | dashboard, pos, customers, inventory | ✅ YES | ✅ YES (read-only) |

### Administrative Roles
| Role | Sections | Employee Access | Settings Access |
|------|----------|----------------|-----------------|
| `super_admin` | * (all) | ✅ YES | ✅ YES |
| `admin` | dashboard, settings, employees | ✅ YES | ✅ YES |
| `hr` | dashboard, employees, finance | ✅ YES | ❌ NO |
| `it_support` | dashboard, settings, employees | ✅ YES | ✅ YES |

### Finance Roles
| Role | Sections | Finance Access | Procurement Access |
|------|----------|----------------|-------------------|
| `finance_manager` | dashboard, finance, sales, procurement, employees | ✅ YES | ✅ YES |
| `procurement_manager` | dashboard, procurement, inventory, warehouse, finance | ✅ YES | ✅ YES |
| `auditor` | dashboard, sales, inventory, finance | ✅ YES (read-only) | ❌ NO |

### Other Roles
| Role | Sections | Primary Function |
|------|----------|------------------|
| `cs_manager` | dashboard, customers, sales | Customer service management |
| `driver` | dashboard, warehouse | Delivery/logistics |

---

## 6. POTENTIAL ISSUES & RECOMMENDATIONS

### ⚠️ Issue 1: No Explicit Site Filtering in Permissions
**Problem:** Permissions are role-based but don't explicitly enforce site-level data filtering.

**Current Behavior:**
- User's `siteId` is set correctly
- DataContext syncs active site to user's site
- BUT: Permission system doesn't prevent cross-site data access if user manually changes site

**Recommendation:**
```typescript
// Add to auth.service.ts
export function canAccessSite(userRole: UserRole, userSiteId: string, targetSiteId: string): boolean {
    // Super admin can access all sites
    if (userRole === 'super_admin') return true;
    
    // Admin and HR can access all sites
    if (['admin', 'hr'].includes(userRole)) return true;
    
    // All other roles can only access their assigned site
    return userSiteId === targetSiteId;
}
```

### ⚠️ Issue 2: Warehouse Workers May See Wrong Sections
**Problem:** A `picker` at a **Store** location might still see warehouse sections.

**Current Behavior:**
- `picker` role has permissions: `['dashboard', 'warehouse', 'inventory']`
- If picker is assigned to a Store (not Warehouse), they still see warehouse sections

**Recommendation:**
Add site-type-based filtering:
```typescript
export function getAvailableSections(userRole: UserRole, siteType: SiteType): string[] {
    const basePermissions = ROLE_PERMISSIONS[userRole];
    
    // Filter out warehouse sections if user is at a Store
    if (siteType === 'Store' || siteType === 'Dark Store') {
        return basePermissions.filter(p => p !== 'warehouse' && p !== 'procurement');
    }
    
    // Filter out POS sections if user is at a Warehouse
    if (siteType === 'Warehouse' || siteType === 'Distribution Center') {
        return basePermissions.filter(p => p !== 'pos');
    }
    
    return basePermissions;
}
```

### ✅ Working Correctly
1. **Employee location is displayed** in all relevant views
2. **Site linkage is functional** - employees are properly assigned to sites
3. **Role permissions are defined** for all 16 roles
4. **Access control function exists** and works for route checking

---

## 7. SUMMARY

### Current State: ✅ MOSTLY WORKING

| Component | Status | Notes |
|-----------|--------|-------|
| **Location Display** | ✅ Working | Shows in directory, wizard, and details |
| **Site Linkage** | ✅ Working | Properly linked via `siteId` field |
| **Role Permissions** | ✅ Working | All roles have defined permissions |
| **Access Control** | ⚠️ Partial | Works for routes, but no site-level enforcement |
| **Site-Type Filtering** | ❌ Missing | Warehouse roles at stores still see warehouse sections |

### Recommendations Priority
1. **HIGH:** Implement site-type-based section filtering (Issue #2)
2. **MEDIUM:** Add explicit site-level access control (Issue #1)
3. **LOW:** Add visual indicators for site-restricted users

---

**Assessment Complete** ✅
