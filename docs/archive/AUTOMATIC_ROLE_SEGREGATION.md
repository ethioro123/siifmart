# 🛡️ AUTOMATIC ROLE SEGREGATION SYSTEM

## Overview
A comprehensive system has been implemented to ensure that employees are automatically assigned to the correct site types based on their roles. This prevents role segregation issues at the source (hiring/creation).

## 🔧 Key Components

### 1. **Role Segregation Utility (`utils/roleSegregation.ts`)**
This is the core logic engine that defines the rules and provides helper functions.

**Features:**
- **Centralized Rules:** `ROLE_SEGREGATION_RULES` defines where each role belongs.
- **Auto-Selection:** `autoSelectSiteForRole()` finds the correct site ID for a given role.
- **Validation:** `validateRoleSiteAssignment()` checks if a role-site pair is valid.
- **Department Mapping:** `getRecommendedDepartment()` suggests the correct department.

### 2. **Employee Creation Wizard (`pages/Employees.tsx`)**
The hiring interface has been upgraded to use the segregation utility.

**Improvements:**
- **Auto-Assignment:** When a role is selected, the system **automatically** switches the "Assigned Site" dropdown to the correct location (e.g., selecting "HR Manager" switches site to "SIIFMART HQ").
- **Auto-Department:** The department is also automatically set based on the role.
- **Validation Warnings:** If an admin manually overrides the site to an incorrect one, a warning confirmation is shown before submission.
- **Role List Update:** Added missing roles (`warehouse_manager`, `dispatcher`, `auditor`) to the selection list.

### 3. **Warehouse Operations Cleanup (`pages/WarehouseOperations.tsx`)**
Legacy role references have been updated to reflect the new role structure.

**Changes:**
- Removed legacy `wms` role references.
- Added `dispatcher` and `warehouse_manager` to permission checks and filters.
- Ensured warehouse tasks are only assignable to appropriate warehouse roles.

---

## 📋 Role Segregation Rules

### **🏢 HQ ROLES (Must be at SIIFMART HQ)**
| Role | Department | Description |
|------|------------|-------------|
| `super_admin` | Management | CEO / Executive |
| `admin` | Management | System Administrator |
| `hr` | Human Resources | HR Manager |
| `finance_manager` | Management | Finance Manager |
| `procurement_manager` | Management | Procurement Manager |
| `cs_manager` | Management | Customer Service Manager |
| `auditor` | Management | Compliance Auditor |
| `it_support` | Management | IT Support Specialist |

### **🏭 WAREHOUSE ROLES (Must be at Warehouse/DC)**
| Role | Department | Description |
|------|------------|-------------|
| `warehouse_manager` | Logistics & Warehouse | Warehouse Operations Lead |
| `dispatcher` | Logistics & Warehouse | Logistics Coordinator |
| `picker` | Logistics & Warehouse | Order Fulfillment |
| `driver` | Transport | Delivery Driver |

### **🏪 RETAIL ROLES (Must be at Store)**
| Role | Department | Description |
|------|------------|-------------|
| `store_supervisor` | Retail Operations | Floor Management |
| `pos` | Retail Operations | Cashier / Point of Sale |
| `inventory_specialist` | Retail Operations | Stock Control |

### **🔄 FLEXIBLE ROLES (Any Location)**
| Role | Department | Description |
|------|------------|-------------|
| `manager` | Any | Department Manager (Can manage any site type) |

---

## ✅ How to Test
1. Go to **Employees** page.
2. Click **"Onboard Talent"**.
3. Select **"HR Manager"** role -> Site should auto-switch to **"SIIFMART HQ"**.
4. Select **"Picker"** role -> Site should auto-switch to a **Warehouse**.
5. Select **"Cashier"** role -> Site should auto-switch to a **Store**.
6. Try to manually change an HR Manager's site to a Warehouse -> You should see a warning upon clicking "Complete Onboarding".

## 🚀 Status
**COMPLETE** - The system now enforces role segregation automatically during the hiring process.
