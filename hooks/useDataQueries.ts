import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import {
    productsService, employeesService, purchaseOrdersService, salesService,
    customersService, suppliersService, wmsJobsService, stockMovementsService,
    transfersService, jobAssignmentsService, workerPointsService, storePointsService,
    tasksService, schedulesService, barcodeApprovalsService, warehouseZonesService,
    expensesService, systemLogsService, shiftsService
} from '../services/supabase.service';
import {
    Product, Employee, PurchaseOrder, SaleRecord, Customer, Supplier, WMSJob,
    StockMovement, TransferRecord, JobAssignment, WorkerPoints, StorePoints,
    EmployeeTask, StaffSchedule, BarcodeApproval, WarehouseZone, ExpenseRecord, SystemLog, ShiftRecord
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
    shifts: (siteId?: string) => ['shifts', siteId],
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
                queryFn: trackProgress('products', () => productsService.getAll(siteId, 500).then(res => res.data)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 10, // 10 mins
            },
            {
                queryKey: DATA_KEYS.employees(siteId),
                queryFn: trackProgress('employees', () => employeesService.getAll(siteId, !siteId)),
                enabled: enabled,
                staleTime: 1000 * 60 * 30, // 30 mins (infrequently changing roster)
            }
        ]
    });

    // Secondary Data (Orders, Sales, Customers, Suppliers)
    const secondaryQueries = useQueries({
        queries: [
            {
                queryKey: DATA_KEYS.orders(siteId),
                queryFn: trackProgress('orders', () => purchaseOrdersService.getAll(siteId, 25).then(res => res.data)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 10, // 10 mins
            },
            {
                queryKey: DATA_KEYS.sales(siteId),
                queryFn: trackProgress('sales', () => salesService.getAll(siteId, 25).then(res => res.data)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 5, // 5 mins
            },
            {
                queryKey: DATA_KEYS.customers(),
                queryFn: trackProgress('customers', () => customersService.getAll(50)),
                enabled: enabled,
                staleTime: 1000 * 60 * 30, // 30 mins
            },
            {
                queryKey: DATA_KEYS.suppliers(),
                queryFn: trackProgress('suppliers', () => suppliersService.getAll(50).then(res => res.data)),
                enabled: enabled,
                staleTime: 1000 * 60 * 60, // 60 mins
            }
        ]
    });

    // Tertiary Data (Active operational entities strictly needed by DataContext)
    // NOTE: jobs, transfers, assignments, barcodeApprovals, zones are handled by FulfillmentDataProvider
    // workerPoints is handled by GamificationContext; schedules is handled by RosterContext;
    // systemLogs is loaded on-demand in CentralOperations. Pruned here to stop 10GB+ egress leak.
    const tertiaryQueries = useQueries({
        queries: [
            {
                queryKey: DATA_KEYS.movements(siteId),
                queryFn: trackProgress('movements', () => stockMovementsService.getAll(siteId, undefined, 25).then(res => res.data)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 5,
            },
            {
                queryKey: DATA_KEYS.storePoints(),
                queryFn: trackProgress('storePoints', () => storePointsService.getAll()),
                enabled: enabled,
                staleTime: 1000 * 60 * 15,
            },
            {
                queryKey: DATA_KEYS.tasks(siteId),
                queryFn: trackProgress('tasks', () => tasksService.getAll(siteId, 25)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 15,
            },
            {
                queryKey: DATA_KEYS.expenses(siteId),
                queryFn: trackProgress('expenses', () => expensesService.getAll(siteId, 25).then(res => res.data)),
                enabled: enabled && !!siteId,
                staleTime: 1000 * 60 * 15,
            },
            {
                queryKey: DATA_KEYS.shifts(siteId),
                queryFn: trackProgress('shifts', () => shiftsService.getAll(siteId, 25).catch(() => [])),
                enabled: enabled,
                staleTime: 1000 * 60 * 10,
            }
        ]
    });

    const emptyQueryResult = { data: undefined, isLoading: false, isError: false, refetch: () => Promise.resolve() } as any;

    return {
        // Group 1
        products: criticalQueries[0] as UseQueryResult<Product[], Error>,
        employees: criticalQueries[1] as UseQueryResult<Employee[], Error>,

        // Group 2
        orders: secondaryQueries[0] as UseQueryResult<PurchaseOrder[], Error>,
        sales: secondaryQueries[1] as UseQueryResult<SaleRecord[], Error>,
        customers: secondaryQueries[2] as UseQueryResult<Customer[], Error>,
        suppliers: secondaryQueries[3] as UseQueryResult<Supplier[], Error>,

        // Group 3 (Active DataContext entities)
        movements: tertiaryQueries[0] as UseQueryResult<StockMovement[], Error>,
        storePoints: tertiaryQueries[1] as UseQueryResult<StorePoints[], Error>,
        tasks: tertiaryQueries[2] as UseQueryResult<EmployeeTask[], Error>,
        expenses: tertiaryQueries[3] as UseQueryResult<ExpenseRecord[], Error>,
        shifts: tertiaryQueries[4] as UseQueryResult<ShiftRecord[], Error>,

        // Group 4 (Domain-delegated entities - mapped to safe fallbacks to protect types & save bandwidth)
        jobs: emptyQueryResult as UseQueryResult<WMSJob[], Error>,
        transfers: emptyQueryResult as UseQueryResult<TransferRecord[], Error>,
        assignments: emptyQueryResult as UseQueryResult<JobAssignment[], Error>,
        workerPoints: emptyQueryResult as UseQueryResult<WorkerPoints[], Error>,
        schedules: emptyQueryResult as UseQueryResult<StaffSchedule[], Error>,
        barcodeApprovals: emptyQueryResult as UseQueryResult<BarcodeApproval[], Error>,
        zones: emptyQueryResult as UseQueryResult<WarehouseZone[], Error>,
        systemLogs: emptyQueryResult as UseQueryResult<SystemLog[], Error>,

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
