import { Employee } from '../types';

export interface EmployeeDocument {
    id: string;
    name: string;
    size: string;
    type: string;
    uploadedAt: string;
    dataUrl?: string;
}

export interface LeaveRequest {
    id: string;
    type: 'Annual Leave' | 'Sick Leave' | 'Emergency' | 'Unpaid';
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}

export interface PayslipRecord {
    id: string;
    period: string; // e.g. "September 2026"
    releaseDate: string;
    grossSalary: number;
    taxDeduction: number;
    pensionDeduction: number;
    netSalary: number;
    status?: 'Disbursed' | 'Pending';
}

// Net Salary Calculation
export function calculateNetSalary(gross: number) {
    if (!gross || gross <= 0) {
        return {
            grossSalary: 0,
            taxDeduction: 0,
            pensionDeduction: 0,
            netSalary: 0
        };
    }
    const taxDeduction = Math.round(gross * 0.15);
    const pensionDeduction = Math.round(gross * 0.07);
    const netSalary = Math.max(0, gross - taxDeduction - pensionDeduction);
    return {
        grossSalary: gross,
        taxDeduction,
        pensionDeduction,
        netSalary
    };
}

// Safe LocalStorage helpers
function getStorageItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('Storage quota exceeded or storage unavailable', e);
    }
}

// Documents Local Storage Bridge
export function getEmployeeDocuments(employeeId: string): EmployeeDocument[] {
    try {
        const stored = getStorageItem(`siifmart_emp_docs_${employeeId}`);
        if (!stored) {
            const defaults: EmployeeDocument[] = [
                {
                    id: `doc_def_1_${employeeId}`,
                    name: `Employment_Contract_${employeeId}.pdf`,
                    size: '1.4 MB',
                    type: 'pdf',
                    uploadedAt: '2025-01-15'
                },
                {
                    id: `doc_def_2_${employeeId}`,
                    name: 'National_ID_Card.png',
                    size: '420 KB',
                    type: 'png',
                    uploadedAt: '2025-01-15'
                }
            ];
            setStorageItem(`siifmart_emp_docs_${employeeId}`, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveEmployeeDocument(employeeId: string, doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>): EmployeeDocument {
    const docs = getEmployeeDocuments(employeeId);
    const newDoc: EmployeeDocument = {
        ...doc,
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        uploadedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newDoc, ...docs];
    setStorageItem(`siifmart_emp_docs_${employeeId}`, JSON.stringify(updated));
    return newDoc;
}

export function addEmployeeDocument(employeeId: string, name: string, size: string, dataUrl?: string): EmployeeDocument {
    return saveEmployeeDocument(employeeId, {
        name,
        size,
        type: name.split('.').pop() || 'file',
        dataUrl
    });
}

export function deleteEmployeeDocument(employeeId: string, docId: string): void {
    const docs = getEmployeeDocuments(employeeId).filter(d => d.id !== docId);
    setStorageItem(`siifmart_emp_docs_${employeeId}`, JSON.stringify(docs));
}

export function removeEmployeeDocument(employeeId: string, docId: string): void {
    deleteEmployeeDocument(employeeId, docId);
}

// Leave Requests Storage Bridge
export function getEmployeeLeaveRequests(employeeId: string): LeaveRequest[] {
    try {
        const stored = getStorageItem(`siifmart_emp_leave_${employeeId}`);
        if (!stored) {
            const defaults: LeaveRequest[] = [
                {
                    id: `leave_def_1_${employeeId}`,
                    type: 'Annual Leave',
                    startDate: '2026-01-12',
                    endDate: '2026-01-16',
                    days: 5,
                    reason: 'Annual family holiday',
                    status: 'Approved',
                    createdAt: '2026-01-05'
                }
            ];
            setStorageItem(`siifmart_emp_leave_${employeeId}`, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveEmployeeLeaveRequest(employeeId: string, request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>): LeaveRequest {
    const list = getEmployeeLeaveRequests(employeeId);
    const newReq: LeaveRequest = {
        ...request,
        id: `leave_${Date.now()}`,
        status: 'Pending',
        createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newReq, ...list];
    setStorageItem(`siifmart_emp_leave_${employeeId}`, JSON.stringify(updated));
    return newReq;
}

export function addEmployeeLeaveRequest(employeeId: string, request: { type: string; startDate: string; endDate: string; reason?: string }): LeaveRequest {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    return saveEmployeeLeaveRequest(employeeId, {
        type: request.type as LeaveRequest['type'],
        startDate: request.startDate,
        endDate: request.endDate,
        days,
        reason: request.reason || ''
    });
}

export function updateEmployeeLeaveStatus(employeeId: string, requestId: string, status: 'Approved' | 'Rejected'): void {
    const list = getEmployeeLeaveRequests(employeeId).map(req => {
        if (req.id === requestId) {
            return { ...req, status };
        }
        return req;
    });
    setStorageItem(`siifmart_emp_leave_${employeeId}`, JSON.stringify(list));
}

export function updateEmployeeLeaveRequestStatus(employeeId: string, requestId: string, status: 'Approved' | 'Rejected'): void {
    updateEmployeeLeaveStatus(employeeId, requestId, status);
}

// Real Payslip Generator from actual salary
export function generateEmployeePayslips(employee: Employee, countOrCurrency?: number | string): PayslipRecord[] {
    const salary = employee.salary || 12000;
    const count = typeof countOrCurrency === 'number' ? countOrCurrency : 4;
    const payslips: PayslipRecord[] = [];
    const now = new Date();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let i = 1; i <= count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 28);
        const period = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        const releaseDate = `${monthNames[d.getMonth()].substring(0, 3)} 28, ${d.getFullYear()}`;

        const { grossSalary, taxDeduction, pensionDeduction, netSalary } = calculateNetSalary(salary);

        payslips.push({
            id: `SLIP-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${employee.id.substring(0, 4)}`,
            period,
            releaseDate,
            grossSalary,
            taxDeduction,
            pensionDeduction,
            netSalary,
            status: 'Disbursed'
        });
    }

    return payslips;
}
