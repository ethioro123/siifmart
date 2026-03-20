import { useCallback } from 'react';
import type { Employee, ShiftRecord, Site, SystemLog } from '../../types';
import { employeesService } from '../../services/supabase.service';

interface UseEmployeeActionsDeps {
    activeSite: Site | undefined;
    activeSiteId: string;
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    setShifts: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
}

export function useEmployeeActions(deps: UseEmployeeActionsDeps) {
    const { activeSite, activeSiteId, employees, setEmployees, setShifts, addNotification, logSystemEvent } = deps;

    const addEmployee = useCallback(async (employee: Employee, user?: string) => {
        try {
            const newEmployee = await employeesService.create({
                ...employee,
                siteId: employee.siteId || activeSite?.id || ''
            });
            setEmployees(prev => [newEmployee, ...prev]);
            addNotification('success', `Employee ${employee.name} added`);
            return newEmployee;
        } catch (error: any) {
            console.error('addEmployee error:', error);
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
            console.error(error);
            addNotification('alert', 'Failed to update employee');
        }
    }, [addNotification]);

    const deleteEmployee = useCallback(async (id: string, user: string) => {
        try {
            await employeesService.delete(id);
            setEmployees(prev => prev.filter(e => e.id !== id));
            addNotification('success', 'Employee deleted');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to delete employee');
        }
    }, [addNotification]);

    const startShift = useCallback(async (cashierId: string, openingFloat: number) => {
        try {
            const cashier = employees.find(e => e.id === cashierId);
            const shift: ShiftRecord = {
                id: crypto.randomUUID(),
                siteId: activeSiteId || '',
                cashierId,
                cashierName: cashier?.name || 'Unknown',
                startTime: new Date().toISOString(),
                status: 'Open',
                openingFloat,
                cashSales: 0,
                expectedCash: 0,
                actualCash: 0,
                variance: 0,
                discrepancyReason: ''
            };
            setShifts(prev => [shift, ...prev]);
            addNotification('success', 'Shift started');
            logSystemEvent('Start Shift', `Started shift for ${cashierId}`, cashierId, 'HR');
        } catch (error) {
            console.error('Failed to start shift:', error);
            addNotification('alert', 'Failed to start shift');
        }
    }, [activeSiteId, employees, addNotification, logSystemEvent]);

    const closeShift = useCallback(async (shift: ShiftRecord) => {
        try {
            setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, ...shift, status: 'Closed', endTime: new Date().toISOString() } : s));
            addNotification('success', 'Shift closed');
            logSystemEvent('Close Shift', `Closed shift ${shift.id}`, shift.cashierId, 'HR');
        } catch (error) {
            console.error('Failed to close shift:', error);
            addNotification('alert', 'Failed to close shift');
        }
    }, [addNotification, logSystemEvent]);

    return { addEmployee, updateEmployee, deleteEmployee, startShift, closeShift };
}
