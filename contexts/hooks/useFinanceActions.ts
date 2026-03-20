import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ExpenseRecord, Employee, Product, Supplier, SystemLog } from '../../types';
import { productsService, suppliersService } from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
import { CURRENCY_SYMBOL } from '../../constants';

interface UseFinanceActionsDeps {
    activeSiteId: string;
    activeSite: any;
    products: Product[];
    allProducts: Product[];
    employees: Employee[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
    queries: any;
}

export function useFinanceActions(deps: UseFinanceActionsDeps) {
    const {
        activeSiteId, activeSite, products, allProducts, employees,
        setProducts, setExpenses, setSuppliers,
        addNotification, logSystemEvent, queries
    } = deps;
    const queryClient = useQueryClient();

    const addSupplier = useCallback(async (supplier: Supplier) => {
        try {
            const newSupplier = await suppliersService.create(supplier);
            setSuppliers(prev => [newSupplier, ...prev]);

            queryClient.setQueryData(['suppliers'], (old: Supplier[] | undefined) =>
                old ? [newSupplier, ...old] : [newSupplier]
            );

            addNotification('success', `Supplier ${supplier.name} added`);
            logSystemEvent('Add Supplier', `Added supplier ${supplier.name}`, 'System', 'Inventory');
        } catch (error) {
            console.error('Failed to add supplier:', error);
            addNotification('alert', 'Failed to add supplier');
        }
    }, [addNotification, logSystemEvent, queryClient]);

    const adjustStock = useCallback(async (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => {
        try {
            // 1. Optimistic Update
            setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                    const newStock = type === 'IN' ? p.stock + qty : Math.max(0, p.stock - qty);
                    return { ...p, stock: newStock };
                }
                return p;
            }));

            // 2. Server Update
            const product = products.find(p => p.id === productId) || allProducts.find(p => p.id === productId);

            if (product) {
                const newStock = type === 'IN' ? product.stock + qty : Math.max(0, product.stock - qty);
                await productsService.update(productId, { stock: newStock });

                // 3. Log Movement to DB
                try {
                    const dbMovement = {
                        site_id: product.siteId || product.site_id || activeSiteId || '',
                        product_id: productId,
                        product_name: product.name,
                        type: type === 'IN' ? 'IN' : type === 'OUT' ? 'OUT' : 'ADJUSTMENT',
                        quantity: qty,
                        reason: reason,
                        movement_date: new Date().toISOString(),
                        performed_by: user
                    };

                    await supabase.from('stock_movements').insert([dbMovement]);
                    console.log(`✅ Stock movement recorded: ${qty} ${type} for ${product.name} (Site: ${dbMovement.site_id})`);
                } catch (movementError) {
                    console.error('❌ Failed to log stock movement to DB:', movementError);
                }
            } else {
                console.error(`❌ adjustStock failed: Product ${productId} not found in products or allProducts`);
            }

            addNotification('success', 'Stock adjusted successfully');
            logSystemEvent('Adjust Stock', `${type} ${qty} for ${productId}: ${reason}`, user, 'Inventory');

        } catch (error) {
            console.error('Failed to adjust stock:', error);
            addNotification('alert', 'Failed to adjust stock');
            queries.refetchAll();
        }
    }, [products, activeSiteId, activeSite, addNotification, logSystemEvent, queries]);

    const addExpense = useCallback(async (expense: ExpenseRecord) => {
        try {
            setExpenses(prev => [expense, ...prev]);
            addNotification('success', 'Expense recorded');
        } catch (error) {
            console.error('Failed to add expense:', error);
            addNotification('alert', 'Failed to add expense');
        }
    }, [addNotification]);

    const deleteExpense = useCallback(async (id: string) => {
        try {
            setExpenses(prev => prev.filter(e => e.id !== id));
            addNotification('info', 'Expense deleted');
        } catch (error) {
            console.error('Failed to delete expense:', error);
            addNotification('alert', 'Failed to delete expense');
        }
    }, [addNotification]);

    const processPayroll = useCallback(async (siteId: string, user: string) => {
        try {
            const activeEmployees = employees.filter(e => (e.siteId === siteId || e.site_id === siteId) && e.status === 'Active');
            const totalSalary = activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);

            if (totalSalary === 0) {
                addNotification('info', 'No active employees with salary to process.');
                return;
            }

            const expense: ExpenseRecord = {
                id: `PAYROLL-${Date.now()}`,
                siteId,
                site_id: siteId,
                date: new Date().toISOString().split('T')[0],
                category: 'Salaries',
                description: `Monthly Payroll for ${activeEmployees.length} employees`,
                amount: totalSalary,
                status: 'Paid',
                approvedBy: user
            };

            await addExpense(expense);
            addNotification('success', `Payroll processed: ${CURRENCY_SYMBOL}${totalSalary.toLocaleString()}`);
            logSystemEvent('Payroll', `Processed payroll for ${activeEmployees.length} employees`, user, 'Finance');
        } catch (error) {
            console.error('Payroll failed:', error);
            addNotification('alert', 'Failed to process payroll');
        }
    }, [employees, addExpense, addNotification, logSystemEvent]);

    return { addSupplier, adjustStock, addExpense, deleteExpense, processPayroll };
}
