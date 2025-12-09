# SIIFMART Privacy Policy & Data Protection Framework
## Retail Grocery Management System - Ethiopia

**Document Version**: 1.0  
**Effective Date**: 2025  
**Last Updated**: 2025-11-28  
**Compliance**: Ethiopian Data Protection Laws, International Best Practices

---

## Table of Contents
1. [Introduction](#introduction)
2. [Scope & Applicability](#scope--applicability)
3. [Data Classification](#data-classification)
4. [Role-Based Privacy Policies](#role-based-privacy-policies)
5. [Technical Controls](#technical-controls)
6. [Data Retention & Lifecycle](#data-retention--lifecycle)
7. [Violation & Incident Response](#violation--incident-response)
8. [Employee Rights & Responsibilities](#employee-rights--responsibilities)

---

## 1. Introduction

### 1.1 Purpose
This Privacy Policy establishes the framework for protecting sensitive data within SIIFMART's Warehouse Management System (WMS) and administrative operations. It defines how personal data, financial information, and business-critical data must be handled across all roles.

### 1.2 Business Context
- **Industry**: Retail Grocery
- **Location**: Ethiopia
- **Data Types**: Customer PII, Employee Records, Financial Data, Payment Information, Inventory Data
- **Regulatory Framework**: Ethiopian Data Protection Laws, PCI-DSS (for payment data)

### 1.3 Principles
All data handling must adhere to:
- **Confidentiality**: Data accessible only to authorized personnel
- **Integrity**: Data accuracy and completeness maintained
- **Availability**: Data accessible when needed by authorized users
- **Accountability**: All access logged and auditable
- **Minimization**: Collect and retain only necessary data

---

## 2. Scope & Applicability

### 2.1 Covered Systems
- Warehouse Management System (WMS)
- Point of Sale (POS) System
- Employee Management System
- Financial Management System
- Procurement System
- Customer Relationship Management (CRM)

### 2.2 Covered Personnel
- All employees (permanent, temporary, contract)
- Third-party vendors with system access
- Contractors and consultants
- System administrators

### 2.3 Covered Data
- **Personal Data**: Names, addresses, phone numbers, email addresses, national IDs
- **Financial Data**: Salaries, bank accounts, payment information, transaction records
- **Business Data**: Inventory levels, pricing, supplier information, trade secrets
- **System Data**: Login credentials, access logs, audit trails

---

## 3. Data Classification

### 3.1 Classification Levels

#### **Level 1: PUBLIC**
- **Definition**: Information intended for public consumption
- **Examples**: Product catalog, store locations, business hours, promotional materials
- **Access**: No restrictions
- **Handling**: Standard business practices

#### **Level 2: INTERNAL**
- **Definition**: Information for internal business operations
- **Examples**: Inventory levels, sales reports (aggregated), shift schedules, internal memos
- **Access**: All employees on need-to-know basis
- **Handling**: 
  - Do not share outside organization
  - Encrypt when transmitted electronically
  - Secure physical documents

#### **Level 3: CONFIDENTIAL** ⭐ (Primary Classification)
- **Definition**: Sensitive information requiring protection
- **Examples**: 
  - Customer personal information (names, addresses, phone numbers)
  - Employee personal records (excluding salary)
  - Detailed sales reports
  - Supplier contracts
  - Pricing strategies
- **Access**: Role-based, logged, requires approval
- **Handling**:
  - ✅ Mandatory encryption (AES-256)
  - ✅ Access logging required
  - ✅ Multi-factor authentication for remote access
  - ✅ Screen lock after 5 minutes inactivity
  - ✅ No unauthorized screenshots/photos
  - ✅ Secure disposal (shredding/data wiping)

#### **Level 4: RESTRICTED**
- **Definition**: Highly sensitive data with legal/financial implications
- **Examples**:
  - Employee salaries and compensation
  - Customer payment card information
  - Bank account details
  - Financial statements and tax records
  - Audit reports
  - System administrator credentials
- **Access**: Strictly limited, dual authorization required
- **Handling**:
  - ✅ All Level 3 controls PLUS:
  - ✅ Dual authorization for access
  - ✅ Time-limited access sessions (30 minutes)
  - ✅ Manager notification on access
  - ✅ Quarterly access review
  - ✅ Encrypted backups only
  - ✅ No export/download without approval

#### **Level 5: HIGHLY RESTRICTED**
- **Definition**: Critical business secrets and compliance data
- **Examples**:
  - System master passwords
  - Encryption keys
  - Board-level strategic plans
  - Legal investigation data
  - Security incident reports
- **Access**: CEO/Super Admin only
- **Handling**:
  - ✅ All Level 4 controls PLUS:
  - ✅ Physical security (safe/vault)
  - ✅ Biometric authentication
  - ✅ Real-time monitoring
  - ✅ Immediate alert on access

### 3.2 Data Classification Matrix

| Data Type | Classification | Roles with Access | Special Controls |
|-----------|---------------|-------------------|------------------|
| Customer Names, Phone | Confidential | POS, Manager, CS Manager | Encryption, Logging |
| Customer Payment Cards | Restricted | POS (tokenized only) | PCI-DSS, No storage |
| Employee Salaries | Restricted | HR, Finance Manager, Super Admin | Dual auth, Manager alert |
| Inventory Levels | Internal | All warehouse/store roles | Standard |
| Financial Statements | Restricted | Finance Manager, Auditor, Super Admin | Quarterly review |
| System Admin Passwords | Highly Restricted | IT Support, Super Admin | Vault storage |
| Supplier Pricing | Confidential | Procurement Manager, Finance Manager | NDA required |
| Audit Logs | Restricted | Auditor, Super Admin | Tamper-proof |

---

## 4. Role-Based Privacy Policies

### 4.1 Super Admin / CEO

**Access Level**: Full system access (Level 1-5)  
**Primary Data**: All data types  
**Strictness**: Level 2 (Standard) with enhanced monitoring

**Policies**:
- ✅ All actions logged and reviewed quarterly
- ✅ Cannot delete own audit logs
- ✅ Separation of Duties: Cannot approve own expenses
- ✅ Multi-factor authentication mandatory
- ✅ Session timeout: 15 minutes
- ✅ IP whitelisting recommended
- ✅ Annual security training required

**Restrictions**:
- ❌ Cannot access employee salary data without business justification (logged)
- ❌ Cannot modify audit logs
- ❌ Cannot bypass approval workflows

**Monitoring**:
- Real-time alerts for:
  - Bulk data exports
  - User permission changes
  - System configuration changes
  - After-hours access to financial data

---

### 4.2 Finance Manager

**Access Level**: Financial data (Level 1-4)  
**Primary Data**: Expenses, payroll, revenue, financial reports  
**Strictness**: Level 2+ (Enhanced for salary data)

**Policies**:
- ✅ Access to employee salary data logged and reviewed monthly
- ✅ Cannot create AND approve same expense (SoD)
- ✅ Dual authorization required for payments >50,000 ETB
- ✅ Multi-factor authentication mandatory
- ✅ Session timeout: 10 minutes for payroll screens
- ✅ Quarterly access review
- ✅ Financial data handling training required

**Restrictions**:
- ❌ Cannot export salary data without HR Manager approval
- ❌ Cannot access system administration functions
- ❌ Cannot modify own salary record
- ❌ No access to customer payment card data (PCI-DSS)

**Monitoring**:
- Manager notification when:
  - Salary data accessed
  - Large expense created (>100,000 ETB)
  - Bulk financial data exported
  - Access outside business hours (7am-7pm)

**Data Handling**:
- Financial reports: Encrypted, password-protected
- Payroll data: Access only during payroll period (last 5 days of month)
- Printed reports: Shred immediately after use
- Email: Encrypted email only for financial data

---

### 4.3 HR Manager

**Access Level**: Employee data (Level 1-4)  
**Primary Data**: Employee records, salaries, personal information  
**Strictness**: Level 2+ (Enhanced for PII)

**Policies**:
- ✅ Access to all employee personal data
- ✅ Cannot create AND approve same employee hire (SoD)
- ✅ All salary changes logged and require Finance Manager approval
- ✅ Multi-factor authentication mandatory
- ✅ Session timeout: 10 minutes
- ✅ Annual HR data privacy training required
- ✅ Background check required for role

**Restrictions**:
- ❌ Cannot access financial statements
- ❌ Cannot modify system configurations
- ❌ Cannot access warehouse operational data
- ❌ Cannot export employee data without Super Admin approval

**Monitoring**:
- Manager notification when:
  - Employee salary modified
  - Bulk employee data exported
  - Employee record deleted
  - Access to terminated employee records

**Data Handling**:
- Employee files: Locked filing cabinet (physical)
- Digital records: Encrypted database
- Termination records: Retained 12 months, then archived
- Salary data: Shared with Finance Manager only

---

### 4.4 IT Support / Admin

**Access Level**: System administration (Level 1-4, selective Level 5)  
**Primary Data**: System configs, user accounts, audit logs  
**Strictness**: Level 3 (Strict) - "Who watches the watchers"

**Policies**:
- ✅ All system changes logged and reviewed weekly by Super Admin
- ✅ Cannot access business data (sales, inventory) without ticket
- ✅ Password changes logged and user notified
- ✅ Dual authorization for critical system changes
- ✅ Multi-factor authentication mandatory
- ✅ Session recording for privileged access
- ✅ Quarterly security audit of IT staff access

**Restrictions**:
- ❌ Cannot access employee salary data
- ❌ Cannot access customer payment information
- ❌ Cannot modify audit logs
- ❌ Cannot create Super Admin accounts without CEO approval
- ❌ No personal use of admin privileges

**Monitoring**:
- Real-time alerts for:
  - User account creation/deletion
  - Permission changes
  - System configuration changes
  - Database access outside maintenance windows
  - Failed login attempts (>3)

**Special Controls**:
- Privileged access: Time-limited (4-hour sessions)
- Emergency access: Requires CEO approval + incident ticket
- Vendor access: Supervised sessions only
- Remote access: VPN + MFA + IP whitelist

---

### 4.5 Warehouse Manager

**Access Level**: Warehouse operations (Level 1-3)  
**Primary Data**: Inventory, receiving, shipping, warehouse staff  
**Strictness**: Level 2 (Standard)

**Policies**:
- ✅ Access to inventory and warehouse operations data
- ✅ Cannot receive AND count same inventory (SoD)
- ✅ Inventory adjustments >100 units require approval
- ✅ Session timeout: 15 minutes
- ✅ Monthly access review

**Restrictions**:
- ❌ Cannot access financial data (costs, margins)
- ❌ Cannot access employee salary information
- ❌ Cannot access customer payment data
- ❌ Cannot modify pricing

**Monitoring**:
- Warning notification for:
  - Large inventory adjustments
  - Bulk product deletions
  - After-hours system access

---

### 4.6 Procurement Manager

**Access Level**: Procurement & suppliers (Level 1-3)  
**Primary Data**: Suppliers, purchase orders, receiving  
**Strictness**: Level 2 (Standard)

**Policies**:
- ✅ Access to supplier and procurement data
- ✅ Cannot create AND approve same PO (SoD)
- ✅ PO >50,000 ETB requires Finance Manager approval
- ✅ Supplier contracts require NDA
- ✅ Session timeout: 15 minutes

**Restrictions**:
- ❌ Cannot access employee salary data
- ❌ Cannot access customer personal data
- ❌ Cannot modify inventory without Warehouse Manager approval

**Monitoring**:
- Manager notification for:
  - PO >100,000 ETB created
  - New supplier added
  - Supplier pricing changed

---

### 4.7 Store Manager

**Access Level**: Store operations (Level 1-3)  
**Primary Data**: Sales, customers, store inventory, POS  
**Strictness**: Level 2 (Standard)

**Policies**:
- ✅ Access to store-level sales and customer data
- ✅ Cannot void AND approve same sale (SoD)
- ✅ Refunds >1,000 ETB require approval
- ✅ Session timeout: 15 minutes
- ✅ Customer data: View only, no export

**Restrictions**:
- ❌ Cannot access employee salary data
- ❌ Cannot access warehouse operations
- ❌ Cannot access financial statements
- ❌ Cannot export customer lists

**Monitoring**:
- Warning notification for:
  - Large refunds
  - Void transactions
  - Discount overrides >20%

---

### 4.8 POS Cashier

**Access Level**: Point of sale only (Level 1-2)  
**Primary Data**: Customer transactions, basic customer info  
**Strictness**: Level 2 (Standard)

**Policies**:
- ✅ Access to POS system during shift only
- ✅ Customer data: Minimal collection (name, phone for loyalty only)
- ✅ Payment cards: Tokenized, never stored
- ✅ Session timeout: 30 minutes
- ✅ Cannot access customer history beyond current transaction

**Restrictions**:
- ❌ Cannot access inventory management
- ❌ Cannot access employee data
- ❌ Cannot access financial reports
- ❌ Cannot void transactions without manager approval
- ❌ Cannot export any data

**Monitoring**:
- Warning notification for:
  - Excessive voids
  - Large discounts
  - Cash drawer discrepancies

**Data Minimization**:
- Collect only: Name, phone (optional), purchase items
- Do NOT collect: Address, email, ID numbers (unless legally required)
- Payment cards: Process only, never store full card number

---

### 4.9 Warehouse Picker / Driver

**Access Level**: Task execution only (Level 1-2)  
**Primary Data**: Pick lists, delivery addresses  
**Strictness**: Level 1 (Basic)

**Policies**:
- ✅ Access to assigned tasks only
- ✅ Customer delivery addresses: View only during delivery
- ✅ Session timeout: 30 minutes
- ✅ Cannot access customer phone numbers or payment info

**Restrictions**:
- ❌ Cannot access inventory management
- ❌ Cannot access employee data
- ❌ Cannot access financial data
- ❌ Cannot modify orders

**Data Handling**:
- Delivery slips: Return to warehouse after delivery
- Customer addresses: Do not record or share
- Failed deliveries: Report to dispatcher only

---

### 4.10 Auditor

**Access Level**: Read-only all data (Level 1-4)  
**Primary Data**: All business data for audit purposes  
**Strictness**: Level 2 (Standard) with read-only enforcement

**Policies**:
- ✅ Read-only access to all data
- ✅ Cannot modify any records
- ✅ All access logged for counter-audit
- ✅ Quarterly access review
- ✅ Audit reports: Confidential, encrypted

**Restrictions**:
- ❌ Cannot create, edit, or delete any data
- ❌ Cannot approve transactions
- ❌ Cannot access Level 5 (Highly Restricted) data
- ❌ Cannot export data without Super Admin approval

**Monitoring**:
- Log all access for transparency
- Quarterly review of auditor access patterns

---

## 5. Technical Controls

### 5.1 Authentication & Access Control

#### Multi-Factor Authentication (MFA)
**Required for**:
- Super Admin, Finance Manager, HR Manager, IT Support
- Remote access (all roles)
- Access to Restricted (Level 4) data

**Methods**:
- SMS OTP (One-Time Password)
- Authenticator app (Google Authenticator, Microsoft Authenticator)
- Email verification (backup method)

#### Password Policy
- **Minimum length**: 12 characters
- **Complexity**: Must include uppercase, lowercase, number, special character
- **Expiry**: 90 days for admin roles, 180 days for standard roles
- **History**: Cannot reuse last 5 passwords
- **Lockout**: 3 failed attempts = 15-minute lockout
- **Storage**: Bcrypt hashed, salted

#### Session Management
| Role | Timeout | Max Concurrent Sessions |
|------|---------|------------------------|
| Super Admin | 15 min | 1 |
| Finance Manager | 10 min (payroll), 15 min (other) | 1 |
| HR Manager | 10 min | 1 |
| IT Support | 15 min | 2 |
| Warehouse Manager | 15 min | 2 |
| Store Manager | 15 min | 2 |
| POS Cashier | 30 min | 1 |
| Warehouse Picker | 30 min | 1 |
| Auditor | 20 min | 1 |

### 5.2 Data Encryption

#### Encryption at Rest
- **Database**: AES-256 encryption
- **File storage**: AES-256 encryption
- **Backups**: AES-256 encryption + password protection
- **Sensitive fields**: Additional field-level encryption for:
  - Employee salaries
  - Customer payment tokens
  - Bank account numbers
  - National ID numbers

#### Encryption in Transit
- **Web traffic**: TLS 1.3 (minimum TLS 1.2)
- **API calls**: HTTPS only
- **Email**: S/MIME or PGP for confidential data
- **File transfers**: SFTP or encrypted cloud storage

### 5.3 Audit Logging

#### What to Log
- ✅ User login/logout (success and failures)
- ✅ Data access (view, create, edit, delete)
- ✅ Permission changes
- ✅ System configuration changes
- ✅ Data exports
- ✅ Failed authorization attempts
- ✅ Sensitive data access (salary, payment info)

#### Log Retention
- **Standard logs**: 12 months online, 24 months archived
- **Financial logs**: 7 years (tax compliance)
- **Security incidents**: Indefinite

#### Log Protection
- Tamper-proof (write-once)
- Encrypted storage
- Access restricted to Auditor and Super Admin
- Regular integrity checks

### 5.4 Network Security

#### IP Whitelisting
**Recommended for**:
- Super Admin (office IP only)
- Finance Manager (office + home IP)
- IT Support (office IP + approved remote IPs)

#### VPN Requirement
**Mandatory for**:
- Remote access to admin functions
- Access to Restricted (Level 4) data from outside office
- IT Support remote sessions

#### Firewall Rules
- Block all incoming traffic except HTTPS (443)
- Whitelist known IPs for admin access
- Rate limiting to prevent brute force attacks

### 5.5 Data Loss Prevention (DLP)

#### Export Controls
| Role | Can Export | Approval Required | Format Allowed |
|------|-----------|-------------------|----------------|
| Super Admin | Yes | Self-approved | PDF, Excel, CSV |
| Finance Manager | Financial data only | HR Manager (for salary) | PDF (encrypted) |
| HR Manager | Employee data only | Super Admin | PDF (encrypted) |
| Auditor | Read-only reports | Super Admin | PDF only |
| Others | No | N/A | N/A |

#### Print Controls
- Watermark all printed confidential documents
- Print logs maintained for 12 months
- Secure print release (PIN required)

#### Screenshot/Screen Recording
- Disabled for:
  - Payroll screens
  - Customer payment screens
  - System admin panels
- Warning message displayed on sensitive screens

#### USB/External Devices
- Disabled by default
- Enabled only with IT Support approval
- All file transfers logged

---

## 6. Data Retention & Lifecycle

### 6.1 Retention Periods

| Data Type | Retention Period | Archive Period | Disposal Method |
|-----------|-----------------|----------------|-----------------|
| **Customer Data** |
| Transaction records | 12 months active | 7 years archive | Secure deletion |
| Customer profiles (active) | Until account closure + 12 months | N/A | Secure deletion |
| Customer profiles (inactive >2 years) | Auto-delete | N/A | Secure deletion |
| Payment tokens | Until card expiry + 3 months | N/A | Immediate deletion |
| **Employee Data** |
| Active employee records | Duration of employment | N/A | N/A |
| Terminated employee records | 12 months active | 7 years archive | Secure deletion |
| Payroll records | 12 months active | 7 years archive | Secure deletion |
| Attendance records | 12 months active | 3 years archive | Secure deletion |
| **Financial Data** |
| Sales transactions | 12 months active | 7 years archive | Secure deletion |
| Expense records | 12 months active | 7 years archive | Secure deletion |
| Tax documents | 12 months active | 10 years archive | Secure deletion |
| Bank statements | 12 months active | 7 years archive | Secure deletion |
| **Operational Data** |
| Inventory records | 12 months active | 3 years archive | Secure deletion |
| Purchase orders | 12 months active | 5 years archive | Secure deletion |
| Supplier contracts | Contract term + 12 months | 7 years archive | Secure deletion |
| **System Data** |
| Audit logs (standard) | 12 months active | 24 months archive | Secure deletion |
| Audit logs (financial) | 12 months active | 7 years archive | Secure deletion |
| Security incident logs | Indefinite | N/A | Never |
| Backup data | 30 days | N/A | Secure deletion |

### 6.2 Data Lifecycle Stages

#### 1. Collection
- Collect only necessary data (minimization principle)
- Obtain consent where required
- Document purpose of collection

#### 2. Storage
- Encrypt sensitive data
- Access controls enforced
- Regular backups (daily incremental, weekly full)

#### 3. Use
- Use only for stated purpose
- Access logged and monitored
- Share only with authorized personnel

#### 4. Archive
- Move to secure archive storage after retention period
- Reduced access (Auditor + Super Admin only)
- Maintain encryption

#### 5. Disposal
- Secure deletion methods:
  - **Digital**: 7-pass wipe (DoD 5220.22-M standard)
  - **Physical**: Cross-cut shredding (P-4 level minimum)
  - **Hard drives**: Physical destruction after wiping
- Certificate of destruction maintained

### 6.3 Right to Erasure (Data Subject Rights)

**Customer Rights**:
- Request copy of personal data (within 30 days)
- Request correction of inaccurate data
- Request deletion of data (with exceptions)

**Exceptions** (Cannot delete):
- Data required for legal/tax compliance (7 years)
- Data subject to ongoing legal proceedings
- Data required for fraud prevention

**Process**:
1. Customer submits written request
2. Verify identity (ID + purchase history)
3. Review for exceptions
4. Execute within 30 days
5. Provide confirmation

---

## 7. Violation & Incident Response

### 7.1 Policy Violations

#### Types of Violations

**Minor Violations** (Warning):
- Single unauthorized access attempt
- Sharing password with colleague
- Leaving workstation unlocked
- Printing confidential data without watermark

**Major Violations** (Suspension + Investigation):
- Accessing data without business need
- Sharing confidential data externally
- Attempting to bypass security controls
- Multiple failed access attempts
- Accessing terminated employee records without justification

**Critical Violations** (Immediate Termination + Legal Action):
- Stealing customer/employee data
- Selling confidential information
- Intentionally deleting/modifying audit logs
- Installing malware/backdoors
- Fraud or embezzlement

#### Violation Response Process

**Step 1: Detection**
- Automated alerts trigger
- Manual reports from employees
- Audit log review

**Step 2: Notification**
```
Minor: Warning notification to employee
Major: Manager notification + HR notification
Critical: Super Admin + HR + Legal notification
```

**Step 3: Investigation**
- IT Support pulls audit logs
- HR interviews involved parties
- Evidence collected and preserved

**Step 4: Action**
```
Minor: Written warning + training
Major: Suspension (1-5 days) + formal warning + training
Critical: Termination + legal action + law enforcement notification
```

**Step 5: Documentation**
- Incident report filed
- Audit log preserved
- Lessons learned documented

### 7.2 Data Breach Response

#### Breach Classification

**Level 1 - Low Risk**
- Single customer record exposed
- Internal exposure only
- No sensitive data (e.g., just name)

**Level 2 - Medium Risk**
- Multiple customer records exposed (<100)
- Employee personal data exposed
- External exposure but no financial data

**Level 3 - High Risk**
- Large-scale exposure (>100 records)
- Financial data exposed
- Payment card data exposed
- Public exposure

**Level 4 - Critical**
- Massive breach (>1,000 records)
- Payment card data stolen
- Ransomware attack
- System compromise

#### Breach Response Plan

**Phase 1: Containment (0-1 hour)**
1. Isolate affected systems
2. Revoke compromised credentials
3. Block unauthorized access
4. Preserve evidence (logs, screenshots)

**Phase 2: Assessment (1-4 hours)**
1. Determine scope of breach
2. Identify affected data
3. Count affected individuals
4. Classify breach level

**Phase 3: Notification (4-24 hours)**

**Internal Notification**:
- Immediate: Super Admin, IT Support
- Within 1 hour: HR Manager, Finance Manager (if relevant)
- Within 4 hours: All managers

**External Notification** (if Level 3-4):
- Within 24 hours: Affected customers (email + SMS)
- Within 72 hours: Regulatory authorities (if required)
- Within 7 days: Public announcement (if >1,000 affected)

**Notification Template**:
```
Subject: Important Security Notice - SIIFMART Data Incident

Dear [Customer/Employee],

We are writing to inform you of a data security incident that may have affected your personal information.

What Happened:
[Brief description of incident]

What Information Was Involved:
[List of data types: name, phone, etc.]

What We Are Doing:
- Secured the affected systems
- Investigating the incident
- Enhancing security measures

What You Should Do:
- Monitor your accounts for suspicious activity
- Change your password if you have an account
- Contact us with any concerns: [contact info]

We sincerely apologize for this incident and are committed to protecting your information.

Sincerely,
SIIFMART Management
```

**Phase 4: Remediation (1-7 days)**
1. Fix security vulnerability
2. Restore systems from clean backups
3. Implement additional controls
4. Conduct security audit

**Phase 5: Post-Incident (7-30 days)**
1. Root cause analysis
2. Update policies and procedures
3. Employee training
4. Regulatory reporting (if required)
5. Lessons learned documentation

### 7.3 Incident Escalation Matrix

| Incident Type | Severity | Notify Within | Notify Who |
|---------------|----------|---------------|------------|
| Failed login (3x) | Low | Real-time | User (email) |
| Unauthorized access attempt | Medium | 15 minutes | Manager + IT Support |
| Data export (unusual) | Medium | 15 minutes | Manager + Super Admin |
| Salary data accessed | Medium | 30 minutes | HR Manager + Finance Manager |
| System configuration change | High | Immediate | Super Admin + IT Support |
| Bulk data deletion | High | Immediate | Super Admin + Manager |
| Data breach (any) | Critical | Immediate | Super Admin + HR + Legal |
| Ransomware detected | Critical | Immediate | All managers + IT Support |

---

## 8. Employee Rights & Responsibilities

### 8.1 Employee Rights

**Right to Privacy**:
- Personal data collected only for employment purposes
- Access to own employee record upon request
- Correction of inaccurate personal data
- Notification of data breaches affecting personal data

**Right to Access**:
- Request copy of own data (within 14 days)
- Understand how data is used
- Know who has accessed personal data (audit logs)

**Right to Object**:
- Object to processing of personal data (with valid reason)
- Request restriction of processing
- Escalate privacy concerns to HR

**Right to Training**:
- Annual privacy and security training
- Role-specific data handling training
- Incident response training

### 8.2 Employee Responsibilities

**Confidentiality**:
- ✅ Protect all confidential data
- ✅ Do not share passwords
- ✅ Do not discuss confidential matters in public
- ✅ Secure physical documents (locked drawer/cabinet)
- ✅ Lock workstation when leaving desk (Windows+L)

**Data Handling**:
- ✅ Access only data needed for job duties
- ✅ Do not access own records or records of family/friends
- ✅ Report suspected data breaches immediately
- ✅ Follow clean desk policy
- ✅ Shred confidential documents

**System Security**:
- ✅ Use strong, unique passwords
- ✅ Enable MFA when required
- ✅ Do not install unauthorized software
- ✅ Do not use personal USB drives
- ✅ Report lost/stolen devices immediately
- ✅ Do not access systems from public WiFi (use VPN)

**Prohibited Actions**:
- ❌ Sharing login credentials
- ❌ Accessing data without business need
- ❌ Copying confidential data to personal devices
- ❌ Taking photos/screenshots of confidential data
- ❌ Discussing confidential matters on social media
- ❌ Using company data for personal gain

### 8.3 Acknowledgment & Training

**New Employee Onboarding**:
- Day 1: Privacy policy acknowledgment (signed)
- Week 1: Data security training (2 hours)
- Month 1: Role-specific privacy training

**Annual Requirements**:
- Privacy policy review and re-acknowledgment
- Security awareness training (1 hour)
- Phishing simulation test

**Role Changes**:
- New role privacy training within 7 days
- Access review and adjustment
- Updated acknowledgment

**Acknowledgment Form**:
```
I, [Employee Name], acknowledge that I have read, understood, and agree to comply with the SIIFMART Privacy Policy and Data Protection Framework.

I understand that:
- I am responsible for protecting confidential data
- Violations may result in disciplinary action up to termination
- I must report security incidents immediately
- I will complete required training

Signature: ________________  Date: ________________
Employee ID: ________________  Role: ________________
```

---

## 9. Compliance & Enforcement

### 9.1 Policy Governance

**Policy Owner**: Chief Executive Officer (Super Admin)  
**Policy Administrator**: HR Manager  
**Technical Enforcement**: IT Support

**Review Schedule**:
- Annual comprehensive review
- Quarterly risk assessment
- Ad-hoc updates for regulatory changes

### 9.2 Compliance Monitoring

**Monthly**:
- Access log review (IT Support)
- Policy violation reports (HR)
- Security incident summary (IT Support)

**Quarterly**:
- Access rights review (all roles)
- Data retention compliance check
- Employee training completion audit

**Annually**:
- Full security audit (external auditor)
- Policy effectiveness review
- Employee privacy survey

### 9.3 Enforcement

**Disciplinary Actions**:
1. Verbal warning (documented)
2. Written warning
3. Suspension (1-5 days without pay)
4. Termination
5. Legal action (if applicable)

**Progressive Discipline**:
- First minor violation: Verbal warning + training
- Second minor violation: Written warning
- Third minor violation: Suspension
- Fourth minor violation: Termination

**Immediate Termination**:
- Critical violations (see 7.1)
- Fraud or theft
- Intentional data breach
- Gross negligence

---

## 10. Contact & Reporting

### 10.1 Privacy Contacts

**Data Protection Officer**: HR Manager  
**Email**: privacy@siifmart.et  
**Phone**: [HR Manager Phone]

**Security Incidents**: IT Support  
**Email**: security@siifmart.et  
**Phone**: [IT Support Phone]  
**Emergency**: [24/7 Hotline]

### 10.2 Reporting Channels

**Policy Violations**:
- Report to: Direct Manager or HR Manager
- Anonymous hotline: [Phone Number]
- Email: ethics@siifmart.et

**Data Breaches**:
- Report immediately to: IT Support + Super Admin
- Email: security@siifmart.et
- Phone: [Emergency Number]

**Privacy Concerns**:
- Report to: HR Manager
- Email: privacy@siifmart.et

---

## 11. Appendices

### Appendix A: Glossary
- **PII**: Personally Identifiable Information
- **SoD**: Separation of Duties
- **MFA**: Multi-Factor Authentication
- **PCI-DSS**: Payment Card Industry Data Security Standard
- **ETB**: Ethiopian Birr (currency)

### Appendix B: Quick Reference Card
[To be printed and distributed to all employees]

### Appendix C: Training Materials
[Links to training videos and documents]

### Appendix D: Incident Report Form
[Template for reporting security incidents]

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-28 | System Administrator | Initial release |

**Approval**

CEO/Super Admin: ________________  Date: ________________

HR Manager: ________________  Date: ________________

---

**END OF DOCUMENT**
