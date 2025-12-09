# 🤖 AI Super Admin Commands - Complete Reference

## Overview
The AI Assistant has **full system control** for Super Admins. You can execute any operation using natural language commands.

---

## 📦 Procurement & Inventory

### Purchase Orders
```
create PO for 50 units of Coca-Cola
approve PO-12345
approve all POs
approve all draft POs
reject PO-12345
delete PO-12345
create POs for low stock items
auto restock items below 10 units
```

### Inventory Management
```
adjust stock for Coca-Cola by +100
adjust stock for SKU-123 by -50
transfer 20 units of Pepsi from Warehouse A to Store B
create product: Sprite 500ml, price 25 ETB
update product SKU-123 price to 30 ETB
delete product SKU-999
```

---

## 👥 Employee & HR Management

### Employee Operations
```
create employee: John Doe, role cashier, site Store A
update employee EMP-123 role to manager
delete employee EMP-456
assign super_admin role to Sara
change John's role to warehouse_manager
```

### Payroll
```
process payroll for all employees
process payroll for Store A
generate payroll report for December
```

---

## 🛒 Customer Management

### Customer Operations
```
create customer: Jane Smith, phone +251911000000
update customer CUST-123 email to jane@email.com
delete customer CUST-456
add 100 loyalty points to customer CUST-789
```

---

## 💰 Sales & Orders

### Sales Operations
```
create sale: 5x Coca-Cola, customer CUST-123
refund sale SALE-456
void sale SALE-789
process return for order ORD-123
```

---

## 📊 Warehouse Operations

### Job Management
```
assign job JOB-123 to John
assign all pending jobs
auto assign pending PICK jobs
complete job JOB-456
create PICK job for order ORD-789
```

---

## ⚙️ Settings & Configuration

### System Settings
```
update store name to "SIIFMART HQ"
change currency to USD
set timezone to Africa/Nairobi
update tax rate to 15%
enable multi-currency support
disable loyalty program
```

### Data Management
```
backup system data
export all data
restore from backup
reset system to defaults
```

---

## 📈 Reports & Analytics

### Generate Reports
```
generate sales report for today
generate inventory report
generate employee performance report
export customer data
create financial summary for December
```

---

## 🔍 Navigation & Search

### Quick Navigation
```
go to inventory
open procurement
show dashboard
navigate to employees
view sales history
```

### Search Operations
```
search for Coca-Cola
find customer John
show all low stock items
list pending POs
find employee Sara
```

---

## 👻 Ghost Mode (User Impersonation)

### Impersonation
```
impersonate Sara
view as John
login as warehouse manager
exit ghost mode
stop impersonation
```

---

## 🎯 Smart Commands (AI Interprets Intent)

The AI understands context and can execute complex operations:

### Examples:
```
"We're running low on Coca-Cola, order more"
→ AI creates PO for Coca-Cola

"Approve everything pending"
→ AI bulk approves all draft POs

"Make John a manager"
→ AI updates John's role to manager

"How much did we sell today?"
→ AI generates sales report for today

"Show me who's working at Store A"
→ AI navigates to employees filtered by Store A

"Transfer stock from warehouse to store"
→ AI prompts for details and creates transfer

"Give customer 123 some loyalty points"
→ AI adds loyalty points to customer

"Process this month's payroll"
→ AI processes payroll for current month
```

---

## 🔒 Security & Permissions

### Access Control
- ✅ **All commands** require `super_admin` role
- ✅ **Destructive actions** (delete, reset) require confirmation
- ✅ **Bulk operations** show preview before execution
- ✅ **All actions** are logged in audit trail
- ✅ **Ghost Mode** preserves original admin session

### Confirmation Required For:
- Deleting records (employees, products, customers)
- Bulk approvals (>5 items)
- System reset
- Data restore
- Payroll processing

---

## 💡 Tips for Best Results

### 1. Be Specific
❌ "Create PO"  
✅ "Create PO for 50 units of Coca-Cola"

### 2. Use Natural Language
✅ "Order more Pepsi"  
✅ "Make Sara a manager"  
✅ "Show me today's sales"

### 3. Combine Operations
✅ "Find low stock items and create POs"  
✅ "Approve all POs and generate report"

### 4. Ask Questions
✅ "How many employees do we have?"  
✅ "What's our total inventory value?"  
✅ "Who's the manager of Store A?"

---

## 🚀 Advanced Features

### Batch Operations
```
approve all POs from Supplier X
delete all inactive customers
update all products in category Electronics
```

### Conditional Logic
```
if stock below 10, create PO
approve POs under 10,000 ETB
assign jobs to available employees
```

### Scheduled Actions
```
process payroll on the 25th
generate monthly report
backup data every week
```

---

## 📝 Command Syntax Guide

### General Pattern:
```
[ACTION] [TARGET] [PARAMETERS]

Examples:
create    employee   name: John, role: cashier
update    product    SKU-123, price: 30
delete    customer   CUST-456
approve   all        POs
```

### Shortcuts:
```
Full: "create purchase order for 50 units"
Short: "create PO 50 units"

Full: "navigate to inventory page"
Short: "go to inventory"

Full: "impersonate user Sara"
Short: "impersonate Sara"
```

---

## 🎮 Try It Now!

Open the AI Assistant (`Cmd+K` or purple button) and try:

1. **Simple Navigation:**
   ```
   go to inventory
   ```

2. **Create Something:**
   ```
   create PO for 100 units of Pepsi
   ```

3. **Bulk Operation:**
   ```
   approve all pending POs
   ```

4. **Smart Query:**
   ```
   show me low stock items
   ```

5. **Ghost Mode:**
   ```
   impersonate warehouse manager
   ```

---

## 🆘 Need Help?

**In the AI Assistant, type:**
```
help
what can you do?
show me commands
```

The AI will explain its capabilities and guide you! 🤖✨

---

## 🔄 Updates & Improvements

The AI is continuously learning and improving. New commands and capabilities are added regularly.

**Last Updated:** December 2024  
**Version:** 2.0 - Full System Control
