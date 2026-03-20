import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import {
    productsService, employeesService, purchaseOrdersService, salesService,
    customersService, suppliersService, wmsJobsService, stockMovementsService,
    transfersService, jobAssignmentsService, workerPointsService, storePointsService,
    tasksService, schedulesService, barcodeApprovalsService, warehouseZonesService,
    expensesService, systemLogsService
} from '../services/supabase.service';
import {
    Product, Employee, PurchaseOrder, SaleRecord, Customer, Supplier, WMSJob,
    StockMovement, TransferRecord, JobAssignment, WorkerPoints, StorePoints,
    EmployeeTask, StaffSchedule, BarcodeApproval, WarehouseZone, ExpenseRecord, SystemLog
} from '../types';

// Query Keys
export const DATA_KEYS = {
    products: (siteId?: string) => ['products', siteId],
    employees: (siteId?: string) => ['employees', siteId],
    orders: (siteId?: string) => ['orders', siteId],
    sales: (siteId?: string) => ['sales', siteId],
    customers: () => ['customers'],
    suppliers: () => ['suppliers'],
    jobs: (siteId?: string) => ['jobs', siteId],
    movements: (siteId?: string) => ['movements', siteId],
    transfers: (siteId?: string) => ['transfers', siteId],
    assignments: (siteId?: string) => ['assignments', siteId],
    workerPoints: (siteId?: string) => ['workerPoints', siteId],
    storePoints: () => ['storePoints'],
    tasks: (siteId?: string) => ['tasks', siteId],
    schedules: (siteId?: string) => ['schedules', siteId],
    barcodeApprovals: (siteId?: string) => ['barcodeApprovals', siteId],
    zones: (siteId?: string) => ['zones', siteId],
    expenses: (siteId?: string) => ['expenses', siteId],
    systemLogs: () => ['systemLogs'],
};

interface UseDataQueriesProps {
    siteId: string;
    enabled: boolean;
    onProgress?: (entity: string, status: 'loading' | 'success' | 'error') => void;
}

