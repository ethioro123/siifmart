import { useCallback } from 'react';
import type { Employee, ShiftRecord, Site, SystemLog } from '../../types';
import { employeesService, shiftsService } from '../../services/supabase.service';

import { logger } from '../../utils/logger';

interface UseEmployeeActionsDeps {
    activeSite: Site | undefined;
    activeSiteId: string;
    employees: Employee[];
    shifts?: ShiftRecord[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    setShifts: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
}

export function useEmployeeActions(deps: UseEmployeeActionsDeps) {
    const { activeSite, activeSiteId, employees, shifts = [], setEmployees, setShifts, addNotification, logSystemEvent } = deps;

    const addEmployee = useCallback(async (employee: Employee, user?: string) => {
        try {
            const targetSiteId = (employee.siteId || activeSite?.id || '').trim();
            if (!targetSiteId) {
                throw new Error('Workplace location is mandatory. Every employee must be assigned to an operating location.');
            }
            const newEmployee = await employeesService.create({
                ...employee,
                siteId: targetSiteId
            });
            setEmployees(prev => [newEmployee, ...prev]);
            addNotification('success', `Employee ${employee.name} added`);
            return newEmployee;
        } catch (error: any) {
            logger.error('useEmployeeActions', 'addEmployee error:', error as Error);
            const errorMessage = error?.message || 'Failed to add employee';
            addNotification('alert', `Failed to add employee: ${errorMessage}`);
            throw error;
        }
    }, [activeSite, addNotification]);

    const updateEmployee = useCallback(async (employee: Employee, user: string) => {
        try {
            await employeesService.update(employee.id, employee);
            setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
            addNotification('success', 'Employee updated');
        } catch (error) {
            logger.error('useEmployeeActions', 'caught error', error as Error);
            addNotification('alert', 'Failed to update employee');
        }
    }, [addNotification]);

    const deleteEmployee = useCallback(async (id: string, user: string) => {
        try {
            await employeesService.delete(id);
            setEmployees(prev => prev.filter(e => e.id !== id));
            addNotification('success', 'Employee deleted');
        } catch (error) {
            logger.error('useEmployeeActions', 'caught error', error as Error);
            addNotification('alert', 'Failed to delete employee');
        }
    }, [addNotification]);

    const startShift = useCallback(async (cashierId: string, openingFloat: number, counterNumber?: string) => {
        try {
            const cashier = employees.find(e => e.id === cashierId || e.code === cashierId);
            const staffName = cashier?.name || 'Staff Member';
            const cashierCode = cashier?.code || undefined;
            const shiftId = crypto.randomUUID();
            const resolvedCounter = counterNumber || 'Counter 1';
            const counterIndex = Number(resolvedCounter.match(/[0-9]+$/)?.[0] || 1);
            const terminalId = activeSite?.code
                ? `${activeSite.code.toUpperCase()}-POS-${String(counterIndex).padStart(2, '0')}`
                : undefined;

            // Calculate sequential human-readable shift number (e.g. SHF-0001, SHF-0002)
            const existingNums = (shifts || [])
                .map(s => {
                    const cleanNum = String(s.shiftNumber || s.shift_number || '').replace(/^[^\d]*/, '');
                    return parseInt(cleanNum, 10);
                })
                .filter(n => !isNaN(n) && n > 0);
            const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : (shifts || []).length;
            const nextSeq = maxNum + 1;
            const formattedShiftNumber = `SHF-${String(nextSeq).padStart(4, '0')}`;

            const shift: ShiftRecord = {
                id: shiftId,
                shiftNumber: formattedShiftNumber,
                shift_number: formattedShiftNumber,
                siteId: activeSiteId || activeSite?.id || '',
                cashierId,
                cashierName: staffName,
                cashierCode,
                cashier_code: cashierCode,
                counterNumber: resolvedCounter,
                counter_number: resolvedCounter,
                terminalId,
                terminal_id: terminalId,
                startTime: new Date().toISOString(),
                status: 'Open',
                openingFloat,
                cashSales: 0,
                expectedCash: openingFloat,
                actualCash: 0,
                variance: 0,
                discrepancyReason: '',
                reconciliationStatus: 'Pending'
            };

            // 1. Persist directly to Supabase
            await shiftsService.create(shift);

            // 2. State update only after successful persistence
            setShifts(prev => [shift, ...prev]);

            const staffBadge = cashierCode ? `${cashierCode} (${staffName})` : staffName;
            addNotification('success', `Shift started on ${resolvedCounter} for ${staffBadge} with ${openingFloat.toLocaleString()} float`);
            logSystemEvent('Start Shift', `Started shift ${formattedShiftNumber} on ${resolvedCounter} for ${staffBadge} with float ${openingFloat}`, staffName, 'HR');
        } catch (error) {
            logger.error('useEmployeeActions', 'Failed to start shift:', error as Error);
            throw error;
        }
    }, [activeSiteId, activeSite?.id, employees, shifts, addNotification, logSystemEvent, setShifts]);

    const closeShift = useCallback(async (shift: ShiftRecord) => {
        try {
            const cashier = employees.find(e => e.id === shift.cashierId);
            const staffName = shift.cashierName || cashier?.name || 'Staff Member';
            const endTime = new Date().toISOString();
            const closedShift: ShiftRecord = {
                ...shift,
                status: 'Closed',
                endTime,
                closedBy: staffName
            };

            // 1. Persist directly to Supabase first
            await shiftsService.update(shift.id, closedShift);

            // 2. State update only after successful persistence
            setShifts(prev => prev.map(s => s.id === shift.id ? closedShift : s));

            addNotification('success', 'Shift closed & submitted for HQ audit');
            logSystemEvent('Close Shift', `Closed shift for ${staffName}. Variance: ${closedShift.variance || 0}`, staffName, 'HR');
        } catch (error) {
            logger.error('useEmployeeActions', 'Failed to close shift:', error as Error);
            addNotification('alert', 'Failed to close shift in database');
            throw error;
        }
    }, [employees, addNotification, logSystemEvent, setShifts]);

    const reconcileShift = useCallback(async (
        shiftId: string,
        hqUserName: string,
        status: 'Reconciled' | 'Discrepancy_Flagged' = 'Reconciled',
        hqNotes?: string
    ) => {
        try {
            // 1. Persist to Supabase
            await shiftsService.reconcile(shiftId, hqUserName, status, hqNotes);

            // 2. Update local state
            setShifts(prev => prev.map(s => s.id === shiftId ? {
                ...s,
                status: status === 'Reconciled' ? 'Audited' : 'Flagged',
                reconciledBy: hqUserName,
                reconciledAt: new Date().toISOString(),
                reconciliationStatus: status,
                hqNotes: hqNotes || s.hqNotes
            } : s));

            addNotification('success', `Shift reconciliation signed off: ${status}`);
            logSystemEvent('Reconcile Shift', `HQ ${hqUserName} reconciled shift ${shiftId}: ${status}`, hqUserName, 'Finance');
        } catch (error) {
            logger.error('useEmployeeActions', 'Failed to reconcile shift:', error as Error);
            addNotification('alert', 'Failed to save reconciliation status');
        }
    }, [addNotification, logSystemEvent, setShifts]);

    return { addEmployee, updateEmployee, deleteEmployee, startShift, closeShift, reconcileShift };
}

