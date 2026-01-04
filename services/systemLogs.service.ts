/**
 * System Logs Service
 * Handles audit logging for security, compliance, and operational events.
 * Implements requirements from PRIVACY_POLICY.md
 */

import { UserRole } from '../types';

export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type LogCategory =
    | 'SECURITY'    // Login, permissions, SoD
    | 'FINANCE'     // Transactions, payroll, expenses
    | 'HR'          // Employee data access, salary changes
    | 'OPERATIONS'  // Inventory, sales, procurement
    | 'SYSTEM'      // Config changes, errors
    | 'COMPLIANCE'; // Audit access, data exports

export interface LogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userRole: UserRole | string;
    userName: string;
    action: string;
    details: string;
    category: LogCategory;
    severity: LogSeverity;
    ip?: string;
    metadata?: Record<string, any>;
}

class SystemLogsService {
    private logs: LogEntry[] = [];
    private readonly STORAGE_KEY = 'siifmart_system_logs';

    constructor() {
        this.loadLogs();
    }

    private loadLogs() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load logs', e);
        }
    }

    private saveLogs() {
        try {
            // IMPORTANT: Rotate logs to prevent localStorage overflow
            // Keep only last 1000 entries (approximately 500KB)
            if (this.logs.length > 1000) {
                console.warn(`Log rotation: Trimming ${this.logs.length - 1000} old entries`);
                this.logs = this.logs.slice(0, 1000);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save logs', e);
            // If localStorage is full, force cleanup
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded - forcing log cleanup');
                this.logs = this.logs.slice(0, 500); // Keep only 500 most recent
                try {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
                } catch (retryError) {
                    console.error('Failed to save logs even after cleanup', retryError);
                }
            }
        }
    }

    /**
     * Cleanup old logs (called periodically)
     */
    cleanupOldLogs(daysToKeep: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const before = this.logs.length;
        this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoffDate);
        const after = this.logs.length;

        if (before !== after) {
            console.log(`Cleaned up ${before - after} old log entries`);
            this.saveLogs();
        }
    }

    /**
     * Create a new audit log entry
     */
    log(
        category: LogCategory,
        severity: LogSeverity,
        action: string,
        details: string,
        user?: { id: string; role: string; name: string },
        metadata?: Record<string, any>
    ): LogEntry {
        const entry: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            userId: user?.id || 'system',
            userRole: user?.role || 'system',
            userName: user?.name || 'System',
            action,
            details,
            category,
            severity,
            metadata
        };

        this.logs.unshift(entry);
        this.saveLogs();

        // Console output for dev
        const color = this.getConsoleColor(severity);
        console.log(`%c[${category}] ${action}: ${details}`, color);

        return entry;
    }

    /**
     * Log a security event (Login, Logout, Permission Denied)
     */
    logSecurity(action: string, details: string, user?: any, severity: LogSeverity = 'INFO') {
        return this.log('SECURITY', severity, action, details, user);
    }

    /**
     * Log a financial event (High value transaction, Payroll)
     */
    logFinance(action: string, amount: number, details: string, user?: any) {
        const severity = amount > 50000 ? 'WARNING' : 'INFO';
        return this.log('FINANCE', severity, action, `${details} (Amount: ${amount} ETB)`, user, { amount });
    }

    /**
     * Log an HR event (Salary view, Employee update)
     */
    logHR(action: string, details: string, user?: any, severity: LogSeverity | object = 'INFO', metadata?: Record<string, any>) {
        // Handle overload where severity might be metadata object (backwards compatibility)
        let actualSeverity: LogSeverity = 'INFO';
        let actualMetadata = metadata;

        if (typeof severity === 'object') {
            actualMetadata = severity as any;
            actualSeverity = 'INFO';
        } else {
            actualSeverity = severity as LogSeverity;
        }

        return this.log('HR', actualSeverity, action, details, user, actualMetadata);
    }

    /**
     * Log a Separation of Duties violation
     */
    logSoDViolation(user: any, conflictingPermissions: string[]) {
        return this.log(
            'SECURITY',
            'CRITICAL',
            'SOD_VIOLATION',
            `User attempted actions violating SoD: ${conflictingPermissions.join(', ')}`,
            user,
            { conflictingPermissions }
        );
    }

    /**
     * Get logs with filtering
     */
    getLogs(filters?: {
        category?: LogCategory;
        severity?: LogSeverity;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }): LogEntry[] {
        let filtered = this.logs;

        if (filters) {
            if (filters.category) filtered = filtered.filter(l => l.category === filters.category);
            if (filters.severity) filtered = filtered.filter(l => l.severity === filters.severity);
            if (filters.userId) filtered = filtered.filter(l => l.userId === filters.userId);
            if (filters.startDate) filtered = filtered.filter(l => new Date(l.timestamp) >= filters.startDate!);
            if (filters.endDate) filtered = filtered.filter(l => new Date(l.timestamp) <= filters.endDate!);
        }

        return filtered;
    }

    /**
     * Clear logs (CEO only - strictly controlled in real app)
     */
    clearLogs() {
        this.logs = [];
        this.saveLogs();
        this.log('SYSTEM', 'WARNING', 'LOGS_CLEARED', 'Audit logs were cleared');
    }

    private getConsoleColor(severity: LogSeverity): string {
        switch (severity) {
            case 'CRITICAL': return 'color: red; font-weight: bold';
            case 'ERROR': return 'color: red';
            case 'WARNING': return 'color: orange';
            case 'INFO': return 'color: blue';
            default: return 'color: black';
        }
    }
}

export const systemLogsService = new SystemLogsService();