export const useDataQueries = ({ siteId, enabled, onProgress }: UseDataQueriesProps) => {

    // Helper to wrap queries with progress tracking
    const trackProgress = <T>(key: string, fn: () => Promise<T>): () => Promise<T> => {
        return async () => {
            onProgress?.(key, 'loading');
            try {
                const res = await fn();
                onProgress?.(key, 'success');
                return res;
            } catch (err) {
                onProgress?.(key, 'error');
                throw err;
            }
        };
    };

    // Critical Data (Products, Employees)
    const criticalQueries = useQueries({
        queries: [
            {
                queryKey: DATA_KEYS.products(siteId),
                queryFn: trackProgress('products', () => productsService.getAll(siteId, 5000).then(res => res.data)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 5, // 5 mins
            },
            {
                queryKey: DATA_KEYS.employees(siteId),
                queryFn: trackProgress('employees', () => employeesService.getAll()),
                enabled: enabled,
                staleTime: 1000 * 60 * 15, // 15 mins
            }
        ]
    });

    // Secondary Data (Orders, Sales, Customers, Suppliers)
    const secondaryQueries = useQueries({
        queries: [
            {
                queryKey: DATA_KEYS.orders(siteId),
                queryFn: trackProgress('orders', () => purchaseOrdersService.getAll(siteId, 5000).then(res => res.data)),
                enabled: enabled && !!siteId,
            },
            {
                queryKey: DATA_KEYS.sales(siteId),
                queryFn: trackProgress('sales', () => salesService.getAll(siteId, 2000).then(res => res.data)),
                enabled: enabled && !!siteId,
            },
            {
                queryKey: DATA_KEYS.customers(),
                queryFn: trackProgress('customers', () => customersService.getAll(2000)),
                enabled: enabled,
            },
            {
                queryKey: DATA_KEYS.suppliers(),
                queryFn: trackProgress('suppliers', () => suppliersService.getAll(1000).then(res => res.data)),
                enabled: enabled,
            }
        ]
    });

    // Tertiary Data (Everything else)
    const tertiaryQueries = useQueries({
        queries: [
            {
                queryKey: DATA_KEYS.jobs(siteId),
                queryFn: trackProgress('jobs', () => wmsJobsService.getAll(siteId, 2000)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.movements(siteId),
                queryFn: trackProgress('movements', () => stockMovementsService.getAll(siteId, undefined, 2000).then(res => res.data)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.transfers(siteId),
                queryFn: trackProgress('transfers', () => transfersService.getAll(siteId, 500)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.assignments(siteId),
                queryFn: trackProgress('assignments', () => jobAssignmentsService.getAll(siteId, undefined, 500)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.workerPoints(siteId),
                queryFn: trackProgress('workerPoints', () => workerPointsService.getAll(siteId)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.storePoints(),
                queryFn: trackProgress('storePoints', () => storePointsService.getAll()),
                enabled: enabled
            },
            {
                queryKey: DATA_KEYS.tasks(siteId),
                queryFn: trackProgress('tasks', () => tasksService.getAll(siteId, 500)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.schedules(siteId),
                queryFn: trackProgress('schedules', () => schedulesService.getAll(siteId)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.barcodeApprovals(undefined), // Always global
                queryFn: trackProgress('barcodeApprovals', () => barcodeApprovalsService.getAuditLog(undefined).catch(() => [])),
                enabled: enabled // Allow global fetch (siteId is optional)
            },
            {
                queryKey: DATA_KEYS.zones(siteId),
                queryFn: trackProgress('zones', () => warehouseZonesService.getAll(siteId).catch(() => [])),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.expenses(siteId),
                queryFn: trackProgress('expenses', () => expensesService.getAll(siteId, 500).then(res => res.data)),
                enabled: enabled && !!siteId
            },
            {
                queryKey: DATA_KEYS.systemLogs(),
                queryFn: trackProgress('systemLogs', () => systemLogsService.getAll().catch(() => [])),
                enabled: enabled
            }
        ]
    });

    return {
        // Group 1
        products: criticalQueries[0] as UseQueryResult<Product[], Error>,
        employees: criticalQueries[1] as UseQueryResult<Employee[], Error>,

        // Group 2
        orders: secondaryQueries[0] as UseQueryResult<PurchaseOrder[], Error>,
        sales: secondaryQueries[1] as UseQueryResult<SaleRecord[], Error>,
        customers: secondaryQueries[2] as UseQueryResult<Customer[], Error>,
        suppliers: secondaryQueries[3] as UseQueryResult<Supplier[], Error>,

        // Group 3
        jobs: tertiaryQueries[0] as UseQueryResult<WMSJob[], Error>,
        movements: tertiaryQueries[1] as UseQueryResult<StockMovement[], Error>,
        transfers: tertiaryQueries[2] as UseQueryResult<TransferRecord[], Error>,
        assignments: tertiaryQueries[3] as UseQueryResult<JobAssignment[], Error>,
        workerPoints: tertiaryQueries[4] as UseQueryResult<WorkerPoints[], Error>,
        storePoints: tertiaryQueries[5] as UseQueryResult<StorePoints[], Error>,
        tasks: tertiaryQueries[6] as UseQueryResult<EmployeeTask[], Error>,
        schedules: tertiaryQueries[7] as UseQueryResult<StaffSchedule[], Error>,
        barcodeApprovals: tertiaryQueries[8] as UseQueryResult<BarcodeApproval[], Error>,
        zones: tertiaryQueries[9] as UseQueryResult<WarehouseZone[], Error>,
        expenses: tertiaryQueries[10] as UseQueryResult<ExpenseRecord[], Error>,
        systemLogs: tertiaryQueries[11] as UseQueryResult<SystemLog[], Error>,

        // Meta
        isLoadingCritical: criticalQueries.some(q => q.isLoading),
        isErrorCritical: criticalQueries.some(q => q.isError),
        refetchAll: () => {
            criticalQueries.forEach(q => q.refetch());
            secondaryQueries.forEach(q => q.refetch());
            tertiaryQueries.forEach(q => q.refetch());
        }
    };
};
