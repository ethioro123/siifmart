import { useCallback } from 'react';
import type { Customer, SystemLog } from '../../types';
import { customersService } from '../../services/supabase.service';

interface UseCustomerActionsDeps {
    queries: any; // useDataQueries result
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
}

export function useCustomerActions(deps: UseCustomerActionsDeps) {
    const { queries, addNotification } = deps;

    const addCustomer = useCallback(async (customer: Omit<Customer, 'id'>) => {
        try {
            await customersService.create(customer);
            await queries.customers.refetch();
            addNotification('success', 'Customer added');
        } catch (error) {
            console.error('Failed to add customer:', error);
            addNotification('alert', 'Failed to add customer');
        }
    }, [queries.customers, addNotification]);

    const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
        try {
            await customersService.update(id, updates);
            await queries.customers.refetch();
            addNotification('success', 'Customer updated');
        } catch (error) {
            console.error('Failed to update customer:', error);
            addNotification('alert', 'Failed to update customer');
        }
    }, [queries.customers, addNotification]);

    const deleteCustomer = useCallback(async (id: string) => {
        try {
            await customersService.delete(id);
            await queries.customers.refetch();
            addNotification('success', 'Customer deleted');
        } catch (error) {
            console.error('Failed to delete customer:', error);
            addNotification('alert', 'Failed to delete customer');
        }
    }, [queries.customers, addNotification]);

    return { addCustomer, updateCustomer, deleteCustomer };
}
