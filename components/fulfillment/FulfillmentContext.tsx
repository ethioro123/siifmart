import React, { createContext, useContext } from 'react';
import { WMSJob, Product, PurchaseOrder, User, StockMovement, TransferRecord, SaleRecord, Site, WarehouseZone } from '../../types';

export type OpTab = 'DOCKS' | 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'PACK' | 'REPLENISH' | 'COUNT' | 'WASTE' | 'RETURNS' | 'ASSIGN' | 'TRANSFER' | 'DRIVER';

export interface FulfillmentContextType {
    // --- Core Data (from DataContext / CentralStore) ---
    user: User | null;
    activeSite: any;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    orders: PurchaseOrder[];
    sales: SaleRecord[];
    movements: StockMovement[];
    transfers: TransferRecord[];
    employees: any[];
    jobs: WMSJob[];
    settings: any;
    workerPoints: any;
    getWorkerPoints: (userId: string) => any;
    getLeaderboard: () => any[];
    jobAssignments: any[];

    // --- DataContext Actions ---
    refreshData: () => Promise<void>;
    refreshJobs: () => void;
    addNotification: (type: string, message: string) => void;
    receivePO: (...args: any[]) => Promise<any>;
    receivePOSplit: (...args: any[]) => Promise<any>;
    finalizePO: (poId: string) => Promise<void>;
    assignJob: (...args: any[]) => Promise<any>;
    unassignJob: (jobId: string) => Promise<void>;
    updateJobItem: (...args: any[]) => Promise<any>;
    completeJob: (...args: any[]) => Promise<any>;
    resetJob: (...args: any[]) => Promise<any>;
    addProduct: (...args: any[]) => Promise<any>;
    updateJobStatus: (...args: any[]) => Promise<any>;
    logSystemEvent: (...args: any[]) => Promise<any>;
    processReturn: (...args: any[]) => Promise<any>;
    deleteJob: (...args: any[]) => Promise<any>;
    fixBrokenJobs: () => Promise<void>;
    wmsJobsService: any;

    // --- Translation ---
    t: (key: string) => string;

    // --- Mutations ---
    adjustStockMutation: any;
    relocateProductMutation: any;
    putawayStock: (params: { sku: string, location: string, quantity: number, siteId: string, type: 'IN' | 'TRANSFER', expiryDate?: string, batchNumber?: string, sourceProductId?: string, timestamp?: string, size?: string, brand?: string, unit?: string, packQuantity?: number, category?: string, retailPrice?: number, customAttributes?: any, description?: string, minStock?: number, maxStock?: number }) => Promise<void>;
    zones: WarehouseZone[];

    // --- Filtered/Computed Data ---
    filteredJobs: WMSJob[];
    filteredProducts: Product[];

    filteredMovements: StockMovement[];
    historicalJobs: WMSJob[];
    resolveOrderRef: (ref: string | undefined) => string;

    // --- Permissions ---
    canApprove: boolean;
    isMultiSiteRole: boolean;
    isHQ: boolean | string;
    needsSiteSelection: boolean;
    handleStartJob: (job: WMSJob) => Promise<void>;
    formatJobId: (job: WMSJob) => string;
    formatDateTime: (date: string | Date | undefined, options?: any) => string;
    formatRelativeTime: (date: string) => string;
    generateTrackingNumber: () => string;

    // --- Shared UI State ---
    activeTab: OpTab;
    setActiveTab: (tab: OpTab) => void;
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (open: boolean) => void;
    isSubmitting: boolean;
    setIsSubmitting: (v: boolean) => void;
    processingJobIds: Set<string>;
    setProcessingJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    isScannerMode: boolean;
    setIsScannerMode: (v: boolean) => void;

    // --- Shared Loading States ---
    isReceiving: boolean;
    setIsReceiving: (v: boolean) => void;
    isPrinting: boolean;
    setIsPrinting: (v: boolean) => void;
    isCompleting: boolean;
    setIsCompleting: (v: boolean) => void;

    // --- Gamification ---
    showPointsPopup: boolean;
    setShowPointsPopup: (v: boolean) => void;
    receivingPO: any;
    setReceivingPO: (po: any) => void;
    filteredEmployees: any[];



    earnedPoints: { points: number; message: string; bonuses: { label: string; points: number }[] };
    setEarnedPoints: (v: any) => void;

    // --- Tab-Specific State & Utilities ---





}

const FulfillmentContext = createContext<FulfillmentContextType | null>(null);

export const useFulfillment = () => {
    const ctx = useContext(FulfillmentContext);
    if (!ctx) throw new Error('useFulfillment must be used within FulfillmentProvider');
    return ctx;
};

export const FulfillmentProvider: React.FC<{
    value: FulfillmentContextType;
    children: React.ReactNode;
}> = ({ value, children }) => (
    <FulfillmentContext.Provider value={value}>
        {children}
    </FulfillmentContext.Provider>
);
