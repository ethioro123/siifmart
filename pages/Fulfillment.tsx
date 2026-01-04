import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    ClipboardList, Box, Search, CheckCircle, Truck, AlertTriangle, RotateCcw,
    Thermometer, Calendar, Scan, ArrowRight, Package, Archive, Layers,
    RefreshCw, Trash2, Lock, Printer, Grid, ChevronRight, ChevronDown, Play,
    StopCircle, PauseCircle, Shield, ShoppingBag, Snowflake, Sun, Layout,
    Droplet, Anchor, Map, FileText, X, Clock, ClipboardCheck,
    AlertOctagon, ArrowDown, Camera, ArrowLeft, MapPin, LayoutList, Zap, User as UserIcon, Plus, Minus, History as HistoryIcon,
    Download, Upload, Navigation, Phone, QrCode, Smartphone, Eye, Loader2, Gift, Crown, List, Hash, Users as UsersIcon, ListFilter, Filter, Activity,
    ShieldCheck, XCircle, Warehouse, Rocket
} from 'lucide-react';
import { WMSJob, JobItem, PurchaseOrder, ReceivingItem, WorkerPoints, PendingInventoryChange, DiscrepancyType, ResolutionType, User, StockMovement, TransferRecord, SaleRecord, Product, Site } from '../types';
import { playBeep } from '../utils/audioUtils';
import { Protected, ProtectedButton } from '../components/Protected';
import Modal from '../components/Modal';

import { useStore } from '../contexts/CentralStore';
import { useLanguage } from '../contexts/LanguageContext';
import { QRScanner } from '../components/QRScanner';
import { useData } from '../contexts/DataContext';
import { LeaderboardWidget, PointsEarnedPopup } from '../components/WorkerPointsDisplay';
import Pagination from '../components/shared/Pagination';
import Button from '../components/shared/Button';
import { DEFAULT_BONUS_TIERS } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { wmsJobsService, purchaseOrdersService, productsService, inventoryRequestsService, discrepancyService } from '../services/supabase.service';
import { filterBySite } from '../utils/locationAccess';
import { generateQRCodeLabelHTML, generateQRCode, generateQRCodeImage } from '../utils/qrCodeGenerator';
import { generateBarcodeSVG, generateBarcodeLabelHTML, generateBatchBarcodeLabelsHTML, generateBarcodeImage } from '../utils/barcodeGenerator';
import { generateUnifiedBatchLabelsHTML, generatePackLabelHTML, LabelSize, LabelFormat, PackLabelData } from '../utils/unifiedLabelGenerator';
import { generateCODE128FromSKU, formatForCODE128 } from '../utils/barcodeFormatter';
import { formatJobId, formatOrderRef, formatTransferId } from '../utils/jobIdFormatter';
import { formatCompactNumber, formatDateTime, formatRelativeTime } from '../utils/formatting';


type OpTab = 'DOCKS' | 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'PACK' | 'REPLENISH' | 'COUNT' | 'WASTE' | 'RETURNS' | 'ASSIGN' | 'TRANSFER' | 'DRIVER';

// Tab-level role permissions-defines which roles can access which tabs
const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    DOCKS: ['super_admin', 'warehouse_manager', 'dispatcher', 'driver'],
    RECEIVE: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    PUTAWAY: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'inventory_specialist'],
    PICK: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker'],
    PACK: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker'],
    REPLENISH: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    COUNT: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    WASTE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    RETURNS: ['super_admin', 'warehouse_manager', 'dispatcher'],
    ASSIGN: ['super_admin', 'warehouse_manager', 'dispatcher'], // Job assignment center
    TRANSFER: ['super_admin', 'warehouse_manager', 'dispatcher', 'retail_manager'], // Store managers can request transfers
    DRIVER: ['super_admin', 'warehouse_manager', 'dispatcher', 'driver']
};

// --- SUB-COMPONENTS ---

const MetricBadge = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div className={`flex flex-col px-4 py-2 rounded-xl border ${color} bg-opacity-10`}>
        <span className="text-[10px] uppercase font-bold opacity-70">{label}</span>
        <span className="text-lg font-mono font-bold">{value}</span>
    </div>
);

const SortDropdown = <T extends string>({
    options,
    value,
    onChange,
    isOpen,
    setIsOpen,
    label = "Sort"
}: {
    options: { id: T, label: string, icon?: React.ReactNode }[],
    value: T,
    onChange: (val: T) => void,
    isOpen: boolean,
    setIsOpen: (val: boolean) => void,
    label?: string
}) => (
    <div className="relative">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-gray-400 hover:text-white transition-all whitespace-nowrap uppercase tracking-widest"
        >
            <ListFilter size={14} className={value !== options[0].id ? 'text-cyber-primary' : ''} />
            <span>{label}: {options.find(o => o.id === value)?.label.toUpperCase() || value.toUpperCase()}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <>
                <div className="fixed inset-0 z-[50]" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0b]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-between group uppercase tracking-widest ${value === option.id
                                ? 'bg-cyber-primary text-black'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                            </div>
                            {value === option.id && <CheckCircle size={12} />}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
);

// --- MAIN COMPONENT ---

export default function WarehouseOperations() {
    const { user } = useStore();
    const { t } = useLanguage();
    const {
        jobs, orders, products, allProducts, settings, sales, processReturn, employees, jobAssignments, activeSite, sites, movements, transfers,
        receivePO, assignJob, updateJobItem, completeJob, resetJob, adjustStock, relocateProduct, addNotification, updateJobStatus, addProduct, refreshData, logSystemEvent,
        workerPoints, getWorkerPoints, getLeaderboard
    } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false); // Global loading state for actions

    // --- SHARED FILTRATION & PAGINATION STATES ---
    // RECEIVE Tab States
    const [receiveSearch, setReceiveSearch] = useState('');
    const [receiveCurrentPage, setReceiveCurrentPage] = useState(1);
    const RECEIVE_ITEMS_PER_PAGE = 25;
    const [receiveHistorySearch, setReceiveHistorySearch] = useState('');
    const [receiveHistoryPage, setReceiveHistoryPage] = useState(1);
    const RECEIVE_HISTORY_PER_PAGE = 25;

    // PICK Tab States
    const [pickSearch, setPickSearch] = useState('');
    const [pickHistorySearch, setPickHistorySearch] = useState('');
    const [pickCurrentPage, setPickCurrentPage] = useState(1);
    const PICK_ITEMS_PER_PAGE = 25;
    const [pickHistoryPage, setPickHistoryPage] = useState(1);
    const PICK_HISTORY_PER_PAGE = 25;
    const [pickStatusFilter, setPickStatusFilter] = useState<'All' | 'Pending' | 'In-Progress' | 'Completed' | 'Cancelled'>('All');
    const [pickSortBy, setPickSortBy] = useState<'priority' | 'date' | 'items' | 'site'>('priority');
    const [isPickSortDropdownOpen, setIsPickSortDropdownOpen] = useState(false);
    const [isPickFilterDropdownOpen, setIsPickFilterDropdownOpen] = useState(false);

    // PACK Tab States
    const [packSearch, setPackSearch] = useState('');
    const [packHistorySearch, setPackHistorySearch] = useState('');
    const [packCurrentPage, setPackCurrentPage] = useState(1);
    const PACK_ITEMS_PER_PAGE = 25;
    const [packHistoryPage, setPackHistoryPage] = useState(1);
    const PACK_HISTORY_PER_PAGE = 25;
    const [packJobFilter, setPackJobFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
    const [packSortBy, setPackSortBy] = useState<'priority' | 'date' | 'items'>('priority');
    const [isPackSortDropdownOpen, setIsPackSortDropdownOpen] = useState(false);
    const [isPackFilterDropdownOpen, setIsPackFilterDropdownOpen] = useState(false);

    // PUTAWAY Tab States
    const [putawaySearch, setPutawaySearch] = useState('');
    const [putawayHistorySearch, setPutawayHistorySearch] = useState('');
    const [putawayCurrentPage, setPutawayCurrentPage] = useState(1);
    const PUTAWAY_ITEMS_PER_PAGE = 10;
    const [putawayHistoryPage, setPutawayHistoryPage] = useState(1);
    const PUTAWAY_HISTORY_PER_PAGE = 25;
    const [isPutawaySortDropdownOpen, setIsPutawaySortDropdownOpen] = useState(false);
    const [putawayStatusFilter, setPutawayStatusFilter] = useState<'All' | 'Pending' | 'In-Progress'>('All');
    const [putawaySortBy, setPutawaySortBy] = useState<'priority' | 'date' | 'items'>('priority');

    // DOCK Tab States
    const [dockSearch, setDockSearch] = useState('');
    const [dockHistoryPage, setDockHistoryPage] = useState(1);
    const DOCK_HISTORY_PER_PAGE = 25;

    // TRANSFER Tab States
    const [transferSearch, setTransferSearch] = useState('');
    const [transferHistorySearch, setTransferHistorySearch] = useState('');
    const [transferHistoryPage, setTransferHistoryPage] = useState(1);
    const TRANSFER_HISTORY_PER_PAGE = 25;
    const [isTransferSortDropdownOpen, setIsTransferSortDropdownOpen] = useState(false);

    // REPLENISH Tab States
    const [replenishSearch, setReplenishSearch] = useState('');
    const [replenishHistorySearch, setReplenishHistorySearch] = useState('');
    const [replenishCurrentPage, setReplenishCurrentPage] = useState(1);
    const REPLENISH_ITEMS_PER_PAGE = 25;
    const [replenishHistoryPage, setReplenishHistoryPage] = useState(1);
    const REPLENISH_HISTORY_PER_PAGE = 25;
    const [replenishFilter, setReplenishFilter] = useState<'all' | 'critical' | 'low' | 'optimal'>('all');
    const [replenishSortBy, setReplenishSortBy] = useState<'urgency' | 'stock' | 'name'>('urgency');
    const [isReplenishFilterDropdownOpen, setIsReplenishFilterDropdownOpen] = useState(false);
    const [isReplenishSortDropdownOpen, setIsReplenishSortDropdownOpen] = useState(false);

    // COUNT Tab States
    const [countSearch, setCountSearch] = useState('');
    const [countHistorySearch, setCountHistorySearch] = useState('');
    const [countHistoryPage, setCountHistoryPage] = useState(1);
    const COUNT_HISTORY_PER_PAGE = 20;

    // WASTE Tab States
    const [wasteSearch, setWasteSearch] = useState('');
    const [wasteHistorySearch, setWasteHistorySearch] = useState('');
    const [wasteHistoryPage, setWasteHistoryPage] = useState(1);
    const WASTE_HISTORY_PER_PAGE = 20;

    // DRIVER Tab States
    const [driverSearch, setDriverSearch] = useState('');
    const [driverHistorySearch, setDriverHistorySearch] = useState('');
    const [driverHistoryPage, setDriverHistoryPage] = useState(1);
    const DRIVER_HISTORY_PER_PAGE = 20;

    // DISPATCH Tab States
    const [dispatchSearch, setDispatchSearch] = useState('');
    const [dispatchCurrentPage, setDispatchCurrentPage] = useState(1);
    const DISPATCH_ITEMS_PER_PAGE = 6;

    // ASSIGN Tab States
    const [assignJobFilter, setAssignJobFilter] = useState<'ALL' | 'PICK' | 'PACK' | 'PUTAWAY' | 'DISPATCH'>('ALL');
    const [dispatchPriorityFilter, setDispatchPriorityFilter] = useState<'ALL' | 'Critical' | 'High' | 'Normal'>('ALL');
    const [dispatchEmployeeFilter, setDispatchEmployeeFilter] = useState<'ALL' | 'picker' | 'packer' | 'dispatcher' | 'warehouse_manager'>('ALL');
    const [dispatchSearchState, setDispatchSearchState] = useState(''); // Renamed to avoid collision with dispatchSearch
    const [dispatchEmployeeSearch, setDispatchEmployeeSearch] = useState('');
    const [assignSortBy, setAssignSortBy] = useState<'priority' | 'date' | 'items'>('priority');
    const [isAssignSortDropdownOpen, setIsAssignSortDropdownOpen] = useState(false);
    const [isAssignFilterDropdownOpen, setIsAssignFilterDropdownOpen] = useState(false);
    const [isEmployeeRoleDropdownOpen, setIsEmployeeRoleDropdownOpen] = useState(false);
    const [assignCurrentPage, setAssignCurrentPage] = useState(1);
    const ASSIGN_ITEMS_PER_PAGE = 10;

    // RETURNS Tab States
    const [returnSearch, setReturnSearch] = useState('');
    const [returnViewMode, setReturnViewMode] = useState<'Process' | 'History'>('Process');
    const [returnStep, setReturnStep] = useState<'Search' | 'Select' | 'Review' | 'Complete'>('Search');
    const [returnHistoryPage, setReturnHistoryPage] = useState(1);
    const RETURN_HISTORY_PER_PAGE = 10;
    const [returnItemsPage, setReturnItemsPage] = useState(1);
    const RETURN_ITEMS_PER_PAGE = 5;
    const [returnHistorySearch, setReturnHistorySearch] = useState('');

    // Gamification State
    const [showPointsPopup, setShowPointsPopup] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState({ points: 0, message: '', bonuses: [] as { label: string; points: number }[] });





    // Calculate bonus for current user


    // 🔒 LOCATION-BASED ACCESS CONTROL
    // CEOs MUST select a specific warehouse/store to view operations
    // If at HQ or no site selected, show empty results
    const isMultiSiteRole = ['CEO', 'Super Admin', 'Admin', 'Auditor', 'super_admin'].includes(user?.role || '');

    const isHQ = activeSite ? ['Administration', 'Administrative', 'Central Operations'].includes(activeSite.type) : 'N/A';
    const needsSiteSelection = isMultiSiteRole && (!activeSite || ['Administration', 'Administrative', 'Central Operations'].includes(activeSite.type));



    const filteredJobs = useMemo(() => {
        // If Global View (needsSiteSelection), show ALL jobs (or filter as needed)
        // User requested to remove the blocking page, so we allow data flow.
        const baseFiltered = filterBySite(jobs, user?.role || 'pos', user?.siteId || '');

        if (activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(j => (j.siteId || j.site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [jobs, user?.role, user?.siteId, activeSite]);

    const filteredEmployees = useMemo(() => {
        const baseFiltered = filterBySite(employees, user?.role || 'pos', user?.siteId || '');
        if (activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(e => (e.siteId || e.site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [employees, user?.role, user?.siteId, activeSite]);

    const filteredProducts = useMemo(() => {
        const baseFiltered = filterBySite(products, user?.role || 'pos', user?.siteId || '');
        if (activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(p => (p.siteId || p.site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [products, user?.role, user?.siteId, activeSite]);

    const filteredMovements = useMemo(() => {
        const baseFiltered = filterBySite(movements, user?.role || 'pos', user?.siteId || '');
        if (activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(m => (m.siteId || (m as any).site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [movements, user?.role, user?.siteId, activeSite]);

    const historicalJobs = useMemo(() => {
        return filteredJobs.filter((j: WMSJob) => j.status === 'Completed' || j.status === 'Cancelled');
    }, [filteredJobs]);

    // DOCK HISTORY Logic
    const filteredDockHistory = useMemo(() => {
        return filteredMovements.filter((m: StockMovement) => {
            const matchesSearch = !dockSearch ||
                m.productName.toLowerCase().includes(dockSearch.toLowerCase()) ||
                m.id.toLowerCase().includes(dockSearch.toLowerCase()) ||
                m.reason.toLowerCase().includes(dockSearch.toLowerCase());
            return matchesSearch;
        });
    }, [filteredMovements, dockSearch]);

    const dockHistoryTotalPages = Math.ceil(filteredDockHistory.length / DOCK_HISTORY_PER_PAGE);
    const paginatedDockHistory = useMemo(() => {
        const start = (dockHistoryPage - 1) * DOCK_HISTORY_PER_PAGE;
        return filteredDockHistory.slice(start, start + DOCK_HISTORY_PER_PAGE);
    }, [filteredDockHistory, dockHistoryPage]);

    // RECEIVE HISTORY Logic
    const filteredReceiveHistory = useMemo(() => {
        const receivedOrders = orders.filter(o => o.status === 'Received');
        return receivedOrders.filter(o => {
            return !receiveHistorySearch ||
                o.id.toLowerCase().includes(receiveHistorySearch.toLowerCase()) ||
                (o.supplierName || '').toLowerCase().includes(receiveHistorySearch.toLowerCase());
        });
    }, [orders, receiveHistorySearch]);

    const receiveHistoryTotalPages = Math.ceil(filteredReceiveHistory.length / RECEIVE_HISTORY_PER_PAGE);
    const paginatedReceiveHistory = useMemo(() => {
        const start = (receiveHistoryPage - 1) * RECEIVE_HISTORY_PER_PAGE;
        return filteredReceiveHistory.slice(start, start + RECEIVE_HISTORY_PER_PAGE);
    }, [filteredReceiveHistory, receiveHistoryPage]);

    // PICK HISTORY Logic
    const filteredPickHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'PICK' && (
                !pickHistorySearch ||
                j.id.toLowerCase().includes(pickHistorySearch.toLowerCase()) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(pickHistorySearch.toLowerCase()))
            )
        );
    }, [historicalJobs, pickHistorySearch]);

    const pickHistoryTotalPages = Math.ceil(filteredPickHistory.length / PICK_HISTORY_PER_PAGE);
    const paginatedPickHistory = useMemo(() => {
        const start = (pickHistoryPage - 1) * PICK_HISTORY_PER_PAGE;
        return filteredPickHistory.slice(start, start + PICK_HISTORY_PER_PAGE);
    }, [filteredPickHistory, pickHistoryPage]);

    // PACK HISTORY Logic
    const filteredPackHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'PACK' && (
                !packHistorySearch ||
                j.id.toLowerCase().includes(packHistorySearch.toLowerCase()) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(packHistorySearch.toLowerCase()))
            )
        );
    }, [historicalJobs, packHistorySearch]);

    const packHistoryTotalPages = Math.ceil(filteredPackHistory.length / PACK_HISTORY_PER_PAGE);
    const paginatedPackHistory = useMemo(() => {
        const start = (packHistoryPage - 1) * PACK_HISTORY_PER_PAGE;
        return filteredPackHistory.slice(start, start + PACK_HISTORY_PER_PAGE);
    }, [filteredPackHistory, packHistoryPage]);

    const filteredPutawayHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'PUTAWAY' && (
                !putawayHistorySearch ||
                j.id.toLowerCase().includes(putawayHistorySearch.toLowerCase()) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(putawayHistorySearch.toLowerCase()))
            )
        );
    }, [historicalJobs, putawayHistorySearch]);

    const putawayHistoryTotalPages = Math.ceil(filteredPutawayHistory.length / PUTAWAY_HISTORY_PER_PAGE);
    const paginatedPutawayHistory = useMemo(() => {
        const start = (putawayHistoryPage - 1) * PUTAWAY_HISTORY_PER_PAGE;
        return filteredPutawayHistory.slice(start, start + PUTAWAY_HISTORY_PER_PAGE);
    }, [filteredPutawayHistory, putawayHistoryPage]);

    // TRANSFER HISTORY Logic
    const filteredTransferHistory = useMemo(() => {
        const completedTransfers = transfers.filter(t => t.status === 'Received' || t.status === 'Cancelled');
        return completedTransfers.filter(t => {
            return !transferHistorySearch ||
                t.id.toLowerCase().includes(transferHistorySearch.toLowerCase()) ||
                (t.sourceSiteName || '').toLowerCase().includes(transferHistorySearch.toLowerCase()) ||
                (t.destSiteName || '').toLowerCase().includes(transferHistorySearch.toLowerCase());
        });
    }, [transfers, transferHistorySearch]);

    const transferHistoryTotalPages = Math.ceil(filteredTransferHistory.length / TRANSFER_HISTORY_PER_PAGE);
    const paginatedTransferHistory = useMemo(() => {
        const start = (transferHistoryPage - 1) * TRANSFER_HISTORY_PER_PAGE;
        return filteredTransferHistory.slice(start, start + TRANSFER_HISTORY_PER_PAGE);
    }, [filteredTransferHistory, transferHistoryPage]);

    const filteredReplenishHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'REPLENISH' && (
                !replenishHistorySearch ||
                j.id.toLowerCase().includes(replenishHistorySearch.toLowerCase())
            )
        );
    }, [historicalJobs, replenishHistorySearch]);

    const replenishHistoryTotalPages = Math.ceil(filteredReplenishHistory.length / REPLENISH_HISTORY_PER_PAGE);
    const paginatedReplenishHistory = useMemo(() => {
        const start = (replenishHistoryPage - 1) * REPLENISH_HISTORY_PER_PAGE;
        return filteredReplenishHistory.slice(start, start + REPLENISH_HISTORY_PER_PAGE);
    }, [filteredReplenishHistory, replenishHistoryPage]);

    // COUNT HISTORY Login
    const filteredCountHistory = useMemo(() => {
        const countMoves = movements.filter(m => m.reason.toLowerCase().includes('count') || m.reason.toLowerCase().includes('adjustment'));
        return countMoves.filter(m => {
            return !countHistorySearch ||
                (m.productName || '').toLowerCase().includes(countHistorySearch.toLowerCase()) ||
                m.id.toLowerCase().includes(countHistorySearch.toLowerCase());
        });
    }, [movements, countHistorySearch]);

    const countHistoryTotalPages = Math.ceil(filteredCountHistory.length / COUNT_HISTORY_PER_PAGE);
    const paginatedCountHistory = useMemo(() => {
        const start = (countHistoryPage - 1) * COUNT_HISTORY_PER_PAGE;
        return filteredCountHistory.slice(start, start + COUNT_HISTORY_PER_PAGE);
    }, [filteredCountHistory, countHistoryPage]);

    // WASTE HISTORY Logic
    const filteredWasteHistory = useMemo(() => {
        const wasteMoves = movements.filter(m => m.reason.toLowerCase().includes('waste') || m.reason.toLowerCase().includes('spoilage'));
        return wasteMoves.filter(m => {
            return !wasteHistorySearch ||
                (m.productName || '').toLowerCase().includes(wasteHistorySearch.toLowerCase()) ||
                m.id.toLowerCase().includes(wasteHistorySearch.toLowerCase()) ||
                (m.reason || '').toLowerCase().includes(wasteHistorySearch.toLowerCase());
        });
    }, [movements, wasteHistorySearch]);

    const wasteHistoryTotalPages = Math.ceil(filteredWasteHistory.length / WASTE_HISTORY_PER_PAGE);
    const paginatedWasteHistory = useMemo(() => {
        const start = (wasteHistoryPage - 1) * WASTE_HISTORY_PER_PAGE;
        return filteredWasteHistory.slice(start, start + WASTE_HISTORY_PER_PAGE);
    }, [filteredWasteHistory, wasteHistoryPage]);

    // DRIVER HISTORY Logic
    const filteredDriverHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            (j.type === 'DISPATCH' || j.type === 'DRIVER') && (
                !driverHistorySearch ||
                j.id.toLowerCase().includes(driverHistorySearch.toLowerCase()) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(driverHistorySearch.toLowerCase()))
            )
        );
    }, [historicalJobs, driverHistorySearch]);

    const driverHistoryTotalPages = Math.ceil(filteredDriverHistory.length / DRIVER_HISTORY_PER_PAGE);
    const paginatedDriverHistory = useMemo(() => {
        const start = (driverHistoryPage - 1) * DRIVER_HISTORY_PER_PAGE;
        return filteredDriverHistory.slice(start, start + DRIVER_HISTORY_PER_PAGE);
    }, [filteredDriverHistory, driverHistoryPage]);

    // RETURNS HISTORY Logic
    const filteredReturnsHistory = useMemo(() => {
        return historicalJobs.filter((j: WMSJob) =>
            j.type === 'RETURNS' && (
                !returnHistorySearch ||
                j.id.toLowerCase().includes(returnHistorySearch.toLowerCase()) ||
                (j.orderRef && j.orderRef.toLowerCase().includes(returnHistorySearch.toLowerCase()))
            )
        );
    }, [historicalJobs, returnHistorySearch]);

    const returnsHistoryTotalPages = Math.ceil(filteredReturnsHistory.length / RETURN_HISTORY_PER_PAGE);
    const paginatedReturnsHistory = useMemo(() => {
        const start = (returnHistoryPage - 1) * RETURN_HISTORY_PER_PAGE;
        return filteredReturnsHistory.slice(start, start + RETURN_HISTORY_PER_PAGE);
    }, [filteredReturnsHistory, returnHistoryPage]);

    // 🔒 TAB-LEVEL ACCESS CONTROL
    // Check if user can access a specific tab
    const canAccessTab = (tab: OpTab): boolean => {
        if (!user?.role) return false;
        return TAB_PERMISSIONS[tab].includes(user.role);
    };

    // Get list of tabs user can access
    const visibleTabs = useMemo(() => {
        // Ordered by natural warehouse workflow:
        // 1. INBOUND: Docks → Receive → Putaway
        // 2. INTERNAL: Replenish → Pick → Pack → Dispatch
        // 3. TRANSFERS: Site-to-site movement
        // 4. EXCEPTIONS: Count, Waste, Returns
        // 4. EXCEPTIONS: Count, Waste, Returns
        // 5. GAMIFICATION: My Points
        const allTabs: OpTab[] = ['DRIVER', 'DOCKS', 'RECEIVE', 'PUTAWAY', 'REPLENISH', 'PICK', 'PACK', 'ASSIGN', 'TRANSFER', 'COUNT', 'WASTE', 'RETURNS'];
        return allTabs.filter(tab => canAccessTab(tab));
    }, [user?.role]);

    // Set default tab to first visible tab
    const [activeTab, setActiveTab] = useState<OpTab>(() => {
        return visibleTabs[0] || 'PICK';
    });
    const [selectedJob, setSelectedJob] = useState<WMSJob | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [processingJobIds, setProcessingJobIds] = useState<Set<string>>(new Set());
    const [driverScannerOpen, setDriverScannerOpen] = useState(false);

    // --- SCANNER STATE ---
    const [isScannerMode, setIsScannerMode] = useState(false);
    const [scannerStep, setScannerStep] = useState<'NAV' | 'SCAN' | 'CONFIRM'>('NAV');

    // Derived state for scanner
    const currentItem = useMemo(() => selectedJob?.lineItems.find(i => i.status === 'Pending'), [selectedJob]);

    const [scannedBin, setScannedBin] = useState('');
    const [scannedItem, setScannedItem] = useState('');
    const locationInputRef = useRef<HTMLInputElement>(null);
    const itemInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus management
    useEffect(() => {
        if (isScannerMode) {
            // Slight delay to ensure DOM is ready
            const timer = setTimeout(() => {
                if (scannerStep === 'NAV' && locationInputRef.current) {
                    locationInputRef.current.focus();
                } else if (scannerStep === 'SCAN' && itemInputRef.current) {
                    itemInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isScannerMode, scannerStep, currentItem]);

    // Keep focus on input if user clicks away (unless clicking specific buttons)
    const handleBlur = (e: React.FocusEvent) => {
        // Only re-focus if we're still in scanner mode and specific step
        // We use a small timeout to allow button clicks to register first
        setTimeout(() => {
            if (isScannerMode && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'BUTTON') {
                if (scannerStep === 'NAV') locationInputRef.current?.focus();
                if (scannerStep === 'SCAN') itemInputRef.current?.focus();
            }
        }, 200);
    };
    const [pickQty, setPickQty] = useState(0);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [qrScannerMode, setQRScannerMode] = useState<'location' | 'product'>('product');
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [showScannerList, setShowScannerList] = useState(false); // Scanner list view toggle
    const [lastCompletedItem, setLastCompletedItem] = useState<{ name: string; qty: number } | null>(null);
    const [lastCompletedStatus, setLastCompletedStatus] = useState<JobItem['status'] | null>(null); // For completion animation

    // --- LOCATION PICKER STATE ---
    const [selectedZone, setSelectedZone] = useState('A');
    const [selectedAisle, setSelectedAisle] = useState('01');
    const [selectedBin, setSelectedBin] = useState('01');
    const [locationSearch, setLocationSearch] = useState('');
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // --- RECEIVING STATE ---
    const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

    // --- DISCREPANCY RESOLUTION STATE ---
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
    const [resolvingItem, setResolvingItem] = useState<{ item: any; index: number } | null>(null);

    const [receiveStep, setReceiveStep] = useState(0); // 0: Select PO, 1: Enter Qtys, 2: SKU Review, 3: Complete
    const [receiveData, setReceiveData] = useState<ReceivingItem[]>([]);
    const [tempCheck, setTempCheck] = useState('');
    // Ensure labels are printed before finishing a reception
    const [hasPrintedReceivingLabels, setHasPrintedReceivingLabels] = useState(false);
    // New Receive Flow States
    const [focusedItem, setFocusedItem] = useState<any | null>(null); // Use any temporarily or ReceivingItem if consistent
    const [showPrintSuccess, setShowPrintSuccess] = useState(false);
    const [scannedSkus, setScannedSkus] = useState<Record<string, string>>({});
    const [skuDecisions, setSkuDecisions] = useState<Record<string, 'keep' | 'generate'>>({});
    const [labelSize, setLabelSize] = useState<'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL'>('SMALL');
    const [labelFormat, setLabelFormat] = useState<'BARCODE' | 'QR'>('BARCODE');
    const [finalizedSkus, setFinalizedSkus] = useState<Record<string, string>>({});

    // Filtered and paginated receive orders
    const filteredReceiveOrders = useMemo(() => {
        return orders.filter(o => {
            const isApproved = o.status === 'Approved';
            const matchesSearch = o.id.toLowerCase().includes(receiveSearch.toLowerCase()) ||
                (o.supplierName || '').toLowerCase().includes(receiveSearch.toLowerCase());
            return isApproved && matchesSearch;
        });
    }, [orders, receiveSearch]);

    const receiveOrdersTotalPages = Math.ceil(filteredReceiveOrders.length / RECEIVE_ITEMS_PER_PAGE);
    const paginatedReceiveOrders = useMemo(() => {
        const start = (receiveCurrentPage - 1) * RECEIVE_ITEMS_PER_PAGE;
        return filteredReceiveOrders.slice(start, start + RECEIVE_ITEMS_PER_PAGE);
    }, [filteredReceiveOrders, receiveCurrentPage]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setReceiveCurrentPage(1);
    }, [receiveSearch]);

    // PICK Tab States
    const filteredPickJobs = useMemo(() => {
        return filteredJobs.filter(j =>
            j.type === 'PICK' &&
            j.status !== 'Completed' &&
            (!j.assignedTo || j.assignedTo === user?.name || ['admin', 'manager', 'super_admin'].includes(user?.role || ''))
        );
    }, [filteredJobs, user?.name, user?.role]);
    const pickJobsTotalPages = Math.ceil(filteredPickJobs.length / PICK_ITEMS_PER_PAGE);
    const paginatedPickJobs = useMemo(() => {
        const start = (pickCurrentPage - 1) * PICK_ITEMS_PER_PAGE;
        return filteredPickJobs.slice(start, start + PICK_ITEMS_PER_PAGE);
    }, [filteredPickJobs, pickCurrentPage]);


    const filteredDispatchJobs = useMemo(() => {
        return filteredJobs.filter(j =>
            j.type === 'DISPATCH' &&
            j.status === 'Pending' &&
            !j.assignedTo
        );
    }, [filteredJobs]);

    const dispatchTotalPages = Math.ceil(filteredDispatchJobs.length / DISPATCH_ITEMS_PER_PAGE);
    const paginatedDispatchJobs = useMemo(() => {
        const start = (dispatchCurrentPage - 1) * DISPATCH_ITEMS_PER_PAGE;
        return filteredDispatchJobs.slice(start, start + DISPATCH_ITEMS_PER_PAGE);
    }, [filteredDispatchJobs, dispatchCurrentPage]);

    // Reset to page 1 if list changes drastically
    useEffect(() => {
        setDispatchCurrentPage(dispatchTotalPages);
    }, [dispatchTotalPages, dispatchCurrentPage]);



    // Assign Pagination State

    // Count States

    // Waste States

    // Driver/Dispatch States

    // Dock States

    // Transfer History States

    // Additional Missing States





    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

    // Calculate received quantities from jobs (run when PO changes or jobs change)
    useEffect(() => {
        if (receivingPO) {
            const counts: Record<string, number> = {};
            // Putaway jobs count as 'Received' into dock
            const allPoJobs = jobs.filter(j => j.orderRef === receivingPO.id);

            allPoJobs.forEach(job => {
                job.lineItems.forEach(item => {
                    counts[item.productId] = (counts[item.productId] || 0) + item.expectedQty;
                });
            });
            setReceivedQuantities(counts);
        }
    }, [receivingPO, jobs]);

    // Auto-populate SKU for receiving modal using LIVE inventory
    useEffect(() => {
        if (focusedItem && activeSite) {
            // Skip if not in browser context or product missing
            if (typeof window === 'undefined') return;

            const product = products.find(p => p.id === focusedItem.productId);

            // Skip if user has already edited/set value for this session
            if (scannedSkus[focusedItem.productId]) return;

            const populateSku = async () => {
                if (product?.sku && product.sku !== 'MISC' && product.sku.trim() !== '') {
                    // Pre-fill existing SKU
                    setScannedSkus(prev => ({ ...prev, [focusedItem.productId]: product.sku }));
                    setSkuDecisions(prev => ({ ...prev, [focusedItem.productId]: 'keep' }));
                } else {
                    // Generate new SKU using live data
                    const { generateSKU } = await import('../utils/skuGenerator');
                    const category = product?.category || 'General';
                    const newSku = generateSKU(category, allProducts);
                    if (focusedItem.productId) {
                        setScannedSkus(prev => ({ ...prev, [focusedItem.productId!]: newSku }));
                    }
                    // Implicitly 'generate'
                }
            };
            populateSku();
        }
    }, [focusedItem, activeSite, products, allProducts]);

    // Derived state for PO completion
    const isPOFullyReceived = useMemo(() => {
        if (!receivingPO?.lineItems) return false;
        return receivingPO.lineItems.every(item => {
            const received = item.productId ? (receivedQuantities[item.productId] || 0) : 0;
            return received >= item.quantity;
        });
    }, [receivingPO, receivedQuantities]);

    // --- RETURNS DATA ---
    const [foundSale, setFoundSale] = useState<any | null>(null); // Using any to avoid type complexity for now, or import SaleRecord
    const [returnItems, setReturnItems] = useState<any[]>([]); // Using any for ReturnItem[] compatibility

    // Computed Data for Returns
    const filteredRefundedSales = useMemo(() => {
        let filtered = sales.filter(s => s.status === 'Refunded' || s.status === 'Partially Refunded');

        if (returnHistorySearch) {
            const query = returnHistorySearch.toLowerCase();
            filtered = filtered.filter(s =>
                s.id.toLowerCase().includes(query) ||
                (s.customer_name && s.customer_name.toLowerCase().includes(query)) ||
                (s.customerName && s.customerName.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [sales, returnHistorySearch]);

    const returnHistoryTotalPages = Math.ceil(filteredRefundedSales.length / RETURN_HISTORY_PER_PAGE);
    const paginatedRefundedSales = useMemo(() => {
        const start = (returnHistoryPage - 1) * RETURN_HISTORY_PER_PAGE;
        return filteredRefundedSales.slice(start, start + RETURN_HISTORY_PER_PAGE);
    }, [filteredRefundedSales, returnHistoryPage]);

    const paginatedFoundSaleItems = useMemo(() => {
        if (!foundSale?.items) return [];
        const start = (returnItemsPage - 1) * RETURN_ITEMS_PER_PAGE;
        return foundSale.items.slice(start, start + RETURN_ITEMS_PER_PAGE);
    }, [foundSale, returnItemsPage]);

    const foundSaleTotalPages = Math.ceil((foundSale?.items?.length || 0) / RETURN_ITEMS_PER_PAGE);

    // Reset pages
    useEffect(() => {
        setReturnItemsPage(1);
    }, [foundSale]);

    useEffect(() => {
        setReturnHistoryPage(1);
    }, [returnViewMode]);

    // --- REVIEW & PRINT STATE ---
    const [reviewPO, setReviewPO] = useState<PurchaseOrder | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // --- REPRINT OPTIONS STATE ---
    const [reprintItem, setReprintItem] = useState<{ sku: string; name: string; qty: number } | null>(null);
    const [reprintSize, setReprintSize] = useState<'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
    const [reprintFormat, setReprintFormat] = useState<'QR' | 'Barcode' | 'Both'>('Barcode');

    // Pack Job Reprint State (uses same size/format as above)-Rich data for detailed labels
    const [packReprintJob, setPackReprintJob] = useState<PackLabelData & { id: string } | null>(null);

    // --- LOADING STATES (prevent double-clicking) ---
    const [isReceiving, setIsReceiving] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isDistributing, setIsDistributing] = useState(false);
    const [label_sRePrint] = useState<string[]>([]);
    const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
    const [creatingReplenishTask, setCreatingReplenishTask] = useState<string | null>(null); // Tracks productId of task being created
    const [approvingVariance, setApprovingVariance] = useState<number | null>(null); // Tracks index of variance being approved
    const [isDisposingWaste, setIsDisposingWaste] = useState(false); // Tracks waste disposal operation
    const [approvingJobId, setApprovingJobId] = useState<string | null>(null);

    const handleReprintLabels = async () => {
        if (!reprintItem || isPrinting) return;

        setIsPrinting(true);
        try {
            const labelsToPrint = [];
            // Use quantity to generate "1 of X" labels
            labelsToPrint.push({ value: reprintItem.sku, label: reprintItem.name, quantity: reprintItem.qty });

            const html = await generateUnifiedBatchLabelsHTML(labelsToPrint, {
                size: reprintSize as LabelSize,
                format: reprintFormat as LabelFormat
            });

            const printWin = window.open('', '_blank');
            if (printWin) {
                printWin.document.write(html);
                printWin.document.close();
            } else {
                addNotification('alert', 'Popup blocked. Allow popups to print.');
            }
        } catch (e) {
            console.error(e);
            addNotification('alert', 'Failed to generate labels');
        } finally {
            setIsPrinting(false);
            setReprintItem(null); // Close modal after printing
        }
    };

    const handlePrintReceivingLabels = async (po: PurchaseOrder) => {
        if (!po.lineItems) return;

        const labels: Array<{ value: string; label: string; quantity: number }> = [];

        po.lineItems.forEach(item => {
            const receivedQty = item.productId ? (receivedQuantities[item.productId] || 0) : 0;

            if (receivedQty > 0 && item.productId) {
                const product = products.find(p => p.id === item.productId);
                // Use finalized SKU if available, otherwise product SKU
                const itemSku = finalizedSkus[item.productId] || product?.sku || 'UNKNOWN';

                // Use quantity for proper "1 of 50" numbering across all items
                labels.push({ value: itemSku, label: item.productName, quantity: receivedQty });
            }
        });

        if (labels.length === 0) {
            addNotification('info', 'No items received yet to print labels for.');
            return;
        }

        setIsPrinting(true);
        try {
            const html = await generateUnifiedBatchLabelsHTML(labels, {
                size: labelSize as LabelSize,
                format: labelFormat as LabelFormat
            });
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } catch (error) {
            console.error('Print generation failed', error);
            addNotification('alert', 'Failed to generate labels');
        } finally {
            setIsPrinting(false);
        }
    };

    // --- PACKING STATE ---
    const [bagCount, setBagCount] = useState(0);
    const [hasIcePack, setHasIcePack] = useState(false);

    // --- DOCK STATE ---
    const [dockStatus, setDockStatus] = useState<Record<string, { status: 'Empty' | 'Occupied' | 'Maintenance', assignedPoId?: string, vesselName?: string, eta?: string }>>({
        'D1': { status: 'Occupied', assignedPoId: 'PO-1001', vesselName: 'Cargo Vessel #101', eta: 'Live' },
        'D2': { status: 'Empty' },
        'D3': { status: 'Empty' },
        'D4': { status: 'Maintenance' }
    });

    const [inboundQueue, setInboundQueue] = useState([
        { id: 'v1', vesselName: 'Cargo Vessel #102', poId: 'PO-1002', origin: 'Overseas Terminal', eta: '0:20M', priority: 'High' },
        { id: 'v2', vesselName: 'Cargo Vessel #103', poId: 'PO-1003', origin: 'Regional Hub', eta: '0:45M', priority: 'Normal' },
        { id: 'v3', vesselName: 'Cargo Vessel #104', poId: 'PO-1004', origin: 'Manufacturer A', eta: '1:15H', priority: 'Normal' }
    ]);

    const [selectedQueueVessel, setSelectedQueueVessel] = useState<any | null>(null);
    const [selectedDockId, setSelectedDockId] = useState<string | null>(null);

    const assignVesselToDock = (dockId: string, vessel: any) => {
        setDockStatus(prev => ({
            ...prev,
            [dockId]: {
                status: 'Occupied',
                assignedPoId: vessel.poId,
                vesselName: vessel.vesselName,
                eta: 'Docked'
            }
        }));
        setInboundQueue(prev => prev.filter(v => v.id !== vessel.id));
        setSelectedQueueVessel(null);
        addNotification('success', `${vessel.vesselName} successfully assigned to ${dockId}.`);
    };

    const releaseDock = (dockId: string) => {
        const dock = dockStatus[dockId];
        if (!dock) return;
        setDockStatus(prev => ({
            ...prev,
            [dockId]: { status: 'Empty' }
        }));
        logSystemEvent(
            'Dock Released',
            `${dock.vesselName || 'Cargo'} departed from ${dockId} `,
            user?.name || 'Manager',
            'Logistics'
        );
        setSelectedDockId(null);
        addNotification('success', `${dockId} is now available.`);
    };

    const toggleDockMaintenance = (dockId: string) => {
        setDockStatus(prev => {
            const current = prev[dockId];
            const isMaintenance = current.status === 'Maintenance';
            return {
                ...prev,
                [dockId]: { status: isMaintenance ? 'Empty' : 'Maintenance' }
            };
        });
        setSelectedDockId(null);
    };

    // --- WAVE STATE ---
    const [waveView, setWaveView] = useState<'LIST' | 'KANBAN'>('KANBAN');

    // --- ADMIN STATE ---
    const [labelMode, setLabelMode] = useState<'BIN' | 'PRODUCT'>('PRODUCT');

    // Zone Management State
    const [lockedZones, setLockedZones] = useState<Set<string>>(new Set());
    const [zoneMaintenanceReasons, setZoneMaintenanceReasons] = useState<Record<string, string>>({});

    const [selectedPackJob, setSelectedPackJob] = useState<string | null>(null);
    const [boxSize, setBoxSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');

    // PACK Tab Pagination-placed here to access state variables
    const filteredPackJobs = useMemo(() => {
        return filteredJobs.filter(j => {
            if (j.type !== 'PACK') return false;
            if (packSearch && !j.id.toLowerCase().includes(packSearch.toLowerCase())) return false;
            if (packJobFilter === 'all') return true;
            if (packJobFilter === 'pending') return j.status === 'Pending';
            if (packJobFilter === 'in-progress') return j.status === 'In-Progress';
            if (packJobFilter === 'completed') return j.status === 'Completed';
            return true;
        }).sort((a, b) => {
            if (packSortBy === 'priority') {
                const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
            } else if (packSortBy === 'date') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            } else if (packSortBy === 'items') {
                return (b.lineItems?.length ?? 0) - (a.lineItems?.length ?? 0);
            }
            return 0;
        });
    }, [filteredJobs, packSearch, packJobFilter, packSortBy]);
    const packJobsTotalPages = Math.ceil(filteredPackJobs.length / PACK_ITEMS_PER_PAGE);
    const paginatedPackJobs = useMemo(() => {
        const start = (packCurrentPage - 1) * PACK_ITEMS_PER_PAGE;
        return filteredPackJobs.slice(start, start + PACK_ITEMS_PER_PAGE);
    }, [filteredPackJobs, packCurrentPage]);
    // Reset pack page on filter change
    useEffect(() => {
        setPackCurrentPage(1);
    }, [packSearch, packJobFilter]);
    const [fragileItems, setFragileItems] = useState<Set<string>>(new Set());
    const [packScanMode, setPackScanMode] = useState(false); // Toggle between checkbox and scanner mode
    const [packScanInput, setPackScanInput] = useState(''); // Scanner input for pack mode
    const [packingMaterials, setPackingMaterials] = useState({
        bubbleWrap: false,
        airPillows: false,
        fragileStickers: false
    });
    const [labelPrinted, setLabelPrinted] = useState(false);

    // Reset labelPrinted when selectedPackJob changes
    useEffect(() => {
        setLabelPrinted(false);
    }, [selectedPackJob]);

    // --- DOCK STATE ---
    const [dockTab, setDockTab] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');

    const [expandedCompletedPackJob, setExpandedCompletedPackJob] = useState<string | null>(null);
    const [shippingTransferId, setShippingTransferId] = useState<string | null>(null); // Loading state for shipping buttons
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({}); // Generic loading state for any action by ID

    // --- REPLENISH STATE ---
    const [selectedReplenishItems, setSelectedReplenishItems] = useState<Set<string>>(new Set());
    const [expandedReplenishItem, setExpandedReplenishItem] = useState<string | null>(null);


    // --- PUTAWAY STATE ---

    // Putaway Logic (Extracted from JSX to fix Hook Violation)
    const sortedPutawayJobs = useMemo(() => {
        let filtered = filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status !== 'Completed');
        if (putawayStatusFilter !== 'All') filtered = filtered.filter(j => j.status === putawayStatusFilter);
        if (putawaySearch) {
            filtered = filtered.filter(j =>
                j.id.toLowerCase().includes(putawaySearch.toLowerCase()) ||
                (j.orderRef && orders.find(o => o.id === j.orderRef)?.po_number?.toLowerCase().includes(putawaySearch.toLowerCase()))
            );
        }

        return filtered.sort((a, b) => {
            if (putawaySortBy === 'priority') {
                const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            } else if (putawaySortBy === 'items') {
                return b.items - a.items;
            } else {
                return new Date(b.id).getTime() - new Date(a.id).getTime();
            }
        });
    }, [filteredJobs, putawayStatusFilter, putawaySearch, putawaySortBy, orders]);

    const putawayTotalPages = Math.ceil(sortedPutawayJobs.length / PUTAWAY_ITEMS_PER_PAGE);
    const safePutawayCurrentPage = Math.min(Math.max(1, putawayCurrentPage), Math.max(1, putawayTotalPages));
    const paginatedPutawayJobs = useMemo(() => {
        const start = (safePutawayCurrentPage - 1) * PUTAWAY_ITEMS_PER_PAGE;
        return sortedPutawayJobs.slice(start, start + PUTAWAY_ITEMS_PER_PAGE);
    }, [sortedPutawayJobs, safePutawayCurrentPage]);


    // Replenish Logic (Extracted for Pagination)
    const sortedReplenishItems = useMemo(() => {
        return filteredProducts
            .filter(p => {
                if (replenishSearch && !p.name.toLowerCase().includes(replenishSearch.toLowerCase()) && !p.sku?.toLowerCase().includes(replenishSearch.toLowerCase())) return false;

                const minStock = p.minStock || 10;
                if (replenishFilter === 'critical') return p.stock === 0;
                if (replenishFilter === 'low') return p.stock > 0 && p.stock < minStock;
                if (replenishFilter === 'optimal') return p.stock >= minStock;

                return p.stock < minStock * 2; // Default 'all' shows recommended replenishments
            })
            .sort((a, b) => {
                if (replenishSortBy === 'urgency') {
                    if (a.stock === 0 && b.stock !== 0) return -1;
                    if (b.stock === 0 && a.stock !== 0) return 1;
                    return (a.stock / (a.minStock || 10)) - (b.stock / (b.minStock || 10));
                }
                if (replenishSortBy === 'stock') return a.stock - b.stock;
                if (replenishSortBy === 'name') return a.name.localeCompare(b.name);
                return 0;
            });
    }, [filteredProducts, replenishSearch, replenishFilter, replenishSortBy]);

    const replenishTotalPages = Math.ceil(sortedReplenishItems.length / REPLENISH_ITEMS_PER_PAGE);
    const safeReplenishCurrentPage = Math.min(Math.max(1, replenishCurrentPage), Math.max(1, replenishTotalPages));

    const paginatedReplenishItems = useMemo(() => {
        const start = (safeReplenishCurrentPage - 1) * REPLENISH_ITEMS_PER_PAGE;
        return sortedReplenishItems.slice(start, start + REPLENISH_ITEMS_PER_PAGE);
    }, [sortedReplenishItems, safeReplenishCurrentPage]);

    // Reset Replenish Page on filter change
    useEffect(() => {
        setReplenishCurrentPage(1);
    }, [replenishSearch, replenishFilter, replenishSortBy]);


    // --- TRANSFER STATE ---
    const [transferSourceSite, setTransferSourceSite] = useState<string>('');
    const [transferDestSite, setTransferDestSite] = useState<string>('');
    const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [transferPriority, setTransferPriority] = useState<'Normal' | 'High' | 'Critical'>('Normal');
    const [transferNote, setTransferNote] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferStatusFilter, setTransferStatusFilter] = useState<'ALL' | 'Requested' | 'Approved' | 'Picking' | 'Picked' | 'Packed' | 'In-Transit' | 'Delivered' | 'Received'>('ALL');
    const [transferSortBy, setTransferSortBy] = useState<'date' | 'items' | 'site' | 'priority'>('date');

    const [scannerSortBy, setScannerSortBy] = useState<'bin' | 'name' | 'status'>('bin');
    const [transferReceiveMode, setTransferReceiveMode] = useState(false);
    const [transferReceiveItems, setTransferReceiveItems] = useState<{ productId: string; expectedQty: number; receivedQty: number; condition: string; notes?: string }[]>([]);
    const [activeTransferJob, setActiveTransferJob] = useState<any | null>(null);

    // --- TRANSFER ARCHIVE STATE ---
    const [showTransferArchive, setShowTransferArchive] = useState(false);
    const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
    const [archiveDateFrom, setArchiveDateFrom] = useState('');
    const [archiveDateTo, setArchiveDateTo] = useState('');

    // TRANSFER Tab Pagination
    const [transferCurrentPage, setTransferCurrentPage] = useState(1);
    const TRANSFER_ITEMS_PER_PAGE = 10;

    const [archiveCurrentPage, setArchiveCurrentPage] = useState(1);
    const ARCHIVE_ITEMS_PER_PAGE = 20;

    const filteredOngoingTransfers = useMemo(() => {
        return filteredJobs
            .filter(j => j.type === 'TRANSFER' && j.transferStatus !== 'Received')
            .filter(j => {
                if (typeof transferStatusFilter === 'undefined' || transferStatusFilter === 'ALL') return true;
                if (transferStatusFilter === 'Picking') return j.transferStatus === 'Picking' || j.transferStatus === 'Picked';
                return j.transferStatus === transferStatusFilter;
            })
            .sort((a, b) => {
                switch (transferSortBy) {
                    case 'priority':
                        const p: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 1, 'Low': 0 };
                        return (p[b.priority] || 1) - (p[a.priority] || 1);
                    case 'date':
                        return new Date(b.createdAt || b.orderRef).getTime() - new Date(a.createdAt || a.orderRef).getTime();
                    case 'items':
                        return (b.lineItems?.length || 0) - (a.lineItems?.length || 0);
                    case 'site':
                        return (sites.find(s => s.id === a.destSiteId)?.name || '').localeCompare(sites.find(s => s.id === b.destSiteId)?.name || '');
                    default:
                        return 0;
                }
            });
    }, [filteredJobs, transferStatusFilter, transferSortBy, sites]);

    const transferTotalPages = Math.ceil(filteredOngoingTransfers.length / TRANSFER_ITEMS_PER_PAGE);
    const paginatedOngoingTransfers = useMemo(() => {
        const start = (transferCurrentPage - 1) * TRANSFER_ITEMS_PER_PAGE;
        return filteredOngoingTransfers.slice(start, start + TRANSFER_ITEMS_PER_PAGE);
    }, [filteredOngoingTransfers, transferCurrentPage]);

    const filteredArchiveTransfers = useMemo(() => {
        return filteredJobs
            .filter(j => j.type === 'TRANSFER')
            .filter(j => {
                // Search filter
                if (archiveSearchQuery) {
                    const query = archiveSearchQuery.toLowerCase();
                    const transferId = formatTransferId(j).toLowerCase();
                    const sourceName = (sites.find(s => s.id === j.sourceSiteId)?.name || '').toLowerCase();
                    const destName = (sites.find(s => s.id === j.destSiteId)?.name || '').toLowerCase();
                    return transferId.includes(query) || sourceName.includes(query) || destName.includes(query);
                }
                return true;
            })
            .filter(j => {
                // Date filter
                if (archiveDateFrom || archiveDateTo) {
                    const transferDate = new Date(j.createdAt || j.orderRef);
                    if (archiveDateFrom && transferDate < new Date(archiveDateFrom)) return false;
                    if (archiveDateTo && transferDate > new Date(archiveDateTo + 'T23:59:59')) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.createdAt || b.orderRef).getTime() - new Date(a.createdAt || a.orderRef).getTime());
    }, [filteredJobs, archiveSearchQuery, archiveDateFrom, archiveDateTo, sites]);

    const archiveTotalPages = Math.ceil(filteredArchiveTransfers.length / ARCHIVE_ITEMS_PER_PAGE);
    const paginatedArchiveTransfers = useMemo(() => {
        const start = (archiveCurrentPage - 1) * ARCHIVE_ITEMS_PER_PAGE;
        return filteredArchiveTransfers.slice(start, start + ARCHIVE_ITEMS_PER_PAGE);
    }, [filteredArchiveTransfers, archiveCurrentPage]);

    // Reset pages on filter change
    useEffect(() => { setTransferCurrentPage(1); }, [transferStatusFilter, transferSortBy]);
    useEffect(() => { setArchiveCurrentPage(1); }, [archiveSearchQuery, archiveDateFrom, archiveDateTo]);


    // --- BULK DISTRIBUTION STATE (Wave Transfer to Multiple Stores) ---
    const [showBulkDistributionModal, setShowBulkDistributionModal] = useState(false);
    const [bulkDistributionSourceSite, setBulkDistributionSourceSite] = useState<string>('');
    const [bulkDistributionProductId, setBulkDistributionProductId] = useState<string>('');
    const [bulkDistributionAllocations, setBulkDistributionAllocations] = useState<{ storeId: string; quantity: number }[]>([]);
    const [bulkDistributionMode, setBulkDistributionMode] = useState<'single' | 'wave'>('single');
    const [waveProducts, setWaveProducts] = useState<{ productId: string; allocations: { storeId: string; quantity: number }[] }[]>([]);

    // --- DISTRIBUTION HUB STATE (Manual replenishment decision support) ---
    const [showDistHubModal, setShowDistHubModal] = useState(false);
    const [distHubLoading, setDistHubLoading] = useState(false);
    const [distHubLowStockItems, setDistHubLowStockItems] = useState<Product[]>([]);
    const [distHubSelectedSku, setDistHubSelectedSku] = useState<string | null>(null);
    const [distHubSelectedDestSite, setDistHubSelectedDestSite] = useState<string | null>(null);
    const [distHubAvailableSources, setDistHubAvailableSources] = useState<(Product & { site?: Site })[]>([]);
    const [distHubTransferDrafts, setDistHubTransferDrafts] = useState<{
        sku: string;
        sourceSiteId: string;
        destSiteId: string;
        qty: number;
        productName: string;
        sourceSiteName: string;
        destSiteName: string;
    }[]>([]);
    const [isRefreshingDistHub, setIsRefreshingDistHub] = useState(false);
    const [distHubTimer, setDistHubTimer] = useState(0);
    const [distHubSectorIntegrity, setDistHubSectorIntegrity] = useState(98.4);

    // Mission Timer Effect
    useEffect(() => {
        let interval: any;
        if (showDistHubModal) {
            setDistHubTimer(0);
            // Randomize sector integrity slightly for "live" feel
            setDistHubSectorIntegrity(98 + Math.random() * 1.5);
            interval = setInterval(() => {
                setDistHubTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [showDistHubModal]);

    const formatMissionTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };


    // --- COUNT STATE ---
    const [countSessionStatus, setCountSessionStatus] = useState<'Idle' | 'Active' | 'Review'>('Idle');
    const [countSessionType, setCountSessionType] = useState<'Cycle' | 'Spot'>('Cycle');
    const [countSessionItems, setCountSessionItems] = useState<{
        productId: string;
        systemQty: number;
        countedQty?: number;
        status: 'Pending' | 'Counted' | 'Recount' | 'Approved';
        variance?: number;
    }[]>([]);
    const [countFilter, setCountFilter] = useState<'All' | 'Pending' | 'Counted' | 'Variance'>('All');
    const [countViewMode, setCountViewMode] = useState<'Operations' | 'Reports'>('Operations');

    // --- WASTE STATE ---
    const [wasteBasket, setWasteBasket] = useState<{
        productId: string;
        quantity: number;
        reason: string;
        notes?: string;
    }[]>([]);
    const [wasteViewMode, setWasteViewMode] = useState<'Log' | 'History'>('Log');

    // --- MODAL STATE ---
    // Short Pick Modal
    const [showShortPickModal, setShowShortPickModal] = useState(false);
    const [shortPickQuantity, setShortPickQuantity] = useState('');
    const [shortPickMaxQty, setShortPickMaxQty] = useState(0);
    const [shortPickResolution, setShortPickResolution] = useState<'standard' | 'discontinue'>('standard');

    // Zone Lock Modal
    const [showZoneLockModal, setShowZoneLockModal] = useState(false);
    const [zoneLockReason, setZoneLockReason] = useState('');
    const [zoneToLock, setZoneToLock] = useState('');

    // Confirmation Modals
    const [showLabelsNotPrintedModal, setShowLabelsNotPrintedModal] = useState(false);
    const [showIncompletePackingModal, setShowIncompletePackingModal] = useState(false);
    const [showMissingIcePacksModal, setShowMissingIcePacksModal] = useState(false);
    const [showMissingProtectiveModal, setShowMissingProtectiveModal] = useState(false);

    // Pending actions for confirmation modals
    const [pendingReceiveAction, setPendingReceiveAction] = useState<(() => void) | null>(null);
    const [pendingPackAction, setPendingPackAction] = useState<(() => void) | null>(null);

    // Helper function to check if a zone is locked
    const isZoneLocked = (location: string): boolean => {
        if (!location) return false;
        // Check if any locked zone matches the location
        // Handle different location formats: "Zone A", "A-01", "A-01-05", etc.
        const locationUpper = location.toUpperCase();
        for (const lockedZone of Array.from(lockedZones)) {
            // Extract zone letter from locked zone (e.g., "A-01" -> "A")
            const zoneLetter = lockedZone.split('-')[0];
            // Check if location contains the zone letter
            if (locationUpper.includes(zoneLetter) || locationUpper.includes(`ZONE ${zoneLetter} `)) {
                return true;
            }
        }
        return false;
    };

    // --- DISTRIBUTION HUB LOGIC ---
    const fetchDistHubData = async () => {
        setDistHubLoading(true);
        try {
            const lowStock = await productsService.getLowStockAcrossSites();
            // Filter only for stores (not warehouses) showing up as low stock
            const storeLowStock = lowStock.filter(p => {
                const site = sites.find(s => s.id === (p.siteId || p.site_id));
                const isStore = site?.type === 'Store';

                // Restriction: only know what we can supply from our current node
                if (activeSite && activeSite.type !== 'HQ' && activeSite.type !== 'Administration') {
                    const canSupply = products.some(local => local.sku === p.sku && local.stock > 0);
                    return isStore && canSupply;
                }

                return isStore;
            });
            setDistHubLowStockItems(storeLowStock);
        } catch (err) {
            console.error('Failed to fetch dist hub data:', err);
            addNotification('alert', 'Failed to load low stock monitor');
        } finally {
            setDistHubLoading(false);
        }
    };

    const handleSelectLowStockProduct = async (product: Product) => {
        setDistHubSelectedSku(product.sku);
        setDistHubSelectedDestSite(product.siteId || product.site_id || null);
        setDistHubAvailableSources([]);

        try {
            const rawSources = await productsService.getWarehouseStock(product.sku);

            // Manual Join with local 'sites' state to avoid ambiguous query error
            const sourcesWithSites = rawSources.map(s => ({
                ...s,
                site: sites.find(site => site.id === (s.siteId || s.site_id))
            }));

            // Only show warehouses/DCs as sources, restricted strictly to active site if selected
            const warehouseSources = sourcesWithSites.filter(s =>
                (s.site?.type === 'Warehouse' || s.site?.type === 'Distribution Center') &&
                s.site?.id !== (product.siteId || product.site_id) &&
                (!activeSite || activeSite.type === 'HQ' || activeSite.type === 'Administration' ? true : s.site?.id === activeSite.id)
            );
            setDistHubAvailableSources(warehouseSources);
        } catch (err) {
            console.error('Failed to fetch source stock:', err);
        }
    };

    const addToDistDraft = (source: Product & { site?: Site }, qty: number) => {
        if (!distHubSelectedSku || !distHubSelectedDestSite || qty <= 0) return;

        const destSite = sites.find(s => s.id === distHubSelectedDestSite);
        const sourceSite = source.site || sites.find(s => s.id === (source.siteId || source.site_id));
        const targetProduct = distHubLowStockItems.find(p => p.sku === distHubSelectedSku && (p.siteId === distHubSelectedDestSite || p.site_id === distHubSelectedDestSite));

        const newDraft = {
            sku: distHubSelectedSku,
            sourceSiteId: sourceSite?.id || '',
            destSiteId: distHubSelectedDestSite,
            qty: qty,
            productName: targetProduct?.name || distHubSelectedSku,
            sourceSiteName: sourceSite?.name || 'Unknown',
            destSiteName: destSite?.name || 'Unknown'
        };

        setDistHubTransferDrafts([...distHubTransferDrafts, newDraft]);
        addNotification('info', `Added draft: ${qty} units from ${sourceSite?.name}`);
    };

    const submitDistTransfers = async () => {
        if (distHubTransferDrafts.length === 0) return;

        setDistHubLoading(true);
        let successCount = 0;

        try {
            for (const draft of distHubTransferDrafts) {
                // Find products for the draft to get IDs
                const srcProd = allProducts.find(p => p.sku === draft.sku && (p.siteId === draft.sourceSiteId || p.site_id === draft.sourceSiteId));

                if (!srcProd) {
                    console.error(`Source product for SKU ${draft.sku} not found at site ${draft.sourceSiteId}`);
                    continue;
                }

                const orderRef = `DIST-${draft.sku}-${Date.now().toString().slice(-4)}`;

                const job: any = {
                    siteId: draft.destSiteId,
                    site_id: draft.destSiteId,
                    type: 'TRANSFER',
                    sourceSiteId: draft.sourceSiteId,
                    destSiteId: draft.destSiteId,
                    priority: 'Normal',
                    status: 'In-Progress',
                    transferStatus: 'Approved',
                    orderRef,
                    items: 1,
                    lineItems: [{
                        productId: srcProd.id,
                        expectedQty: draft.qty,
                        receivedQty: 0,
                        status: 'Pending'
                    }]
                };

                const createdTransfer = await wmsJobsService.create(job);

                // AUTOMATED PICK JOB: Create pick job at source site
                const pickJob: any = {
                    site_id: draft.sourceSiteId,
                    siteId: draft.sourceSiteId,
                    type: 'PICK',
                    sourceSiteId: draft.sourceSiteId,
                    destSiteId: draft.destSiteId,
                    priority: 'Normal',
                    status: 'Pending',
                    orderRef: createdTransfer.id,
                    items: 1,
                    lineItems: [{
                        productId: srcProd.id,
                        expectedQty: draft.qty,
                        pickedQty: 0,
                        status: 'Pending'
                    }],
                    jobNumber: `PICK-${(createdTransfer.jobNumber || '').replace('TRF-', '')}`
                };

                await wmsJobsService.create(pickJob);
                successCount++;
            }

            addNotification('success', `Successfully created ${successCount} transfer jobs`);
            setShowDistHubModal(false);
            setDistHubTransferDrafts([]);
            refreshData();
        } catch (err) {
            console.error('Failed to submit transfers:', err);
            addNotification('alert', 'Error creating some transfer jobs');
        } finally {
            setDistHubLoading(false);
        }
    };


    // Helper function to get smart location suggestions based on product category
    const getSmartLocationSuggestions = (productId: string) => {
        const product = filteredProducts.find(p => p.id === productId);
        if (!product) return [];

        const suggestions: string[] = [];

        // Category-based zone recommendations
        const categoryZoneMap: Record<string, string> = {
            'Frozen': 'F',
            'Dairy': 'C',
            'Meat & Seafood': 'C',
            'Fresh Produce': 'A',
            'Beverages': 'B',
            'Pantry Staples': 'A',
            'Snacks & Sweets': 'B',
            'Household': 'D',
            'Cleaning': 'D',
            'Health & Wellness': 'E',
            'Personal Care': 'E'
        };

        // Find recommended zone
        const recommendedZone = categoryZoneMap[product.category] || 'A';

        // If product already has a location, suggest nearby locations
        if (product.location) {
            const match = product.location.match(/^([A-Z])-(\d{2})-(\d{2})$/);
            if (match) {
                const [, zone, aisle, bin] = match;
                const aisleNum = parseInt(aisle);
                const binNum = parseInt(bin);

                // Suggest same zone, nearby aisles
                for (let i = 0; i < 3; i++) {
                    const newAisle = String(Math.max(1, Math.min(20, aisleNum + i))).padStart(2, '0');
                    const newBin = String(Math.max(1, Math.min(20, binNum + i))).padStart(2, '0');
                    suggestions.push(`${zone} -${newAisle} -${newBin} `);
                }
            }
        } else {
            // Suggest locations in recommended zone
            for (let i = 1; i <= 3; i++) {
                suggestions.push(`${recommendedZone}-01 - ${String(i).padStart(2, '0')} `);
            }
        }

        // Find where similar products (same category) are stored
        const similarProducts = filteredProducts.filter(p =>
            p.category === product.category &&
            p.location &&
            p.id !== productId
        );

        if (similarProducts.length > 0) {
            const locations = similarProducts
                .map(p => p.location)
                .filter((loc): loc is string => !!loc)
                .slice(0, 2);
            suggestions.push(...locations);
        }

        return Array.from(new Set(suggestions)).slice(0, 5);
    };

    // Helper to get temperature requirements
    const getTemperatureRequirement = (category: string) => {
        const coldCategories = ['Frozen', 'Dairy', 'Meat & Seafood', 'Fresh Produce'];
        if (coldCategories.includes(category)) {
            return category === 'Frozen' ? 'Frozen (-18°C)' : 'Cold (2-4°C)';
        }
        return null;
    };

    // --- COUNT STATE ---
    const [counts, setCounts] = useState<Record<string, number>>({});

    // --- EFFECTS ---
    // Ensure receiveData is initialized when receivingPO changes
    useEffect(() => {
        if (receivingPO && receivingPO.lineItems) {
            // Only initialize if receiveData is empty or doesn't match the PO
            const shouldInitialize = receiveData.length === 0 ||
                receiveData.length !== receivingPO.lineItems.length ||
                !receiveData.some((item, idx) =>
                    receivingPO.lineItems?.[idx]?.productId === item.productId
                );

            if (shouldInitialize) {
                setReceiveData(receivingPO.lineItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName || '',
                    expectedQty: item.quantity,
                    receivedQty: item.quantity,
                    quantity: item.quantity
                })));
            }
        } else if (!receivingPO) {
            // Clear receiveData when receivingPO is cleared
            setReceiveData([]);
        }
    }, [receivingPO?.id]); // Only depend on PO ID, not the entire object

    // --- HELPERS ---

    const getExpiryStatus = (dateString?: string) => {
        if (!dateString) return { color: 'text-gray-400', label: t('warehouse.noDate') };
        const days = Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (days < 7) return { color: 'text-red-500', label: t('warehouse.criticalExpires'), icon: AlertTriangle };
        if (days < 30) return { color: 'text-yellow-400', label: t('warehouse.warningExpires'), icon: Clock };
        return { color: 'text-green-400', label: t('warehouse.good'), icon: CheckCircle };
    };

    const handleStartJob = async (job: WMSJob) => {
        setIsSubmitting(true);
        try {
            // APPROVAL CHECK: Block unapproved transfer jobs
            if (job.type === 'TRANSFER' && job.transferStatus && job.transferStatus !== 'Approved') {
                addNotification('alert', 'This transfer must be approved by a manager before work can begin.');
                setIsSubmitting(false);
                return;
            }

            // Auto-assign if not assigned
            if (!job.assignedTo && user) {
                try {
                    await assignJob(job.id, user.id || user.name);
                    addNotification('success', t('warehouse.jobAssignedToYou').replace('{name}', user.name));
                } catch (e) {
                    console.error('Failed to auto-assign job', e);
                }
            }

            // Update status to In-Progress if Pending
            if (job.status === 'Pending') {
                updateJobStatus(job.id, 'In-Progress');
            }

            // SAFETY CHECK: Ensure lineItems exists (handle both camelCase and snake_case)
            const jobLineItems = job.lineItems || (job as any).line_items || [];
            if (!jobLineItems || jobLineItems.length === 0) {
                addNotification('alert', t('warehouse.errorJobNoItems') || 'Job has no items. Cannot start.');
                console.error('Job has no items:', job);
                return;
            }

            // Normalize the job to ensure lineItems is set
            const normalizedJob = { ...job, lineItems: jobLineItems };

            // OPTIMIZATION: Inject original index before sorting to preserve DB mapping
            const indexedItems = jobLineItems.map((item, idx) => ({ ...item, originalIndex: idx }));

            // Sort items by bin location to create efficient pick path
            const sortedItems = [...indexedItems].sort((a, b) => {
                const prodA = filteredProducts.find(p => p.id === a.productId);
                const prodB = filteredProducts.find(p => p.id === b.productId);
                return (prodA?.location || '').localeCompare(prodB?.location || '');
            });

            const optimizedJob = { ...normalizedJob, lineItems: sortedItems, assignedTo: job.assignedTo || user?.name };

            // Check if job is already complete (all items processed)
            const allItemsAlreadyProcessed = optimizedJob.lineItems.every(i =>
                i.status === 'Picked' || i.status === 'Short'
            );

            if (allItemsAlreadyProcessed) {
                addNotification('info', 'This job is already complete');
                return;
            }

            // Just set the job-user will click "Start Picking" button in modal to open scanner
            setSelectedJob(optimizedJob);
            setIsDetailsOpen(true);
            // Don't set scanner mode here-let user preview job details first
            setIsScannerMode(false);

            logSystemEvent(
                'Job Started',
                `Started ${job.type} job ${job.jobNumber || job.id} with ${optimizedJob.lineItems.length} items`,
                user?.name || 'Worker',
                'Inventory'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBinScan = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock validation:accepts any bin starting with 'A', 'B', 'C'
        if (scannedBin.length > 2) {
            setScannerStep('SCAN');
        } else {
            addNotification('alert', t('warehouse.invalidBinLabel'));
        }
    };

    // Generate location from zone/aisle/bin selection
    const generateLocation = (zone: string, aisle: string, bin: string) => {
        const a = aisle.padStart(2, '0');
        const b = bin.padStart(2, '0');
        return `Aisle ${a} - Zone ${zone} - Bin ${b} `;
    };

    // Get occupied locations from products
    const getOccupiedLocations = () => {
        return new Set(filteredProducts.filter(p => p.location).map(p => p.location!));
    };

    // Check if location is available (for PUTAWAY, locations can always be used even if occupied)
    // This is informational only-shows if other items exist at this location
    const isLocationAvailable = (location: string) => {
        // For PUTAWAY operations, always allow-multiple items can share a bin
        // This just indicates if the location already has items (informational)
        return true; // Always available for putaway
    };

    // Check if location has existing items (informational display)
    const isLocationOccupied = (location: string) => {
        const occupied = getOccupiedLocations();
        return occupied.has(location);
    };

    // Handle location selection
    const handleLocationSelect = (location: string) => {
        if (!location || location.trim() === '') {
            addNotification('alert', t('warehouse.pleaseSelectLocation'));
            return;
        }
        setScannedBin(location);
        setShowLocationPicker(false);
        setScannerStep('SCAN');
        addNotification('success', t('warehouse.locationSelected').replace('{location}', location));
        playBeep('success');
    };

    const applyScannerSort = (sortBy: 'bin' | 'name' | 'status') => {
        if (!selectedJob) return;
        const items = [...selectedJob.lineItems];
        items.sort((a, b) => {
            if (sortBy === 'bin') {
                const prodA = products.find(p => p.id === a.productId);
                const prodB = products.find(p => p.id === b.productId);
                return (prodA?.location || '').localeCompare(prodB?.location || '');
            } else if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'status') {
                const statusOrder: Record<string, number> = { 'Pending': 0, 'Short': 1, 'Picked': 2 };
                return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
            }
            return 0;
        });
        setScannerSortBy(sortBy);
        setSelectedJob({ ...selectedJob, lineItems: items });
    };

    const handleItemScan = async (actualQty?: number, forcedStatus?: JobItem['status']) => {
        if (!selectedJob || isProcessingScan || isSubmitting) return;
        setIsProcessingScan(true);
        setIsSubmitting(true);
        try {
            // Find item in job
            const itemIndex = selectedJob.lineItems.findIndex(i => i.status === 'Pending');
            if (itemIndex === -1) return;

            const item = selectedJob.lineItems[itemIndex];

            if (item) {
                // Safety: Get original index to ensure DB update hits correct item
                const originalIdx = (item as any).originalIndex;
                const updateTargetIndex = typeof originalIdx === 'number' ? originalIdx : itemIndex;

                console.log(`🔍 Scanning Item: ${item.name} at Sorted Idx: ${itemIndex}, Original Idx: ${updateTargetIndex} `);

                // Validate location for PUTAWAY jobs
                if (selectedJob.type === 'PUTAWAY' && !scannedBin) {
                    addNotification('alert', t('warehouse.pleaseSelectStorageLocation'));
                    setScannerStep('NAV');
                    return;
                }

                // Perform Putaway Logic: Update Product Location AND Stock
                if (selectedJob.type === 'PUTAWAY' && scannedBin) {
                    try {
                        const qtyToAdd = actualQty !== undefined ? actualQty : item.expectedQty;
                        let productId = item.productId;

                        // If productId is null, auto-create the product first
                        if (!productId) {
                            console.log(`🆕 Product ID is null.Auto-creating product: ${item.name} `);

                            // Determine product category (fallback to 'General' if not available)
                            const productCategory = 'General'; // Can be enhanced to extract from context if available

                            // Generate a proper SKU or use existing from item
                            // Generate a proper SKU or use existing from item
                            const { generateSKU } = await import('../utils/skuGenerator');
                            const generatedSKU = item.sku && item.sku.trim() !== '' && item.sku !== 'MISC'
                                ? item.sku
                                : generateSKU(productCategory, allProducts);

                            // AUTO-CREATE: Now requires approval
                            console.log(`📝 Creating auto-create request for: ${item.name} `);
                            const request: Omit<PendingInventoryChange, 'id'> = {
                                productId: '', // New product
                                productName: item.name,
                                productSku: generatedSKU,
                                siteId: selectedJob.siteId || selectedJob.site_id || '',
                                changeType: 'create',
                                requestedBy: user?.name || 'WMS Worker',
                                requestedAt: new Date().toISOString(),
                                status: 'pending',
                                proposedChanges: {
                                    name: item.name,
                                    sku: generatedSKU,
                                    category: productCategory,
                                    price: 0,
                                    cost: 0,
                                    stock: 0, // Initial stock should be 0, Putaway Job will add the real stock
                                    minStock: 0,
                                    siteId: selectedJob.siteId || selectedJob.site_id,
                                    location: scannedBin,
                                    image: item.image || '/placeholder.png',
                                    barcode: '',
                                    unit: 'pcs',
                                    status: 'active'
                                } as any,
                                adjustmentType: 'IN',
                                adjustmentQty: qtyToAdd,
                                adjustmentReason: 'Auto-create during Putaway'
                            };

                            await inventoryRequestsService.create(request);
                            addNotification('success', `✅ Creation request for "${item.name}" submitted for approval.`);

                            // Since we didn't actually create the product yet, we cannot continue with stock adjustment.
                            // We should stop here or mark item as 'Pending Approval' in UI?
                            // For now, let's stop and notify.
                            return;
                        } else {
                            // Updatethe product's location

                            await relocateProduct(productId, scannedBin, user?.name || 'WMS Worker');
                        }

                        // Add stock to inventory (increases the stock count)
                        console.log(`📦 PUTAWAY: Adding ${qtyToAdd} units of ${item.name} to inventory at ${scannedBin} `);
                        await adjustStock(
                            productId,
                            qtyToAdd,
                            'IN',
                            `PUTAWAY from PO - stored at ${scannedBin} `,
                            user?.name || 'WMS Worker'
                        );

                        addNotification('success', `✅ Added ${qtyToAdd}x ${item.name} to inventory at ${scannedBin} `);
                        playBeep('success');
                    } catch (error) {
                        console.error('Putaway Error:', error);
                        addNotification('alert', 'Failed to complete putaway operation. Please try again.');
                        playBeep('error');
                        return; // Stop execution if putaway fails
                    }
                }

                // Perform Pick Logic: Deduct stock from inventory when items are picked
                if (selectedJob.type === 'PICK' && item.productId) {
                    try {
                        const qtyToDeduct = actualQty !== undefined ? actualQty : item.expectedQty;

                        // Deduct stock from inventory (decreases the stock count)
                        console.log(`📤 PICK: Deducting ${qtyToDeduct} units of ${item.name} from inventory`);
                        await adjustStock(
                            item.productId,
                            qtyToDeduct,
                            'OUT',
                            `PICK for Order ${selectedJob.orderRef || selectedJob.id}`,
                            user?.name || 'Picker'
                        );

                        addNotification('success', `✅ Picked ${qtyToDeduct}x ${item.name} `);
                        playBeep('success');

                        // EXPANDED LOGGING: Log that the user picked an item
                        logSystemEvent(
                            'Item Picked',
                            `Picked ${qtyToDeduct}x ${item.name} for Job ${selectedJob.jobNumber || selectedJob.id}`,
                            user?.name || 'Picker',
                            'Inventory'
                        );

                        // Update UI State (for Job Progress)
                    } catch (error) {
                        console.error('Pick Error:', error);
                        addNotification('alert', 'Failed to deduct stock. Please try again.');
                        playBeep('error');
                        return; // Stop execution if pick fails
                    }
                }

                const qtyToRecord = actualQty !== undefined ? actualQty : item.expectedQty;
                const statusToRecord = forcedStatus || ((actualQty !== undefined && actualQty < item.expectedQty) ? 'Short' : 'Picked');

                await updateJobItem(selectedJob.id, updateTargetIndex, statusToRecord, qtyToRecord);

                // Show completion feedback for this item
                setLastCompletedItem({ name: item.name, qty: qtyToRecord });
                setLastCompletedStatus(statusToRecord);

                // Update local state to reflect change immediately (Using sorted index is fine for UI, but DB needs original)
                const updatedJob = { ...selectedJob };
                updatedJob.lineItems = [...selectedJob.lineItems]; // Shallow copy array
                updatedJob.lineItems[itemIndex] = { ...item, status: statusToRecord, pickedQty: qtyToRecord };
                setSelectedJob(updatedJob);

                // Check if job is truly complete-ALL items must be processed
                const allItemsProcessed = updatedJob.lineItems.every(i =>
                    i.status === 'Picked' || i.status === 'Short' || i.status === 'Discontinued'
                );

                if (allItemsProcessed) {
                    console.log(`✅ Job ${selectedJob.jobNumber || selectedJob.id} -All items processed, completing job`);
                    const result = await completeJob(selectedJob.id, user?.name || 'Worker', true); // skipValidation=true since we already verified

                    if (result && result.points > 0) {
                        setEarnedPoints({
                            points: result.points,
                            message: `Job Complete!`,
                            bonuses: result.breakdown
                        });
                        setShowPointsPopup(true);
                        playBeep('success'); // Reinforce success
                    }

                    // Find next pending job of the same type
                    const nextJob = filteredJobs.find(j =>
                        j.id !== selectedJob.id &&
                        j.type === selectedJob.type &&
                        j.status !== 'Completed'
                    );

                    if (nextJob) {
                        // Automatically start next job
                        addNotification('success', t('warehouse.jobCompleteStartingNext').replace('{id}', selectedJob.id));
                        setSelectedJob(nextJob);
                        setScannerStep('NAV');
                        setScannedBin('');
                        setScannedItem('');
                    } else {
                        // No more jobs, close scanner
                        addNotification('success', t('warehouse.jobCompleteAllDone').replace('{id}', selectedJob.id).replace('{type}', selectedJob.type));
                        setIsScannerMode(false);
                        setSelectedJob(null);
                    }
                    setLastCompletedItem(null);
                } else {
                    // Clear completion feedback after short delay to show next item
                    setTimeout(() => {
                        setLastCompletedItem(null);
                    }, 1200);
                    setScannerStep(settings.binScan ? 'NAV' : 'SCAN');
                    setScannedBin('');
                }
            }
        } finally {
            setIsProcessingScan(false);
            setIsSubmitting(false);
        }
    };



    // --- RENDERERS ---

    const ScannerInterface = () => {
        if (!selectedJob) return null;
        // Use parent-level state instead of local useState to prevent hook violations
        const showList = showScannerList;
        const setShowList = setShowScannerList;
        const currentItem = selectedJob.lineItems.find(i => i.status === 'Pending');

        // Check if this is a cross-warehouse order (destination different from source)
        const isCrossWarehouse = selectedJob.destSiteId && selectedJob.sourceSiteId &&
            selectedJob.destSiteId !== selectedJob.sourceSiteId;
        const destSite = sites.find(s => s.id === selectedJob.destSiteId);
        const sourceSite = sites.find(s => s.id === selectedJob.sourceSiteId);

        // If no pending items but job not closed, show completion screen with shipping info
        if (!currentItem && !showList) return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('warehouse.jobComplete')}</h2>
                <p className="text-gray-400 mb-4">{t('warehouse.allItemsProcessed')}</p>

                {/* Destination/Shipping Info for Cross-Warehouse */}
                {isCrossWarehouse && destSite && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <Truck className="text-blue-400" size={24} />
                            <h3 className="font-bold text-blue-400 text-lg">{t('warehouse.shippingRequired')}</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">{t('warehouse.from')}:</span>
                                <span className="font-bold text-white">{sourceSite?.name || t('warehouse.thisWarehouse')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Ship To:</span>
                                <span className="font-bold text-green-400">{destSite.name}</span>
                            </div>
                            {destSite.address && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Address:</span>
                                    <span className="text-white text-right max-w-[200px]">{destSite.address}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-gray-500">
                                    📦 Pack these items and prepare for dispatch to {destSite.name}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local fulfillment message */}
                {!isCrossWarehouse && destSite && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 max-w-md w-full text-center">
                        <p className="text-green-400 text-sm">
                            ✓ Local fulfillment at {destSite.name}
                        </p>
                    </div>
                )}

                <button onClick={() => setIsScannerMode(false)} className="px-6 py-3 bg-gray-800 rounded-xl border border-gray-700 hover:bg-gray-700 transition-colors">
                    {t('warehouse.closeScanner')}
                </button>
            </div>
        );

        const product = currentItem ? filteredProducts.find(p => p.id === currentItem.productId) : null;
        const expiry = product ? getExpiryStatus(product.expiryDate) : { color: '', label: '' };

        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                {/* Header */}
                <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] bg-gray-900 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-800">
                    <div className="text-white w-full md:w-auto">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-lg">{selectedJob.type} {formatJobId(selectedJob)}</h2>
                                <p className="text-xs text-gray-400">{selectedJob.lineItems.length} {t('warehouse.items')} • {selectedJob.lineItems.filter(i => i.status === 'Pending').length} {t('warehouse.remaining')}</p>
                            </div>
                            {/* Mobile Exit Button */}
                            <button onClick={() => setIsScannerMode(false)} className="md:hidden text-gray-400 p-2" aria-label="Close scanner">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Store Information */}
                        {(selectedJob.sourceSiteId || selectedJob.destSiteId) && (
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px]">
                                {selectedJob.sourceSiteId && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">{t('warehouse.from')}:</span>
                                        <span className="text-blue-400 font-bold">
                                            {sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId}
                                        </span>
                                    </div>
                                )}
                                {selectedJob.destSiteId && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">{t('warehouse.to')}:</span>
                                        <span className="text-green-400 font-bold">
                                            {sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
                        <button onClick={() => setShowList(!showList)} className="flex-1 md:flex-none py-3 md:py-0 text-center bg-gray-800 md:bg-transparent rounded-lg md:rounded-none text-blue-400 font-bold text-sm border border-gray-700 md:border-none">
                            {showList ? t('warehouse.scanView') : t('warehouse.viewList')}
                        </button>
                        <button onClick={() => setIsScannerMode(false)} className="hidden md:block text-red-400 font-bold text-sm">{t('warehouse.exit')}</button>
                    </div>
                </div>

                {/* Cross-Warehouse Destination Banner */}
                {isCrossWarehouse && destSite && (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-blue-500/30 px-4 py-2 flex items-center justify-center gap-3">
                        <Truck size={16} className="text-blue-400" />
                        <span className="text-xs font-medium text-white">
                            📦 Ship to: <span className="text-green-400 font-bold">{destSite.name}</span>
                        </span>
                        {destSite.address && (
                            <span className="text-xs text-gray-400">• {destSite.address}</span>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center overflow-hidden relative">

                    {/* Item Completion Overlay */}
                    {lastCompletedItem && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="text-center animate-in zoom-in-95 duration-300">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse">
                                    <CheckCircle size={48} className="text-white" />
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${lastCompletedStatus === 'Discontinued' ? 'text-purple-400' : 'text-white'}`}>
                                    {lastCompletedStatus === 'Discontinued' ? t('warehouse.archived') : t('warehouse.picked')}
                                </h3>
                                <p className={`${lastCompletedStatus === 'Discontinued' ? 'text-purple-300' : 'text-green-400'} font-bold text-lg mb-1`}>{lastCompletedItem.qty}x {lastCompletedItem.name}</p>
                                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
                                    <span className="text-sm">
                                        {selectedJob.lineItems.filter(i => i.status === 'Picked' || i.status === 'Short' || i.status === 'Discontinued').length} / {selectedJob.lineItems.length} items
                                    </span>
                                </div>
                                <div className="mt-2 w-48 mx-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${lastCompletedStatus === 'Discontinued' ? 'from-purple-500 to-indigo-400' : 'from-green-500 to-emerald-400'} rounded-full transition-all duration-500 w-[${Math.round((selectedJob.lineItems.filter(i => i.status === 'Picked' || i.status === 'Short' || i.status === 'Discontinued').length / selectedJob.lineItems.length) * 100)}%]`}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 animate-pulse">{t('warehouse.loadingNextItem')}</p>
                            </div>
                        </div>
                    )}

                    {showList ? (
                        <div className="w-full h-full max-w-md overflow-y-auto space-y-3 relative">
                            {/* Scanner Sort Controls */}
                            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur pb-2">
                                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
                                    {[
                                        { id: 'bin', label: 'Bin Path' },
                                        { id: 'name', label: 'Name' },
                                        { id: 'status', label: 'Status' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => applyScannerSort(opt.id as any)}
                                            className={`flex-1 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${scannerSortBy === opt.id
                                                ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                } `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <Pagination
                                    currentPage={receiveCurrentPage}
                                    totalPages={receiveOrdersTotalPages}
                                    totalItems={filteredReceiveOrders.length}
                                    itemsPerPage={RECEIVE_ITEMS_PER_PAGE}
                                    onPageChange={setReceiveCurrentPage}
                                    itemName="orders"
                                />
                            </div>
                            {['admin', 'manager', 'super_admin'].includes(user?.role || '') && selectedJob.type === 'PICK' && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="ghost"
                                        onClick={async () => {
                                            if (!selectedJob || isProcessingScan) return;
                                            setIsProcessingScan(true);
                                            try {
                                                // Deduct stock for each item
                                                for (const item of selectedJob.lineItems) {
                                                    if (item.productId && item.status === 'Pending') {
                                                        try {
                                                            await adjustStock(
                                                                item.productId,
                                                                item.expectedQty,
                                                                'OUT',
                                                                `PICK for Order ${selectedJob.orderRef || selectedJob.id}`,
                                                                user?.name || 'Admin'
                                                            );
                                                        } catch (error) {
                                                            console.error('Failed to deduct stock for:', item.name, error);
                                                        }
                                                    }
                                                }

                                                // Mark all items as Picked
                                                const updatedItems: JobItem[] = (selectedJob.lineItems || []).map(item => ({
                                                    ...item,
                                                    status: 'Picked',
                                                    pickedQty: item.expectedQty
                                                }));

                                                const updatedJob = { ...selectedJob, lineItems: updatedItems };
                                                setSelectedJob(updatedJob);

                                                addNotification('success', 'All items picked and stock deducted!');

                                                // Complete the job
                                                const result = await completeJob(selectedJob.id, user?.name || 'Worker');

                                                if (result && result.points > 0) {
                                                    setEarnedPoints({
                                                        points: result.points,
                                                        message: `Admin Pick Complete!`,
                                                        bonuses: result.breakdown
                                                    });
                                                    setShowPointsPopup(true);
                                                }

                                                // Close list to show completion screen
                                                setShowList(false);
                                            } finally {
                                                setIsProcessingScan(false);
                                            }
                                        }}
                                        icon={<CheckCircle size={14} />}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-cyber-primary transition-colors mb-2"
                                    >
                                        {t('warehouse.pickAllAdmin')}
                                    </Button>
                                </div>
                            )}
                            {selectedJob.lineItems.map((item, idx) => {
                                const itemProduct = filteredProducts.find(p => p.id === item.productId);
                                return (
                                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${item.status === 'Pending' ? 'bg-white/5 border-white/10' :
                                        item.status === 'Short' ? 'bg-red-900/20 border-red-500/50' :
                                            item.status === 'Discontinued' ? 'bg-gray-900/40 border-purple-500/30 opacity-70 grayscale-[0.3]' :
                                                'bg-green-900/20 border-green-500/50'
                                        } `}>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-white font-bold truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400">{t('warehouse.sku')}: {item.sku || t('warehouse.nA')}</p>
                                            {/* Show location for PICK jobs */}
                                            {selectedJob.type === 'PICK' && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">📍</span>
                                                    <span className={`text-xs font-mono font-bold ${itemProduct?.location ? 'text-blue-400' : 'text-yellow-500'} `}>
                                                        {itemProduct?.location || 'No Location'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${item.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                item.status === 'Short' ? 'bg-red-500/10 text-red-400' :
                                                    item.status === 'Discontinued' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                        'bg-green-500/10 text-green-400'
                                                } `}>
                                                {item.status === 'Discontinued' && <Archive size={10} />}
                                                {item.status === 'Pending' ? t('warehouse.pending') :
                                                    item.status === 'Short' ? t('warehouse.short') :
                                                        item.status === 'Discontinued' ? t('warehouse.archived') :
                                                            t('warehouse.picked')}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">{item.pickedQty || 0}/{item.expectedQty}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // SCANNER VIEW
                        <>
                            {/* Step 1: Location Input (Simplified & Robust) */}
                            {scannerStep === 'NAV' && currentItem && (
                                <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-lg shadow-blue-500/10">
                                            <MapPin size={40} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">
                                                {selectedJob.type === 'PUTAWAY' ? t('warehouse.selectStorage') : t('warehouse.locateItem')}
                                            </h1>
                                            <p className="text-gray-400 text-lg">
                                                Scan Location or Type: <span className="text-blue-400 font-mono font-bold">A-Z-B</span> (e.g. 1-A-1)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Simplified Location Input Container */}
                                    <div className="bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                        <div className="relative space-y-8">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyber-primary transition-colors duration-300">
                                                    <Scan size={32} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="1-A-1"
                                                    value={locationSearch}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase();
                                                        setLocationSearch(val);

                                                        // Auto-parse on valid pattern (e.g. 1-A-1 to 20-Z-20)
                                                        const match = val.match(/^(\d{1,2})-([A-Z])-(\d{1,2})$/);
                                                        if (match) {
                                                            const aisleNum = parseInt(match[1]);
                                                            const zoneLetter = match[2];
                                                            const binNum = parseInt(match[3]);

                                                            if (aisleNum >= 1 && aisleNum <= 20 && binNum >= 1 && binNum <= 20) {
                                                                // Debounced auto-submit for smooth UX
                                                                const loc = generateLocation(zoneLetter, String(aisleNum), String(binNum));
                                                                setTimeout(() => {
                                                                    if (locationSearch === val) {
                                                                        handleLocationSelect(loc);
                                                                        setLocationSearch('');
                                                                    }
                                                                }, 400);
                                                            }
                                                        }
                                                    }}
                                                    className="w-full bg-black/60 border-2 border-white/10 rounded-3xl py-8 pl-16 pr-8 text-4xl font-mono text-white placeholder:text-gray-800 focus:border-cyber-primary focus:outline-none focus:ring-8 focus:ring-cyber-primary/10 transition-all text-center tracking-[0.2em] shadow-inner"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && locationSearch) {
                                                            e.preventDefault();
                                                            const match = locationSearch.match(/^(\d{1,2})-([A-Z])-(\d{1,2})$/);
                                                            if (match) {
                                                                const aisleNum = parseInt(match[1]);
                                                                const zoneLetter = match[2];
                                                                const binNum = parseInt(match[3]);
                                                                if (aisleNum >= 1 && aisleNum <= 20 && binNum >= 1 && binNum <= 20) {
                                                                    handleLocationSelect(generateLocation(zoneLetter, String(aisleNum), String(binNum)));
                                                                    setLocationSearch('');
                                                                } else {
                                                                    addNotification('alert', 'Aisle/Bin must be 1-20');
                                                                }
                                                            } else {
                                                                handleLocationSelect(locationSearch); // Fallback for raw legacy scans
                                                                setLocationSearch('');
                                                            }
                                                        }
                                                    }}
                                                    autoFocus
                                                    aria-label="Location Scanner Input"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => {
                                                        if (locationSearch) {
                                                            const match = locationSearch.match(/^(\d{1,2})-([A-Z])-(\d{1,2})$/);
                                                            if (match) {
                                                                handleLocationSelect(generateLocation(match[2], match[1], match[3]));
                                                            } else {
                                                                handleLocationSelect(locationSearch);
                                                            }
                                                            setLocationSearch('');
                                                        }
                                                    }}
                                                    className="py-6 bg-cyber-primary hover:bg-cyber-accent text-black font-black text-xl rounded-2xl transition-all uppercase tracking-widest shadow-xl shadow-cyber-primary/20 flex items-center justify-center gap-3"
                                                >
                                                    <CheckCircle size={24} strokeWidth={4} />
                                                    {t('common.confirm')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setQRScannerMode('location');
                                                        setIsQRScannerOpen(true);
                                                    }}
                                                    className="py-6 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 shadow-xl"
                                                >
                                                    <Camera size={24} />
                                                    Camera
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Critical Targets for Pickers */}
                                    {selectedJob.type === 'PICK' && product?.location && (
                                        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-2 border-blue-500/30 rounded-3xl p-8 text-center animate-pulse shadow-2xl">
                                            <p className="text-blue-400 font-black uppercase tracking-widest mb-2 text-sm">{t('warehouse.pickFromLocation')}</p>
                                            <p className="text-5xl font-mono text-white font-black tracking-tighter">{product.location}</p>
                                        </div>
                                    )}

                                    {/* Smart Recommendation (Minimalist) */}
                                    {selectedJob.type === 'PUTAWAY' && product?.location && (
                                        <div className="bg-green-600/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-center gap-3">
                                            <span className="text-green-400 font-bold">Recommended:</span>
                                            <button
                                                onClick={() => handleLocationSelect(product.location!)}
                                                className="font-mono text-white font-black hover:text-green-400 transition-colors"
                                            >
                                                {product.location}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Item Scan */}
                            {scannerStep === 'SCAN' && currentItem && (

                                <>
                                    <div className="text-center w-full max-w-md mx-auto space-y-6 pb-24 md:pb-0 px-4 md:px-0">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="relative inline-block shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-xl border-4 border-gray-800 bg-black/40 overflow-hidden flex items-center justify-center">
                                                {currentItem.image && !currentItem.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={currentItem.image}
                                                        className="w-full h-full object-cover"
                                                        alt={currentItem.name}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={48} className="text-gray-600" />
                                                )}
                                                {settings.fefoRotation && selectedJob.type === 'PICK' && (
                                                    <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full animate-pulse shadow-lg border-2 border-white text-xs md:text-base">
                                                        FEFO: PICK OLD
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h2 className="text-xl md:text-2xl font-bold text-white line-clamp-2">{currentItem.name}</h2>
                                                <div className="flex justify-center gap-4 mt-4">
                                                    <MetricBadge label={t('warehouse.qty')} value={currentItem.expectedQty} color="border-blue-500 text-blue-400 bg-blue-500" />
                                                    <MetricBadge label={t('warehouse.stock')} value={product?.stock || 0} color="border-gray-500 text-gray-400 bg-gray-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {settings.fefoRotation && product?.expiryDate && selectedJob.type === 'PICK' && (
                                            <div className={`p-4 rounded-xl border flex items-center justify-center gap-3 ${expiry.color === 'text-red-500' ? 'bg-red-900/20 border-red-500' : 'bg-gray-800 border-gray-700'} `}>
                                                <AlertTriangle size={24} className={expiry.color} />
                                                <div className="text-left">
                                                    <p className="text-xs text-gray-400 uppercase">{t('warehouse.checkExpiry')}</p>
                                                    <p className={`font-bold ${expiry.color} `}>{product.expiryDate} ({expiry.label})</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* PICK Job-Show item location */}
                                        {selectedJob.type === 'PICK' && product?.location && (
                                            <div className="p-4 rounded-xl bg-blue-900/30 border-2 border-blue-500 flex flex-col items-center animate-pulse">
                                                <p className="text-xs text-blue-400 uppercase font-bold mb-2">{t('warehouse.goToLocation')}</p>
                                                <p className="text-3xl text-white font-mono font-bold tracking-wider">{product.location}</p>
                                                <p className="text-xs text-gray-400 mt-2">{t('warehouse.pickItem').replace('{qty}', currentItem.expectedQty.toString()).replace('{name}', currentItem.name)}</p>
                                            </div>
                                        )}

                                        {/* PICK Job-No location assigned */}
                                        {selectedJob.type === 'PICK' && !product?.location && (
                                            <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/50 flex items-center justify-center gap-3">
                                                <AlertTriangle size={24} className="text-yellow-500" />
                                                <div className="text-left">
                                                    <p className="text-xs text-yellow-400 uppercase font-bold">{t('warehouse.noLocationAssigned')}</p>
                                                    <p className="text-gray-400 text-sm">{t('warehouse.checkInventoryRecords')}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedJob.type === 'PUTAWAY' && scannedBin && (
                                            <div className="p-4 rounded-xl bg-green-900/20 border border-green-500 flex flex-col items-center">
                                                <p className="text-xs text-green-400 uppercase font-bold mb-2">{t('warehouse.selectedStorageLocation')}</p>
                                                <p className="text-2xl text-white font-mono font-bold">{scannedBin}</p>
                                                {isLocationOccupied(scannedBin) && (
                                                    <p className="text-xs text-blue-400 mt-2">{t('warehouse.thisLocationHasItems')}</p>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setScannedBin('');
                                                        setScannerStep('NAV');
                                                    }}
                                                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    {t('warehouse.changeLocation')}
                                                </button>
                                            </div>
                                        )}

                                        {/* Barcode Scanner Input-Critical for Operations */}
                                        <div className="w-full space-y-3">
                                            <div className="bg-gray-900 rounded-xl border-2 border-cyber-primary/50 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Scan className="text-cyber-primary" size={20} />
                                                    <p className="text-xs text-cyber-primary uppercase font-bold">{t('warehouse.scanProductBarcode')}</p>
                                                </div>
                                                <div className="flex gap-2 min-w-0">
                                                    <input
                                                        type="text"
                                                        value={scannedItem}
                                                        className={`flex-1 bg-black/50 border-2 border-cyber-primary/30 rounded-lg p-4 text-white font-mono text-lg text-center focus:border-cyber-primary focus:outline-none focus:ring-2 focus:ring-cyber-primary/50 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : ''} `}
                                                        ref={itemInputRef}
                                                        onBlur={handleBlur}
                                                        autoFocus
                                                        disabled={isProcessingScan}
                                                        title={t('warehouse.scanProductBarcode')}
                                                        aria-label={t('warehouse.scanProductBarcode')}
                                                        onKeyDown={(e) => {
                                                            // Priority: Enter key (standard scanner terminology)
                                                            if (e.key === 'Enter' && scannedItem.trim()) {
                                                                e.preventDefault();
                                                                // Clear any pending debounce
                                                                if ((window as any).scanTimeout) clearTimeout((window as any).scanTimeout);

                                                                handleItemScan();
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setScannedItem(value);

                                                            // REMOVED: Aggressive auto-submit logic.
                                                            // Users reported "ghost picking". We now rely strictly on Enter key
                                                            // (sent by most scanners) or the manual Confirm button.
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setQRScannerMode('product');
                                                            setIsQRScannerOpen(true);
                                                        }}
                                                        className={`px-4 py-4 bg-blue-500 / 20 border-2 border-blue-500 / 30 text-blue-400 font-bold rounded-lg flex items-center gap-2 transition-colors ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/30'} `}
                                                        title={t('warehouse.scanProductWithCamera')}
                                                        disabled={isProcessingScan}
                                                    >
                                                        <Camera size={24} />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-500 text-center mt-2">
                                                    {t('warehouse.expected')}: <span className="font-bold text-cyber-primary">{currentItem?.sku || currentItem?.productId}</span>
                                                    <span className="text-blue-400 ml-2">• {t('warehouse.orUseCamera')}</span>
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    <button
                                        disabled={isProcessingScan || isSubmitting}
                                        onClick={() => {
                                            if (isProcessingScan || isSubmitting) return;
                                            if (selectedJob?.type === 'PUTAWAY') {
                                                const normalize = (s: string | undefined | null) => s?.trim().toUpperCase() || '';
                                                const input = normalize(scannedItem);
                                                const expectedSku = normalize(currentItem?.sku);
                                                const product = filteredProducts.find(p => p.id === currentItem?.productId);
                                                const expectedProductSku = normalize(product?.sku);

                                                if (!input) {
                                                    addNotification('alert', 'Please scan or enter the Product SKU');
                                                    return;
                                                }

                                                // Strict check: Input must match valid SKU
                                                const isValid = (input === expectedSku && expectedSku !== '') ||
                                                    (input === expectedProductSku && expectedProductSku !== '');

                                                if (!isValid) {
                                                    addNotification('alert', `Incorrect SKU.Expected: ${expectedSku || expectedProductSku} `);
                                                    setScannedItem('');
                                                    return;
                                                }
                                            }
                                            handleItemScan();
                                        }}
                                        className={`w-full py-6 bg-green-500 text-black font-bold text-xl rounded-2xl shadow-[0_0_30px_rgba(34, 197, 94, 0.4)] flex items-center justify-center gap-3 ${isProcessingScan || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400'} `}
                                    >
                                        {(isProcessingScan || isSubmitting) ? <RefreshCw size={28} className="animate-spin" /> : <Scan size={28} />}
                                        {(isProcessingScan || isSubmitting) ? t('warehouse.processing') : `${t('warehouse.confirm')} ${t('warehouse.tabs.' + (selectedJob.type?.toLowerCase() || 'pick'))} `}
                                    </button>

                                    {/* Exception Handling Controls */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                        <button
                                            disabled={isProcessingScan}
                                            onClick={() => {
                                                // SKIP LOGIC: Move current item to end of array
                                                if (!selectedJob) return;
                                                const items = [...selectedJob.lineItems];
                                                const currentIdx = items.findIndex(i => i.status === 'Pending');
                                                if (currentIdx > -1) {
                                                    const [skippedItem] = items.splice(currentIdx, 1);
                                                    items.push(skippedItem);
                                                    setSelectedJob({ ...selectedJob, lineItems: items });
                                                    addNotification('info', t('warehouse.itemSkipped'));
                                                }
                                            }}
                                            className={`py-4 bg-gray-800 text-white font-bold rounded-xl border border-gray-600 flex flex-col items-center justify-center gap-1 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'} `}
                                        >
                                            <ArrowRight size={20} className="text-yellow-400" />
                                            <span className="text-sm">{t('warehouse.skipItem')}</span>
                                        </button>

                                        <button
                                            disabled={isProcessingScan}
                                            onClick={() => {
                                                // SHORT PICK LOGIC-Open custom modal
                                                setShortPickMaxQty(currentItem.expectedQty);
                                                setShortPickQuantity('');
                                                setShortPickResolution('standard');
                                                setShowShortPickModal(true);
                                            }}
                                            className={`py-4 bg-red-900 / 30 text-red-400 font-bold rounded-xl border border-red-500 / 30 flex flex-col items-center justify-center gap-1 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-900/50'} `}
                                        >
                                            <AlertTriangle size={20} />
                                            <span className="text-sm">{t('warehouse.shortPick')}</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    // 🚚 DRIVER INTERFACE-Phase 5
    // Simplified view for drivers showing only their assigned jobs
    if (user?.role === 'driver') {
        const myJobs = filteredJobs.filter(j => j.assignedTo === user.name || j.assignedTo === user.id);

        return (
            <Protected permission="ACCESS_WAREHOUSE" showMessage>
                <div className="h-full flex flex-col gap-6">
                    <div className="flex items-center justify-between bg-cyber-gray p-4 rounded-xl border border-white/5">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Truck className="text-cyber-primary" />
                                {t('warehouse.driverDashboard')}
                            </h2>
                            <p className="text-sm text-gray-400">{t('warehouse.activeDeliveries')}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-mono font-bold text-white">{myJobs.length}</div>
                            <div className="text-xs text-gray-500 uppercase">{t('warehouse.assignedJobs')}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20">
                        {myJobs.map(job => (
                            <div key={job.id} className="bg-cyber-gray border border-white/5 rounded-xl p-5 hover:border-cyber-primary/50 transition-colors group relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${job.status === 'Completed' ? 'bg-green-500' :
                                    job.status === 'In-Progress' ? 'bg-blue-500' : 'bg-yellow-500'
                                    } `} />

                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <span className="font-mono text-lg font-bold text-white">{formatJobId(job)}</span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                        job.status === 'In-Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                                        } `}>{job.status}</span>
                                </div>

                                <div className="space-y-2 pl-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Box size={14} className="text-cyber-primary" />
                                        <span>{job.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Map size={14} className="text-cyber-primary" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <FileText size={14} className="text-cyber-primary" />
                                        <span>{t('warehouse.reference')}: {formatOrderRef(job.orderRef, job.id)}</span>
                                    </div>
                                </div>

                                <ProtectedButton
                                    permission="COMPLETE_TASKS"
                                    onClick={() => {
                                        setSelectedJob(job);
                                        setIsDetailsOpen(true);
                                        // Logic to open job details/completion modal would go here
                                        // For now we reuse the existing selection state which might trigger other UI elements
                                        // Ideally we'd have a specific driver modal
                                    }}
                                    className="w-full py-2 bg-white/5 hover:bg-cyber-primary hover:text-black text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {t('warehouse.viewDetails')} <ArrowRight size={14} />
                                </ProtectedButton>
                            </div>
                        ))}

                        {myJobs.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                                <Truck size={64} className="mb-4" />
                                <p className="text-lg font-bold">{t('warehouse.noActiveDeliveries')}</p>
                                <p className="text-sm">{t('warehouse.allCaughtUp')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Protected>
        );
    }

    // 🔒 SITE SELECTION REMOVED: User requested to delete the "Select a Location" page.
    // If we are in Global View, we simply fall through to the main UI.
    // Filter logic below handles what data is shown.




    return (
        <Protected permission="ACCESS_WAREHOUSE" showMessage>
            <div className="h-full flex flex-col gap-4 md:gap-6 p-2 md:p-0">
                {isScannerMode && <ScannerInterface />}

                {/* Header Tabs */}
                {/* Header Tabs-Scrollable on Mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 bg-cyber-gray md:bg-transparent rounded-none md:rounded-xl shrink-0 no-scrollbar touch-pan-x">
                    <div className="flex gap-2 min-w-max">
                        {visibleTabs.map((tab) => {
                            // Check for discrepancies in TRANSFER tab
                            const hasTransferDiscrepancies = tab === 'TRANSFER' && filteredJobs
                                .filter(j => j.type === 'TRANSFER')
                                .some(j => (j.lineItems || []).some((item: any) =>
                                    item.receivedQty !== undefined && item.receivedQty !== item.expectedQty &&
                                    !['Resolved', 'Completed'].includes(item.status)
                                ));
                            const discrepancyCount = tab === 'TRANSFER'
                                ? filteredJobs.filter(j => j.type === 'TRANSFER' &&
                                    (j.lineItems || []).some((item: any) =>
                                        item.receivedQty !== undefined && item.receivedQty !== item.expectedQty &&
                                        !['Resolved', 'Completed'].includes(item.status)
                                    )).length
                                : 0;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as OpTab)}
                                    className={`px-4 py-3 md:py-2 rounded-lg text-sm md:text-xs font-bold transition-all whitespace-nowrap min-h-[44px] md:min-h-0 select-none relative ${activeTab === tab
                                        ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                                        : hasTransferDiscrepancies
                                            ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
                                            : 'text-gray-400 hover:bg-white/5'
                                        } `}
                                >
                                    {t(`warehouse.tabs.${tab.toLowerCase()}`)}
                                    {hasTransferDiscrepancies && (
                                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-white text-[10px] text-red-600 rounded-full font-black min-w-[18px] text-center border border-red-500">
                                            {discrepancyCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Worker Points Widget */}
                    <div className="hidden md:flex items-center gap-3 pl-2">
                    </div>

                    {/* Points Earned Popup */}
                    {showPointsPopup && (
                        <PointsEarnedPopup
                            points={earnedPoints.points}
                            message={earnedPoints.message}
                            bonuses={earnedPoints.bonuses}
                            onClose={() => setShowPointsPopup(false)}
                        />
                    )}

                </div>

                {/* --- DOCKS TAB --- */}
                {activeTab === 'DOCKS' && (
                    <div className="flex flex-col h-full gap-6">
                        {/* TERMINAL CONTROL SUB-NAV */}
                        <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl w-fit border border-white/10 mx-4 md:mx-0 shadow-xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-all opacity-50" />
                            {['INBOUND', 'OUTBOUND'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setDockTab(tab as any)}
                                    className={`relative z-10 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${dockTab === tab
                                        ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                        } `}
                                >
                                    <div className="flex items-center gap-3">
                                        {tab === 'INBOUND' ? <Download size={14} /> : <Upload size={14} />}
                                        <span>{tab === 'INBOUND' ? t('warehouse.docks.incoming') : t('warehouse.docks.outgoing')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {dockTab === 'INBOUND' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto md:overflow-hidden pr-2 custom-scrollbar">
                                {/* DOCK TERMINAL MAP */}
                                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                                <div className="p-2 bg-blue-600/20 rounded-xl">
                                                    <Download className="text-blue-400" size={20} />
                                                </div>
                                                {t('warehouse.docks.inboundTitle')}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Live Terminal Telemetry Active
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                                        {Object.entries(dockStatus).filter(([k]) => k.startsWith('D')).map(([dock, data]) => {
                                            const status = data.status;
                                            const isSelectedForAssignment = selectedQueueVessel && status === 'Empty';

                                            return (
                                                <div
                                                    key={dock}
                                                    onClick={() => {
                                                        if (isSelectedForAssignment) {
                                                            assignVesselToDock(dock, selectedQueueVessel);
                                                        } else if (status !== 'Empty') {
                                                            setSelectedDockId(dock);
                                                        }
                                                    }}
                                                    className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center gap-4 relative group cursor-pointer transition-all duration-500 hover:scale-[1.02] active: scale-95 shadow-2xl ${status === 'Empty' ? (isSelectedForAssignment ? 'border-blue-500 animate-pulse bg-blue-500/10' : 'border-green-500/20 bg-green-500/5 shadow-green-500/5') :
                                                        status === 'Occupied' ? 'border-red-500/20 bg-red-500/5 shadow-red-500/5' :
                                                            'border-orange-500/20 bg-orange-500/5 shadow-orange-500/5'
                                                        } `}
                                                >
                                                    {/* Ambient Status Glow */}
                                                    <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full ${status === 'Empty' ? 'bg-green-500' :
                                                        status === 'Occupied' ? 'bg-red-500' :
                                                            'bg-orange-500'
                                                        } `} />

                                                    <span className="absolute top-4 left-5 font-black text-white/20 text-xl tracking-tighter">{dock}</span>

                                                    <div className="relative">
                                                        {status === 'Occupied' ? (
                                                            <div className="relative">
                                                                <Truck size={48} className="text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.4)]" />
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-ping" />
                                                            </div>
                                                        ) : status === 'Empty' ? (
                                                            <div className={`w-16 h-16 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${isSelectedForAssignment ? 'border-blue-500/50 bg-blue-500/10 rotate-45 scale-110' : 'border-green-500/10'} `}>
                                                                {isSelectedForAssignment && <Plus size={24} className="text-blue-400 -rotate-45" />}
                                                            </div>
                                                        ) : (
                                                            <AlertTriangle size={48} className="text-orange-400" />
                                                        )}
                                                    </div>

                                                    <div className="text-center">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status === 'Empty' ? (isSelectedForAssignment ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20') :
                                                            status === 'Occupied' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                                                'text-orange-400 bg-orange-500/10 border-orange-500/20'
                                                            } `}>
                                                            {isSelectedForAssignment ? 'Select Dock' : status === 'Empty' ? t('warehouse.docks.empty') : status === 'Occupied' ? t('warehouse.docks.occupied') : t('warehouse.docks.maintenance')}
                                                        </span>
                                                        {status === 'Occupied' && data.vesselName && (
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mt-2 tracking-tighter max-w-[80px] truncate">{data.vesselName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <button className="aspect-square rounded-3xl border-2 border-dashed border-white/5 bg-white/2 flex flex-col items-center justify-center gap-3 group hover:border-blue-500/30 hover:bg-blue-600/5 transition-all">
                                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-600/20 transition-all">
                                                <Plus size={24} className="text-gray-600 group-hover:text-blue-400" />
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('warehouse.docks.newShipment') || 'Expand Bay'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* INBOUND LOGISTICS QUEUE */}
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-2xl relative overflow-hidden">
                                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full" />

                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                                            {t('warehouse.docks.inboundQueue')}
                                            <span className="h-1 w-1 rounded-full bg-gray-600" />
                                            <span className="text-blue-400 font-mono">{inboundQueue.length.toString().padStart(2, '0')}</span>
                                        </h3>
                                        <div className="px-2 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{t('warehouse.sortingHigh')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-4 relative z-10 custom-scrollbar pr-2">
                                        {inboundQueue.map(vessel => (
                                            <div key={vessel.id} className={`group p-5 bg-black/40 rounded-3xl border transition-all duration-500 relative overflow-hidden shadow-lg ${selectedQueueVessel?.id === vessel.id ? 'border-blue-500 shadow-blue-500/20 bg-blue-500/5' : 'border-white/5 hover:border-blue-500/30'} `}>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-black text-white uppercase tracking-widest">{vessel.vesselName}</p>
                                                            {vessel.priority === 'High' && <div className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] font-black rounded border border-yellow-500/20">{t('warehouse.priority')}</div>}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">
                                                            Origin: {vessel.origin}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-600/10 px-2 py-1 rounded-lg">ETA {vessel.eta}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedQueueVessel(selectedQueueVessel?.id === vessel.id ? null : vessel)}
                                                    className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active: scale-[0.98] border ${selectedQueueVessel?.id === vessel.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-600/20'} `}
                                                >
                                                    {selectedQueueVessel?.id === vessel.id ? 'Cancel Selection' : t('warehouse.docks.assignDock')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {dockTab === 'OUTBOUND' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto md:overflow-hidden pr-2 custom-scrollbar">
                                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                                    <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-purple-600/20 rounded-xl">
                                            <Upload className="text-purple-400" size={20} />
                                        </div>
                                        {t('warehouse.docks.outboundTitle')}
                                    </h3>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
                                        {Object.entries(dockStatus).filter(([k]) => ['D3', 'D4'].includes(k)).map(([dock, data]) => {
                                            const status = data.status;
                                            return (
                                                <div key={dock} className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center gap-4 relative group cursor-pointer transition-all duration-500 hover:scale-[1.02] active: scale-95 shadow-2xl ${status === 'Empty' ? 'border-green-500/20 bg-green-500/5 shadow-green-500/5' :
                                                    status === 'Occupied' ? 'border-purple-500/20 bg-purple-500/5 shadow-purple-500/5' :
                                                        'border-orange-500/20 bg-orange-500/5 shadow-orange-500/5'
                                                    } `}>
                                                    <span className="absolute top-4 left-5 font-black text-white/20 text-xl tracking-tighter">{dock}</span>

                                                    <div className="relative">
                                                        {status === 'Occupied' ? (
                                                            <div className="relative">
                                                                <Truck size={48} className="text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.4)]" />
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-black animate-ping" />
                                                            </div>
                                                        ) : status === 'Empty' ? (
                                                            <div className="w-16 h-16 rounded-3xl border-2 border-green-500/10 border-dashed flex items-center justify-center" />
                                                        ) : (
                                                            <AlertTriangle size={48} className="text-orange-400" />
                                                        )}
                                                    </div>

                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status === 'Empty' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                        status === 'Occupied' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                                            'text-orange-400 bg-orange-500/10 border-orange-500/20'
                                                        } `}>
                                                        {status === 'Empty' ? t('warehouse.docks.empty') : 'Loading'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="relative z-10">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                                            <Package size={16} className="text-orange-500" />
                                            {t('warehouse.docks.stagingArea')}
                                        </h4>
                                        <div className="bg-black/30 rounded-[2rem] p-6 border border-white/5 shadow-inner">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer shadow-lg">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                                                <Package size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-white uppercase tracking-widest">Shipment #202{i}</p>
                                                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Dest: {t('common.activeSite')?.split(': ')[1] || 'Regional Hub'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-400 font-mono font-bold tracking-tighter">24 Units</p>
                                                            <p className="text-[9px] text-green-400 font-black tracking-widest uppercase mt-1">{t('warehouse.readyForDispatch')}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-2xl relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-sm font-black text-white tracking-widest uppercase">{t('warehouse.docks.outboundSchedule')}</h3>
                                        <button className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-600/20">
                                            <Plus size={14} /> {t('warehouse.docks.newShipment')}
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                        <div className="p-6 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] bg-purple-600/20 text-purple-400 px-3 py-1 rounded-lg font-black uppercase tracking-widest border border-purple-600/20">14:00 PM</span>
                                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('warehouse.pendingSync')}</span>
                                            </div>
                                            <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Weekly Supply-Chain Ops</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Unit: Heavy-Lifter T-1000</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- DRIVER TAB --- */}
                {/* --- DRIVER TAB --- */}
                {activeTab === 'DRIVER' && (
                    <div className="flex-1 overflow-hidden flex flex-col space-y-6">
                        {/* DRIVER HUB CONTROL */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                            {/* Animated Background Gradients */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 rounded-full animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] -ml-24 -mb-24 rounded-full" />

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                        <Truck className="text-cyan-400" size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Driver Command</h3>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-xs text-gray-500 font-black uppercase tracking-widest">{t('warehouse.docks.welcome')?.replace('{name}', user?.name || 'Driver') || `Welcome, ${user?.name || 'Driver'} `}</p>
                                            <div className="h-3 w-px bg-white/10" />
                                            {(() => {
                                                const currentEmployee = employees.find(e => e.email === user?.email);
                                                const driverType = currentEmployee?.driverType || 'internal';
                                                return (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${driverType === 'internal' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        driverType === 'subcontracted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        } `}>
                                                        {driverType === 'internal' ? 'Internal Fleet' : driverType === 'subcontracted' ? 'Contractor' : 'Partner'}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-4">
                                        <div className="text-right border-r border-white/10 pr-4">
                                            <p className="text-sm font-black text-white font-mono">{formatDateTime(new Date(), { showTime: true })}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{activeSite?.name || 'Global'}</p>
                                        </div>
                                        <button
                                            onClick={() => refreshData()}
                                            disabled={isSubmitting}
                                            title="Refresh Hub"
                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-cyan-400 transition-all hover:scale-110 active:scale-95 group"
                                        >
                                            <RefreshCw size={18} className={`${isSubmitting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} `} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MAIN OPERATIONAL GRID */}
                        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT COLUMN: MISSION QUEUE */}
                            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar">

                                {/* ACTIVE MISSIONS */}
                                {(() => {
                                    const currentEmployee = employees.find(e => e.email === user?.email);
                                    const myJobs = filteredJobs.filter(j =>
                                        j.type === 'DISPATCH' &&
                                        j.assignedTo === currentEmployee?.id &&
                                        j.status !== 'Completed'
                                    );

                                    if (myJobs.length === 0) return null;

                                    return (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                                    {t('warehouse.docks.currentMission') || 'Current Mission'}
                                                    <span className="text-cyan-500/50">[{myJobs.length}]</span>
                                                </h4>
                                            </div>

                                            <div className="space-y-4">
                                                {myJobs.map((job, idx) => {
                                                    const destSite = sites.find(s => s.id === job.destSiteId);
                                                    const isPending = job.status === 'Pending';
                                                    const isFirst = idx === 0 && !isPending;

                                                    return (
                                                        <div
                                                            key={job.id}
                                                            onClick={() => {
                                                                setSelectedJob(job);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className={`group relative rounded-3xl transition-all duration-300 overflow-hidden border ${isPending
                                                                ? 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'
                                                                : isFirst
                                                                    ? 'bg-gradient-to-br from-cyan-900/20 via-black to-black border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
                                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                                } `}
                                                        >
                                                            {isFirst && (
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] -mr-16 -mt-16 rounded-full" />
                                                            )}

                                                            <div className="p-6 relative z-10">
                                                                <div className="flex justify-between items-start mb-6">
                                                                    <div>
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isPending ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'} `}>
                                                                                {isPending ? 'Pending Approval' : isFirst ? 'Live Route' : `Queued Job ${idx + 1} `}
                                                                            </span>
                                                                            <span className="text-[10px] font-mono text-gray-600 font-bold">{formatJobId(job)}</span>
                                                                        </div>
                                                                        <h3 className={`font-black tracking-tight ${isFirst ? 'text-3xl text-white' : 'text-xl text-gray-300'} `}>
                                                                            {destSite?.name || 'Unknown Destination'}
                                                                        </h3>
                                                                        <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                                                            <MapPin size={12} className="text-cyan-500" />
                                                                            <span>{destSite?.address || 'Location Coordinates Encrypted'}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-right">
                                                                        <p className="text-2xl font-black text-white tracking-tighter">{job.items || job.lineItems?.length || 0}</p>
                                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Payload Items</p>
                                                                    </div>
                                                                </div>

                                                                {!isPending && (
                                                                    <div className="flex gap-3">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (destSite?.address) {
                                                                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank');
                                                                                } else {
                                                                                    addNotification('info', 'Address Coordinates Encrypted. Using manual navigation.');
                                                                                }
                                                                            }}
                                                                            title="Activate GPS Navigation"
                                                                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group/btn" >
                                                                            <Navigation size={16} className="text-cyan-400 group-hover/btn:scale-125 transition-transform" />
                                                                            Activate GPS
                                                                        </button >
                                                                        <button
                                                                            disabled={processingJobIds.has(job.id)}
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                                                try {
                                                                                    await wmsJobsService.update(job.id, {
                                                                                        status: 'Completed',
                                                                                        transferStatus: 'Delivered'
                                                                                    });
                                                                                    await refreshData();
                                                                                    addNotification('success', `Mission Successful. Delivered to ${destSite?.name}.`);
                                                                                } catch (err) {
                                                                                    addNotification('alert', 'Transmission Interrupted. Failed to log delivery.');
                                                                                } finally {
                                                                                    setProcessingJobIds(prev => {
                                                                                        const next = new Set(prev);
                                                                                        next.delete(job.id);
                                                                                        return next;
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="flex-1 py-4 bg-cyan-500 text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                                                                        >
                                                                            {processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                                                            {processingJobIds.has(job.id) ? 'LOGGING...' : 'Finalize Drop'}
                                                                        </button>
                                                                    </div >
                                                                )}

                                                                {
                                                                    isPending && (
                                                                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] animate-pulse">Scanning for Dispatch Authentication...</p>
                                                                        </div>
                                                                    )
                                                                }
                                                            </div >
                                                        </div >
                                                    );
                                                })}
                                            </div >
                                        </div >
                                    );
                                })()}

                                {/* AVAILABLE DISPATCH INTAKE */}
                                {
                                    (() => {
                                        const currentEmployee = employees.find(e => e.email === user?.email);
                                        const isInternal = !currentEmployee?.driverType || currentEmployee?.driverType === 'internal';

                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                        Intake Marketplace
                                                        <span className="text-yellow-500/50">[{filteredDispatchJobs.length}]</span>
                                                    </h4>
                                                    {!isInternal && (
                                                        <span className="text-[9px] text-orange-400 font-black uppercase tracking-widest px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                                            Auth Required
                                                        </span>
                                                    )}
                                                </div>

                                                {filteredDispatchJobs.length === 0 ? (
                                                    <div className="bg-black/20 rounded-3xl p-10 border border-white/5 text-center">
                                                        <Shield size={40} className="text-gray-800 mx-auto mb-4" />
                                                        <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">No Active Dispatch Requests</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {paginatedDispatchJobs.map(job => {
                                                                const dest = sites.find(s => s.id === job.destSiteId);
                                                                const source = sites.find(s => s.id === job.sourceSiteId || s.id === job.siteId);

                                                                return (
                                                                    <div
                                                                        key={job.id}
                                                                        onClick={() => {
                                                                            setSelectedJob(job);
                                                                            setIsDetailsOpen(true);
                                                                        }}
                                                                        className="bg-white/5 border border-white/10 rounded-[28px] p-5 hover:border-yellow-500/30 transition-all group relative overflow-hidden flex flex-col h-full"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <div>
                                                                                <p className="text-[9px] font-mono text-gray-500 font-bold mb-1">{formatJobId(job)}</p>
                                                                                <h5 className="font-black text-white text-lg leading-tight truncate w-full max-w-[150px]">{dest?.name || 'Direct Delivery'}</h5>
                                                                            </div>
                                                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${job.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                                job.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                                                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                                                }`}>
                                                                                {job.priority}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex-1 space-y-3 mb-6">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                                                                    <div className="w-px h-3 bg-white/5" />
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <p className="text-[9px] text-gray-600 font-bold uppercase">{source?.name || 'Logistics Hub'}</p>
                                                                                    <p className="text-[10px] text-white font-bold">{dest?.name || 'Site Alpha'}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            disabled={processingJobIds.has(job.id)}
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                if (!currentEmployee) return;
                                                                                setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                                                try {
                                                                                    await wmsJobsService.update(job.id, {
                                                                                        assignedTo: currentEmployee.id,
                                                                                        status: isInternal ? 'In-Progress' : 'Pending'
                                                                                    });
                                                                                    await refreshData();
                                                                                    addNotification('success', isInternal ? 'Mission claim successful.' : 'Dispatch request transmitted for auth.');
                                                                                } catch (err) {
                                                                                    addNotification('alert', 'Claim process failed. Retrying sync.');
                                                                                } finally {
                                                                                    setProcessingJobIds(prev => {
                                                                                        const next = new Set(prev);
                                                                                        next.delete(job.id);
                                                                                        return next;
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isInternal ? 'bg-white text-black hover:bg-cyan-400' : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                                                                } disabled:opacity-50`}
                                                                        >
                                                                            {processingJobIds.has(job.id) ? <RefreshCw className="animate-spin mx-auto" size={14} /> : (isInternal ? 'Initiate Claim' : 'Request Auth')}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {filteredDispatchJobs.length > 0 && (
                                                            <div className="mt-4">
                                                                <Pagination
                                                                    currentPage={dispatchCurrentPage}
                                                                    totalPages={dispatchTotalPages}
                                                                    totalItems={filteredDispatchJobs.length}
                                                                    itemsPerPage={DISPATCH_ITEMS_PER_PAGE}
                                                                    onPageChange={setDispatchCurrentPage}
                                                                    isLoading={false}
                                                                    itemName="requests"
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()
                                }
                            </div >

                            {/* RIGHT COLUMN: OPERATIONAL INTELLIGENCE */}
                            < div className="space-y-6" >
                                {/* UNIT HUB (Quick Actions) */}
                                < div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden" >
                                    <div className="absolute top-0 left-0 w-1 bg-cyan-500 h-full opacity-50" />
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Operations Hub</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                icon: QrCode, label: 'Scan', color: 'blue',
                                                action: () => setDriverScannerOpen(true)
                                            },
                                            {
                                                icon: AlertTriangle, label: 'Report', color: 'orange',
                                                action: () => addNotification('alert', 'Maintenance & Incident protocol active. Dispatch notified.')
                                            },
                                            {
                                                icon: FileText, label: 'Docs', color: 'purple',
                                                action: () => addNotification('info', 'Digital manifest & BOL documents encrypted for security.')
                                            },
                                            {
                                                icon: CheckCircle, label: 'Finish', color: 'green',
                                                action: () => {
                                                    const finished = window.confirm("Finalize shift and logout of Driver Hub?");
                                                    if (finished) setActiveTab('PICK');
                                                }
                                            }
                                        ].map((act, i) => (
                                            <button
                                                key={i}
                                                onClick={act.action}
                                                className={`aspect-square bg-${act.color}-500/10 border border-${act.color}-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-${act.color}-500/20 transition-all hover:scale-105 active:scale-95 group`}
                                            >
                                                <act.icon size={24} className={`text-${act.color}-400 group-hover:drop-shadow-[0_0_8px_rgba(var(--${act.color}-rgb),0.5)]`} />
                                                <span className={`text-[9px] font-black text-${act.color}-100 uppercase tracking-widest`}>{act.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div >

                                {/* PERFORMANCE TELEMETRY */}
                                {
                                    (() => {
                                        const currentEmployee = employees.find(e => e.email === user?.email);
                                        const stats = {
                                            completed: filteredJobs.filter(j => j.type === 'DISPATCH' && j.assignedTo === currentEmployee?.id && j.status === 'Completed').length,
                                            active: filteredJobs.filter(j => j.type === 'DISPATCH' && j.assignedTo === currentEmployee?.id && j.status !== 'Completed').length,
                                            items: filteredJobs.filter(j => j.type === 'DISPATCH' && j.assignedTo === currentEmployee?.id).reduce((sum, j) => sum + (j.items || j.lineItems?.length || 0), 0)
                                        };

                                        return (
                                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] -mr-16 -mb-16 rounded-full" />
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Performance Telemetry</h4>

                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Payload</p>
                                                            <p className="text-3xl font-black text-white leading-none">{stats.items}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest mb-1">Efficiency</p>
                                                            <p className="text-xl font-black text-white leading-none">98<span className="text-[10px] text-gray-600">%</span></p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                                                            <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Missions</p>
                                                            <p className="text-lg font-black text-cyan-400">{stats.completed + stats.active}</p>
                                                        </div>
                                                        <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                                                            <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Completed</p>
                                                            <p className="text-lg font-black text-green-400">{stats.completed}</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Shift Progress</span>
                                                            <span className="text-[9px] text-cyan-500 font-bold">75%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyan-500 rounded-full w-3/4 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                }
                            </div >

                            {/* Standardized DRIVER History Section */}
                            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 mt-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                            <HistoryIcon size={18} className="text-cyan-400" />
                                            Mission History
                                        </h4>
                                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Recent logistics and delivery completions</p>
                                    </div>

                                    {/* History Search */}
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search mission logs..."
                                            value={driverHistorySearch}
                                            onChange={(e) => setDriverHistorySearch(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                {paginatedDriverHistory.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {paginatedDriverHistory.map((job: any) => {
                                                const destSite = sites.find(s => s.id === job.destSiteId);
                                                return (
                                                    <div
                                                        key={job.id}
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-cyan-500/30 transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-[10px] font-mono text-cyan-400 font-bold">{job.id.slice(0, 8)}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                <span className="text-[9px] text-green-400 uppercase font-black">Delivered</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <ArrowRight size={10} className="text-gray-600" />
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{destSite?.name || 'Unknown Hub'}</p>
                                                            </div>
                                                            <div className="flex justify-between items-end mt-4">
                                                                <p className="text-[9px] text-gray-600 font-mono italic">{formatDateTime(job.updatedAt || job.createdAt)}</p>
                                                                <div className="text-right">
                                                                    <p className="text-white font-black text-xs leading-none">{job.items}</p>
                                                                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Units</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Pagination
                                            currentPage={driverHistoryPage}
                                            totalPages={driverHistoryTotalPages}
                                            totalItems={filteredDriverHistory.length}
                                            itemsPerPage={DRIVER_HISTORY_PER_PAGE}
                                            onPageChange={setDriverHistoryPage}
                                            itemName="history"
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-16 bg-black/20 rounded-2xl border border-dashed border-white/5">
                                        <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
                                            <Package className="text-gray-700" size={32} />
                                        </div>
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No matching mission history found</p>
                                    </div>
                                )}
                            </div>
                        </div >

                        {/* DRIVER SCANNER OVERLAY */}
                        {
                            driverScannerOpen && (
                                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 bg-opacity-95 backdrop-blur-xl">
                                    <button
                                        onClick={() => setDriverScannerOpen(false)}
                                        title="Close Scanner"
                                        className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                                    >
                                        <X size={32} />
                                    </button>

                                    <div className="w-full max-w-lg space-y-8 text-center">
                                        <div className="relative inline-block">
                                            <div className="absolute-inset-4 bg-cyan-500/20 blur-xl animate-pulse rounded-full" />
                                            <div className="w-64 h-64 border-2 border-dashed border-cyan-500/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_2s_infinite]" />
                                                <QrCode size={120} className="text-cyan-400 opacity-20" />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Initializing Optics</h3>
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Scan delivery QR code to finalize mission</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <button
                                                onClick={async () => {
                                                    if (selectedJob) {
                                                        try {
                                                            await wmsJobsService.update(selectedJob.id, {
                                                                status: 'Completed',
                                                                transferStatus: 'Delivered'
                                                            });
                                                            addNotification('success', 'Mission Finalized: Logs Synced to HQ.');
                                                            await refreshData();
                                                        } catch (err) {
                                                            addNotification('alert', 'Cloud Sync Failed. Local relay active.');
                                                        }
                                                    }
                                                    setDriverScannerOpen(false);
                                                    setSelectedJob(null);
                                                }}
                                                className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400 transition-all active:scale-95"
                                            >
                                                Authenticate Mission
                                            </button>
                                            <button
                                                onClick={() => setDriverScannerOpen(false)}
                                                className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                                            >
                                                Abort Scan
                                            </button>
                                        </div>
                                    </div>
                                    <style>{`
                                    @keyframes scan {
                                        0% { transform: translateY(0); }
                                        50% { transform: translateY(256px); }
                                        100% { transform: translateY(0); }
                                    }
                                `}</style>
                                </div>
                            )
                        }
                    </div >
                )}

                {/* --- RECEIVE TAB --- */}
                {
                    activeTab === 'RECEIVE' && (
                        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
                            {/* RECEIVE INTELLIGENCE HEADER */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                            <Truck className="text-green-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">{t('warehouse.receivingQueue')}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('warehouse.approvedPOsWillAppear')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-center">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-green-400 transition-colors">
                                                <Search size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search Manifest / Supplier..."
                                                value={receiveSearch}
                                                onChange={(e) => setReceiveSearch(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-6 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/30 transition-all w-64"
                                            />
                                            {receiveSearch && (
                                                <button
                                                    onClick={() => setReceiveSearch('')}
                                                    className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-white"
                                                    title="Clear search"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Pending Units</p>
                                            <p className="text-lg font-mono font-black text-green-400">
                                                {orders.filter(o => o.status === 'Approved').reduce((sum, o) => sum + (o.lineItems?.length || 0), 0)}
                                            </p>
                                        </div>
                                        <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Throughput</p>
                                            <p className="text-lg font-mono font-black text-blue-400">94%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RECEIVE QUEUE */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-6">
                                {filteredReceiveOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                        <div className="p-8 bg-white/5 rounded-full border border-white/10">
                                            <Package size={64} className="text-gray-700" />
                                        </div>
                                        <div>
                                            <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-sm">{t('warehouse.noApprovedPOs')}</p>
                                            <p className="text-gray-600 text-xs mt-2 font-bold uppercase tracking-widest">{t('warehouse.approvedPOsWillAppear')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-6">
                                            {paginatedReceiveOrders.map(po => {
                                                const poJobs = jobs.filter(j => j.orderRef === po.id);
                                                const receivedMap: Record<string, number> = {};
                                                const jobSkuMap: Record<string, string> = {};

                                                poJobs.forEach(job => {
                                                    job.lineItems.forEach(item => {
                                                        if (item.productId) {
                                                            receivedMap[item.productId] = (receivedMap[item.productId] || 0) + item.expectedQty;
                                                            if (item.sku) jobSkuMap[item.productId] = item.sku;
                                                        }
                                                    });
                                                });

                                                const allItemsReceived = po.lineItems?.every(item => {
                                                    const received = item.productId ? (receivedMap[item.productId] || 0) : 0;
                                                    return received >= item.quantity;
                                                }) || false;

                                                return (
                                                    <div key={po.id} className={`group bg-white/5 backdrop-blur-xl border rounded-[2rem] p-8 hover:bg-white/10 transition-all duration-700 relative overflow-hidden shadow-2xl ${allItemsReceived ? 'border-green-500/30' : 'border-white/10 hover:border-blue-500/30'
                                                        }`}>
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                                        {/* Shipment Header */}
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`p-4 rounded-2xl shadow-xl ${allItemsReceived ? 'bg-green-500/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                                                    <Layers size={24} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3">
                                                                        <h3 className="text-lg font-black text-white tracking-widest uppercase">{po.supplierName}</h3>
                                                                        {(() => {
                                                                            const assignedDock = Object.entries(dockStatus).find(([_, data]) => data.assignedPoId === po.id)?.[0];
                                                                            return assignedDock && (
                                                                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-500/30 flex items-center gap-1.5">
                                                                                    <Anchor size={8} /> Dock {assignedDock}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 font-mono font-black uppercase mt-1 tracking-widest">
                                                                        Manifest: {po.po_number || po.id.slice(0, 8)} • {po.lineItems?.length || 0} Cargo Units
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${allItemsReceived
                                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                : 'bg-blue-600/10 text-blue-400 border-blue-600/20'
                                                                }`}>
                                                                {allItemsReceived ? 'Ready for Audit' : 'Inbound Processing'}
                                                            </div>
                                                        </div>

                                                        {/* Item Matrix */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                            {(po.lineItems || []).map((item, idx) => {
                                                                const receivedQty = item.productId ? (receivedMap[item.productId] || 0) : 0;
                                                                const remainingQty = Math.max(0, item.quantity - receivedQty);
                                                                const isComplete = receivedQty >= item.quantity;
                                                                const product = products.find(p => p.id === item.productId);

                                                                return (
                                                                    <div key={item.productId || idx} className={`group/item p-6 rounded-[2rem] border transition-all duration-700 relative overflow-hidden ${isComplete
                                                                        ? 'bg-green-500/5 border-green-500/10 opacity-70'
                                                                        : 'bg-black/40 border-white/5 hover:border-blue-500/30 hover:bg-black/60 shadow-xl'
                                                                        }`}>

                                                                        {/* Item Progress Glow */}
                                                                        {!isComplete && (
                                                                            <div className="absolute inset-0 bg-blue-500/[0.02] group-hover/item:bg-blue-500/[0.05] transition-colors" />
                                                                        )}

                                                                        <div className="flex flex-col gap-5 relative z-10">
                                                                            <div className="flex justify-between items-start gap-4">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className={`text-xs font-black uppercase tracking-widest truncate ${isComplete ? 'text-gray-500' : 'text-white'}`}>
                                                                                            {item.productName}
                                                                                        </p>
                                                                                        {isComplete && <CheckCircle size={14} className="text-green-500 shadow-glow" />}
                                                                                    </div>
                                                                                    <p className="text-[10px] text-gray-500 font-mono mt-1 font-bold uppercase tracking-widest">
                                                                                        ID: {jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'PENDING'}
                                                                                    </p>
                                                                                </div>

                                                                                {isComplete ? (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const sku = jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'UNKNOWN';
                                                                                            setReprintItem({ sku, name: item.productName, qty: receivedQty });
                                                                                        }}
                                                                                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all active:scale-90"
                                                                                        title="Reprint Tag"
                                                                                    >
                                                                                        <Printer size={14} />
                                                                                    </button>
                                                                                ) : (
                                                                                    <Protected permission="RECEIVE_PO">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setFocusedItem({
                                                                                                    id: item.id,
                                                                                                    productId: item.productId,
                                                                                                    productName: item.productName || '',
                                                                                                    expectedQty: item.quantity,
                                                                                                    receivedQty: remainingQty
                                                                                                });
                                                                                                setReceivingPO(po);
                                                                                                setShowPrintSuccess(false);
                                                                                            }}
                                                                                            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg active:scale-95 transition-all group-hover/item:scale-110"
                                                                                            title="Initialize Inbound"
                                                                                        >
                                                                                            <Plus size={16} />
                                                                                        </button>
                                                                                    </Protected>
                                                                                )}
                                                                            </div>

                                                                            <div className="space-y-3">
                                                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                                    <span className="text-gray-500">Logistics Status</span>
                                                                                    <span className={isComplete ? 'text-green-400' : 'text-blue-400'}>
                                                                                        {receivedQty} / {item.quantity} UNITS
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                                    <div
                                                                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${isComplete ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                                                                                            } w-[${Math.round((receivedQty / item.quantity) * 100)}%]`}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Audit Control */}
                                                        {allItemsReceived && (
                                                            <div className="mt-8 pt-8 border-t border-green-500/20 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                                                                <div className="flex items-center gap-3 text-green-400">
                                                                    <div className="p-2 bg-green-500/20 rounded-xl">
                                                                        <CheckCircle size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-widest">Inbound Authenticated</p>
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Cargo integrity verified across all units</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setReviewPO(po);
                                                                        setShowReviewModal(true);
                                                                    }}
                                                                    className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-green-600/20 active:scale-[0.98]"
                                                                >
                                                                    Finalize Manifest
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Pagination Controls */}
                                        <Pagination
                                            currentPage={receiveCurrentPage}
                                            totalPages={receiveOrdersTotalPages}
                                            totalItems={filteredReceiveOrders.length}
                                            itemsPerPage={RECEIVE_ITEMS_PER_PAGE}
                                            onPageChange={setReceiveCurrentPage}
                                            itemName="orders"
                                        />
                                    </>
                                )}

                                {/* RECEIVE History Section */}
                                <div className="border-t border-white/10 mt-12 pt-8 pb-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                                <HistoryIcon size={18} className="text-gray-400" />
                                                Logistics History
                                            </h4>
                                            <p className="text-gray-500 text-[10px]">Recent completed and finalized manifests</p>
                                        </div>

                                        {/* History Search */}
                                        <div className="relative w-full md:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search history..."
                                                value={receiveHistorySearch}
                                                onChange={(e) => setReceiveHistorySearch(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {paginatedReceiveHistory.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {paginatedReceiveHistory.map((po: any) => (
                                                    <div
                                                        key={po.id}
                                                        onClick={() => {
                                                            setSelectedJob(po);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] font-mono text-cyber-primary font-bold">{po.po_number || po.id.slice(0, 8)}</span>
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-green-500/10 text-green-400">
                                                                {po.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{po.supplierName}</p>
                                                                <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(po.receivedAt || po.updatedAt || po.createdAt || po.date)}</p>
                                                            </div>
                                                            <div className="text-right text-white font-bold text-xs">
                                                                {(po.lineItems || []).length} <span className="text-[9px] text-gray-500 font-normal">lines</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Pagination
                                                currentPage={receiveHistoryPage}
                                                totalPages={receiveHistoryTotalPages}
                                                totalItems={filteredReceiveHistory.length}
                                                itemsPerPage={RECEIVE_HISTORY_PER_PAGE}
                                                onPageChange={setReceiveHistoryPage}
                                                itemName="history"
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                            <p className="text-gray-500 text-xs">No matching history found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Receiving Modal-Opens when clicking Receive on a product */}
                {
                    focusedItem && receivingPO && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 z-[200] animate-in fade-in duration-500">
                            <div className="bg-white/5 border border-white/10 rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

                                {/* Modal Header */}
                                <div className="p-8 pb-4 flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                                <Package size={20} className="text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Inbound Logistics</h3>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                            Validating Cargo Manifest • {focusedItem.productName}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setFocusedItem(null); setReceivingPO(null); }}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                                        title="Abort Mission"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 pt-0 space-y-8 overflow-y-auto relative z-10 custom-scrollbar">
                                    {!showPrintSuccess ? (
                                        <>
                                            {/* Quantity Engine */}
                                            <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Quantity Engine</p>
                                                        <p className="text-3xl font-black text-white">{focusedItem.receivedQty}<span className="text-sm text-gray-600 ml-2">UNITS</span></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Expected</p>
                                                        <p className="text-xl font-black text-gray-400">{focusedItem.expectedQty}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-3">
                                                    {[1, 5, 10, 50].map(val => (
                                                        <button
                                                            key={val}
                                                            onClick={() => setFocusedItem({ ...focusedItem, receivedQty: Math.min(focusedItem.expectedQty, focusedItem.receivedQty + val) })}
                                                            className="py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-xl border border-white/5 transition-all active:scale-95"
                                                        >
                                                            +{val}
                                                        </button>
                                                    ))}
                                                </div>

                                                <input
                                                    title="Target Quantity"
                                                    type="number"
                                                    value={focusedItem.receivedQty}
                                                    onChange={(e) => setFocusedItem({
                                                        ...focusedItem,
                                                        receivedQty: Math.min(focusedItem.expectedQty, Math.max(0, parseInt(e.target.value) || 0))
                                                    })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-4xl text-center text-white font-black focus:border-blue-500/50 focus:outline-none transition-all shadow-inner"
                                                />
                                            </div>

                                            {/* SKU Assignment Engine */}
                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6 relative overflow-hidden group/sku">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Scan size={14} className="text-gray-400" />
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">SKU Assignment Engine</p>
                                                    </div>
                                                    {(() => {
                                                        const product = products.find(p => p.id === focusedItem.productId);
                                                        const isExisting = product?.sku === scannedSkus[focusedItem.productId] && product?.sku !== 'MISC';
                                                        return isExisting ? (
                                                            <span className="text-[8px] bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20 flex items-center gap-1.5 font-black uppercase tracking-widest">
                                                                <CheckCircle size={8} /> Existing Record
                                                            </span>
                                                        ) : (
                                                            <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5 font-black uppercase tracking-widest">
                                                                <RefreshCw size={8} /> New Generation
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        <input
                                                            title="Supplier SKU"
                                                            type="text"
                                                            value={scannedSkus[focusedItem.productId] || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value.trim().toUpperCase();
                                                                setScannedSkus(prev => ({ ...prev, [focusedItem.productId]: val }));
                                                                setSkuDecisions(prev => ({ ...prev, [focusedItem.productId]: 'keep' }));
                                                            }}
                                                            className={`w-full bg-black/40 border rounded-2xl p-5 pr-12 text-white font-mono font-bold focus:outline-none transition-all ${scannedSkus[focusedItem.productId] ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/10'
                                                                }`}
                                                            placeholder="Scan Supplier Barcode..."
                                                        />
                                                        {scannedSkus[focusedItem.productId] && (
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400">
                                                                <CheckCircle size={18} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="h-px flex-1 bg-white/5" />
                                                        <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">OR</span>
                                                        <div className="h-px flex-1 bg-white/5" />
                                                    </div>

                                                    <button
                                                        onClick={async () => {
                                                            const product = products.find(p => p.id === focusedItem.productId);
                                                            const { generateSKU } = await import('../utils/skuGenerator');
                                                            const newSku = generateSKU(product?.category || 'General', allProducts);
                                                            setScannedSkus(prev => ({ ...prev, [focusedItem.productId]: newSku }));
                                                            setSkuDecisions(prev => ({ ...prev, [focusedItem.productId]: 'generate' }));
                                                        }}
                                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-xs text-gray-300 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                                    >
                                                        <RefreshCw size={14} className="group-hover/sku:rotate-180 transition-transform duration-700" />
                                                        Auto-Generate Logistics SKU
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Telemetry & Labels */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4">
                                                    <label className="block text-[8px] font-black text-gray-500 mb-3 uppercase tracking-widest">Thermal Output</label>
                                                    <select
                                                        title="Thermal Size"
                                                        value={labelSize}
                                                        onChange={(e) => setLabelSize(e.target.value as any)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] text-white font-bold focus:border-blue-500/50 focus:outline-none"
                                                    >
                                                        <option value="Tiny">1.25" x 1"</option>
                                                        <option value="Small">2.25" x 1.25"</option>
                                                        <option value="Medium">3" x 2"</option>
                                                        <option value="Large">4" x 3"</option>
                                                    </select>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4">
                                                    <label className="block text-[8px] font-black text-gray-500 mb-3 uppercase tracking-widest">Optic format</label>
                                                    <select
                                                        title="Optic Format"
                                                        value={labelFormat}
                                                        onChange={(e) => setLabelFormat(e.target.value as any)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] text-white font-bold focus:border-blue-500/50 focus:outline-none"
                                                    >
                                                        <option value="QR">QR Matrix</option>
                                                        <option value="Barcode">CODE 128</option>
                                                        {(labelSize === 'MEDIUM' || labelSize === 'LARGE') && <option value="Both">Hybrid</option>}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => { setFocusedItem(null); setReceivingPO(null); }}
                                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    disabled={isReceiving}
                                                    onClick={async () => {
                                                        if (!receivingPO || !focusedItem || isReceiving) return;
                                                        if (focusedItem.receivedQty <= 0) {
                                                            addNotification('alert', 'Quantity must be greater than 0');
                                                            return;
                                                        }

                                                        setIsReceiving(true);
                                                        try {
                                                            const singleItem: ReceivingItem = {
                                                                ...focusedItem,
                                                                quantity: focusedItem.receivedQty
                                                            };

                                                            const skus = await receivePO(
                                                                receivingPO.id,
                                                                [singleItem],
                                                                skuDecisions,
                                                                scannedSkus
                                                            );

                                                            if (skus) {
                                                                setFinalizedSkus(prev => ({ ...prev, ...skus }));
                                                                setShowPrintSuccess(true);
                                                                // Log User Action
                                                                logSystemEvent(
                                                                    'Stock Received',
                                                                    `Received ${focusedItem.receivedQty}x ${focusedItem.productName} (PO: ${receivingPO.po_number || receivingPO.id})`,
                                                                    user?.name || 'Receiver',
                                                                    'Inventory'
                                                                );
                                                            }
                                                        } finally {
                                                            setIsReceiving(false);
                                                        }
                                                    }}
                                                    className={`flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl transition-colors flex flex-col items-center justify-center leading-none ${isReceiving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'} `}
                                                >
                                                    {isReceiving ? (
                                                        <>
                                                            <RefreshCw size={18} className="animate-spin" />
                                                            <span className="text-[10px] opacity-70 mt-1">Processing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Confirm Receive</span>
                                                            <span className="text-[10px] opacity-70 mt-1">Next: Print Labels</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        /* Success Screen: Logistics Intake Verified */
                                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-700">
                                            <div className="relative mb-8">
                                                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                                <div className="p-8 bg-green-500/20 rounded-full border border-green-500/30 relative">
                                                    <CheckCircle size={64} className="text-green-400" />
                                                </div>
                                            </div>

                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Intake Verified</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">
                                                {focusedItem.receivedQty} UNITS • {focusedItem.productName}
                                            </p>

                                            <div className="w-full grid grid-cols-1 gap-4">
                                                <button
                                                    disabled={isPrinting}
                                                    onClick={async () => {
                                                        if (isPrinting) return;
                                                        setIsPrinting(true);
                                                        try {
                                                            const labelsToPrint: Array<{ value: string; label: string; quantity: number }> = [];
                                                            const product = products.find(p => p.id === focusedItem.productId);
                                                            const finalSku = finalizedSkus[focusedItem.productId] || scannedSkus[focusedItem.productId] || product?.sku || 'UNKNOWN';
                                                            labelsToPrint.push({ value: finalSku, label: focusedItem.productName, quantity: focusedItem.receivedQty });

                                                            const html = await generateUnifiedBatchLabelsHTML(labelsToPrint, {
                                                                size: labelSize as LabelSize,
                                                                format: labelFormat as LabelFormat
                                                            });

                                                            const printWin = window.open('', '_blank');
                                                            if (printWin) {
                                                                printWin.document.write(html);
                                                                printWin.document.close();
                                                            }
                                                        } catch (e) {
                                                            addNotification('alert', 'Print failed');
                                                        } finally {
                                                            setIsPrinting(false);
                                                        }
                                                    }}
                                                    className={`w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 ${isPrinting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98]'} `}
                                                >
                                                    {isPrinting ? <RefreshCw size={20} className="animate-spin" /> : <Printer size={20} />}
                                                    {isPrinting ? 'Generating...' : 'Execute Print Run'}
                                                </button>

                                                <button
                                                    onClick={async () => {
                                                        if (receivingPO && focusedItem && focusedItem.productId) {
                                                            const currentReceived = receivedQuantities[focusedItem.productId] || 0;
                                                            const newTotal = currentReceived + focusedItem.receivedQty;
                                                            const updatedReceivedMap: Record<string, number> = { ...receivedQuantities, [focusedItem.productId]: newTotal };
                                                            const isComplete = receivingPO.lineItems.every(item => {
                                                                const rec = item.productId ? (updatedReceivedMap[item.productId] || 0) : 0;
                                                                return rec >= item.quantity;
                                                            });
                                                            if (isComplete) {
                                                                setReviewPO(receivingPO);
                                                                setShowReviewModal(true);
                                                            }
                                                        }
                                                        setFocusedItem(null);
                                                        setReceivingPO(null);
                                                        setShowPrintSuccess(false);
                                                    }}
                                                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.3em] rounded-2xl border border-white/10 transition-all"
                                                >
                                                    Finalize & Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Dock Detail Modal */}
                {
                    selectedDockId && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 z-[200] animate-in fade-in duration-500">
                            <div className="bg-[#111111]/90 border border-white/10 rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

                                {/* Modal Header */}
                                <div className="p-8 pb-4 flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-xl ${dockStatus[selectedDockId].status === 'Occupied' ? 'bg-red-500/20 text-red-400' :
                                                dockStatus[selectedDockId].status === 'Maintenance' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-green-500/20 text-green-400'
                                                }`}>
                                                <Anchor size={20} />
                                            </div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Dock Command • {selectedDockId}</h3>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                            Terminal Map Sector A4 • Operational Control
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDockId(null)}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                                        title="Close"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 pt-0 space-y-8 overflow-y-auto relative z-10 custom-scrollbar">
                                    {dockStatus[selectedDockId].status === 'Occupied' ? (
                                        <div className="space-y-6">
                                            {/* Vessel Info */}
                                            <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Truck size={80} />
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Assigned Vessel</p>
                                                    <p className="text-2xl font-black text-white mb-4">{dockStatus[selectedDockId].vesselName}</p>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Manifest Reference</p>
                                                            <p className="text-sm font-mono text-white">{dockStatus[selectedDockId].assignedPoId}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Docking Status</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                                <p className="text-sm font-bold text-green-400">Live Connection</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="grid grid-cols-1 gap-3">
                                                <button
                                                    onClick={() => {
                                                        setActiveTab('RECEIVE');
                                                        setReceiveSearch(dockStatus[selectedDockId].assignedPoId || '');
                                                        setSelectedDockId(null);
                                                    }}
                                                    className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    <Play size={20} />
                                                    Initialize Full Unload
                                                </button>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => releaseDock(selectedDockId)}
                                                        className="py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <ArrowRight size={16} />
                                                        Depart
                                                    </button>
                                                    <button
                                                        onClick={() => toggleDockMaintenance(selectedDockId)}
                                                        className="py-4 bg-white/5 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/20 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <AlertTriangle size={16} />
                                                        Service
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="bg-black/40 rounded-[2rem] p-12 border border-white/5 flex flex-col items-center justify-center text-center">
                                                <div className={`p-6 rounded-full mb-6 ${dockStatus[selectedDockId].status === 'Maintenance' ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                                                    {dockStatus[selectedDockId].status === 'Maintenance' ? (
                                                        <AlertTriangle size={48} className="text-orange-400" />
                                                    ) : (
                                                        <Clock size={48} className="text-green-400" />
                                                    )}
                                                </div>
                                                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                                                    {dockStatus[selectedDockId].status === 'Maintenance' ? 'System Offline' : 'Ready for Inbound'}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-[240px]">
                                                    {dockStatus[selectedDockId].status === 'Maintenance'
                                                        ? 'Dock is under periodic maintenance or repair protocol.'
                                                        : 'Sector is clear with zero reported obstructions.'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => toggleDockMaintenance(selectedDockId)}
                                                className={`w-full py-5 font-black uppercase tracking-[0.3em] rounded-2xl transition-all border flex items-center justify-center gap-3 active:scale-95 ${dockStatus[selectedDockId].status === 'Maintenance'
                                                    ? 'bg-green-600/10 text-green-400 border-green-500/20 hover:bg-green-600/20'
                                                    : 'bg-orange-600/10 text-orange-400 border-orange-500/20 hover:bg-orange-600/20'
                                                    }`}
                                            >
                                                <Activity size={20} />
                                                {dockStatus[selectedDockId].status === 'Maintenance' ? 'Restore to Service' : 'Request Maintenance'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Reprint Options Modal */}
                {
                    reprintItem && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50">
                            <div className="bg-[#1a1a1a] border-t md:border border-white/10 rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[85vh] md:max-h-auto overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Printer className="text-cyber-primary" size={24} />
                                        Reprint Labels
                                    </h3>
                                    <button onClick={() => setReprintItem(null)} className="text-gray-400 hover:text-white" title="Close">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <p className="font-bold text-white">{reprintItem.name}</p>
                                    <p className="text-sm text-gray-400">SKU: {reprintItem.sku}</p>
                                    <p className="text-sm text-cyber-primary font-bold mt-1">{reprintItem.qty} labels</p>
                                </div>

                                {/* Size Selection */}
                                <div className="mb-4">
                                    <label className="text-sm text-gray-400 mb-2 block">Label Size</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['TINY', 'SMALL', 'MEDIUM', 'LARGE'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setReprintSize(s)}
                                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${reprintSize === s
                                                    ? 'bg-cyber-primary text-black'
                                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    } `}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {reprintSize === 'TINY' && '1.25" × 1"-SKU Tags'}
                                        {reprintSize === 'SMALL' && '2.25" × 1.25"-Multipurpose'}
                                        {reprintSize === 'MEDIUM' && '3" × 2"-Shelf Labels'}
                                        {reprintSize === 'LARGE' && '4" × 3"-Carton Tags'}
                                    </p>
                                </div>

                                {/* Format Selection */}
                                <div className="mb-6">
                                    <label className="text-sm text-gray-400 mb-2 block">Code Format</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['QR', 'Barcode', 'Both'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setReprintFormat(f)}
                                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${reprintFormat === f
                                                    ? 'bg-cyber-primary text-black'
                                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    } `}
                                            >
                                                {f === 'QR' && '📱 QR'}
                                                {f === 'Barcode' && '▮▯▮ Barcode'}
                                                {f === 'Both' && '📱+▮ Both'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setReprintItem(null)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isPrinting}
                                        onClick={handleReprintLabels}
                                        className={`flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 ${isPrinting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'} `}
                                    >
                                        {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                                        {isPrinting ? 'Generating...' : `Print ${reprintItem.qty} Labels`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }


                {/* Review & Complete Modal */}
                {
                    showReviewModal && reviewPO && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50">
                            <div className="bg-[#1a1a1a] border-t md:border border-white/10 rounded-t-2xl md:rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                                <h3 className="text-xl font-bold text-white mb-4">Review & Print Labels</h3>

                                <p className="text-gray-400 mb-6 text-sm">Review received items and configure labels before finalizing.</p>

                                {/* Label Settings */}
                                <div className="grid grid-cols-2 gap-4 mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Label Size</label>
                                        <select
                                            title="Select Label Size"
                                            value={labelSize}
                                            onChange={(e) => setLabelSize(e.target.value as any)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-cyber-primary focus:outline-none"
                                        >
                                            <option value="Tiny">Tiny (1.25" x 1")</option>
                                            <option value="Small">Small (2.25" x 1.25")</option>
                                            <option value="Medium">Medium (3" x 2")</option>
                                            <option value="Large">Large (4" x 3")</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Code Format</label>
                                        <select
                                            title="Select Label Format"
                                            value={labelFormat}
                                            onChange={(e) => setLabelFormat(e.target.value as any)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-cyber-primary focus:outline-none"
                                        >
                                            <option value="QR">QR Code</option>
                                            <option value="Barcode">Barcode (Code 128)</option>
                                            {(labelSize === 'MEDIUM' || labelSize === 'LARGE') && (
                                                <option value="Both">Both</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                                    {reviewPO.lineItems?.map((item, idx) => {
                                        const receivedQty = item.productId ? (receivedQuantities[item.productId] || 0) : 0;
                                        if (receivedQty === 0) return null;

                                        const product = item.productId ? products.find(p => p.id === item.productId) : undefined;
                                        const sku = item.productId ? (finalizedSkus[item.productId] || product?.sku || 'PENDING') : 'PENDING';

                                        return (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                                                <div>
                                                    <p className="font-bold text-white">{item.productName}</p>
                                                    <p className="text-xs text-gray-400 font-mono">SKU: {sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-bold text-green-400">{receivedQty}</span>
                                                    <span className="text-xs text-gray-500 block">Received</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button
                                        onClick={() => { setShowReviewModal(false); setReviewPO(null); }}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isCompleting}
                                        onClick={async () => {
                                            if (reviewPO && !isCompleting) {
                                                setIsCompleting(true);
                                                try {
                                                    await purchaseOrdersService.receive(reviewPO.id);
                                                    addNotification('success', 'PO Completed!');
                                                } catch (e) {
                                                    console.error(e);
                                                } finally {
                                                    setIsCompleting(false);
                                                    setShowReviewModal(false);
                                                    setReviewPO(null);
                                                }
                                            }
                                        }}
                                        className={`px-6 py-3 bg-green-600/20 text-green-400 border border-green-500/30 font-bold rounded-xl transition-colors flex items-center gap-2 ${isCompleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600/30'} `}
                                    >
                                        {isCompleting ? <Loader2 size={18} className="animate-spin" /> : null}
                                        {isCompleting ? t('warehouse.processing') : t('warehouse.completeOnly')}
                                    </button>
                                    <button
                                        disabled={isCompleting}
                                        onClick={async () => {
                                            if (!reviewPO || isCompleting) return;
                                            setIsCompleting(true);
                                            try {
                                                await handlePrintReceivingLabels(reviewPO);
                                                await purchaseOrdersService.receive(reviewPO.id);
                                                addNotification('success', 'PO Completed & Labels Generated');
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setIsCompleting(false);
                                                setShowReviewModal(false);
                                                setReviewPO(null);
                                            }
                                        }}
                                        className={`flex-1 px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isCompleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'} `}
                                    >
                                        {isCompleting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                                        {isCompleting ? t('warehouse.processing') : t('warehouse.completeAndPrintLabels')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }



                {/* --- PICK TAB --- */}
                {
                    activeTab === 'PICK' && (
                        <div className="flex-1 flex flex-col gap-6 px-4">
                            {/* Modern Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-white text-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-primary/30 to-blue-500/20 flex items-center justify-center">
                                            <Package size={20} className="text-cyber-primary" />
                                        </div>
                                        Pick Queue
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('warehouse.selectJobToAssign')}</p>
                                    <p className="md:hidden text-cyber-primary text-xs font-bold mt-2 animate-pulse">{t('warehouse.tapToScan')}</p>
                                </div>

                                {/* Quick Stats */}
                                <div className="flex gap-3">
                                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl px-4 py-2 border border-yellow-500/20">
                                        <p className="text-yellow-400 font-bold text-lg">{filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Pending').length}</p>
                                        <p className="text-[10px] text-yellow-500/70 uppercase">Pending</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl px-4 py-2 border border-blue-500/20">
                                        <p className="text-blue-400 font-bold text-lg">{filteredJobs.filter(j => j.type === 'PICK' && j.status === 'In-Progress').length}</p>
                                        <p className="text-[10px] text-blue-500/70 uppercase">In Progress</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl px-4 py-2 border border-green-500/20">
                                        <p className="text-green-400 font-bold text-lg">{filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Completed').length}</p>
                                        <p className="text-[10px] text-green-500/70 uppercase">Done</p>
                                    </div>
                                </div>
                            </div>


                            {/* Sort Controls */}
                            <div className="flex justify-end px-1">
                                <SortDropdown
                                    label="Sort By"
                                    options={[
                                        { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                                        { id: 'site', label: 'Store', icon: <MapPin size={12} /> },
                                        { id: 'date', label: 'Time', icon: <Clock size={12} /> },
                                        { id: 'items', label: 'Size', icon: <List size={12} /> }
                                    ]}
                                    value={pickSortBy}
                                    onChange={(val) => setPickSortBy(val)}
                                    isOpen={isPickSortDropdownOpen}
                                    setIsOpen={setIsPickSortDropdownOpen}
                                />
                            </div>

                            {/* Job Cards Grid */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredPickJobs.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
                                            {paginatedPickJobs.sort((a, b) => {
                                                switch (pickSortBy) {
                                                    case 'priority':
                                                        const p: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 1, 'Low': 0 };
                                                        return (p[b.priority] || 1) - (p[a.priority] || 1);
                                                    case 'date':
                                                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                                                    case 'items':
                                                        return (b.lineItems?.length || 0) - (a.lineItems?.length || 0);
                                                    case 'site':
                                                        const siteA = sites.find(s => s.id === a.destSiteId)?.name || '';
                                                        const siteB = sites.find(s => s.id === b.destSiteId)?.name || '';
                                                        return siteA.localeCompare(siteB);
                                                    default:
                                                        return 0;
                                                }
                                            }).map(job => {
                                                const lineItems = job.lineItems || (job as any).line_items || [];
                                                const totalItems = lineItems.length;
                                                const pickedItems = lineItems.filter((i: any) => i.status === 'Picked').length;
                                                const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;

                                                return (
                                                    <div
                                                        key={job.id}
                                                        onClick={() => handleStartJob(job)}
                                                        className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-cyber-primary/10 min-h-auto md:min-h-[140px] flex flex-col justify-between ${job.status === 'In-Progress'
                                                            ? 'border-blue-500/50 shadow-lg shadow-blue-500/20'
                                                            : 'border-white/10 hover:border-cyber-primary/50'
                                                            } `}
                                                    >
                                                        {/* Priority Ribbon */}
                                                        {job.priority === 'Critical' && (
                                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">
                                                                URGENT
                                                            </div>
                                                        )}

                                                        <div className="p-4 md:p-5 flex-1 flex flex-col">
                                                            {/* Job Header */}
                                                            <div className="flex items-start justify-between gap-2 mb-4">
                                                                <div className="min-w-0">
                                                                    <p className="text-cyber-primary font-mono font-bold text-base md:text-sm truncate">
                                                                        {formatJobId(job)}
                                                                    </p>
                                                                    <p className="text-gray-500 text-xs mt-1 truncate">
                                                                        {job.orderRef?.startsWith('TRF') ? 'Transfer Pick' : 'Order Pick'}
                                                                    </p>
                                                                </div>
                                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap shrink-0 ${job.status === 'In-Progress'
                                                                    ? 'bg-blue-500/20 text-blue-400 md:animate-pulse'
                                                                    : job.priority === 'High'
                                                                        ? 'bg-orange-500/20 text-orange-400'
                                                                        : 'bg-gray-500/20 text-gray-400'
                                                                    } `}>
                                                                    {job.status === 'In-Progress' ? '● ACTIVE' : job.priority}
                                                                </span>
                                                            </div>

                                                            {/* Items Preview */}
                                                            <div className="flex gap-2 mb-4">
                                                                {lineItems.slice(0, 4).map((item: any, idx: number) => (
                                                                    <div key={idx} className="w-10 h-10 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                        {item.image && !item.image.includes('placeholder.com') ? (
                                                                            <img
                                                                                src={item.image}
                                                                                alt=""
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Package size={14} className="text-gray-600" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {lineItems.length > 4 && (
                                                                    <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center">
                                                                        <span className="text-cyber-primary text-xs font-bold">+{lineItems.length - 4}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Progress */}
                                                            <div className="mb-4">
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-gray-500">Progress</span>
                                                                    <span className="text-white font-bold">{pickedItems}/{totalItems} items</span>
                                                                </div>
                                                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full bg-gradient-to-r from-cyber-primary to-blue-400 rounded-full transition-all duration-500 w-[${Math.round(progress)}%]`}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Footer */}
                                                            <div className="mt-auto flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {job.assignedTo ? (
                                                                        <>
                                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                                                <span className="text-[10px] font-bold text-white">{job.assignedTo.charAt(0)}</span>
                                                                            </div>
                                                                            <span className="text-xs text-gray-400">{job.assignedTo}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-600 italic">Unassigned</span>
                                                                    )}
                                                                </div>
                                                                <button className="hidden md:block px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary text-cyber-primary hover:text-black text-xs font-bold rounded-lg transition-all duration-300 group-hover:px-5">
                                                                    {job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Mobile Tap Cue */}
                                                        <div className="md:hidden p-3 bg-white/5 border-t border-white/5 flex items-center justify-center text-cyber-primary">
                                                            <span className="text-xs font-bold uppercase tracking-wider">Tap to Start Picking</span>
                                                            <ArrowRight size={14} className="ml-1" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* PICK Pagination Controls */}
                                        <Pagination
                                            currentPage={pickCurrentPage}
                                            totalPages={pickJobsTotalPages}
                                            totalItems={filteredPickJobs.length}
                                            itemsPerPage={PICK_ITEMS_PER_PAGE}
                                            onPageChange={setPickCurrentPage}
                                            itemName="jobs"
                                        />
                                    </>
                                ) : (
                                    /* Empty State */
                                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6 border border-white/5">
                                            <Package size={32} className="text-gray-600" />
                                        </div>
                                        <h4 className="text-white font-bold text-lg mb-2">{t('warehouse.noPendingJobs')}</h4>
                                        <p className="text-gray-500 text-sm text-center max-w-sm">
                                            {t('warehouse.jobsAppearAfterReceive')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* PICK History Section */}
                            <div className="border-t border-white/10 mt-10 pt-8 pb-20">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h3 className="item-title font-bold text-white flex items-center gap-2">
                                            <Archive size={20} className="text-gray-400" />
                                            {t('warehouse.pickHistory')}
                                        </h3>
                                        <p className="text-gray-500 text-xs">Review completed and cancelled picking jobs</p>
                                    </div>

                                    {/* History Search */}
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search by ID or Order..."
                                            value={pickHistorySearch}
                                            onChange={(e) => setPickHistorySearch(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {paginatedPickHistory.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                            {paginatedPickHistory.map(job => (
                                                <div key={job.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-mono text-cyber-primary font-bold">{formatJobId(job)}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${job.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{job.orderRef || 'No Ref'}</p>
                                                            <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(job.createdAt || '')}</p>
                                                        </div>
                                                        <div className="text-right text-white font-bold text-xs">
                                                            {job.items} <span className="text-[9px] text-gray-500 font-normal">items</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            currentPage={pickHistoryPage}
                                            totalPages={pickHistoryTotalPages}
                                            totalItems={filteredPickHistory.length}
                                            itemsPerPage={PICK_HISTORY_PER_PAGE}
                                            onPageChange={setPickHistoryPage}
                                            itemName="history"
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                        <p className="text-gray-500 text-xs">No matching history found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* --- PACK TAB (MODERN SIMPLIFIED) --- */}
                {
                    activeTab === 'PACK' && (
                        <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            {/* Standard Header (Matte/Flat) */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                                            <Package size={28} className="text-gray-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{t('warehouse.tabs.pack')}</h2>
                                            <p className="text-sm text-gray-400">{t('warehouse.packDesc')}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Pack Intelligence Filter (Status) */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsPackFilterDropdownOpen(!isPackFilterDropdownOpen)}
                                                className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-xs font-black text-gray-400 hover:text-white transition-all whitespace-nowrap"
                                            >
                                                <Filter size={14} className={packJobFilter !== 'all' ? 'text-cyber-primary' : ''} />
                                                <span>STATUS: {packJobFilter === 'all' ? 'ALL ARCHIVES' : packJobFilter.toUpperCase()}</span>
                                                <ChevronDown size={14} className={`transition-transform duration-300 ${isPackFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isPackFilterDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[50]" onClick={() => setIsPackFilterDropdownOpen(false)} />
                                                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {['all', 'pending', 'in-progress', 'completed'].map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => {
                                                                    setPackJobFilter(status as any);
                                                                    setIsPackFilterDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-between group ${packJobFilter === status
                                                                    ? 'bg-cyber-primary text-black'
                                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                    }`}
                                                            >
                                                                {(status === 'all' ? 'ALL ARCHIVES' : status.toUpperCase())}
                                                                {packJobFilter === status && <CheckCircle size={12} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Pack Sort Dropdown */}
                                        <SortDropdown
                                            label="Sort"
                                            options={[
                                                { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                                                { id: 'date', label: 'Date', icon: <Clock size={12} /> },
                                                { id: 'items', label: 'Items', icon: <List size={12} /> }
                                            ]}
                                            value={packSortBy}
                                            onChange={(val) => setPackSortBy(val)}
                                            isOpen={isPackSortDropdownOpen}
                                            setIsOpen={setIsPackSortDropdownOpen}
                                        />

                                        {/* Pack Search Input */}
                                        <div className="flex-1 min-w-[150px]">
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search size={12} className="text-gray-600 group-focus-within:text-cyber-primary transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search Payload IDs..."
                                                    value={packSearch}
                                                    onChange={(e) => setPackSearch(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-[10px] font-bold tracking-tight focus:border-cyber-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-gray-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                {selectedPackJob ? (
                                    // ACTIVE PACKING STATION VIEW
                                    (() => {
                                        const currentPackJob = filteredJobs.find(j => j.id === selectedPackJob);

                                        if (!currentPackJob) {
                                            setSelectedPackJob(null);
                                            return null;
                                        }

                                        const packedCount = currentPackJob.lineItems.filter(i => i.status === 'Picked' || i.status === 'Completed').length;
                                        const totalItems = currentPackJob.lineItems.length;
                                        const progress = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

                                        // Helpers
                                        const hasColdItems = currentPackJob.lineItems.some(item => {
                                            const product = filteredProducts.find(p => p.id === item.productId);
                                            return product?.category === 'Frozen' || product?.category === 'Dairy';
                                        });
                                        const hasFragileItems = currentPackJob.lineItems.some(item => {
                                            const product = filteredProducts.find(p => p.id === item.productId);
                                            return product && ['Electronics', 'Glass', 'Beverages'].some(cat => product.category.includes(cat));
                                        });

                                        return (
                                            <div className="h-full flex flex-col lg:flex-row gap-6">
                                                {/* Left Column: Job Details & Items */}
                                                <div className="flex-1 flex flex-col bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden pt-0 mt-0">
                                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setSelectedPackJob(null)}
                                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                                aria-label="Back to List"
                                                            >
                                                                <ArrowLeft size={20} />
                                                            </button>
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">{formatJobId(currentPackJob)}</h3>
                                                                <p className="text-xs text-gray-400">Order Ref: {formatOrderRef(currentPackJob.orderRef, currentPackJob.id)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                                <button onClick={() => setPackScanMode(false)} className={`px-3 py-1 text-xs rounded font-bold transition-colors ${!packScanMode ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Manual</button>
                                                                <button onClick={() => setPackScanMode(true)} className={`px-3 py-1 text-xs rounded font-bold transition-colors ${packScanMode ? 'bg-cyber-primary text-black' : 'text-gray-500'}`}>Scanner</button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Scanner */}
                                                    {packScanMode && (
                                                        <div className="p-4 border-b border-white/5 bg-black/10">
                                                            <form onSubmit={(e) => {
                                                                e.preventDefault();
                                                                if (!packScanInput.trim()) return;
                                                                const matchingItemIndex = currentPackJob.lineItems.findIndex((item) => {
                                                                    const product = filteredProducts.find(p => p.id === item.productId);
                                                                    return product?.sku?.toLowerCase() === packScanInput.toLowerCase() ||
                                                                        product?.barcode?.toLowerCase() === packScanInput.toLowerCase() ||
                                                                        item.name.toLowerCase().includes(packScanInput.toLowerCase());
                                                                });
                                                                if (matchingItemIndex !== -1) {
                                                                    const item = currentPackJob.lineItems[matchingItemIndex];
                                                                    if (item.status !== 'Picked') {
                                                                        updateJobItem(currentPackJob.id, matchingItemIndex, 'Picked', item.expectedQty);
                                                                        addNotification('success', `Packed: ${item.name}`);
                                                                    } else {
                                                                        addNotification('info', `Already packed: ${item.name}`);
                                                                    }
                                                                } else {
                                                                    addNotification('alert', `Item not found: ${packScanInput}`);
                                                                }
                                                                setPackScanInput('');
                                                            }}>
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={packScanInput}
                                                                    onChange={(e) => setPackScanInput(e.target.value)}
                                                                    placeholder="Scan item SKU or barcode..."
                                                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyber-primary"
                                                                />
                                                            </form>
                                                        </div>
                                                    )}

                                                    {/* Items List */}
                                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                                        {currentPackJob.lineItems.map((item, i) => {
                                                            const product = filteredProducts.find(p => p.id === item.productId);
                                                            const isPacked = item.status === 'Picked' || item.status === 'Completed';
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => !packScanMode && updateJobItem(currentPackJob.id, i, isPacked ? 'Pending' : 'Picked', item.expectedQty)}
                                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isPacked ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                                >
                                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isPacked ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                                                                        {isPacked && <CheckCircle size={14} className="text-black" />}
                                                                    </div>
                                                                    <div className="w-12 h-12 rounded bg-black flex items-center justify-center overflow-hidden">
                                                                        {product?.image && !product.image.includes('placeholder.com') ? (
                                                                            <img
                                                                                src={product.image}
                                                                                alt=""
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Package size={20} className="text-gray-600" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className={`font-medium ${isPacked ? 'text-gray-400 line-through' : 'text-white'}`}>{item.name}</p>
                                                                        <p className="text-xs text-gray-500">Qty: {item.expectedQty} • SKU: {product?.sku || 'N/A'}</p>
                                                                    </div>
                                                                    {(product?.category === 'Frozen' || product?.category === 'Dairy') && <Snowflake size={16} className="text-blue-400" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Right Column: Actions */}
                                                <div className="w-full lg:w-80 flex flex-col gap-6">
                                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5">
                                                        <div className="flex justify-between items-end mb-2">
                                                            <span className="text-sm text-gray-400">Progress</span>
                                                            <span className="text-xl font-mono font-bold text-white">{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                            {/* eslint-disable-next-line */}
                                                            <div className={`h-full bg-cyber-primary transition-all duration-300 w-[${Math.round(progress)}%]`} />
                                                        </div>
                                                    </div>

                                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 space-y-4">
                                                        <select value={boxSize} onChange={(e) => setBoxSize(e.target.value as any)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-cyber-primary" aria-label="Box Size">
                                                            <option value="Small">{t('warehouse.boxSmall')}</option>
                                                            <option value="Medium">{t('warehouse.boxMedium')}</option>
                                                            <option value="Large">{t('warehouse.boxLarge')}</option>
                                                            <option value="Extra Large">{t('warehouse.boxXL')}</option>
                                                        </select>
                                                        {hasFragileItems && (
                                                            <div className="pt-2 border-t border-white/5">
                                                                <p className="text-xs text-red-400 font-bold uppercase mb-2 flex items-center gap-1"><AlertTriangle size={10} /> Fragile Items</p>
                                                                <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={packingMaterials.bubbleWrap} onChange={e => setPackingMaterials({ ...packingMaterials, bubbleWrap: e.target.checked })} className="accent-cyber-primary" /><span className="text-sm text-gray-300">Bubble Wrap</span></label>
                                                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={packingMaterials.fragileStickers} onChange={e => setPackingMaterials({ ...packingMaterials, fragileStickers: e.target.checked })} className="accent-cyber-primary" /><span className="text-sm text-gray-300">Stickers</span></label>
                                                            </div>
                                                        )}
                                                        {hasColdItems && (
                                                            <div className="pt-2 border-t border-white/5">
                                                                <p className="text-xs text-blue-400 font-bold uppercase mb-2 flex items-center gap-1"><Snowflake size={10} /> Cold Items</p>
                                                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasIcePack} onChange={e => setHasIcePack(e.target.checked)} className="accent-cyber-primary" /><span className="text-sm text-gray-300">Ice Packs</span></label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto flex gap-3">
                                                        <button
                                                            onClick={async () => {
                                                                if (loadingActions[`print-${currentPackJob.id}`]) return;
                                                                setLoadingActions(prev => ({ ...prev, [`print-${currentPackJob.id}`]: true }));
                                                                try {
                                                                    const packLabelData: PackLabelData = {
                                                                        orderRef: currentPackJob.orderRef || currentPackJob.id,
                                                                        itemCount: totalItems,
                                                                        packDate: formatDateTime(new Date()),
                                                                        packerName: user?.name,
                                                                        specialHandling: { coldChain: hasColdItems, fragile: packingMaterials.bubbleWrap || packingMaterials.fragileStickers, perishable: hasColdItems },
                                                                        destSiteName: currentPackJob.destSiteId ? sites.find(s => s.id === currentPackJob.destSiteId)?.name : undefined
                                                                    };
                                                                    const html = await generatePackLabelHTML(packLabelData, { size: reprintSize, format: reprintFormat });
                                                                    const printWindow = window.open('', '_blank');
                                                                    if (printWindow) {
                                                                        printWindow.document.write(html);
                                                                        setTimeout(() => { printWindow.document.close(); printWindow.print(); }, 500);
                                                                        setLabelPrinted(true);
                                                                        addNotification('success', 'Label generated!');
                                                                    }
                                                                } catch (err) { console.error(err); addNotification('alert', 'Failed to generate label'); }
                                                                finally { setLoadingActions(prev => ({ ...prev, [`print-${currentPackJob.id}`]: false })); }
                                                            }}
                                                            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all"
                                                        >
                                                            {loadingActions[`print-${currentPackJob.id}`] ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} Print
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (loadingActions[currentPackJob.id]) return;
                                                                if (packedCount < totalItems) { addNotification('alert', 'Pack all items first.'); return; }
                                                                if (hasColdItems && !hasIcePack) { addNotification('alert', 'Ice packs required!'); return; }
                                                                setLoadingActions(prev => ({ ...prev, [currentPackJob.id]: true }));
                                                                try {
                                                                    const result = await completeJob(currentPackJob.id, user?.name || 'Packer', true);
                                                                    if (result && result.points > 0) {
                                                                        setEarnedPoints({ points: result.points, message: `Order Packed!`, bonuses: result.breakdown });
                                                                        setShowPointsPopup(true);
                                                                    }
                                                                    addNotification('success', 'Order Packed!');
                                                                    setSelectedPackJob(null);
                                                                    setLabelPrinted(false);
                                                                } catch (err: any) { addNotification('alert', err?.message || 'Error'); }
                                                                finally { setLoadingActions(prev => ({ ...prev, [currentPackJob.id]: false })); }
                                                            }}
                                                            disabled={packedCount < totalItems}
                                                            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${packedCount === totalItems ? 'bg-cyber-primary text-black hover:bg-cyber-accent' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                                                        >
                                                            {loadingActions[currentPackJob.id] ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Complete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="space-y-6 pb-6 overflow-y-auto h-full px-4 pt-4">
                                        {(() => {
                                            // Using top-level paginatedPackJobs


                                            return (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-cyber-primary animate-pulse"></div>
                                                            <h3 className="text-lg font-bold text-white">Packing Jobs</h3>
                                                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{filteredPackJobs.length}</span>
                                                        </div>
                                                    </div>

                                                    {filteredPackJobs.length > 0 ? (
                                                        <>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                                {paginatedPackJobs.map(job => {
                                                                    const totalItems = job.lineItems?.length || 0;
                                                                    const destSite = sites.find(s => s.id === job.destSiteId);
                                                                    const isCompleted = job.status === 'Completed';

                                                                    return (
                                                                        <div
                                                                            key={job.id}
                                                                            onClick={() => {
                                                                                if (!isCompleted) {
                                                                                    setSelectedPackJob(job.id);
                                                                                    setPackScanMode(false);
                                                                                }
                                                                            }}
                                                                            className={`bg-cyber-gray border rounded-xl p-5 hover:border-white/20 transition-all flex flex-col ${!isCompleted ? 'cursor-pointer' : ''} ${job.status === 'In-Progress' ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : isCompleted ? 'border-green-500/30 opacity-80' : 'border-yellow-500/30'}`}
                                                                        >
                                                                            <div className="flex justify-between items-start mb-4">
                                                                                <div>
                                                                                    <span className="text-white font-mono font-bold text-lg">{formatJobId(job)}</span>
                                                                                    {isCompleted && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold">Completed</span>}
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.status === 'In-Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{job.status}</span>
                                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : job.priority === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-400'}`}>{job.priority}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {destSite && (
                                                                                <div className="mb-4 p-3 bg-black/20 rounded-lg">
                                                                                    <p className="text-xs text-gray-400 mb-1">Destination</p>
                                                                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                                                        <MapPin size={14} className="text-cyber-primary" />
                                                                                        {destSite.name}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Package size={14} className="text-gray-500" />
                                                                                    <span className="text-sm text-gray-300">{totalItems} items</span>
                                                                                </div>

                                                                                {isCompleted ? (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setPackReprintJob({
                                                                                                id: job.id,
                                                                                                orderRef: job.orderRef || job.id,
                                                                                                itemCount: totalItems,
                                                                                                destSiteName: destSite?.name
                                                                                            });
                                                                                        }}
                                                                                        className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase py-1.5 px-3 rounded transition-all"
                                                                                    >
                                                                                        <Printer size={12} /> Reprint
                                                                                    </button>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1 text-cyber-primary text-xs font-bold uppercase">
                                                                                        Start Packing <ArrowRight size={14} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Pagination Controls */}
                                                            {filteredPackJobs.length > 0 && (
                                                                <Pagination
                                                                    currentPage={packCurrentPage}
                                                                    totalPages={packJobsTotalPages}
                                                                    totalItems={filteredPackJobs.length}
                                                                    itemsPerPage={PACK_ITEMS_PER_PAGE}
                                                                    onPageChange={setPackCurrentPage}
                                                                    isLoading={false}
                                                                    itemName="jobs"
                                                                />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                                            <Package size={32} className="mb-4 opacity-50" />
                                                            <p>No packing jobs found matching your filters.</p>
                                                        </div>
                                                    )}
                                                    {/* Standardized PACK History Section */}
                                                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 mt-12">
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                                            <div>
                                                                <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                                                    <HistoryIcon size={18} className="text-cyber-primary" />
                                                                    Packing History
                                                                </h4>
                                                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Recent mission achievements</p>
                                                            </div>

                                                            {/* History Search */}
                                                            <div className="relative w-full md:w-72">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search history archives..."
                                                                    value={packHistorySearch}
                                                                    onChange={(e) => setPackHistorySearch(e.target.value)}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all font-mono"
                                                                />
                                                            </div>
                                                        </div>

                                                        {paginatedPackHistory.length > 0 ? (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {paginatedPackHistory.map((job: any) => {
                                                                        const destSite = sites.find(s => s.id === job.destSiteId);
                                                                        return (
                                                                            <div
                                                                                key={job.id}
                                                                                onClick={() => {
                                                                                    setSelectedJob(job);
                                                                                    setIsDetailsOpen(true);
                                                                                }}
                                                                                className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-cyber-primary/30 transition-all group cursor-pointer"
                                                                            >
                                                                                <div className="flex justify-between items-start mb-3">
                                                                                    <span className="text-[10px] font-mono text-cyber-primary font-bold">{job.id.slice(0, 8)}</span>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'Cancelled' ? 'bg-red-500' : 'bg-green-500'}`} />
                                                                                        <span className={`text-[9px] uppercase font-black ${job.status === 'Cancelled' ? 'text-red-400' : 'text-green-400'}`}>{job.status}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Package size={10} className="text-gray-600" />
                                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate">REF: {job.orderRef || 'INTERNAL'}</p>
                                                                                    </div>
                                                                                    {destSite && (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <MapPin size={10} className="text-gray-600" />
                                                                                            <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{destSite.name}</p>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex justify-between items-end mt-4">
                                                                                        <p className="text-[9px] text-gray-600 font-mono italic">{formatDateTime(job.updatedAt || job.createdAt)}</p>
                                                                                        <div className="text-right">
                                                                                            <p className="text-white font-black text-xs leading-none">{job.items || 0}</p>
                                                                                            <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Payload items</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <Pagination
                                                                    currentPage={packHistoryPage}
                                                                    totalPages={packHistoryTotalPages}
                                                                    totalItems={filteredPackHistory.length}
                                                                    itemsPerPage={PACK_HISTORY_PER_PAGE}
                                                                    onPageChange={setPackHistoryPage}
                                                                    itemName="history"
                                                                />
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-16 bg-black/20 rounded-2xl border border-dashed border-white/5">
                                                                <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
                                                                    <HistoryIcon size={32} className="text-gray-700" />
                                                                </div>
                                                                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No matching mission achieves found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }




                {/* --- ASSIGN TAB (Job Assignment Center) --- */}
                {
                    activeTab === 'ASSIGN' && canAccessTab('ASSIGN') && (
                        <div className="flex-1 overflow-y-auto space-y-6">


                            {/* JOB ASSIGNMENT CENTER */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/40 relative overflow-hidden group">
                                {/* Decorative Gradient Background */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyber-primary/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-cyber-primary/20 transition-colors duration-700" />

                                <h3 className="font-extrabold text-white mb-6 flex items-center gap-3 text-xl tracking-tight">
                                    <div className="p-2 bg-cyber-primary/20 rounded-xl">
                                        <ClipboardList className="text-cyber-primary" size={24} />
                                    </div>
                                    Job Assignment Center
                                </h3>

                                {/* Simplified Unified Filters */}
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    {/* Intelligence Filter Dropdown (Type + Priority) */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsAssignFilterDropdownOpen(!isAssignFilterDropdownOpen)}
                                            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-xs font-black text-gray-400 hover:text-white transition-all whitespace-nowrap"
                                        >
                                            <Filter size={14} className={assignJobFilter !== 'ALL' || dispatchPriorityFilter !== 'ALL' ? 'text-cyber-primary' : ''} />
                                            <span>FILTER: {assignJobFilter === 'ALL' ? 'ALL JOBS' : assignJobFilter} {dispatchPriorityFilter !== 'ALL' ? `(${dispatchPriorityFilter})` : ''}</span>
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${isAssignFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isAssignFilterDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[50]" onClick={() => setIsAssignFilterDropdownOpen(false)} />
                                                <div className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="space-y-4">
                                                        {/* Type Section */}
                                                        <div>
                                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 px-2">Job Intelligence Type</p>
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {['ALL', 'PICK', 'PACK', 'PUTAWAY', 'DISPATCH'].map(type => (
                                                                    <button
                                                                        key={type}
                                                                        onClick={() => setAssignJobFilter(type as any)}
                                                                        className={`text-left px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${assignJobFilter === type
                                                                            ? 'bg-cyber-primary text-black'
                                                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {type}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Priority Section */}
                                                        <div className="pt-2 border-t border-white/5">
                                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 px-2">Operational Priority</p>
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {['ALL', 'Critical', 'High', 'Normal'].map(priority => (
                                                                    <button
                                                                        key={priority}
                                                                        onClick={() => setDispatchPriorityFilter(priority as any)}
                                                                        className={`text-left px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${dispatchPriorityFilter === priority
                                                                            ? 'bg-cyber-primary text-black'
                                                                            : priority === 'Critical' ? 'text-red-500/60 hover:text-red-400 hover:bg-red-500/5' :
                                                                                priority === 'High' ? 'text-orange-500/60 hover:text-orange-400 hover:bg-orange-500/5' :
                                                                                    'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {priority.toUpperCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Sort By Dropdown */}
                                    <SortDropdown
                                        label="Sort"
                                        options={[
                                            { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                                            { id: 'date', label: 'Date', icon: <Clock size={12} /> },
                                            { id: 'items', label: 'Items', icon: <List size={12} /> }
                                        ]}
                                        value={assignSortBy}
                                        onChange={(val) => setAssignSortBy(val)}
                                        isOpen={isAssignSortDropdownOpen}
                                        setIsOpen={setIsAssignSortDropdownOpen}
                                    />

                                    {/* ID Search Input */}
                                    <div className="flex-1 min-w-[150px]">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search size={12} className="text-gray-600 group-focus-within:text-cyber-primary transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Payload ID Intelligence..."
                                                value={dispatchSearch}
                                                onChange={(e) => setDispatchSearch(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-[10px] font-bold tracking-tight focus:border-cyber-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] md:h-96">
                                    {/* Pending Jobs */}
                                    <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-xl">
                                        <div className="p-4 border-b border-white/5 bg-white/5 font-black text-[10px] text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                                                <span>{t('warehouse.pendingJobs')}</span>
                                                <span className="bg-cyber-primary/10 text-cyber-primary px-2 py-0.5 rounded-full border border-cyber-primary/20 ml-1">
                                                    {(() => {
                                                        let filtered = filteredJobs.filter(j => j.status === 'Pending');
                                                        if (assignJobFilter !== 'ALL') filtered = filtered.filter(j => j.type === assignJobFilter);
                                                        if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority === dispatchPriorityFilter);
                                                        if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));
                                                        return filtered.length;
                                                    })()}
                                                </span>
                                            </div>
                                            {!selectedJob && filteredJobs.filter(j => j.status === 'Pending').length > 0 && (
                                                <span className="text-[10px] text-blue-400/60 normal-case font-medium flex items-center gap-1">
                                                    <ArrowRight size={10} /> {t('warehouse.selectJobToAssign')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                            {(() => {
                                                let filtered = filteredJobs.filter(j => j.status === 'Pending');
                                                if (assignJobFilter !== 'ALL') filtered = filtered.filter(j => j.type === assignJobFilter);
                                                if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority === dispatchPriorityFilter);
                                                if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));

                                                // Sort based on selected sort option
                                                filtered.sort((a, b) => {
                                                    if (assignSortBy === 'priority') {
                                                        const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                                                        return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
                                                    } else if (assignSortBy === 'date') {
                                                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                                                    } else if (assignSortBy === 'items') {
                                                        return (b.items || 0) - (a.items || 0);
                                                    }
                                                    return 0;
                                                });

                                                return filtered.map(job => {
                                                    // Calculate estimated duration
                                                    let estimatedDuration = 15;
                                                    if (job.type === 'PICK') estimatedDuration = Math.max(15, job.items * 3);
                                                    else if (job.type === 'PACK') estimatedDuration = Math.max(10, job.items * 2);
                                                    else if (job.type === 'PUTAWAY') estimatedDuration = Math.max(20, job.items * 4);

                                                    // Find best match employee
                                                    const bestMatchEmployee = employees
                                                        .filter(e => {
                                                            if (!['picker', 'packer', 'dispatcher', 'driver', 'warehouse_manager'].includes(e.role)) return false;
                                                            if (e.status !== 'Active') return false;
                                                            // Role match
                                                            if (job.type === 'PICK' && e.role !== 'picker' && e.role !== 'dispatcher' && e.role !== 'warehouse_manager') return false;
                                                            if (job.type === 'PACK' && e.role !== 'packer' && e.role !== 'dispatcher' && e.role !== 'warehouse_manager') return false;
                                                            if (job.type === 'PUTAWAY' && e.role !== 'dispatcher' && e.role !== 'warehouse_manager') return false;
                                                            if (job.type === 'DISPATCH' && e.role !== 'dispatcher' && e.role !== 'driver' && e.role !== 'warehouse_manager') return false;
                                                            return true;
                                                        })
                                                        .map(e => {
                                                            const activeAssignments = jobAssignments.filter(
                                                                a => a.employeeId === e.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                                            );
                                                            return { employee: e, workload: activeAssignments.length };
                                                        })
                                                        .sort((a, b) => a.workload - b.workload)[0];

                                                    const jobZoneLocked = isZoneLocked(job.location || '');

                                                    return (
                                                        <div
                                                            key={job.id}
                                                            onClick={() => {
                                                                setSelectedJob(job);
                                                                setIsDetailsOpen(false);
                                                            }}
                                                            className={`p-4 rounded-2xl border transition-all duration-300 ${selectedJob?.id === job.id
                                                                ? 'bg-cyber-primary/10 border-cyber-primary shadow-[0_0_20px_rgba(0,255,157,0.15)] scale-[1.02]'
                                                                : jobZoneLocked
                                                                    ? 'bg-red-500/5 border-red-500/20 opacity-60'
                                                                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08] hover:scale-[1.01]'
                                                                } `}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded shadow-sm tracking-tighter uppercase ${job.type === 'PICK' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : job.type === 'PACK' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'} `}>
                                                                            {job.type}
                                                                        </span>
                                                                        <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-tighter uppercase border ${job.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                                            job.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                                                'bg-blue-500/10 text-blue-400/60 border-white/5'
                                                                            } `}>
                                                                            {job.priority}
                                                                        </span>
                                                                        {jobZoneLocked && (
                                                                            <span className="text-[9px] text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-black uppercase tracking-tighter">
                                                                                Locked
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-500 font-mono font-medium tracking-widest">{formatJobId(job)}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {bestMatchEmployee && bestMatchEmployee.workload < 3 && !jobZoneLocked && (
                                                                        <div className="flex items-center justify-center p-1.5 bg-green-500/20 rounded-lg border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)] animate-pulse" title={`${t('warehouse.suggested')}: ${bestMatchEmployee.employee.name} `}>
                                                                            <span className="text-[10px]">💡</span>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedJob(job);
                                                                            setIsDetailsOpen(true);
                                                                        }}
                                                                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Information Row */}
                                                            <div className="flex items-end justify-between">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-sm font-black text-white">{job.items}</span>
                                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{t('warehouse.itemsLabel')}</span>
                                                                    </div>

                                                                    {/* Site Path Indicators */}
                                                                    <div className="flex items-center gap-1.5 pt-1">
                                                                        {job.sourceSiteId && (
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                                                <span className="text-[9px] text-gray-400 uppercase font-black">{sites.find(s => s.id === job.sourceSiteId)?.name.split(' ')[0] || job.sourceSiteId}</span>
                                                                            </div>
                                                                        )}
                                                                        {(job.sourceSiteId && job.destSiteId) && <ArrowRight size={8} className="text-gray-700" />}
                                                                        {job.destSiteId && (
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                                                                <span className="text-[9px] text-gray-400 uppercase font-black">{sites.find(s => s.id === job.destSiteId)?.name.split(' ')[0] || job.destSiteId}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="flex items-center justify-end gap-1 text-gray-500 mb-0.5">
                                                                        <Clock size={10} />
                                                                        <span className="text-[10px] font-black uppercase">ETA</span>
                                                                    </div>
                                                                    <span className="text-xs font-mono font-bold text-gray-400">{estimatedDuration}m</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            {(() => {
                                                let filtered = filteredJobs.filter(j => j.status === 'Pending');
                                                if (assignJobFilter !== 'ALL') filtered = filtered.filter(j => j.type === assignJobFilter);
                                                if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority === dispatchPriorityFilter);
                                                if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));
                                                return filtered.length === 0;
                                            })() && (
                                                    <div className="text-center py-8 text-gray-500 text-sm">{t('warehouse.noPendingJobsMatch')}</div>
                                                )}
                                        </div>
                                    </div>

                                    {/* Available Workers */}
                                    <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-xl">
                                        <div className="p-4 border-b border-white/5 bg-white/5 font-black text-[10px] text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <UsersIcon size={12} className="text-blue-400" />
                                                <span>{t('warehouse.availableStaff')}</span>
                                                <span className="bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-400/20 ml-1">
                                                    {(() => {
                                                        let filtered = filteredEmployees.filter(e =>
                                                            ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) &&
                                                            e.status === 'Active'
                                                        );
                                                        if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role === dispatchEmployeeFilter);
                                                        if (dispatchEmployeeSearch) filtered = filtered.filter(e => e.name.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()));
                                                        return filtered.length;
                                                    })()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Staff Search */}
                                                <div className="relative group">
                                                    <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search staff..."
                                                        value={dispatchEmployeeSearch}
                                                        onChange={(e) => setDispatchEmployeeSearch(e.target.value)}
                                                        className="w-32 bg-black/40 border border-white/10 rounded-xl pl-7 pr-3 py-1.5 text-white text-[10px] focus:border-blue-400/50 outline-none transition-all placeholder:text-gray-600"
                                                    />
                                                </div>

                                                {/* Role Filter Dropdown */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setIsEmployeeRoleDropdownOpen(!isEmployeeRoleDropdownOpen)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-gray-400 hover:text-white transition-all whitespace-nowrap"
                                                    >
                                                        <UserIcon size={12} className={dispatchEmployeeFilter !== 'ALL' ? 'text-blue-400' : ''} />
                                                        <span>ROLE: {dispatchEmployeeFilter.toUpperCase()}</span>
                                                        <ChevronDown size={12} className={`transition-transform duration-300 ${isEmployeeRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {isEmployeeRoleDropdownOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-[50]" onClick={() => setIsEmployeeRoleDropdownOpen(false)} />
                                                            <div className="absolute top-full right-0 mt-2 w-32 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                                                {['ALL', 'picker', 'packer', 'dispatcher'].map(role => (
                                                                    <button
                                                                        key={role}
                                                                        onClick={() => {
                                                                            setDispatchEmployeeFilter(role as any);
                                                                            setIsEmployeeRoleDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${dispatchEmployeeFilter === role
                                                                            ? 'bg-blue-400 text-black shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {role.toUpperCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                            {(() => {
                                                let filtered = filteredEmployees.filter(e =>
                                                    ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) &&
                                                    e.status === 'Active'
                                                );
                                                if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role === dispatchEmployeeFilter);
                                                if (dispatchEmployeeSearch) filtered = filtered.filter(e => e.name.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()));

                                                // Check if selected job matches employee role
                                                const getRoleMatch = (employee: any, job: WMSJob | null) => {
                                                    if (!job) return false;
                                                    if (job.type === 'PICK' && (employee.role === 'picker' || employee.role === 'dispatcher' || employee.role === 'warehouse_manager')) return true;
                                                    if (job.type === 'PACK' && (employee.role === 'packer' || employee.role === 'dispatcher' || employee.role === 'warehouse_manager')) return true;
                                                    if (job.type === 'PUTAWAY' && (employee.role === 'dispatcher' || employee.role === 'warehouse_manager')) return true;
                                                    return false;
                                                };

                                                // Sort by:role match first, then by workload
                                                filtered.sort((a, b) => {
                                                    const aMatch = getRoleMatch(a, selectedJob);
                                                    const bMatch = getRoleMatch(b, selectedJob);
                                                    if (aMatch !== bMatch) return aMatch ? -1 : 1;

                                                    const aWorkload = jobAssignments.filter(
                                                        ass => ass.employeeId === a.id && ['Assigned', 'Accepted', 'In-Progress'].includes(ass.status)
                                                    ).length;
                                                    const bWorkload = jobAssignments.filter(
                                                        ass => ass.employeeId === b.id && ['Assigned', 'Accepted', 'In-Progress'].includes(ass.status)
                                                    ).length;
                                                    return aWorkload - bWorkload;
                                                });

                                                const assignTotalPages = Math.ceil(filtered.length / ASSIGN_ITEMS_PER_PAGE);
                                                const safeAssignPage = Math.min(Math.max(1, assignCurrentPage), Math.max(1, assignTotalPages));
                                                const paginatedEmployees = filtered.slice((safeAssignPage - 1) * ASSIGN_ITEMS_PER_PAGE, safeAssignPage * ASSIGN_ITEMS_PER_PAGE);

                                                return (
                                                    <>
                                                        {paginatedEmployees.map((employee) => {
                                                            // Count active assignments for this employee
                                                            const activeAssignments = jobAssignments.filter(
                                                                a => a.employeeId === employee.id &&
                                                                    ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                                            );
                                                            const workloadCount = activeAssignments.length;
                                                            const isOverloaded = workloadCount >= 3;
                                                            const roleMatch = getRoleMatch(employee, selectedJob);

                                                            // Calculate total estimated time for active jobs
                                                            const totalEstimatedTime = activeAssignments.reduce((sum, ass) => {
                                                                return sum + (ass.estimatedDuration || 0);
                                                            }, 0);

                                                            return (
                                                                <div key={employee.id} className={`p-4 rounded-2xl border transition-all duration-300 ${roleMatch && selectedJob
                                                                    ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                                                                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]'
                                                                    } `}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="relative">
                                                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-sm font-black text-white shadow-lg">
                                                                                {employee.name.charAt(0)}
                                                                            </div>
                                                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${employee.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <div className="text-sm text-gray-200 font-black truncate">{employee.name}</div>
                                                                                {roleMatch && selectedJob && (
                                                                                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/30 font-black uppercase tracking-tighter shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                                                                        Match
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Workload Progress Bar */}
                                                                            <div className="space-y-1.5">
                                                                                <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest">
                                                                                    <span className="text-gray-500">{employee.role}</span>
                                                                                    <span className={isOverloaded ? 'text-red-400' : 'text-gray-400'}>
                                                                                        {workloadCount}/3 {t('warehouse.active')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                                                    <div
                                                                                        className={`h-full transition-all duration-500 ${isOverloaded ? 'bg-red-500' : 'bg-blue-500'} w-[${Math.round((workloadCount / 3) * 100)}%]`}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <Protected permission="ASSIGN_TASKS">
                                                                            <button
                                                                                disabled={!selectedJob || isOverloaded || (selectedJob && isZoneLocked(selectedJob.location || ''))}
                                                                                onClick={async () => {
                                                                                    if (selectedJob) {
                                                                                        if (isZoneLocked(selectedJob.location || '')) {
                                                                                            addNotification('alert', `Cannot assign job: Zone is locked for maintenance.`);
                                                                                            return;
                                                                                        }
                                                                                        await assignJob(selectedJob.id, employee.id);
                                                                                        addNotification('success', `Job assigned to ${employee.name} `);
                                                                                        setSelectedJob(null);
                                                                                    }
                                                                                }}
                                                                                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${!selectedJob || isOverloaded || (selectedJob && isZoneLocked(selectedJob.location || ''))
                                                                                    ? 'bg-white/5 border-white/5 text-gray-700 cursor-not-allowed'
                                                                                    : roleMatch
                                                                                        ? 'bg-blue-500 text-black border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95'
                                                                                        : 'bg-white/10 border-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95'
                                                                                    }`}
                                                                                title={
                                                                                    isOverloaded
                                                                                        ? 'Full'
                                                                                        : !selectedJob
                                                                                            ? t('warehouse.selectJobFirst')
                                                                                            : 'Assign Task'
                                                                                }
                                                                            >
                                                                                <Plus size={16} />
                                                                            </button>
                                                                        </Protected>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Assign Pagination Controls */}
                                                        {assignTotalPages > 1 && (
                                                            <div className="flex items-center justify-center gap-4 py-4 border-t border-white/5">
                                                                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full border border-white/5">
                                                                    <button
                                                                        onClick={() => setAssignCurrentPage(prev => Math.max(1, prev - 1))}
                                                                        disabled={safeAssignPage === 1}
                                                                        title="Previous Page"
                                                                        aria-label="Previous Page"
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-all"
                                                                    >
                                                                        <ChevronDown className="rotate-90" size={14} />
                                                                    </button>
                                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                                                                        Page <span className="text-white">{safeAssignPage}</span> of {assignTotalPages}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setAssignCurrentPage(prev => Math.min(assignTotalPages, prev + 1))}
                                                                        disabled={safeAssignPage === assignTotalPages}
                                                                        title="Next Page"
                                                                        aria-label="Next Page"
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-all"
                                                                    >
                                                                        <ChevronDown className="-rotate-90" size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                            {filteredEmployees.filter(e =>
                                                ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) &&
                                                e.status === 'Active'
                                            ).length === 0 && (
                                                    <div className="text-center py-8 text-gray-500 text-sm">
                                                        No warehouse staff available
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                {/* Selected Job Details */}
                                {selectedJob && isDetailsOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-300">
                                        <div className="bg-[#0a0a0b]/90 border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,157,0.05)] flex flex-col relative">
                                            {/* Top Accent Bar */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-primary/40 to-transparent" />

                                            {/* Header */}
                                            <div className="p-8 border-b border-white/5 flex justify-between items-start bg-black/20">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <h2 className="text-2xl font-black text-white tracking-tight">Job Intelligence</h2>
                                                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{selectedJob.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border ${selectedJob.type === 'TRANSFER' ? 'border-cyber-primary/30 text-cyber-primary bg-cyber-primary/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10'} `}>
                                                            {selectedJob.type}
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-gray-700" />
                                                        <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{selectedJob.status}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setIsDetailsOpen(false)}
                                                    aria-label="Close"
                                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all hover:rotate-90 duration-300"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Body */}
                                            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                                                {/* Route/Info Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Source/Dest */}
                                                    {(selectedJob.sourceSiteId || selectedJob.destSiteId) && (
                                                        <div className="bg-white/5 rounded-[24px] p-6 border border-white/5 relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                                                <Truck size={24} className="text-cyber-primary" />
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Logistics Route</p>
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-1">
                                                                    <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Origin</p>
                                                                    <p className="font-black text-white truncate text-sm">{sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId || 'N/A'}</p>
                                                                </div>
                                                                <div className="p-2 bg-cyber-primary/10 rounded-full border border-cyber-primary/20">
                                                                    <ArrowRight className="text-cyber-primary" size={16} />
                                                                </div>
                                                                <div className="flex-1 text-right">
                                                                    <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Destination</p>
                                                                    <p className="font-black text-white truncate text-sm">{sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Operations Matrix */}
                                                    <div className="bg-white/5 rounded-[24px] p-6 border border-white/5 space-y-4">
                                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Operations Matrix</p>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Requested By</span>
                                                                <span className="text-white font-black text-xs">{selectedJob.requestedBy || 'System Terminal'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Auth Authority</span>
                                                                <span className="text-white font-black text-xs">{selectedJob.approvedBy || 'Pending Auth'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Timestamp</span>
                                                                <span className="text-white font-mono text-[10px] font-bold">
                                                                    {formatDateTime(selectedJob.createdAt || new Date())}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Manifest List */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-black text-white flex items-center gap-3 text-sm uppercase tracking-widest">
                                                            <div className="p-1.5 bg-cyber-primary/20 rounded-lg">
                                                                <Package size={14} className="text-cyber-primary" />
                                                            </div>
                                                            Inventory Manifest
                                                        </h3>
                                                        <span className="text-[10px] font-mono text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                            {selectedJob.lineItems?.length || selectedJob.items || 0} UNI
                                                        </span>
                                                    </div>

                                                    <div className="bg-white/5 rounded-[24px] border border-white/5 overflow-hidden shadow-inner shadow-black/20">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-[9px] text-gray-600 bg-white/[0.02] uppercase font-black tracking-widest border-b border-white/5">
                                                                <tr>
                                                                    <th className="px-6 py-4">{t('warehouse.intelligence')}</th>
                                                                    <th className="px-6 py-4 text-center">{t('warehouse.volume')}</th>
                                                                    <th className="px-6 py-4 text-right">{t('warehouse.state')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/[0.02]">
                                                                {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                                                        <td className="px-6 py-4">
                                                                            <p className="text-gray-200 font-black mb-0.5">{item.name}</p>
                                                                            <p className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">{item.sku}</p>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-center">
                                                                            <span className="font-black text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                                                {item.expectedQty}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter ${item.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                                item.status === 'Discrepancy' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                                    'bg-white/10 text-gray-500 border border-white/5'
                                                                                }`}>
                                                                                {item.status || 'Verified'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )) : (
                                                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-600 font-black uppercase tracking-widest text-[10px] italic opacity-50">Operational Payload Empty</td></tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="p-8 border-t border-white/5 bg-black/40 flex justify-end gap-3 backdrop-blur-md">
                                                <button
                                                    onClick={() => setIsDetailsOpen(false)}
                                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ACTIVE ASSIGNMENT HUB */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 blur-[80px] rounded-full pointer-events-none" />

                                <h3 className="font-extrabold text-white mb-6 flex items-center gap-3 text-xl tracking-tight">
                                    <div className="p-2 bg-green-500/20 rounded-xl">
                                        <ClipboardCheck className="text-green-400" size={24} />
                                    </div>
                                    Live Operations Matrix
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {employees
                                        .filter(e => ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) && e.status === 'Active')
                                        .map(employee => {
                                            const employeeAssignments = jobAssignments.filter(
                                                a => a.employeeId === employee.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                            );
                                            const employeeJobs = filteredJobs.filter(j =>
                                                employeeAssignments.some(a => a.jobId === j.id)
                                            );

                                            if (employeeJobs.length === 0) return null;

                                            return (
                                                <div key={employee.id} className="bg-white/5 backdrop-blur-md rounded-[24px] border border-white/5 p-5 relative overflow-hidden group hover:bg-white/[0.08] transition-all duration-500">
                                                    {/* Status Glow */}
                                                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-green-500/10 blur-[40px] rounded-full group-hover:bg-green-500/20 transition-colors" />

                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyber-primary/20 via-white/5 to-white/10 border border-white/10 flex items-center justify-center text-lg font-black text-cyber-primary shadow-inner">
                                                                {employee.name.charAt(0)}
                                                            </div>
                                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0d0e12] animate-pulse" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white tracking-tight">{employee.name}</p>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">{employee.role}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {employeeJobs.map(job => (
                                                            <div key={job.id} className="p-3 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/job">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg tracking-widest uppercase ${job.type === 'PICK' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                        job.type === 'PACK' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                                        }`}>
                                                                        {job.type}
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-600 font-mono font-bold tracking-tighter">{formatJobId(job)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                                                                        <Layers size={10} className="text-gray-600" />
                                                                        {job.items} PAYLOADS
                                                                    </p>
                                                                    <ChevronRight size={12} className="text-gray-700 group-hover/job:text-white group-hover/job:translate-x-0.5 transition-all" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                        .filter(Boolean)}
                                    {jobAssignments.filter(a => ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)).length === 0 && (
                                        <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                                            No active assignments
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Printer size={20} className="text-cyber-primary" /> Label Printing Hub</h3>

                                    <div className="flex gap-4 mb-6">
                                        <button onClick={() => setLabelMode('PRODUCT')} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${labelMode === 'PRODUCT' ? 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary' : 'border-white/10 text-gray-400'} `}>Product Labels</button>
                                        <button onClick={() => setLabelMode('BIN')} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${labelMode === 'BIN' ? 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary' : 'border-white/10 text-gray-400'} `}>Rack Labels</button>
                                    </div>

                                    {/* Format Selection-Secondary Option */}
                                    <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/5">
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Label Format</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setLabelFormat('BARCODE')}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${labelFormat === 'BARCODE' ? 'bg-white/10 text-white border-white/20' : 'border-white/5 text-gray-500 hover:bg-white/5'} `}
                                            >
                                                📊 Barcode (Default)
                                            </button>
                                            <button
                                                onClick={() => setLabelFormat('QR')}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${labelFormat === 'QR' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'border-white/5 text-gray-500 hover:bg-white/5'} `}
                                            >
                                                📱 QR Code
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            💡 {labelFormat === 'BARCODE' ? 'Standard barcode labels for traditional scanners' : 'QR codes for mobile devices and cameras'}
                                        </p>
                                    </div>

                                    {labelMode === 'BIN' ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <input title="Bin Zone" id="bin-zone-input" className="bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="Zone (A)" />
                                                <input title="Aisle Number" id="bin-aisle-input" className="bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="Aisle (01)" />
                                                <input title="Bin Range" id="bin-bin-input" className="bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="Bin Range (01-10)" />
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                💡 Enter bin range like "01-10" to generate multiple labels, or single bin like "01" for one label
                                            </div>
                                            {/* Label Size Selector */}
                                            <div className="flex gap-2 mb-4">
                                                {(['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'] as const).map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setLabelSize(size)}
                                                        className={`flex-1 py-2 rounded text-xs font-bold transition-all ${labelSize === size
                                                            ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                            } `}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={async () => {
                                                    const zoneInput = document.getElementById('bin-zone-input') as HTMLInputElement;
                                                    const aisleInput = document.getElementById('bin-aisle-input') as HTMLInputElement;
                                                    const binInput = document.getElementById('bin-bin-input') as HTMLInputElement;

                                                    const zone = zoneInput?.value.trim().toUpperCase() || 'A';
                                                    const aisle = aisleInput?.value.trim().padStart(2, '0') || '01';
                                                    const binValue = binInput?.value.trim() || '01';

                                                    // Parse bin range (e.g., "01-10" or just "01")
                                                    let binStart = 1;
                                                    let binEnd = 1;
                                                    if (binValue.includes('-')) {
                                                        const [start, end] = binValue.split('-').map(s => parseInt(s.trim()) || 1);
                                                        binStart = Math.min(start, end);
                                                        binEnd = Math.max(start, end);
                                                    } else {
                                                        binStart = parseInt(binValue) || 1;
                                                        binEnd = binStart;
                                                    }

                                                    // Generate all bin locations
                                                    const binLocations: string[] = [];
                                                    for (let bin = binStart; bin <= binEnd; bin++) {
                                                        const binStr = String(bin).padStart(2, '0');
                                                        binLocations.push(`${zone} -${aisle} -${binStr} `);
                                                    }

                                                    // Define label dimensions based on size
                                                    const sizeConfig = {
                                                        TINY: { width: '1.6in', height: '0.8in', cssHeight: '0.8in', fontSize: '7px', padding: '4px' },
                                                        SMALL: { width: '1.8in', height: '1in', cssHeight: '1in', fontSize: '8px', padding: '6px' },
                                                        MEDIUM: { width: '2.4in', height: '1.6in', cssHeight: '1.6in', fontSize: '9px', padding: '8px' },
                                                        LARGE: { width: '3.2in', height: '2.4in', cssHeight: '2.4in', fontSize: '11px', padding: '12px' },
                                                        XL: { width: '6.4in', height: '4.4in', cssHeight: '4.4in', fontSize: '14px', padding: '16px' }
                                                    }[labelSize];

                                                    if (labelFormat === 'QR') {
                                                        // Generate QR code labels for multiple bin locations (modern QR generator utility)
                                                        const labelsHTML = await Promise.all(
                                                            binLocations.map(loc =>
                                                                generateQRCodeLabelHTML(
                                                                    loc,
                                                                    'Warehouse Location',
                                                                    'Scan to navigate',
                                                                    labelSize === 'TINY' ? 100 : 150,
                                                                    sizeConfig.width,
                                                                    sizeConfig.height
                                                                )
                                                            )
                                                        );

                                                        const printWindow = window.open('', '_blank');
                                                        if (printWindow) {
                                                            // Combine all labels into a single printable document
                                                            const combinedHTML =
                                                                labelsHTML
                                                                    .map((html, idx) =>
                                                                        html
                                                                            .replace('</body>', '')
                                                                            .replace('</html>', '') +
                                                                        (idx < labelsHTML.length - 1
                                                                            ? '<div style="page-break-after:always;"></div>'
                                                                            : '')
                                                                    )
                                                                    .join('') + '</body></html>';

                                                            printWindow.document.write(combinedHTML);
                                                            printWindow.document.close();
                                                            setTimeout(() => {
                                                                printWindow.print();
                                                            }, 500);
                                                            addNotification('success', `${binLocations.length} QR code labels ready to print!`);
                                                        } else {
                                                            addNotification('alert', 'Please allow popups to print labels');
                                                        }
                                                    } else {
                                                        // Generate barcode labels for all bin locations using npm-based generator (no CDN)
                                                        const labels = binLocations.map(loc => ({
                                                            value: loc,
                                                            label: `Warehouse Location ${loc} `
                                                        }));

                                                        const barcodeLabelHTML = generateBatchBarcodeLabelsHTML(labels, {
                                                            paperSize: `${sizeConfig.width} ${sizeConfig.height} `,
                                                            width: labelSize === 'TINY' ? 1 : (labelSize === 'XL' ? 3 : 2),
                                                            height: labelSize === 'TINY' ? 30 : (labelSize === 'XL' ? 150 : 50),
                                                            fontSize: parseInt(sizeConfig.fontSize)
                                                        });

                                                        const printWindow = window.open('', '_blank');
                                                        if (printWindow) {
                                                            printWindow.document.write(barcodeLabelHTML);
                                                            printWindow.document.close();
                                                            setTimeout(() => {
                                                                printWindow.print();
                                                            }, 500);
                                                            addNotification('success', `${binLocations.length} unique rack labels ready to print!`);
                                                        } else {
                                                            addNotification('alert', 'Please allow popups to print labels');
                                                        }
                                                    }
                                                }}
                                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/5"
                                            >
                                                {labelFormat === 'QR' ? '📱 Generate QR Labels' : '🖨️ Generate Batch PDF'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <input title="Product SKU" className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder={t('warehouse.scanProductSKU')} id="product-sku-input" />

                                            {/* Label Size Selector */}
                                            <div className="flex gap-2">
                                                {(['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'] as const).map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setLabelSize(size)}
                                                        className={`flex-1 py-2 rounded text-xs font-bold transition-all ${labelSize === size
                                                            ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                            } `}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex gap-4">
                                                <input title="Label Quantity" className="w-24 bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm text-center" placeholder="Qty" defaultValue={1} id="label-qty-input" />
                                                <button
                                                    onClick={async () => {
                                                        const skuInput = document.getElementById('product-sku-input') as HTMLInputElement;
                                                        const sku = skuInput?.value || 'PRODUCT-001';

                                                        // Define label dimensions based on size
                                                        const sizeConfig = {
                                                            TINY: { width: '1.6in', height: '0.8in', cssHeight: '0.8in', fontSize: '7px', padding: '4px' },
                                                            SMALL: { width: '1.8in', height: '1in', cssHeight: '1in', fontSize: '8px', padding: '6px' },
                                                            MEDIUM: { width: '2.4in', height: '1.6in', cssHeight: '1.6in', fontSize: '9px', padding: '8px' },
                                                            LARGE: { width: '3.2in', height: '2.4in', cssHeight: '2.4in', fontSize: '11px', padding: '12px' },
                                                            XL: { width: '6.4in', height: '4.4in', cssHeight: '4.4in', fontSize: '14px', padding: '16px' }
                                                        }[labelSize];

                                                        if (labelFormat === 'QR') {
                                                            // Generate QR code label for product
                                                            const product = filteredProducts.find(p => p.sku === sku || p.id === sku);
                                                            const labelHTML = await generateQRCodeLabelHTML(
                                                                sku,
                                                                product?.name || 'Product',
                                                                `SKU: ${sku} `,
                                                                labelSize === 'TINY' ? 100 : 150,
                                                                sizeConfig.width,
                                                                sizeConfig.height
                                                            );
                                                            const printWindow = window.open('', '_blank');
                                                            if (printWindow) {
                                                                printWindow.document.write(labelHTML);
                                                                printWindow.document.close();
                                                                // Wait for content to load, then trigger print
                                                                setTimeout(() => {
                                                                    printWindow.print();
                                                                }, 250);
                                                                addNotification('success', 'QR code sticker ready to print!');
                                                            } else {
                                                                addNotification('alert', 'Please allow popups to print labels');
                                                            }
                                                        } else {
                                                            // Generate barcode labels for products
                                                            const qtyInput = document.getElementById('label-qty-input') as HTMLInputElement;
                                                            const qty = parseInt(qtyInput?.value || '1');
                                                            const product = filteredProducts.find(p => p.sku === sku || p.id === sku);
                                                            const cleanSKU = sku.replace(/[^A-Z0-9]/gi, '').toUpperCase();

                                                            // Pre-generate all barcodes
                                                            const labelPromises: Promise<string>[] = [];
                                                            for (let i = 0; i < qty; i++) {
                                                                const unitNumber = i + 1;
                                                                // Create unique barcode value: SKU + unit number
                                                                const uniqueBarcodeValue = cleanSKU.length > 4
                                                                    ? cleanSKU.substring(0, 4) + unitNumber.toString().padStart(2, '0')
                                                                    : cleanSKU + unitNumber.toString().padStart(2, '0');
                                                                // Take last 6 chars for compact barcode
                                                                const shortValue = uniqueBarcodeValue.length > 6 ? uniqueBarcodeValue.substring(uniqueBarcodeValue.length - 6) : uniqueBarcodeValue;

                                                                // Generate barcode SVG
                                                                const barcodeSVG = generateBarcodeSVG(shortValue, {
                                                                    width: labelSize === 'TINY' ? 1 : (labelSize === 'XL' ? 3 : 2),
                                                                    height: labelSize === 'TINY' ? 30 : (labelSize === 'XL' ? 150 : 50),
                                                                    displayValue: true,
                                                                    fontSize: parseInt(sizeConfig.fontSize),
                                                                    textMargin: 2,
                                                                    margin: 2
                                                                });

                                                                const labelHTML = `
    < div class="label-container" >
                                                                <div class="product-name" style="font-size: ${parseInt(sizeConfig.fontSize) + 2}px; font-weight:bold; margin-bottom: 5px;">${product?.name || 'Product'}</div>
                                                                <div class="barcode-container">
                                                                    ${barcodeSVG}
                                                                </div>
                                                                <div class="sku" style="font-size: ${sizeConfig.fontSize}; margin-top: 5px;">SKU: ${sku} | Unit: ${unitNumber}/${qty}</div>
                                                            </div>
    `;

                                                                labelPromises.push(Promise.resolve(labelHTML));
                                                            }
                                                            try {
                                                                const labelHTMLs = await Promise.all(labelPromises);

                                                                const barcodeLabelHTML = `
    < !DOCTYPE html >
        <html>
            <head>
                <title>Product Labels</title>
                <style>
                    @page {size:auto; margin: 10mm; }
                    body {margin: 0; padding: 10px; font-family: Arial; display:flex; flex-wrap:wrap; gap: 10px; }
                    .label-container {
                        width: ${sizeConfig.width};
                    height: ${sizeConfig.cssHeight};
                    border: 2px solid black;
                    padding: ${sizeConfig.padding};
                    box-sizing:border-box;
                    display:flex;
                    flex-direction:column;
                    justify-content:center;
                    align-items:center;
                    page-break-inside:avoid;
                    background:white;
                    text-align:center;
                                                                        }
                    .no-print {display:block; position:fixed; top: 20px; left: 50%; transform:translateX(-50%); z-index: 1000; background:white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
                    svg {max-width: 100%; height:auto; }
                    @media print { .no-print {display:none !important; } body {padding: 0; } }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <button onclick="window.print()" style="padding: 12px 40px; background: #00ff9d; border:none; border-radius: 8px; cursor:pointer; font-size: 16px; font-weight:bold; margin: 10px;">🖨️ Print All Labels (${qty})</button>
                    <button onclick="window.close()" style="padding: 12px 40px; background: #666; color:white; border:none; border-radius: 8px; cursor:pointer; font-size: 16px; font-weight:bold; margin: 10px;">✕ Close</button>
                </div>
                ${labelHTMLs.join('')}
            </body>
        </html>
`;

                                                                const printWindow = window.open('', '_blank');
                                                                if (printWindow) {
                                                                    printWindow.document.write(barcodeLabelHTML);
                                                                    printWindow.document.close();
                                                                    setTimeout(() => {
                                                                        printWindow.print();
                                                                    }, 500);
                                                                    addNotification('success', `${qty} barcode label(s) ready to print!`);
                                                                } else {
                                                                    addNotification('alert', 'Please allow popups to print labels');
                                                                }
                                                            } catch (error) {
                                                                console.error('Error generating product labels:', error);
                                                                addNotification('alert', 'Error generating labels. Please try again.');
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/5"
                                                >
                                                    {labelFormat === 'QR' ? '📱 Print QR Sticker' : '🖨️ Print Sticker'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Shield size={20} className="text-red-400" /> Zone Management</h3>
                                    <div className="space-y-2 h-64 overflow-y-auto pr-2">
                                        {['A-01', 'A-02', 'B-01', 'C-01 (Cold)'].map(aisle => {
                                            const isLocked = lockedZones.has(aisle);
                                            const maintenanceReason = zoneMaintenanceReasons[aisle] || '';

                                            return (
                                                <div key={aisle} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${isLocked
                                                    ? 'bg-red-500/10 border-red-500/30'
                                                    : 'bg-white/5 border-white/5'
                                                    } `}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-white font-bold">{aisle}</span>
                                                            {isLocked && (
                                                                <span className="text-[10px] text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                                                                    🔒 Locked
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isLocked && maintenanceReason && (
                                                            <p className="text-[10px] text-gray-400 mt-1">{maintenanceReason}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!isLocked ? (
                                                            <>
                                                                <button
                                                                    className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30"
                                                                    disabled
                                                                >
                                                                    Active
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setZoneToLock(aisle);
                                                                        setZoneLockReason('');
                                                                        setShowZoneLockModal(true);
                                                                    }}
                                                                    className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                                                >
                                                                    Lock
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setLockedZones(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.delete(aisle);
                                                                        return newSet;
                                                                    });
                                                                    setZoneMaintenanceReasons(prev => {
                                                                        const newReasons = { ...prev };
                                                                        delete newReasons[aisle];
                                                                        return newReasons;
                                                                    });
                                                                    addNotification('success', `Zone ${aisle} has been unlocked and is now active.`);
                                                                }}
                                                                className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30 hover:bg-green-500/30 transition-colors"
                                                            >
                                                                Unlock
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {lockedZones.size > 0 && (
                                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                            <p className="text-xs text-yellow-400">
                                                ⚠️ <strong>{lockedZones.size}</strong> zone{lockedZones.size !== 1 ? 's' : ''} currently locked.
                                                Jobs will not be assigned to locked zones.
                                            </p>
                                        </div>
                                    )}

                                    {/* PACK History Section */}
                                    <div className="border-t border-white/10 mt-10 pt-8 pb-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div>
                                                <h3 className="item-title font-bold text-white flex items-center gap-2">
                                                    <Archive size={18} className="text-gray-400" />
                                                    Pack History
                                                </h3>
                                                <p className="text-gray-500 text-[10px]">Recent completed packing jobs</p>
                                            </div>
                                        </div>

                                        {paginatedPackHistory.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                                    {paginatedPackHistory.map((job: WMSJob) => (
                                                        <div key={job.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] font-mono text-cyber-primary font-bold">{formatJobId(job)}</span>
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${job.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                                    }`}>
                                                                    {job.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-[10px] text-gray-500 truncate max-w-[80px]">{job.orderRef || 'No Ref'}</p>
                                                                    <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(job.createdAt || '')}</p>
                                                                </div>
                                                                <div className="text-right text-white font-bold text-xs">
                                                                    {job.items} <span className="text-[9px] text-gray-500 font-normal">items</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Pagination
                                                    currentPage={packHistoryPage}
                                                    totalPages={packHistoryTotalPages}
                                                    totalItems={filteredPackHistory.length}
                                                    itemsPerPage={PACK_HISTORY_PER_PAGE}
                                                    onPageChange={setPackHistoryPage}
                                                    itemName="history"
                                                />
                                            </>
                                        ) : (
                                            <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                                <p className="text-gray-500 text-xs">No matching history found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* --- PUTAWAY TAB --- */}
                {
                    activeTab === 'PUTAWAY' && (
                        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
                            {/* PUTAWAY CONTROL HUB */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/20 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                            <Layers className="text-blue-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Putaway Operations Hub</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Storage Matrix Active</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                                        {[
                                            { label: 'Pending', value: filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status === 'Pending').length, color: 'blue' },
                                            { label: 'Active', value: filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status === 'In-Progress').length, color: 'yellow' },
                                            { label: 'Inbound', value: filteredJobs.filter(j => (j.type === 'PUTAWAY' || j.type === 'REPLENISH') && j.status !== 'Completed').reduce((sum, j) => sum + j.items, 0), color: 'green' },
                                            { label: 'Capacity', value: '88%', color: 'purple' }
                                        ].map((stat, i) => (
                                            <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
                                                <p className={`text-lg font-mono font-black text-${stat.color}-400`}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Filters & Navigation */}
                                <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Scan Job ID or SKU..."
                                            value={putawaySearch}
                                            onChange={(e) => setPutawaySearch(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 shrink-0">
                                            {(['All', 'Pending', 'In-Progress'] as const).map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setPutawayStatusFilter(status)}
                                                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${putawayStatusFilter === status ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>

                                        <SortDropdown
                                            label="Sort"
                                            options={[
                                                { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                                                { id: 'date', label: 'Date', icon: <Clock size={12} /> },
                                                { id: 'items', label: 'Items', icon: <List size={12} /> }
                                            ]}
                                            value={putawaySortBy}
                                            onChange={(val) => setPutawaySortBy(val)}
                                            isOpen={isPutawaySortDropdownOpen}
                                            setIsOpen={setIsPutawaySortDropdownOpen}
                                        />

                                        <button
                                            onClick={() => refreshData()}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-blue-400 transition-all active:scale-95"
                                            title="Sync Operations"
                                        >
                                            <RefreshCw size={18} className={isSubmitting ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* PUTAWAY INTELLIGENCE GRID */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                    {sortedPutawayJobs.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <div className="p-6 bg-white/5 rounded-full border border-white/10">
                                                <Box size={48} className="text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-gray-300 font-black uppercase tracking-widest text-sm">Storage Queue Empty</p>
                                                <p className="text-gray-500 text-xs mt-1">No pending putaway jobs matching current filters.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {paginatedPutawayJobs.map(job => {
                                                const completedItems = job.lineItems?.filter(item => item.status === 'Completed').length || 0;
                                                const progress = job.lineItems ? (completedItems / job.lineItems.length) * 100 : 0;
                                                const isCritical = job.priority === 'Critical';

                                                return (
                                                    <div key={job.id} className={`group bg-white/5 backdrop-blur-sm border rounded-3xl p-5 hover:bg-white/10 transition-all duration-500 relative overflow-hidden ${isCritical ? 'border-red-500/20' : 'border-white/10 hover:border-blue-500/30'} `}>
                                                        {isCritical && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />}

                                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-white tracking-widest uppercase">{formatJobId(job)}</span>
                                                                    {isCritical && (
                                                                        <div className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                                                            <Zap size={8} className="fill-current" />
                                                                            Critical
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                        {job.items} Items
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                        Zone {(job as any).zone || 'A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Protected permission="ASSIGN_TASKS">
                                                                <div className="relative group/user">
                                                                    <button
                                                                        onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${selectedJob?.id === job.id
                                                                            ? 'bg-blue-500 border-blue-400 text-white shadow-lg scale-110'
                                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                                                            }`}
                                                                        aria-label="Assign User"
                                                                    >
                                                                        <UserIcon size={14} />
                                                                    </button>
                                                                </div>
                                                            </Protected>
                                                        </div>

                                                        <div className="space-y-4 relative z-10">
                                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                                <span>Progress</span>
                                                                <span className={progress === 100 ? 'text-green-400' : 'text-blue-400'}>{Math.round(progress)}%</span>
                                                            </div>

                                                            {job.status === 'In-Progress' && (
                                                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div className={`h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-700 w-[${Math.round(progress)}%]`} />
                                                                </div>
                                                            )}

                                                            <button
                                                                disabled={!!(job.assignedTo && job.assignedTo !== (user?.name || user?.email))}
                                                                onClick={() => handleStartJob(job)}
                                                                className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${job.assignedTo && job.assignedTo !== (user?.name || user?.email)
                                                                    ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                                                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] shadow-blue-600/20'
                                                                    }`}
                                                            >
                                                                {job.assignedTo && job.assignedTo !== (user?.name || user?.email) ? (
                                                                    <>
                                                                        <Lock size={14} />
                                                                        Occupied by {job.assignedTo}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play size={14} />
                                                                        {job.assignedTo ? 'Continue Job' : 'Start Putaway'}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Standardized PUTAWAY Pagination */}
                                            <Pagination
                                                currentPage={putawayCurrentPage}
                                                totalPages={putawayTotalPages}
                                                totalItems={sortedPutawayJobs.length}
                                                itemsPerPage={PUTAWAY_ITEMS_PER_PAGE}
                                                onPageChange={setPutawayCurrentPage}
                                                itemName="jobs"
                                            />
                                        </>
                                    )}

                                    {/* PUTAWAY History Section */}
                                    <div className="border-t border-white/10 mt-10 pt-8 pb-10 px-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div>
                                                <h3 className="item-title font-bold text-white flex items-center gap-2">
                                                    <Archive size={18} className="text-gray-400" />
                                                    Putaway History
                                                </h3>
                                                <p className="text-gray-500 text-[10px]">Recent completed putaway jobs</p>
                                            </div>

                                            {/* History Search */}
                                            <div className="relative w-full md:w-72">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Search history..."
                                                    value={putawayHistorySearch}
                                                    onChange={(e) => setPutawayHistorySearch(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {paginatedPutawayHistory.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                                    {paginatedPutawayHistory.map((job: WMSJob) => (
                                                        <div key={job.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] font-mono text-cyber-primary font-bold">{formatJobId(job)}</span>
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${job.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                                    }`}>
                                                                    {job.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-[10px] text-gray-500 truncate max-w-[80px]">{job.orderRef || 'No Ref'}</p>
                                                                    <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(job.createdAt || '')}</p>
                                                                </div>
                                                                <div className="text-right text-white font-bold text-xs">
                                                                    {job.items} <span className="text-[9px] text-gray-500 font-normal">items</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Pagination
                                                    currentPage={putawayHistoryPage}
                                                    totalPages={putawayTotalPages}
                                                    totalItems={filteredPutawayHistory.length}
                                                    itemsPerPage={PUTAWAY_HISTORY_PER_PAGE}
                                                    onPageChange={setPutawayHistoryPage}
                                                    itemName="history"
                                                />
                                            </>
                                        ) : (
                                            <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                                <p className="text-gray-500 text-xs">No matching history found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }


                {/* --- REPLENISH TAB --- */}
                {
                    activeTab === 'REPLENISH' && (
                        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
                            {/* REPLENISHMENT CONTROL HUB */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyber-primary/10 blur-[120px] rounded-full pointer-events-none" />

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-cyber-primary/20 rounded-2xl shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                                            <RefreshCw className="text-cyber-primary animate-spin [animation-duration:3s]" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Replenishment Matrix</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                Forward Pick Optimization Hub
                                                <span className="w-1 h-1 rounded-full bg-cyber-primary"></span>
                                                {filteredProducts.filter(p => p.stock < (p.minStock || 10)).length} Alerts
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Status Filter Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsReplenishFilterDropdownOpen(!isReplenishFilterDropdownOpen)}
                                                className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-gray-400 hover:text-white transition-all whitespace-nowrap uppercase tracking-widest"
                                            >
                                                <Filter size={14} className={replenishFilter !== 'all' ? 'text-cyber-primary' : ''} />
                                                <span>STATUS: {replenishFilter === 'all' ? 'ALL STOCK LEVELS' : replenishFilter.toUpperCase()}</span>
                                                <ChevronDown size={14} className={`transition-transform duration-300 ${isReplenishFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isReplenishFilterDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[50]" onClick={() => setIsReplenishFilterDropdownOpen(false)} />
                                                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {['all', 'critical', 'low', 'optimal'].map(filter => (
                                                            <button
                                                                key={filter}
                                                                onClick={() => {
                                                                    setReplenishFilter(filter as any);
                                                                    setIsReplenishFilterDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-between group uppercase tracking-widest ${replenishFilter === filter
                                                                    ? 'bg-cyber-primary text-black'
                                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                    }`}
                                                            >
                                                                {filter === 'all' ? 'ALL ARCHIVES' : filter.toUpperCase()}
                                                                {replenishFilter === filter && <CheckCircle size={12} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Sort Dropdown */}
                                        <SortDropdown
                                            label="Sort"
                                            options={[
                                                { id: 'urgency', label: 'Urgency', icon: <AlertTriangle size={12} /> },
                                                { id: 'stock', label: 'Stock', icon: <Box size={12} /> },
                                                { id: 'name', label: 'Name', icon: <Hash size={12} /> }
                                            ]}
                                            value={replenishSortBy}
                                            onChange={(val) => setReplenishSortBy(val)}
                                            isOpen={isReplenishSortDropdownOpen}
                                            setIsOpen={setIsReplenishSortDropdownOpen}
                                        />

                                        {/* Bulk Actions */}
                                        <div className="flex gap-2 h-full">
                                            <button
                                                onClick={() => {
                                                    const lowStock = filteredProducts.filter(p => p.stock < (p.minStock || 10));
                                                    setSelectedReplenishItems(new Set(lowStock.map(p => p.id)));
                                                    addNotification('info', `Selected ${lowStock.length} items for optimization`);
                                                }}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all active:scale-95"
                                            >
                                                Select Low Stock
                                            </button>
                                            <button
                                                disabled={selectedReplenishItems.size === 0 || isSubmitting}
                                                onClick={async () => {
                                                    setIsSubmitting(true);
                                                    try {
                                                        let createdCount = 0;
                                                        for (const id of Array.from(selectedReplenishItems)) {
                                                            const p = products.find(prod => prod.id === id);
                                                            if (!p) continue;
                                                            const restockQty = Math.min((p.maxStock || 100) - p.stock, 50);
                                                            if (restockQty <= 0) continue;

                                                            const job: WMSJob = {
                                                                id: `REP-${Date.now()}-${createdCount}`,
                                                                siteId: activeSite?.id || '',
                                                                site_id: activeSite?.id,
                                                                sourceSiteId: activeSite?.id || '',
                                                                source_site_id: activeSite?.id,
                                                                destSiteId: activeSite?.id || '',
                                                                dest_site_id: activeSite?.id,
                                                                type: 'PUTAWAY',
                                                                status: 'Pending',
                                                                priority: p.stock === 0 ? 'Critical' : p.stock < (p.minStock || 10) / 2 ? 'High' : 'Normal',
                                                                location: p.location || 'Warehouse Floor',
                                                                assignedTo: '',
                                                                items: 1,
                                                                lineItems: [{
                                                                    productId: p.id,
                                                                    sku: p.sku,
                                                                    name: p.name,
                                                                    image: p.image,
                                                                    expectedQty: restockQty,
                                                                    pickedQty: 0,
                                                                    status: 'Pending'
                                                                }],
                                                                orderRef: `REPLENISH-${p.sku}`
                                                            };
                                                            await wmsJobsService.create(job);
                                                            createdCount++;
                                                        }
                                                        addNotification('success', `Initialized ${createdCount} Optimization Sequences`);
                                                        setSelectedReplenishItems(new Set());
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${selectedReplenishItems.size > 0
                                                    ? 'bg-cyber-primary text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                                                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                                {isSubmitting ? 'Processing...' : `Execute ${selectedReplenishItems.size} Tasks`}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Search Hub */}
                                <div className="mt-6 flex-1 relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search size={14} className="text-gray-500 group-focus-within:text-cyber-primary transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Scan Product Barcode or Search Inventory Matrix..."
                                        value={replenishSearch}
                                        onChange={(e) => setReplenishSearch(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-[11px] font-black tracking-widest uppercase focus:border-cyber-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-gray-700"
                                    />
                                </div>
                            </div>

                            {/* REPLENISHMENT INTELLIGENCE GRID */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {paginatedReplenishItems
                                    .map(p => {
                                        const isExpanded = expandedReplenishItem === p.id;
                                        const isChecked = selectedReplenishItems.has(p.id);
                                        const minStock = p.minStock || 10;
                                        const maxStock = p.maxStock || 100;
                                        const restockQty = Math.min(maxStock - p.stock, 50);

                                        let urgencyColor = 'bg-blue-500';
                                        let urgencyLabel = 'Stable';
                                        if (p.stock === 0) {
                                            urgencyColor = 'bg-red-500';
                                            urgencyLabel = 'Critical';
                                        } else if (p.stock < minStock / 2) {
                                            urgencyColor = 'bg-orange-500';
                                            urgencyLabel = 'High';
                                        } else if (p.stock < minStock) {
                                            urgencyColor = 'bg-yellow-500';
                                            urgencyLabel = 'Low';
                                        }

                                        return (
                                            <div
                                                key={p.id}
                                                className={`group bg-white/[0.02] border border-white/5 rounded-3xl transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white/[0.07] border-white/10 ring-1 ring-white/10' : 'hover:bg-white/[0.04] hover:border-white/10'
                                                    }`}
                                            >
                                                {/* Header Row */}
                                                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedReplenishItem(isExpanded ? null : p.id)}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative group/check" onClick={(e) => {
                                                            e.stopPropagation();
                                                            const next = new Set(selectedReplenishItems);
                                                            if (isChecked) next.delete(p.id); else next.add(p.id);
                                                            setSelectedReplenishItems(next);
                                                        }}>
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isChecked ? 'bg-cyber-primary border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.4)]' : 'border-white/10 group-hover:border-white/30'
                                                                }`}>
                                                                {isChecked && <CheckCircle size={14} className="text-black" />}
                                                            </div>
                                                        </div>

                                                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 overflow-hidden ring-1 ring-white/5 group-hover:ring-cyber-primary/30 transition-all flex items-center justify-center">
                                                            {p.image && !p.image.includes('placeholder.com') ? (
                                                                <img
                                                                    src={p.image}
                                                                    alt=""
                                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Package size={24} className="text-gray-600" />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-black text-white tracking-tight leading-none mb-1 uppercase">{p.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{p.sku}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                                <span className="text-[9px] text-cyber-primary font-black uppercase tracking-widest">{p.location || 'FLOOR-X'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8">
                                                        <div className="hidden sm:flex flex-col items-end">
                                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Status Intelligence</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${urgencyColor} shadow-[0_0_8px_rgba(255,255,255,0.1)]`} />
                                                                <span className={`text-[11px] font-black uppercase tracking-tighter ${urgencyColor.replace('bg-', 'text-')}`}>{urgencyLabel}</span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Stock Volatility</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className={`text-xl font-black ${p.stock < minStock ? 'text-orange-500' : 'text-cyber-primary'}`}>{p.stock}</span>
                                                                <span className="text-xs text-gray-600 font-bold">/ {minStock}</span>
                                                            </div>
                                                        </div>

                                                        <div className={`p-2 rounded-xl bg-white/5 text-gray-600 group-hover:text-white transition-all ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}`}>
                                                            <ChevronDown size={16} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details Intelligence Dashboard */}
                                                {isExpanded && (
                                                    <div className="px-5 pb-5 pt-1 border-t border-white/5 animate-in slide-in-from-top-4 duration-500 ease-out">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                                            <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                                                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                    <RefreshCw size={10} className="text-cyber-primary" /> Optimization Strategy
                                                                </p>
                                                                <p className="text-xs text-white font-bold mb-1">Target Restock: <span className="text-cyber-primary">+{restockQty} Units</span></p>
                                                                <p className="text-[10px] text-gray-500 font-medium">Auto-calculated based on {maxStock} unit ceiling</p>
                                                            </div>

                                                            <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                                                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                    <Map size={10} className="text-purple-400" /> Source Intelligence
                                                                </p>
                                                                <p className="text-xs text-white font-bold mb-1">Bulk Storage: <span className="text-purple-400">ZONE-B-041</span></p>
                                                                <p className="text-[10px] text-gray-500 font-medium">Standard pallets only</p>
                                                            </div>

                                                            <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                                                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                    <AlertTriangle size={10} className="text-red-400" /> Velocity Alerts
                                                                </p>
                                                                {(() => {
                                                                    const pendingOrders = sales.filter(s =>
                                                                        s.status !== 'Completed' &&
                                                                        s.items?.some(item => item.productId === p.id)
                                                                    ).length;
                                                                    return (
                                                                        <>
                                                                            <p className="text-xs text-white font-bold mb-1">
                                                                                Status: <span className={pendingOrders > 0 ? 'text-red-400' : 'text-green-400'}>{pendingOrders > 0 ? 'BACKLOGGED' : 'STABLE'}</span>
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-500 font-medium">{pendingOrders} orders awaiting resupply</p>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>

                                                            <div className="bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col justify-center items-center gap-3">
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setCreatingReplenishTask(p.id);
                                                                        try {
                                                                            const job: WMSJob = {
                                                                                id: `REP-${Date.now()}`,
                                                                                siteId: activeSite?.id || '',
                                                                                site_id: activeSite?.id,
                                                                                sourceSiteId: activeSite?.id || '',
                                                                                source_site_id: activeSite?.id,
                                                                                destSiteId: activeSite?.id || '',
                                                                                dest_site_id: activeSite?.id,
                                                                                type: 'REPLENISH',
                                                                                status: 'Pending',
                                                                                priority: urgencyLabel as any,
                                                                                location: p.location || 'Warehouse Floor',
                                                                                assignedTo: '',
                                                                                items: 1,
                                                                                lineItems: [{
                                                                                    productId: p.id,
                                                                                    sku: p.sku,
                                                                                    name: p.name,
                                                                                    image: p.image,
                                                                                    expectedQty: restockQty,
                                                                                    pickedQty: 0,
                                                                                    status: 'Pending'
                                                                                }],
                                                                                orderRef: `REPLENISH-${p.sku}`
                                                                            };
                                                                            await wmsJobsService.create(job);
                                                                            addNotification('success', `Sequence Initialized for ${p.sku}`);
                                                                        } finally {
                                                                            setCreatingReplenishTask(null);
                                                                        }
                                                                    }}
                                                                    className="w-full bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary text-[10px] font-black uppercase py-3 rounded-xl border border-cyber-primary/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                                                >
                                                                    {creatingReplenishTask === p.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                                    Initialize Optimization
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                {sortedReplenishItems.length > 0 && (
                                    <Pagination
                                        currentPage={safeReplenishCurrentPage}
                                        totalPages={replenishTotalPages}
                                        totalItems={sortedReplenishItems.length}
                                        itemsPerPage={REPLENISH_ITEMS_PER_PAGE}
                                        onPageChange={setReplenishCurrentPage}
                                        isLoading={false}
                                        itemName="items"
                                    />
                                )}

                                {sortedReplenishItems.length === 0 && (
                                    <div className="h-64 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle size={32} className="text-green-500" />
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">System Optimized</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No replenishment required for the current cycle</p>
                                    </div>
                                )}

                                {/* REPLENISH History Section */}
                                <div className="border-t border-white/10 mt-10 pt-8 pb-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                                <HistoryIcon size={18} className="text-gray-400" />
                                                Replenishment History
                                            </h4>
                                            <p className="text-gray-500 text-[10px]">Recent completed refurbishment and restock jobs</p>
                                        </div>

                                        {/* History Search */}
                                        <div className="relative w-full md:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search history..."
                                                value={replenishHistorySearch}
                                                onChange={(e) => setReplenishHistorySearch(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {paginatedReplenishHistory.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {paginatedReplenishHistory.map((job: WMSJob) => (
                                                    <div
                                                        key={job.id}
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] font-mono text-cyber-primary font-bold">{job.id}</span>
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-green-500/10 text-green-400">
                                                                {job.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{job.orderRef || 'Internal'}</p>
                                                                <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(job.updatedAt || job.createdAt || '')}</p>
                                                            </div>
                                                            <div className="text-right text-white font-bold text-xs">
                                                                {job.items} <span className="text-[9px] text-gray-500 font-normal">units</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Pagination
                                                currentPage={replenishHistoryPage}
                                                totalPages={replenishHistoryTotalPages}
                                                totalItems={filteredReplenishHistory.length}
                                                itemsPerPage={REPLENISH_HISTORY_PER_PAGE}
                                                onPageChange={setReplenishHistoryPage}
                                                itemName="history"
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                            <p className="text-gray-500 text-xs">No matching history found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* --- COUNT TAB (ENTERPRISE CYCLE COUNTING) --- */}
                {
                    activeTab === 'COUNT' && (
                        <div className="flex-1 overflow-y-auto space-y-6">
                            {/* Header */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                            <ClipboardCheck className="text-cyber-primary" size={24} />
                                            Inventory Audit & Cycle Counting
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {countViewMode === 'Operations'
                                                ? (countSessionStatus === 'Idle' ? 'Start a new count session' : countSessionStatus === 'Active' ? 'BLIND COUNT IN PROGRESS' : 'Review & Approve Variances')
                                                : 'Historical accuracy and variance reports'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* View Toggle */}
                                        <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                                            <button
                                                onClick={() => setCountViewMode('Operations')}
                                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${countViewMode === 'Operations' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'} `}
                                            >
                                                Operations
                                            </button>
                                            <button
                                                onClick={() => setCountViewMode('Reports')}
                                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${countViewMode === 'Reports' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'} `}
                                            >
                                                Reports
                                            </button>
                                        </div>

                                        {countSessionStatus !== 'Idle' && countViewMode === 'Operations' && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Cancel current session? Progress will be lost.')) {
                                                        setCountSessionStatus('Idle');
                                                        setCountSessionItems([]);
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/10"
                                            >
                                                Cancel Session
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* OPERATIONS VIEW */}
                                {countViewMode === 'Operations' && (
                                    <>
                                        {/* IDLE STATE: Start Session */}
                                        {countSessionStatus === 'Idle' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => {
                                                        // Start Daily Cycle Count (Aisle A for demo)
                                                        const itemsToCount = products
                                                            .filter(p => (p.location || '').startsWith('A'))
                                                            .slice(0, 10)
                                                            .map(p => ({
                                                                productId: p.id,
                                                                systemQty: p.stock,
                                                                status: 'Pending' as const
                                                            }));
                                                        setCountSessionItems(itemsToCount);
                                                        setCountSessionType('Cycle');
                                                        setCountSessionStatus('Active');
                                                    }}
                                                    className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors text-left group"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                                                            <RotateCcw size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white">Daily Cycle Count</h4>
                                                            <p className="text-xs text-gray-400">Routine count of Aisle A</p>
                                                        </div>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        // Start Spot Check (Random 5 items)
                                                        const itemsToCount = [...products]
                                                            .sort(() => 0.5 - Math.random())
                                                            .slice(0, 5)
                                                            .map(p => ({
                                                                productId: p.id,
                                                                systemQty: p.stock,
                                                                status: 'Pending' as const
                                                            }));
                                                        setCountSessionItems(itemsToCount);
                                                        setCountSessionType('Spot');
                                                        setCountSessionStatus('Active');
                                                    }}
                                                    className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors text-left group"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-3 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30">
                                                            <Search size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white">Spot Check</h4>
                                                            <p className="text-xs text-gray-400">Random audit of 5 items</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        )}

                                        {/* ACTIVE STATE: Blind Counting */}
                                        {countSessionStatus === 'Active' && (
                                            <div className="space-y-4">
                                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-center gap-3">
                                                    <AlertTriangle className="text-yellow-500" size={20} />
                                                    <p className="text-sm text-yellow-200">
                                                        <strong>Blind Count Mode:</strong> System quantities are hidden to ensure accuracy.
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    {countSessionItems.map((item, idx) => {
                                                        const product = products.find(p => p.id === item.productId);
                                                        return (
                                                            <div key={item.productId} className={`p-4 rounded-xl border ${item.status === 'Counted' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'} flex items-center justify-between`}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded bg-black flex items-center justify-center overflow-hidden">
                                                                        {product?.image && !product.image.includes('placeholder.com') ? (
                                                                            <img
                                                                                src={product.image}
                                                                                alt=""
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Package size={20} className="text-gray-700" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-white">{product?.name}</p>
                                                                        <p className="text-xs text-gray-400">Loc: {product?.location || 'N/A'} • SKU: {product?.sku}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="Qty"
                                                                        className="w-24 bg-black border border-white/20 rounded-lg p-2 text-center text-white font-mono text-lg"
                                                                        value={item.countedQty === undefined ? '' : item.countedQty}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value);
                                                                            const newItems = [...countSessionItems];
                                                                            newItems[idx].countedQty = isNaN(val) ? undefined : val;
                                                                            newItems[idx].status = isNaN(val) ? 'Pending' : 'Counted';
                                                                            setCountSessionItems(newItems);
                                                                        }}
                                                                    />
                                                                    {item.status === 'Counted' && <CheckCircle className="text-green-500" size={20} />}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="pt-4 border-t border-white/10 flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            if (countSessionItems.some(i => i.status === 'Pending')) {
                                                                addNotification('alert', 'Please count all items before finishing.');
                                                                return;
                                                            }
                                                            // Calculate variances
                                                            const reviewedItems = countSessionItems.map(i => ({
                                                                ...i,
                                                                variance: (i.countedQty || 0) - i.systemQty
                                                            }));
                                                            setCountSessionItems(reviewedItems);
                                                            setCountSessionStatus('Review');
                                                        }}
                                                        className="px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors flex items-center gap-2"
                                                    >
                                                        Finish & Review <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* REVIEW STATE: Manager Approval */}
                                        {countSessionStatus === 'Review' && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="bg-white/5 p-3 rounded-lg text-center">
                                                        <p className="text-xs text-gray-400 uppercase">Total Items</p>
                                                        <p className="text-xl font-bold text-white">{countSessionItems.length}</p>
                                                    </div>
                                                    <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
                                                        <p className="text-xs text-green-400 uppercase">Accurate</p>
                                                        <p className="text-xl font-bold text-green-400">{countSessionItems.filter(i => i.variance === 0).length}</p>
                                                    </div>
                                                    <div className="bg-red-500/10 p-3 rounded-lg text-center border border-red-500/20">
                                                        <p className="text-xs text-red-400 uppercase">Variance</p>
                                                        <p className="text-xl font-bold text-red-400">{countSessionItems.filter(i => i.variance !== 0).length}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {countSessionItems.map((item, idx) => {
                                                        const product = products.find(p => p.id === item.productId);
                                                        const hasVariance = item.variance !== 0;

                                                        return (
                                                            <div key={item.productId} className={`p-4 rounded-xl border ${hasVariance ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'} flex flex-col md:flex-row items-center justify-between gap-4`}>
                                                                <div className="flex items-center gap-4 flex-1">
                                                                    <div className="w-10 h-10 rounded bg-black flex items-center justify-center overflow-hidden">
                                                                        {product?.image && !product.image.includes('placeholder.com') ? (
                                                                            <img
                                                                                src={product.image}
                                                                                alt=""
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Package size={16} className="text-gray-600" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-white">{product?.name}</p>
                                                                        <div className="flex gap-4 text-xs mt-1">
                                                                            <span className="text-gray-400">System: <strong className="text-white">{item.systemQty}</strong></span>
                                                                            <span className="text-cyber-primary">Counted: <strong className="text-white">{item.countedQty}</strong></span>
                                                                            <span className={hasVariance ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                                                                                Var: {item.variance && item.variance > 0 ? '+' : ''}{item.variance}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {hasVariance && item.status !== 'Approved' && (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                // Recount logic
                                                                                const newItems = [...countSessionItems];
                                                                                newItems[idx].status = 'Pending';
                                                                                newItems[idx].countedQty = undefined;
                                                                                newItems[idx].variance = undefined;
                                                                                setCountSessionItems(newItems);
                                                                                setCountSessionStatus('Active');
                                                                                addNotification('info', `Marked ${product?.name} for recount.`);
                                                                            }}
                                                                            className="px-3 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10"
                                                                        >
                                                                            Recount
                                                                        </button>
                                                                        <button
                                                                            disabled={approvingVariance === idx}
                                                                            onClick={async () => {
                                                                                setApprovingVariance(idx);
                                                                                try {
                                                                                    // Approve Variance - NOW CREATES REQUEST
                                                                                    const varianceQty = Math.abs(item.variance || 0);
                                                                                    const adjustType = (item.variance || 0) > 0 ? 'IN' : 'OUT';

                                                                                    const request: Omit<PendingInventoryChange, 'id'> = {
                                                                                        productId: item.productId,
                                                                                        productName: product?.name || 'Unknown',
                                                                                        productSku: product?.sku || 'Unknown',
                                                                                        siteId: product?.siteId || user?.siteId || '',
                                                                                        changeType: 'stock_adjustment',
                                                                                        requestedBy: user?.name || 'Manager',
                                                                                        requestedAt: new Date().toISOString(),
                                                                                        status: 'pending',
                                                                                        adjustmentType: adjustType,
                                                                                        adjustmentQty: varianceQty,
                                                                                        adjustmentReason: `Cycle Count Variance Approval`
                                                                                    };

                                                                                    await inventoryRequestsService.create(request);

                                                                                    const newItems = [...countSessionItems];
                                                                                    newItems[idx].status = 'Approved';
                                                                                    setCountSessionItems(newItems);
                                                                                    addNotification('success', 'Variance adjustment request submitted for approval.');
                                                                                } catch (e) {
                                                                                    console.error('Failed to approve variance:', e);
                                                                                    addNotification('alert', 'Failed to submit variance approval');
                                                                                } finally {
                                                                                    setApprovingVariance(null);
                                                                                }
                                                                            }}
                                                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1 ${approvingVariance === idx
                                                                                ? 'bg-red-500/10 text-red-400/50 border-red-500/20 cursor-not-allowed'
                                                                                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                                                                }`}
                                                                        >
                                                                            {approvingVariance === idx ? (
                                                                                <>
                                                                                    <RefreshCw size={12} className="animate-spin" />
                                                                                    Approving...
                                                                                </>
                                                                            ) : (
                                                                                'Approve Variance'
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {(!hasVariance || item.status === 'Approved') && (
                                                                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold px-3 py-1.5 bg-green-500/10 rounded-lg">
                                                                        <CheckCircle size={14} />
                                                                        {item.status === 'Approved' ? 'Adjusted' : 'Matched'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="pt-4 border-t border-white/10 flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            if (countSessionItems.some(i => i.status !== 'Approved' && i.variance !== 0)) {
                                                                if (!confirm('There are unapproved variances. Finish anyway?')) return;
                                                            }
                                                            setCountSessionStatus('Idle');
                                                            setCountSessionItems([]);
                                                            addNotification('success', 'Count session completed!');
                                                        }}
                                                        className="px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors"
                                                    >
                                                        Complete Session
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* REPORTS VIEW */}
                                {countViewMode === 'Reports' && (
                                    <div className="space-y-6">
                                        {/* KPI Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                    <h4 className="text-gray-400 text-sm font-bold uppercase">Inventory Accuracy</h4>
                                                </div>
                                                <p className="text-3xl font-bold text-white">98.5%</p>
                                                <p className="text-xs text-green-400 mt-1">↑ 1.2% from last month</p>
                                            </div>

                                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                                                        <AlertTriangle size={20} />
                                                    </div>
                                                    <h4 className="text-gray-400 text-sm font-bold uppercase">Net Variance Value</h4>
                                                </div>
                                                <p className="text-3xl font-bold text-white">
                                                    {formatCompactNumber(movements
                                                        .filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment'))
                                                        .reduce((sum, m) => {
                                                            const product = products.find(p => p.id === m.productId);
                                                            const value = m.quantity * (product?.price || 0);
                                                            return sum + (m.type === 'IN' ? value : -value);
                                                        }, 0), { currency: CURRENCY_SYMBOL })}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Total value of adjustments</p>
                                            </div>

                                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                        <RotateCcw size={20} />
                                                    </div>
                                                    <h4 className="text-gray-400 text-sm font-bold uppercase">Cycle Counts YTD</h4>
                                                </div>
                                                <p className="text-3xl font-bold text-white">
                                                    {movements.filter(m => m.reason.includes('Cycle Count')).length}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Items counted this year</p>
                                            </div>
                                        </div>

                                        {/* COUNT History Section */}
                                        <div className="border-t border-white/10 mt-10 pt-8 pb-10">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                                        <HistoryIcon size={18} className="text-gray-400" />
                                                        Count History
                                                    </h4>
                                                    <p className="text-gray-500 text-[10px]">Recent variance and cycle count adjustments</p>
                                                </div>

                                                {/* History Search */}
                                                <div className="relative w-full md:w-72">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search history..."
                                                        value={countHistorySearch}
                                                        onChange={(e) => setCountHistorySearch(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {paginatedCountHistory.length > 0 ? (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        {paginatedCountHistory.map((m: any) => {
                                                            const product = products.find(p => p.id === m.productId);
                                                            return (
                                                                <div
                                                                    key={m.id}
                                                                    onClick={() => {
                                                                        setSelectedJob(m);
                                                                        setIsDetailsOpen(true);
                                                                    }}
                                                                    className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-[10px] font-mono text-cyber-primary font-bold">{m.id.slice(0, 8)}</span>
                                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${m.type === 'IN' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                            {m.type}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-end">
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{product?.name || 'Unknown Item'}</p>
                                                                            <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(m.date)}</p>
                                                                        </div>
                                                                        <div className="text-right text-white font-bold text-xs">
                                                                            {m.quantity} <span className="text-[9px] text-gray-500 font-normal">units</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <Pagination
                                                        currentPage={countHistoryPage}
                                                        totalPages={countHistoryTotalPages}
                                                        totalItems={filteredCountHistory.length}
                                                        itemsPerPage={COUNT_HISTORY_PER_PAGE}
                                                        onPageChange={setCountHistoryPage}
                                                        itemName="history"
                                                    />
                                                </>
                                            ) : (
                                                <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                                    <p className="text-gray-500 text-xs">No matching history found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* --- WASTE TAB (ENTERPRISE) --- */}
                {
                    activeTab === 'WASTE' && (
                        <div className="flex-1 overflow-y-auto space-y-6">
                            {/* Header */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                            <AlertOctagon className="text-red-500" size={24} />
                                            Waste & Spoilage Management
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Log and track inventory write-offs</p>
                                    </div>

                                    <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                                        <button
                                            onClick={() => setWasteViewMode('Log')}
                                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${wasteViewMode === 'Log' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'} `}
                                        >
                                            Log Waste
                                        </button>
                                        <button
                                            onClick={() => setWasteViewMode('History')}
                                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${wasteViewMode === 'History' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'} `}
                                        >
                                            History
                                        </button>
                                    </div>
                                </div>

                                {wasteViewMode === 'Log' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Input Form */}
                                        <div className="lg:col-span-1 space-y-4">
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                                                <h4 className="font-bold text-white text-sm border-b border-white/10 pb-2">Add Item to Log</h4>

                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Product</label>
                                                    <select className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" id="wasteProd" aria-label="Select Product">
                                                        <option value="">Select Product...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Quantity</label>
                                                        <input title="Waste Quantity" type="number" min="1" className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" id="wasteQty" placeholder="0" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Reason</label>
                                                        <select className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" id="wasteReason" aria-label="Select Reason">
                                                            <option>Expired</option>
                                                            <option>Damaged</option>
                                                            <option>Spoiled</option>
                                                            <option>Theft</option>
                                                            <option>Other</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Notes / Evidence</label>
                                                    <textarea className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none h-20" id="wasteNotes" placeholder="Describe damage..." />
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const prodSelect = document.getElementById('wasteProd') as HTMLSelectElement;
                                                        const qtyInput = document.getElementById('wasteQty') as HTMLInputElement;
                                                        const reasonSelect = document.getElementById('wasteReason') as HTMLSelectElement;
                                                        const notesInput = document.getElementById('wasteNotes') as HTMLTextAreaElement;

                                                        if (!prodSelect.value || !qtyInput.value) {
                                                            addNotification('alert', 'Please select product and quantity');
                                                            return;
                                                        }

                                                        setWasteBasket(prev => [...prev, {
                                                            productId: prodSelect.value,
                                                            quantity: parseInt(qtyInput.value),
                                                            reason: reasonSelect.value,
                                                            notes: notesInput.value
                                                        }]);

                                                        // Reset form
                                                        prodSelect.value = '';
                                                        qtyInput.value = '';
                                                        notesInput.value = '';
                                                        addNotification('success', 'Item added to waste basket');
                                                    }}
                                                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={18} /> Add to Basket
                                                </button>
                                            </div>
                                        </div>

                                        {/* Basket & Summary */}
                                        <div className="lg:col-span-2 flex flex-col h-full">
                                            <div className="bg-black/20 rounded-xl border border-white/5 flex-1 flex flex-col overflow-hidden">
                                                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                                    <h4 className="font-bold text-white text-sm">Waste Basket ({wasteBasket.length})</h4>
                                                    {wasteBasket.length > 0 && (
                                                        <button onClick={() => setWasteBasket([])} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                                                    )}
                                                </div>

                                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                                    {wasteBasket.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                                            <Trash2 size={48} className="mb-2" />
                                                            <p>Basket is empty</p>
                                                        </div>
                                                    ) : (
                                                        wasteBasket.map((item, idx) => {
                                                            const product = products.find(p => p.id === item.productId);
                                                            const cost = (product?.price || 0) * item.quantity; // Using price as proxy for cost
                                                            return (
                                                                <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between items-center group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded bg-black flex items-center justify-center overflow-hidden">
                                                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                                                <img
                                                                                    src={product.image}
                                                                                    alt={product?.name || 'Product'}
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        e.currentTarget.style.display = 'none';
                                                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <Package size={16} className="text-gray-600" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-white text-sm">{product?.name}</p>
                                                                            <p className="text-xs text-gray-400">{item.reason} • {item.quantity} units</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <p className="font-mono text-white text-sm">{formatCompactNumber(cost, { currency: CURRENCY_SYMBOL })}</p>
                                                                        <button
                                                                            onClick={() => setWasteBasket(prev => prev.filter((_, i) => i !== idx))}
                                                                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            aria-label="Remove Item"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                <div className="p-4 bg-white/5 border-t border-white/10">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-gray-400">Total Value Loss</span>
                                                        <span className="text-xl font-bold text-white">
                                                            {formatCompactNumber(wasteBasket.reduce((sum, item) => {
                                                                const product = products.find(p => p.id === item.productId);
                                                                return sum + ((product?.price || 0) * item.quantity);
                                                            }, 0), { currency: CURRENCY_SYMBOL })}
                                                        </span>
                                                    </div>
                                                    <button
                                                        disabled={isDisposingWaste || wasteBasket.length === 0}
                                                        onClick={async () => {
                                                            if (wasteBasket.length === 0) return;

                                                            const totalValue = wasteBasket.reduce((sum, item) => {
                                                                const product = products.find(p => p.id === item.productId);
                                                                return sum + ((product?.price || 0) * item.quantity);
                                                            }, 0);

                                                            if (totalValue > 100) {
                                                                if (!confirm(`High value waste(${CURRENCY_SYMBOL}${totalValue.toFixed(2)}).Are you sure ? This will be flagged for review.`)) return;
                                                            } else {
                                                                if (!confirm('Confirm disposal of these items?')) return;
                                                            }

                                                            setIsDisposingWaste(true);
                                                            try {
                                                                // Process all items-CREATE REQUESTS
                                                                for (const item of wasteBasket) {
                                                                    const product = products.find(p => p.id === item.productId);
                                                                    const request: Omit<PendingInventoryChange, 'id'> = {
                                                                        productId: item.productId,
                                                                        productName: product?.name || 'Unknown',
                                                                        productSku: product?.sku || 'Unknown',
                                                                        siteId: product?.siteId || user?.siteId || '',
                                                                        changeType: 'stock_adjustment',
                                                                        requestedBy: user?.name || 'WMS',
                                                                        requestedAt: new Date().toISOString(),
                                                                        status: 'pending',
                                                                        adjustmentType: 'OUT',
                                                                        adjustmentQty: item.quantity,
                                                                        adjustmentReason: `Waste: ${item.reason}${item.notes ? ` (${item.notes})` : ''}`
                                                                    };
                                                                    await inventoryRequestsService.create(request);
                                                                }

                                                                setWasteBasket([]);
                                                                addNotification('success', 'Waste adjustment requests submitted for approval');
                                                            } catch (e) {
                                                                console.error('Failed to submit waste disposal:', e);
                                                                addNotification('alert', 'Failed to submit waste disposal requests');
                                                            } finally {
                                                                setIsDisposingWaste(false);
                                                            }
                                                        }}
                                                        className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isDisposingWaste || wasteBasket.length === 0
                                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                            : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                                            }`}
                                                    >
                                                        {isDisposingWaste ? (
                                                            <>
                                                                <RefreshCw size={18} className="animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertTriangle size={18} />
                                                                Confirm Disposal
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wasteViewMode === 'History' && (
                                    <div className="border-t border-white/10 mt-6 pt-8 pb-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                                    <HistoryIcon size={18} className="text-gray-400" />
                                                    Waste Logs
                                                </h4>
                                                <p className="text-gray-500 text-[10px]">Recent spoilage and damage records</p>
                                            </div>

                                            {/* History Search */}
                                            <div className="relative w-full md:w-72">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Search history..."
                                                    value={wasteHistorySearch}
                                                    onChange={(e) => setWasteHistorySearch(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {paginatedWasteHistory.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {paginatedWasteHistory.map((m: any) => {
                                                        const product = products.find(p => p.id === m.productId);
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => {
                                                                    setSelectedJob(m);
                                                                    setIsDetailsOpen(true);
                                                                }}
                                                                className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-mono text-cyber-primary font-bold">{m.id.slice(0, 8)}</span>
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-red-500/10 text-red-400">
                                                                        {m.reason.replace('Waste: ', '')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-end">
                                                                    <div>
                                                                        <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{product?.name || 'Unknown Item'}</p>
                                                                        <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(m.date)}</p>
                                                                    </div>
                                                                    <div className="text-right text-white font-bold text-xs">
                                                                        {m.quantity} <span className="text-[9px] text-gray-500 font-normal">units</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <Pagination
                                                    currentPage={wasteHistoryPage}
                                                    totalPages={wasteHistoryTotalPages}
                                                    totalItems={filteredWasteHistory.length}
                                                    itemsPerPage={WASTE_HISTORY_PER_PAGE}
                                                    onPageChange={setWasteHistoryPage}
                                                    itemName="history"
                                                />
                                            </>
                                        ) : (
                                            <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                                <p className="text-gray-500 text-xs">No matching history found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* --- RETURNS TAB (ENTERPRISE) --- */}
                {
                    activeTab === 'RETURNS' && (
                        <div className="flex-1 overflow-y-auto space-y-6">
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 min-h-[600px] flex flex-col">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                                            <RefreshCw className="text-blue-400" size={24} />
                                            Returns Management (RMA)
                                        </h3>
                                        <div className="flex items-center gap-6 mt-2">
                                            <button
                                                onClick={() => setReturnViewMode('Process')}
                                                className={`text-[10px] uppercase font-black tracking-widest transition-all ${returnViewMode === 'Process' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Process New Return
                                            </button>
                                            <button
                                                onClick={() => setReturnViewMode('History')}
                                                className={`text-[10px] uppercase font-black tracking-widest transition-all ${returnViewMode === 'History' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Returns History
                                            </button>
                                        </div>
                                    </div>
                                    {returnViewMode === 'Process' && (
                                        <div className="flex items-center gap-2">
                                            {['Search', 'Select', 'Review', 'Complete'].map((step, i) => {
                                                const currentIndex = ['Search', 'Select', 'Review', 'Complete'].indexOf(returnStep);
                                                const isActive = i <= currentIndex;
                                                return (
                                                    <div key={step} className="flex items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                                                            {i + 1}
                                                        </div>
                                                        {i < 3 && <div className={`w-8 h-0.5 mx-1 ${isActive ? 'bg-blue-500' : 'bg-white/5'}`} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {returnViewMode === 'Process' ? (
                                    <div className="flex-1 flex flex-col">
                                        {/* Step 1: Search */}
                                        {returnStep === 'Search' && (
                                            <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
                                                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                                    <Search className="text-blue-400" size={40} />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <h2 className="text-2xl font-bold text-white">Scan Order Receipt</h2>
                                                    <p className="text-gray-400">Enter the Order ID or scan the barcode on the receipt</p>
                                                </div>
                                                <div className="flex gap-2 w-full max-w-md">
                                                    <input
                                                        className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-blue-500 outline-none transition-all"
                                                        placeholder="Order ID (e.g. ORD-12345)"
                                                        value={returnSearch}
                                                        onChange={e => setReturnSearch(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                const sale = sales.find(s => s.id.toLowerCase().includes(returnSearch.toLowerCase()));
                                                                if (sale) {
                                                                    setFoundSale(sale);
                                                                    setReturnItems([]);
                                                                    setReturnStep('Select');
                                                                    addNotification('success', 'Order Found');
                                                                } else {
                                                                    addNotification('alert', 'Order Not Found');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const sale = sales.find(s => s.id.toLowerCase().includes(returnSearch.toLowerCase()));
                                                            if (sale) {
                                                                setFoundSale(sale);
                                                                setReturnItems([]);
                                                                setReturnStep('Select');
                                                                addNotification('success', 'Order Found');
                                                            } else {
                                                                addNotification('alert', 'Order Not Found');
                                                            }
                                                        }}
                                                        className="px-8 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                                    >
                                                        Find
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2: Select Items */}
                                        {returnStep === 'Select' && foundSale && (
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg">Order #{foundSale.id}</h4>
                                                        <p className="text-sm text-gray-400">{formatDateTime(foundSale.date)} • {foundSale.customer_id || 'Walk-in Customer'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-400">Total Paid</p>
                                                        <p className="font-bold text-cyber-primary text-xl">{formatCompactNumber(foundSale.total, { currency: CURRENCY_SYMBOL })}</p>
                                                    </div>
                                                </div>

                                                <h4 className="font-bold text-white mb-4">Select Items to Return</h4>
                                                <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                                                    {paginatedFoundSaleItems.map((item: any, idx: number) => {
                                                        const isSelected = returnItems.some(ri => ri.productId === item.id);
                                                        const returnItem = returnItems.find(ri => ri.productId === item.id);

                                                        return (
                                                            <div key={idx} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5'} `}>
                                                                <div className="flex items-start gap-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        aria-label="Select Item"
                                                                        className="mt-1 w-5 h-5 accent-blue-500 cursor-pointer"
                                                                        checked={isSelected}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setReturnItems([...returnItems, {
                                                                                    productId: item.id,
                                                                                    quantity: 1,
                                                                                    reason: 'Defective',
                                                                                    condition: 'Damaged',
                                                                                    action: 'Discard'
                                                                                }]);
                                                                            } else {
                                                                                setReturnItems(returnItems.filter(ri => ri.productId !== item.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="font-bold text-white">{item.name}</span>
                                                                            <span className="text-sm text-gray-400">Purchased: {item.quantity}</span>
                                                                        </div>

                                                                        {isSelected && returnItem && (
                                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 bg-black/20 p-3 rounded-lg border border-white/5">
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Return Qty</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        aria-label="Return Quantity"
                                                                                        min="1"
                                                                                        max={item.quantity}
                                                                                        className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
                                                                                        value={returnItem.quantity}
                                                                                        onChange={(e) => {
                                                                                            const qty = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity);
                                                                                            setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, quantity: qty } : ri));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Reason</label>
                                                                                    <select
                                                                                        aria-label="Return Reason"
                                                                                        className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
                                                                                        value={returnItem.reason}
                                                                                        onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, reason: e.target.value } : ri))}
                                                                                    >
                                                                                        <option>Defective</option>
                                                                                        <option>Wrong Item</option>
                                                                                        <option>Changed Mind</option>
                                                                                        <option>Expired</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Condition</label>
                                                                                    <select
                                                                                        aria-label="Return Condition"
                                                                                        className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
                                                                                        value={returnItem.condition}
                                                                                        onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, condition: e.target.value } : ri))}
                                                                                    >
                                                                                        <option>New / Sealed</option>
                                                                                        <option>Open Box</option>
                                                                                        <option>Damaged</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Action</label>
                                                                                    <select
                                                                                        aria-label="Return Action"
                                                                                        className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
                                                                                        value={returnItem.action}
                                                                                        onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, action: e.target.value } : ri))}
                                                                                    >
                                                                                        <option value="Restock">Restock</option>
                                                                                        <option value="Discard">Discard</option>
                                                                                        <option value="Quarantine">Quarantine</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {foundSale.items.length > 0 && (
                                                    <Pagination
                                                        currentPage={returnItemsPage}
                                                        totalPages={foundSaleTotalPages}
                                                        totalItems={foundSale.items.length}
                                                        itemsPerPage={RETURN_ITEMS_PER_PAGE}
                                                        onPageChange={setReturnItemsPage}
                                                        isLoading={false}
                                                        itemName="items"
                                                    />
                                                )}

                                                <div className="flex justify-between pt-6 border-t border-white/10">
                                                    <button
                                                        onClick={() => {
                                                            setFoundSale(null);
                                                            setReturnStep('Search');
                                                            setReturnItems([]);
                                                        }}
                                                        className="px-6 py-3 text-gray-400 hover:text-white font-bold"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        disabled={returnItems.length === 0}
                                                        onClick={() => setReturnStep('Review')}
                                                        className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${returnItems.length > 0 ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Review Return <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3: Review & Refund */}
                                        {returnStep === 'Review' && foundSale && (
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                    <div className="lg:col-span-2 space-y-4">
                                                        <h4 className="font-bold text-white mb-2">Return Summary</h4>
                                                        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-black/20 text-xs text-gray-400 uppercase">
                                                                    <tr>
                                                                        <th className="p-4">Product</th>
                                                                        <th className="p-4">Reason</th>
                                                                        <th className="p-4">Action</th>
                                                                        <th className="p-4 text-right">Refund</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-white/5 text-sm">
                                                                    {returnItems.map((ri, idx) => {
                                                                        const originalItem = foundSale.items.find((i: any) => i.id === ri.productId);
                                                                        const refundAmount = (originalItem?.price || 0) * ri.quantity;
                                                                        return (
                                                                            <tr key={idx}>
                                                                                <td className="p-4">
                                                                                    <div className="font-bold text-white">{originalItem?.name}</div>
                                                                                    <div className="text-xs text-gray-500">Qty: {ri.quantity}</div>
                                                                                </td>
                                                                                <td className="p-4 text-gray-300">{ri.reason}</td>
                                                                                <td className="p-4">
                                                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${ri.action === 'Restock' ? 'bg-green-500/20 text-green-400' : ri.action === 'Discard' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                                        {ri.action}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-4 text-right font-mono text-white">
                                                                                    {formatCompactNumber(refundAmount, { currency: CURRENCY_SYMBOL })}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    <div className="lg:col-span-1">
                                                        <div className="bg-black/20 rounded-xl border border-white/5 p-6 space-y-4">
                                                            <h4 className="font-bold text-white border-b border-white/10 pb-2">Financial Breakdown</h4>

                                                            {(() => {
                                                                const subtotal = returnItems.reduce((sum, ri) => {
                                                                    const item = foundSale.items.find((i: any) => i.id === ri.productId);
                                                                    return sum + ((item?.price || 0) * ri.quantity);
                                                                }, 0);
                                                                const tax = subtotal * 0.1; // Mock 10% tax
                                                                const total = subtotal + tax;

                                                                return (
                                                                    <div className="space-y-3 text-sm">
                                                                        <div className="flex justify-between text-gray-400">
                                                                            <span>Subtotal</span>
                                                                            <span>{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-gray-400">
                                                                            <span>Tax (10%)</span>
                                                                            <span>{formatCompactNumber(tax, { currency: CURRENCY_SYMBOL })}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-white font-bold text-lg pt-4 border-t border-white/10">
                                                                            <span>Total Refund</span>
                                                                            <span className="text-cyber-primary">{formatCompactNumber(total, { currency: CURRENCY_SYMBOL })}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            <div className="pt-4 space-y-3">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm('Process this return? This action cannot be undone.')) return;

                                                                        // Calculate total
                                                                        const totalRefund = returnItems.reduce((sum, ri) => {
                                                                            const item = foundSale.items.find((i: any) => i.id === ri.productId);
                                                                            return sum + ((item?.price || 0) * ri.quantity);
                                                                        }, 0) * 1.1; // Including tax

                                                                        await processReturn(foundSale.id, returnItems, totalRefund, user?.name || 'WMS');

                                                                        // Stock Adjustments - CREATE REQUESTS
                                                                        for (const item of returnItems) {
                                                                            if (item.action === 'Restock') {
                                                                                const product = products.find(p => p.id === item.productId);
                                                                                const request: Omit<PendingInventoryChange, 'id'> = {
                                                                                    productId: item.productId,
                                                                                    productName: product?.name || 'Unknown',
                                                                                    productSku: product?.sku || 'Unknown',
                                                                                    siteId: product?.siteId || user?.siteId || '',
                                                                                    changeType: 'stock_adjustment',
                                                                                    requestedBy: user?.name || 'WMS',
                                                                                    requestedAt: new Date().toISOString(),
                                                                                    status: 'pending',
                                                                                    adjustmentType: 'IN',
                                                                                    adjustmentQty: item.quantity,
                                                                                    adjustmentReason: `RMA Restock: ${foundSale.id}`
                                                                                };
                                                                                await inventoryRequestsService.create(request);
                                                                            }
                                                                        }

                                                                        setReturnStep('Complete');
                                                                        addNotification('success', 'Return processed successfully');
                                                                    }}
                                                                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                                                >
                                                                    {t('warehouse.processRefund')}
                                                                </button>
                                                                <button
                                                                    onClick={() => setReturnStep('Select')}
                                                                    className="w-full py-3 text-gray-400 hover:text-white font-bold"
                                                                >
                                                                    {t('warehouse.backToSelection')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 4: Complete */}
                                        {returnStep === 'Complete' && (
                                            <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
                                                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                                    <CheckCircle className="text-green-500" size={40} />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <h2 className="text-2xl font-bold text-white">{t('warehouse.returnProcessedSuccessfully')}</h2>
                                                    <p className="text-gray-400">{t('warehouse.rmaGenerated').replace('{rma}', `RMA - ${Date.now().toString().slice(-6)}`)}</p>
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => {
                                                            window.print();
                                                            addNotification('info', t('warehouse.printingReceipt'));
                                                        }}
                                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center gap-2"
                                                    >
                                                        <Printer size={18} /> {t('warehouse.printReceiptButton')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFoundSale(null);
                                                            setReturnItems([]);
                                                            setReturnSearch('');
                                                            setReturnStep('Search');
                                                        }}
                                                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                                                    >
                                                        {t('warehouse.newReturn')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* History View */
                                    <div className="flex-1 flex flex-col pt-4">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-1">
                                            <div>
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                                    <HistoryIcon size={18} className="text-gray-400" />
                                                    Returns History
                                                </h4>
                                                <p className="text-gray-500 text-[10px]">Recent processed returns and refunds</p>
                                            </div>

                                            {/* History Search */}
                                            <div className="relative w-full md:w-72">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Search history..."
                                                    value={returnHistorySearch}
                                                    onChange={(e) => setReturnHistorySearch(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="text-xs text-gray-400 border-b border-white/10 uppercase font-black tracking-widest">
                                                            <th className="p-4">Date</th>
                                                            <th className="p-4">Sale ID</th>
                                                            <th className="p-4">Customer</th>
                                                            <th className="p-4">Items</th>
                                                            <th className="p-4">Total Refund</th>
                                                            <th className="p-4 text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {paginatedRefundedSales.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="p-12 text-center text-gray-500 italic">
                                                                    No return history found matching your search.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            paginatedRefundedSales.map(sale => (
                                                                <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 text-gray-300 font-mono text-[10px]">{formatDateTime(sale.date)}</td>
                                                                    <td className="p-4 font-bold text-white">{sale.id}</td>
                                                                    <td className="p-4 text-gray-400">{sale.customerName || sale.customer_name || 'Walk-in Customer'}</td>
                                                                    <td className="p-4 text-gray-400">{sale.items?.length || 0} Products</td>
                                                                    <td className="p-4 text-blue-400 font-mono font-bold">
                                                                        {formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sale.status === 'Refunded' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                                                            {sale.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {filteredRefundedSales.length > 0 && (
                                                <Pagination
                                                    currentPage={returnHistoryPage}
                                                    totalPages={returnHistoryTotalPages}
                                                    totalItems={filteredRefundedSales.length}
                                                    itemsPerPage={RETURN_HISTORY_PER_PAGE}
                                                    onPageChange={setReturnHistoryPage}
                                                    isLoading={false}
                                                    itemName="returns"
                                                    className="bg-black/40 border-t border-white/10"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* --- TRANSFER TAB (ENTERPRISE) --- */}
                {
                    activeTab === 'TRANSFER' && (
                        <div className="flex-1 overflow-y-auto space-y-6">
                            {!transferReceiveMode ? (
                                <>
                                    {/* Header */}
                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div>
                                                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                                    <Truck className="text-cyber-primary" size={24} />
                                                    {t('warehouse.interSiteTransfers')}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-1">{t('warehouse.requestManageTransfers')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setDistHubLowStockItems([]);
                                                        setDistHubTransferDrafts([]);
                                                        setShowDistHubModal(true);
                                                        fetchDistHubData();
                                                    }}
                                                    className="px-4 py-2 bg-amber-500/20 text-amber-500 font-bold rounded-lg hover:bg-amber-500/30 border border-amber-500/30 transition-colors flex items-center gap-2"
                                                >
                                                    <Layout size={16} />
                                                    Distribution Hub
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setBulkDistributionSourceSite(activeSite?.id || '');
                                                        setBulkDistributionProductId('');

                                                        setBulkDistributionAllocations([]);
                                                        setWaveProducts([]);
                                                        setBulkDistributionMode('single');
                                                        setShowBulkDistributionModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold rounded-lg hover:bg-blue-500/30 border border-blue-500/30 transition-colors flex items-center gap-2"
                                                >
                                                    <Layers size={16} />
                                                    {t('warehouse.bulkDistribution')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // For non-admin users with assigned site, force source to their site
                                                        const isRestricted = !['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId;
                                                        setTransferSourceSite(isRestricted ? (user?.siteId || '') : (activeSite?.id || ''));
                                                        setTransferDestSite('');
                                                        setTransferItems([]);
                                                        setTransferPriority('Normal');
                                                        setTransferNote('');
                                                        setShowTransferModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-accent transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    {t('warehouse.requestTransfer')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Transfer Summary - Compact Row */}
                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                                <span className="text-gray-400">Active:</span>
                                                <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && !['Received', 'Cancelled'].includes(j.transferStatus || '')).length}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                                <span className="text-gray-400">In Transit:</span>
                                                <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'In-Transit').length}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                <span className="text-gray-400">Completed:</span>
                                                <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Received').length}</span>
                                            </div>
                                            {filteredJobs.filter(j => j.type === 'TRANSFER' && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== item.expectedQty && !['Resolved', 'Completed'].includes(item.status))).length > 0 && (
                                                <div className="flex items-center gap-2 text-red-400">
                                                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                                    <span>Discrepancies:</span>
                                                    <span className="font-bold">{filteredJobs.filter(j => j.type === 'TRANSFER' && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== item.expectedQty && !['Resolved', 'Completed'].includes(item.status))).length}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transfer List */}
                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 md:p-6">

                                        {/* Controls Row-Compact */}
                                        <div className="flex items-center justify-between mb-4 gap-2">
                                            {/* Left: Filter + Sort Dropdown */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <select
                                                    aria-label="Filter transfers by status"
                                                    value={transferStatusFilter}
                                                    onChange={(e) => setTransferStatusFilter(e.target.value as any)}
                                                    className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-cyber-primary focus:outline-none"
                                                >
                                                    <option value="ALL">All Transfers</option>
                                                    <option value="Requested">📋 Requested</option>
                                                    <option value="Picking">📦 Picking</option>
                                                    <option value="Packed">📤 Packed</option>
                                                    <option value="In-Transit">🚚 In Transit</option>
                                                    <option value="Delivered">📍 Delivered</option>
                                                    <option value="Received">✅ Received</option>
                                                </select>
                                                <SortDropdown
                                                    label="Sort"
                                                    options={[
                                                        { id: 'date', label: 'Newest', icon: <Clock size={12} /> },
                                                        { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                                                        { id: 'site', label: 'Store', icon: <MapPin size={12} /> },
                                                        { id: 'items', label: 'Size', icon: <List size={12} /> }
                                                    ]}
                                                    value={transferSortBy}
                                                    onChange={(val) => setTransferSortBy(val)}
                                                    isOpen={isTransferSortDropdownOpen}
                                                    setIsOpen={setIsTransferSortDropdownOpen}
                                                />
                                            </div>

                                            {/* Right: Archive Button */}
                                            <button
                                                onClick={() => setShowTransferArchive && setShowTransferArchive(true)}
                                                className="px-3 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-bold hover:bg-white/10 border border-white/10 flex items-center gap-1.5"
                                            >
                                                <FileText size={14} /> Archive
                                            </button>
                                        </div>

                                        {/* ONGOING TRANSFERS */}
                                        {(() => {
                                            // Render Row Logic moved to helper function or inline map
                                            const renderRow = (transfer: any) => {
                                                const hasDisc = (transfer.lineItems || []).some((item: any) =>
                                                    item.receivedQty !== undefined && item.receivedQty !== item.expectedQty &&
                                                    !['Resolved', 'Completed'].includes(item.status)
                                                );
                                                return (
                                                    <div
                                                        key={transfer.id}
                                                        onClick={() => {
                                                            setSelectedJob(transfer);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${hasDisc ? 'border-red-500/40 bg-red-500/5' : 'border-white/5 hover:border-white/10'
                                                            }`}
                                                    >
                                                        {/* Left: ID only */}
                                                        <div className="flex items-center gap-2">
                                                            {hasDisc && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                                                            <span className="font-mono font-bold text-white text-sm">{formatTransferId(transfer)}</span>
                                                        </div>
                                                        {/* Right: Status + Chevron */}
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${statusColors[transfer.transferStatus || 'Requested']}`}>
                                                                {transfer.transferStatus || 'Requested'}
                                                            </span>
                                                            <ChevronRight size={16} className="text-gray-500" />
                                                        </div>
                                                    </div>
                                                );
                                            };

                                            const completedTransfers = filteredJobs
                                                .filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Received')
                                                .sort((a, b) => new Date(b.receivedAt || b.createdAt || b.orderRef).getTime() - new Date(a.receivedAt || a.createdAt || a.orderRef).getTime())
                                                .slice(0, 10); // Show last 10 completed

                                            const statusColors: Record<string, string> = {
                                                'Requested': 'bg-yellow-500/20 text-yellow-400',
                                                'Approved': 'bg-blue-500/20 text-blue-400',
                                                'Picking': 'bg-orange-500/20 text-orange-400',
                                                'Picked': 'bg-amber-500/20 text-amber-400',
                                                'Packed': 'bg-indigo-500/20 text-indigo-400',
                                                'In-Transit': 'bg-purple-500/20 text-purple-400',
                                                'Delivered': 'bg-cyan-500/20 text-cyan-400',
                                                'Received': 'bg-green-500/20 text-green-400',
                                            };

                                            return (
                                                <div className="space-y-6">
                                                    {/* ONGOING Section */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">Ongoing</h4>
                                                            <span className="text-xs text-gray-500">({filteredOngoingTransfers.length})</span>
                                                        </div>
                                                        {filteredOngoingTransfers.length > 0 ? (
                                                            <>
                                                                <div className="space-y-2">
                                                                    {paginatedOngoingTransfers.map(renderRow)}
                                                                </div>
                                                                {/* Helper pagination controls if many ongoing transfers */}
                                                                <div className="mt-4">
                                                                    <Pagination
                                                                        currentPage={transferCurrentPage}
                                                                        totalPages={transferTotalPages}
                                                                        totalItems={filteredOngoingTransfers.length}
                                                                        itemsPerPage={TRANSFER_ITEMS_PER_PAGE}
                                                                        onPageChange={setTransferCurrentPage}
                                                                        isLoading={false}
                                                                        itemName="transfers"
                                                                    />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-8 text-gray-500 bg-white/[0.02] rounded-lg border border-white/5">
                                                                <Truck size={32} className="mx-auto mb-2 opacity-30" />
                                                                <p className="text-sm">No ongoing transfers</p>
                                                            </div>
                                                        )}
                                                    </div>



                                                    {/* TRANSFER History Section */}
                                                    <div className="border-t border-white/10 mt-10 pt-8 pb-10">
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                                                    <HistoryIcon size={18} className="text-gray-400" />
                                                                    Transfer History
                                                                </h4>
                                                                <p className="text-gray-500 text-[10px]">Recent completed or received transfers</p>
                                                            </div>

                                                            {/* History Search */}
                                                            <div className="relative w-full md:w-72">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search history..."
                                                                    value={transferHistorySearch}
                                                                    onChange={(e) => setTransferHistorySearch(e.target.value)}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-primary/50 transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        {paginatedTransferHistory.length > 0 ? (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                                    {paginatedTransferHistory.map((transfer: TransferRecord) => (
                                                                        <div
                                                                            key={transfer.id}
                                                                            onClick={() => {
                                                                                setSelectedJob(transfer as any);
                                                                                setIsDetailsOpen(true);
                                                                            }}
                                                                            className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                                        >
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="text-[10px] font-mono text-cyber-primary font-bold">{formatTransferId(transfer as any)}</span>
                                                                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-green-500/10 text-green-400">
                                                                                    {transfer.status}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-end">
                                                                                <div>
                                                                                    <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{transfer.id}</p>
                                                                                    <p className="text-[9px] text-gray-600 mt-0.5">{formatDateTime(transfer.date)}</p>
                                                                                </div>
                                                                                <div className="text-right text-white font-bold text-xs">
                                                                                    {Array.isArray(transfer.items) ? (transfer.items as any[]).length : 0} <span className="text-[9px] text-gray-500 font-normal">items</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <Pagination
                                                                    currentPage={transferHistoryPage}
                                                                    totalPages={transferHistoryTotalPages}
                                                                    totalItems={filteredTransferHistory.length}
                                                                    itemsPerPage={TRANSFER_HISTORY_PER_PAGE}
                                                                    onPageChange={setTransferHistoryPage}
                                                                    itemName="history"
                                                                />
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                                                <p className="text-gray-500 text-xs">No matching history found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </>
                            ) : (
                                /* --- RECEIVING MODE --- */
                                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 min-h-[600px] flex flex-col">
                                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                        <div>
                                            <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                                                <ClipboardCheck className="text-green-400" size={24} />
                                                Receive Transfer {activeTransferJob ? formatTransferId(activeTransferJob) : ''}
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">Verify items and quantities from {sites.find(s => s.id === activeTransferJob?.sourceSiteId)?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setTransferReceiveItems(transferReceiveItems.map(item => ({ ...item, receivedQty: item.expectedQty })));
                                                    addNotification('info', 'All items marked as fully received');
                                                }}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg"
                                            >
                                                Receive All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-4">
                                        {transferReceiveItems.map((item, idx) => {
                                            const product = products.find(p => p.id === item.productId);
                                            const isDiscrepancy = item.receivedQty !== item.expectedQty;

                                            return (
                                                <div key={idx} className={`p-4 rounded-xl border transition-all ${isDiscrepancy ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5'}`}>
                                                    {/* Discrepancy Warning */}
                                                    {isDiscrepancy && (
                                                        <div className="flex items-center gap-2 mb-3 p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
                                                            <AlertOctagon size={14} className="text-red-400" />
                                                            <span className="text-xs font-bold text-red-400">
                                                                VARIANCE: {item.receivedQty - item.expectedQty > 0 ? '+' : ''}{item.receivedQty - item.expectedQty} units
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col md:flex-row gap-4 items-center">
                                                        <div className="flex-1">
                                                            <h4 className={`font-bold ${isDiscrepancy ? 'text-red-400' : 'text-white'}`}>{product?.name || 'Unknown Product'}</h4>
                                                            <p className="text-xs text-gray-400">SKU: {product?.sku || item.productId}</p>
                                                        </div>

                                                        <div className="flex items-center gap-6">
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Expected</p>
                                                                <p className="text-xl font-mono text-white">{item.expectedQty}</p>
                                                            </div>

                                                            <div className="text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Received</p>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        aria-label="Decrease Quantity"
                                                                        onClick={() => {
                                                                            const newQty = Math.max(0, item.receivedQty - 1);
                                                                            setTransferReceiveItems(prev => prev.map((pi, i) => i === idx ? { ...pi, receivedQty: newQty } : pi));
                                                                        }}
                                                                        className="w-8 h-8 rounded bg-white/10 flex items-center justify-center hover:bg-white/20"
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        aria-label="Received Quantity"
                                                                        className={`w-16 bg-black border rounded-lg p-2 text-center font-mono font-bold ${isDiscrepancy ? 'text-red-400 border-red-500/50 animate-pulse' : 'text-green-400 border-green-500/50'}`}
                                                                        value={item.receivedQty}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 0;
                                                                            setTransferReceiveItems(prev => prev.map((pi, i) => i === idx ? { ...pi, receivedQty: val } : pi));
                                                                        }}
                                                                    />
                                                                    <button
                                                                        aria-label="Increase Quantity"
                                                                        onClick={() => {
                                                                            const newQty = item.receivedQty + 1;
                                                                            setTransferReceiveItems(prev => prev.map((pi, i) => i === idx ? { ...pi, receivedQty: newQty } : pi));
                                                                        }}
                                                                        className="w-8 h-8 rounded bg-white/10 flex items-center justify-center hover:bg-white/20"
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Condition</p>
                                                                <select
                                                                    aria-label="Item Condition"
                                                                    className="bg-black border border-white/10 rounded-lg p-2 text-sm text-white w-32"
                                                                    value={item.condition}
                                                                    onChange={(e) => setTransferReceiveItems(prev => prev.map((pi, i) => i === idx ? { ...pi, condition: e.target.value } : pi))}
                                                                >
                                                                    <option>Good</option>
                                                                    <option>Damaged</option>
                                                                    <option>Expired</option>
                                                                    <option>Missing</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-end gap-4">
                                        <button
                                            onClick={() => {
                                                setTransferReceiveMode(false);
                                                setActiveTransferJob(null);
                                                setTransferReceiveItems([]);
                                            }}
                                            className="px-6 py-3 text-gray-400 hover:text-white font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!activeTransferJob || loadingActions[activeTransferJob.id]) return;
                                                setLoadingActions(prev => ({ ...prev, [activeTransferJob.id]: true }));
                                                try {
                                                    // 1. Update Job Status and Line Items with Received Data
                                                    const updatedLineItems = activeTransferJob.lineItems.map((item: any, idx: number) => {
                                                        const rx = transferReceiveItems[idx];
                                                        return {
                                                            ...item,
                                                            receivedQty: rx ? rx.receivedQty : 0,
                                                            condition: rx ? rx.condition : 'Good',
                                                            status: (rx && rx.receivedQty === item.expectedQty) ? 'Completed' : 'Discrepancy'
                                                        };
                                                    });

                                                    const hasDiscrepancy = updatedLineItems.some((i: any) => i.status === 'Discrepancy');
                                                    await wmsJobsService.update(activeTransferJob.id, {
                                                        transferStatus: 'Received',
                                                        receivedAt: new Date().toISOString(),
                                                        status: hasDiscrepancy ? 'In-Progress' : 'Completed',
                                                        lineItems: updatedLineItems, // Persist received quantities!
                                                        discrepancies: transferReceiveItems.filter(i => i.receivedQty !== i.expectedQty) as any // Cast if needed
                                                    } as any);

                                                    // 2. Update Inventory for RECEIVED items-find or create products at destination site
                                                    const destSiteId = activeTransferJob.destSiteId || activeTransferJob.dest_site_id || activeSite?.id;

                                                    for (const item of transferReceiveItems) {
                                                        if (item.receivedQty > 0) {
                                                            // Find source product to get details (SKU, name, etc)
                                                            const sourceProduct = allProducts.find(p => p.id === item.productId) ||
                                                                products.find(p => p.id === item.productId);

                                                            if (!sourceProduct) {
                                                                console.error(`Source product ${item.productId} not found`);
                                                                continue;
                                                            }

                                                            // Find if product exists at destination by SKU
                                                            const destProduct = products.find(p =>
                                                                p.sku === sourceProduct.sku &&
                                                                (p.siteId === destSiteId || p.site_id === destSiteId)
                                                            );

                                                            if (destProduct) {
                                                                // Product exists at destination-update its stock
                                                                await adjustStock(
                                                                    destProduct.id,
                                                                    item.receivedQty,
                                                                    'IN',
                                                                    `Transfer Received: ${formatJobId(activeTransferJob)} (${item.condition})`,
                                                                    user?.name || 'System'
                                                                );
                                                                console.log(`📥 Added ${item.receivedQty} of ${destProduct.name} to ${destProduct.id} `);
                                                            } else {
                                                                // Product doesn't exist at destination-create it
                                                                try {
                                                                    await addProduct({
                                                                        siteId: destSiteId,
                                                                        site_id: destSiteId,
                                                                        name: sourceProduct.name,
                                                                        sku: sourceProduct.sku,
                                                                        category: sourceProduct.category,
                                                                        price: sourceProduct.price,
                                                                        costPrice: sourceProduct.costPrice,
                                                                        salePrice: sourceProduct.salePrice,
                                                                        isOnSale: sourceProduct.isOnSale,
                                                                        stock: item.receivedQty,
                                                                        status: 'active',
                                                                        location: 'Receiving Dock',
                                                                        image: sourceProduct.image
                                                                    } as any);
                                                                    console.log(`📦 Created new product ${sourceProduct.name} at destination with ${item.receivedQty} units`);
                                                                } catch (createErr) {
                                                                    console.error('Failed to create product at destination:', createErr);
                                                                    addNotification('alert', `Failed to add ${sourceProduct.name} to inventory`);
                                                                }
                                                            }
                                                        }
                                                        // Log discrepancies if any
                                                        if (item.receivedQty !== item.expectedQty) {
                                                            const productName = products.find(p => p.id === item.productId)?.name || 'Unknown';
                                                            addNotification('alert', `Discrepancy logged for ${productName}: Exp ${item.expectedQty} / Rec ${item.receivedQty}`);
                                                        }
                                                    }

                                                    addNotification('success', 'Transfer received successfully');
                                                    setTransferReceiveMode(false);
                                                    setActiveTransferJob(null);
                                                    setTransferReceiveItems([]);
                                                } catch (e) {
                                                    addNotification('alert', 'Failed to process receipt');
                                                } finally {
                                                    setLoadingActions(prev => ({ ...prev, [activeTransferJob.id]: false }));
                                                }
                                            }}
                                            disabled={activeTransferJob ? loadingActions[activeTransferJob.id] : false}
                                            className={`px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-2 ${activeTransferJob && loadingActions[activeTransferJob.id] ? 'opacity-50 cursor-wait' : ''}`}
                                        >
                                            {activeTransferJob && loadingActions[activeTransferJob.id] ? (
                                                <>
                                                    <RefreshCw className="animate-spin" size={18} />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} />
                                                    Finalize Receipt
                                                </>
                                            )}
                                        </button >
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Transfer Archive Modal - Search Historical Transfers */}
                {
                    showTransferArchive && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-cyber-gray rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                {/* Header */}
                                <div className="p-4 md:p-6 border-b border-white/10">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                                <FileText size={20} />
                                            </div>
                                            Transfer Archive
                                        </h3>
                                        <button
                                            aria-label="Close archive"
                                            onClick={() => setShowTransferArchive(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <X size={20} className="text-gray-400" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Search and retrieve any historical transfer record</p>
                                </div>

                                {/* Search Controls */}
                                <div className="p-4 border-b border-white/10 bg-black/20">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search by Transfer ID, Store, or Product..."
                                                value={archiveSearchQuery}
                                                onChange={(e) => setArchiveSearchQuery(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyber-primary focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={archiveDateFrom}
                                                onChange={(e) => setArchiveDateFrom(e.target.value)}
                                                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                                title="From Date"
                                            />
                                            <input
                                                type="date"
                                                value={archiveDateTo}
                                                onChange={(e) => setArchiveDateTo(e.target.value)}
                                                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                                title="To Date"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Archive List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {paginatedArchiveTransfers.map(transfer => {
                                        const sourceSite = sites.find(s => s.id === transfer.sourceSiteId);
                                        const destSite = sites.find(s => s.id === transfer.destSiteId);
                                        const hasDisc = (transfer.lineItems || []).some((item: any) =>
                                            item.receivedQty !== undefined &&
                                            item.receivedQty !== item.expectedQty &&
                                            !['Resolved', 'Completed'].includes(item.status)
                                        );

                                        return (
                                            <div
                                                key={transfer.id}
                                                className={`p-3 rounded-lg border cursor-pointer hover:bg-white/10 transition-colors ${hasDisc ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedJob(transfer);
                                                    setShowTransferArchive(false);
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-mono font-bold text-white">{formatTransferId(transfer)}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${transfer.transferStatus === 'Received' ? 'bg-green-500/20 text-green-400' :
                                                            transfer.transferStatus === 'In-Transit' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {transfer.transferStatus || 'Requested'}
                                                        </span>
                                                        {hasDisc && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-red-500/30 text-red-400 rounded font-bold">
                                                                DISCREPANCY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span>{sourceSite?.name} → {destSite?.name}</span>
                                                        <span className="font-mono">{formatDateTime(transfer.createdAt || transfer.orderRef)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {filteredArchiveTransfers.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            <FileText size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No transfers found matching your criteria</p>
                                        </div>
                                    )}

                                    {/* Archive Pagination Controls */}
                                    {archiveTotalPages > 1 && (
                                        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                                            <button
                                                onClick={() => setArchiveCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={archiveCurrentPage === 1}
                                                title="Previous Page"
                                                aria-label="Previous Page"
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold disabled:opacity-30"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-[10px] uppercase text-gray-500 font-bold">
                                                Page <span className="text-white">{archiveCurrentPage}</span> of {archiveTotalPages}
                                            </span>
                                            <button
                                                onClick={() => setArchiveCurrentPage(p => Math.min(archiveTotalPages, p + 1))}
                                                disabled={archiveCurrentPage === archiveTotalPages}
                                                title="Next Page"
                                                aria-label="Next Page"
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold disabled:opacity-30"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Transfer Request Modal */}
                {
                    showTransferModal && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-cyber-gray rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <Truck size={20} />
                                            </div>
                                            New Transfer Request
                                        </h3>
                                        <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10" aria-label="Close Modal">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold ${transferSourceSite ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                                            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">1</span>
                                            Source
                                            {transferSourceSite && <CheckCircle size={12} />}
                                        </div>
                                        <ArrowRight size={12} className="text-gray-600" />
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold ${transferDestSite ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                                            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">2</span>
                                            Destination
                                            {transferDestSite && <CheckCircle size={12} />}
                                        </div>
                                        <ArrowRight size={12} className="text-gray-600" />
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold ${transferItems.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                                            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">3</span>
                                            Products
                                            {transferItems.length > 0 && <CheckCircle size={12} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Step 1: Source & Destination */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2 flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                                                From (Source Warehouse)
                                            </label>
                                            <select
                                                disabled={!['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId}
                                                value={transferSourceSite}
                                                onChange={(e) => {
                                                    setTransferSourceSite(e.target.value);
                                                    setTransferItems([]); // Clear items when source changes
                                                }}
                                                aria-label="Source Site"
                                                className={`w-full bg-black/50 border-2 ${transferSourceSite ? 'border-green-500/50' : 'border-white/10'} rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-colors ${!['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">Select source warehouse...</option>
                                                {sites
                                                    .filter(s =>
                                                        s.status === 'Active' &&
                                                        s.type !== 'Administration' &&
                                                        s.type !== 'Administrative' &&
                                                        !s.name?.toLowerCase().includes('hq') &&
                                                        !s.name?.toLowerCase().includes('headquarters')
                                                    )
                                                    .map(site => (
                                                        <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                                    ))}
                                            </select>
                                            {transferSourceSite && (
                                                <div className="absolute right-3 top-9 text-green-400">
                                                    <CheckCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2 flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">2</span>
                                                To (Destination)
                                            </label>
                                            <select
                                                value={transferDestSite}
                                                onChange={(e) => setTransferDestSite(e.target.value)}
                                                aria-label="Destination Site"
                                                disabled={!transferSourceSite}
                                                className={`w-full bg-black/50 border-2 ${transferDestSite ? 'border-green-500/50' : 'border-white/10'} rounded-xl p-3 text-white text-sm focus:border-purple-500 transition-colors ${!transferSourceSite ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">{transferSourceSite ? 'Select destination...' : 'Select source first'}</option>
                                                {sites
                                                    .filter(s =>
                                                        s.status === 'Active' &&
                                                        s.id !== transferSourceSite &&
                                                        s.type !== 'Administration' &&
                                                        s.type !== 'Administrative' &&
                                                        !s.name?.toLowerCase().includes('hq') &&
                                                        !s.name?.toLowerCase().includes('headquarters')
                                                    )
                                                    .map(site => (
                                                        <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                                    ))}
                                            </select>
                                            {transferDestSite && (
                                                <div className="absolute right-3 top-9 text-green-400">
                                                    <CheckCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Visual Route Display */}
                                    {transferSourceSite && transferDestSite && (
                                        <div className="flex items-center justify-center gap-4 py-3 px-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-xl border border-white/5">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 mb-1">FROM</div>
                                                <div className="text-sm font-bold text-blue-400">{sites.find(s => s.id === transferSourceSite)?.name}</div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <div className="w-8 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500" />
                                                <Truck size={20} className="text-purple-400" />
                                                <div className="w-8 h-[2px] bg-gradient-to-r from-purple-500 to-green-500" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 mb-1">TO</div>
                                                <div className="text-sm font-bold text-green-400">{sites.find(s => s.id === transferDestSite)?.name}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Priority */}
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Priority Level</label>
                                        <div className="flex gap-2">
                                            {(['Normal', 'High', 'Critical'] as const).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setTransferPriority(p)}
                                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${transferPriority === p
                                                        ? p === 'Critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' :
                                                            p === 'High' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' :
                                                                'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                                        }`}
                                                >
                                                    {p === 'Critical' && '🚨 '}{p === 'High' && '⚡ '}{p === 'Normal' && '📦 '}{p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Step 3: Items to Transfer */}
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold">3</span>
                                            Products to Transfer
                                            {transferItems.length > 0 && (
                                                <span className="ml-auto text-green-400 text-[10px] bg-green-500/20 px-2 py-0.5 rounded-full">
                                                    {transferItems.length} item{transferItems.length !== 1 ? 's' : ''} • {transferItems.reduce((sum, i) => sum + i.quantity, 0)} units
                                                </span>
                                            )}
                                        </label>

                                        {!transferSourceSite ? (
                                            <div className="bg-black/30 rounded-xl border border-dashed border-white/20 p-8 text-center">
                                                <Package size={32} className="mx-auto text-gray-600 mb-2" />
                                                <p className="text-gray-500 text-sm">Select a source warehouse first to see available products</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-black/30 rounded-xl border border-white/10 p-4 max-h-60 overflow-y-auto">
                                                    {transferItems.length === 0 ? (
                                                        <div className="text-center py-6">
                                                            <Package size={28} className="mx-auto text-gray-600 mb-2" />
                                                            <p className="text-gray-500 text-sm">No products added yet</p>
                                                            <p className="text-gray-600 text-xs mt-1">Use the dropdown below to add products</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {transferItems.map((item, idx) => {
                                                                const product = allProducts.find(p => p.id === item.productId);
                                                                const stockPercent = product ? (item.quantity / product.stock) * 100 : 0;
                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center overflow-hidden">
                                                                                {product?.image && !product.image.includes('placeholder.com') ? (
                                                                                    <img
                                                                                        src={product.image}
                                                                                        alt=""
                                                                                        className="w-full h-full object-cover"
                                                                                        onError={(e) => {
                                                                                            e.currentTarget.style.display = 'none';
                                                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <Package size={16} className="text-gray-700" />
                                                                                )}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-sm text-white font-medium truncate">{product?.name}</p>
                                                                                <p className="text-[10px] text-gray-500">SKU: {product?.sku || 'N/A'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            {/* Quantity Control */}
                                                                            <div className="flex flex-col items-center">
                                                                                <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newItems = [...transferItems];
                                                                                            newItems[idx].quantity = Math.max(1, item.quantity - 1);
                                                                                            setTransferItems(newItems);
                                                                                        }}
                                                                                        title="Decrease Quantity"
                                                                                        aria-label="Decrease Quantity"
                                                                                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                                                                                    >-</button>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        max={product?.stock || 999}
                                                                                        aria-label={`Quantity for ${product?.name}`}
                                                                                        value={item.quantity}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...transferItems];
                                                                                            const maxQty = product?.stock || 999;
                                                                                            const inputQty = parseInt(e.target.value) || 1;
                                                                                            newItems[idx].quantity = Math.min(Math.max(1, inputQty), maxQty);
                                                                                            setTransferItems(newItems);
                                                                                        }}
                                                                                        className="w-12 bg-transparent text-white text-sm text-center font-bold"
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newItems = [...transferItems];
                                                                                            const maxQty = product?.stock || 999;
                                                                                            newItems[idx].quantity = Math.min(item.quantity + 1, maxQty);
                                                                                            setTransferItems(newItems);
                                                                                        }}
                                                                                        title="Increase Quantity"
                                                                                        aria-label="Increase Quantity"
                                                                                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                                                                                    >+</button>
                                                                                </div>
                                                                                {/* Stock indicator */}
                                                                                <div className="w-full mt-1">
                                                                                    <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full transition-all ${stockPercent > 80 ? 'bg-red-500' : stockPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'} w-[${Math.round(Math.min(stockPercent, 100))}%]`}
                                                                                        />
                                                                                    </div>
                                                                                    <p className="text-[9px] text-gray-500 text-center mt-0.5">
                                                                                        {item.quantity} of {product?.stock} ({Math.round(stockPercent)}%)
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}
                                                                                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                                                                aria-label={`Remove ${product?.name}`}
                                                                            >
                                                                                <X size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Add Product-Show products from SOURCE site, or all if none found */}
                                                <div className="mt-3">
                                                    {(() => {
                                                        // First try to get site-specific products
                                                        const siteProducts = allProducts.filter(p =>
                                                            (p.siteId === transferSourceSite || p.site_id === transferSourceSite) &&
                                                            p.stock > 0 &&
                                                            !transferItems.find(i => i.productId === p.id)
                                                        );
                                                        // Fallback to all products if none found for site
                                                        const availableProducts = siteProducts.length > 0 ? siteProducts : allProducts.filter(p =>
                                                            p.stock > 0 &&
                                                            !transferItems.find(i => i.productId === p.id)
                                                        );
                                                        const isFallback = siteProducts.length === 0 && availableProducts.length > 0;

                                                        return (
                                                            <>
                                                                <select
                                                                    onChange={(e) => {
                                                                        if (e.target.value && !transferItems.find(i => i.productId === e.target.value)) {
                                                                            setTransferItems([...transferItems, { productId: e.target.value, quantity: 1 }]);
                                                                        }
                                                                        e.target.value = '';
                                                                    }}
                                                                    aria-label="Add Product to Transfer"
                                                                    className="w-full bg-black/50 border-2 border-dashed border-white/20 hover:border-green-500/50 rounded-xl p-3 text-white text-sm transition-colors cursor-pointer"
                                                                >
                                                                    <option value="">
                                                                        {availableProducts.length > 0
                                                                            ? `➕ Add product (${availableProducts.length} available)...`
                                                                            : '⚠️ No products with stock found'
                                                                        }
                                                                    </option>
                                                                    {availableProducts.map(p => (
                                                                        <option key={p.id} value={p.id}>
                                                                            {p.name} — {p.stock} in stock {p.siteId ? `(${sites.find(s => s.id === p.siteId)?.name || 'Unknown site'})` : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <p className={`text-[10px] mt-1 text-center ${isFallback ? 'text-yellow-500' : 'text-gray-600'}`}>
                                                                    {isFallback
                                                                        ? '⚠️ No products assigned to this warehouse-showing all available products'
                                                                        : siteProducts.length > 0
                                                                            ? `Showing ${siteProducts.length} products from ${sites.find(s => s.id === transferSourceSite)?.name}`
                                                                            : 'Select products to transfer'
                                                                    }
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Note */}
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Notes (Optional)</label>
                                        <textarea
                                            value={transferNote}
                                            onChange={(e) => setTransferNote(e.target.value)}
                                            placeholder="Reason for transfer, special handling instructions..."
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm resize-none h-20 focus:border-blue-500/50 transition-colors"
                                        />
                                    </div>

                                    {/* Summary */}
                                    {transferSourceSite && transferDestSite && transferItems.length > 0 && (
                                        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 p-4">
                                            <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                                                <CheckCircle size={16} />
                                                Ready to Submit
                                            </h4>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{transferItems.length}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">Products</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{transferItems.reduce((sum, i) => sum + i.quantity, 0)}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">Total Units</p>
                                                </div>
                                                <div>
                                                    <p className={`text-2xl font-bold ${transferPriority === 'Critical' ? 'text-red-400' : transferPriority === 'High' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                        {transferPriority}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 uppercase">Priority</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowTransferModal(false)}
                                        className="px-6 py-2 bg-white/5 text-gray-400 rounded-lg font-bold hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!transferSourceSite || !transferDestSite || transferItems.length === 0) {
                                                addNotification('alert', 'Please fill in all required fields');
                                                return;
                                            }

                                            setIsCreatingTransfer(true);
                                            try {
                                                const transferJob: WMSJob = {
                                                    id: `TRF-${Date.now()}`,
                                                    siteId: transferSourceSite,
                                                    site_id: transferSourceSite,
                                                    sourceSiteId: transferSourceSite,
                                                    source_site_id: transferSourceSite,
                                                    destSiteId: transferDestSite,
                                                    dest_site_id: transferDestSite,
                                                    type: 'TRANSFER',
                                                    status: 'Pending',
                                                    priority: transferPriority,
                                                    location: 'Transfer',
                                                    assignedTo: '',
                                                    items: transferItems.length,
                                                    lineItems: transferItems.map(item => {
                                                        const product = allProducts.find(p => p.id === item.productId);
                                                        return {
                                                            productId: item.productId,
                                                            sku: product?.sku || '',
                                                            name: product?.name || '',
                                                            image: product?.image || '',
                                                            expectedQty: item.quantity,
                                                            pickedQty: 0,
                                                            status: 'Pending'
                                                        };
                                                    }),
                                                    orderRef: new Date().toISOString(),
                                                    transferStatus: 'Requested',
                                                    requestedBy: user?.name || 'System'
                                                };
                                                // console.log('📦 Creating Transfer Job:', transferJob);
                                                // console.log('📦 Transfer Items:', transferItems);
                                                // console.log('📦 Line Items:', transferJob.lineItems);

                                                const createdJob = await wmsJobsService.create(transferJob);
                                                // console.log('✅ Transfer Job Created:', createdJob);

                                                addNotification('success', t('warehouse.transferRequestCreated'));

                                                // Clear form and close modal
                                                setTransferItems([]);
                                                setTransferSourceSite('');
                                                setTransferDestSite('');
                                                setTransferNote('');
                                                setTransferPriority('Normal');
                                                setShowTransferModal(false);
                                                setIsCreatingTransfer(false);

                                                // Refresh data to show new transfer (without logout)
                                                await refreshData();
                                            } catch (e) {
                                                console.error('Failed to create transfer:', e);
                                                addNotification('alert', t('warehouse.failedToCreateTransfer'));
                                                setIsCreatingTransfer(false);
                                            }
                                        }}
                                        disabled={isCreatingTransfer || !transferSourceSite || !transferDestSite || transferItems.length === 0}
                                        className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${transferSourceSite && transferDestSite && transferItems.length > 0 && !isCreatingTransfer
                                            ? 'bg-cyber-primary text-black hover:bg-cyber-accent'
                                            : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isCreatingTransfer ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={16} />
                                                {t('warehouse.creating')}
                                            </>
                                        ) : (
                                            t('warehouse.createTransferRequest')
                                        )}
                                    </button>
                                </div>


                            </div>
                        </div>
                    )
                }


                {/* QR Scanner Modal */}
                {
                    isQRScannerOpen && (
                        <QRScanner
                            onScan={(data) => {
                                if (qrScannerMode === 'location') {
                                    // Handle location scan
                                    const upperData = data.toUpperCase();
                                    if (/^[A-Z]-\d{2}-\d{2}$/.test(upperData)) {
                                        handleLocationSelect(upperData);
                                        setLocationSearch('');
                                    } else {
                                        addNotification('alert', 'Invalid location format. Expected: A-01-01');
                                    }
                                } else {
                                    // Handle product scan
                                    setScannedItem(data);
                                    // Get current item from selected job
                                    const currentItem = selectedJob?.lineItems.find(i => i.status === 'Pending');

                                    // Trigger the same validation logic as manual entry
                                    const scannedValue = data.trim().toUpperCase();
                                    const expectedProduct = filteredProducts.find(p => p.id === currentItem?.productId);
                                    const scannedProduct = filteredProducts.find(p =>
                                        p.sku?.toUpperCase() === scannedValue ||
                                        p.id.toUpperCase() === scannedValue ||
                                        p.id.replace(/[^A-Z0-9]/gi, '').toUpperCase() === scannedValue.replace(/[^A-Z0-9]/gi, '')
                                    );

                                    if (scannedProduct && expectedProduct && scannedProduct.id === expectedProduct.id) {
                                        handleItemScan();
                                        setScannedItem('');
                                        addNotification('success', '✓ Product verified!');
                                    } else {
                                        addNotification('alert', `⚠️ Wrong product! Expected: ${expectedProduct?.sku || expectedProduct?.id}, Scanned: ${scannedValue}`);
                                        setScannedItem('');
                                    }
                                }
                                setIsQRScannerOpen(false);
                            }}
                            onClose={() => setIsQRScannerOpen(false)}
                            title={qrScannerMode === 'location' ? 'Scan Location Barcode/QR' : 'Scan Product Barcode/QR'}
                            description={qrScannerMode === 'location' ? 'Position the location barcode within the frame' : 'Position the product barcode within the frame'}
                        />
                    )
                }

                {/* ========== CUSTOM MODALS ========== */}

                {/* Short Pick Quantity Modal */}
                {
                    showShortPickModal && selectedJob?.lineItems.find(i => i.status === 'Pending') && (
                        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4" onClick={() => setShowShortPickModal(false)}>
                            <div className="bg-cyber-gray border-t md:border border-cyber-primary/30 rounded-t-2xl md:rounded-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 max-w-md w-full shadow-[0_0_50px_rgba(0,255,157,0.3)]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-red-500/20 rounded-lg">
                                        <AlertTriangle className="text-red-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{t('warehouse.shortPickTitle')}</h3>
                                        <p className="text-sm text-gray-400">{t('warehouse.enterActualQuantityPicked')}</p>
                                    </div>
                                </div>

                                {/* Resolution Type Selector */}
                                <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-black/40 rounded-lg border border-white/10">
                                    <button
                                        onClick={() => setShortPickResolution('standard')}
                                        className={`py-2 px-3 rounded text-xs font-bold transition-all ${shortPickResolution === 'standard'
                                            ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20'
                                            : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Standard Shortage
                                    </button>
                                    <button
                                        onClick={() => setShortPickResolution('discontinue')}
                                        className={`py-2 px-3 rounded text-xs font-bold transition-all ${shortPickResolution === 'discontinue'
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                            : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Discontinue Product
                                    </button>
                                </div>

                                {shortPickResolution === 'discontinue' && (
                                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg animate-in fade-in duration-300">
                                        <p className="text-xs text-red-200 flex items-start gap-2">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Warning:</strong> This will archive the product <strong>{selectedJob?.lineItems.find(i => i.status === 'Pending')?.name}</strong> and set stock to 0. It will be removed from sale.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <p className="text-sm text-yellow-400">
                                        <strong>{t('warehouse.expected')}:</strong> {shortPickMaxQty} {t('common.quantity')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t('warehouse.enterActualQuantity')}
                                    </p>
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    max={shortPickMaxQty}
                                    value={shortPickQuantity}
                                    onChange={(e) => setShortPickQuantity(e.target.value)}
                                    placeholder={t('warehouse.enterQuantity')}
                                    className="w-full bg-black/50 border-2 border-cyber-primary/30 rounded-lg p-4 text-white text-center text-2xl font-bold focus:border-cyber-primary focus:outline-none mb-4"
                                    autoFocus
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            const actualQty = parseInt(shortPickQuantity);
                                            if (!isNaN(actualQty) && actualQty >= 0 && actualQty < shortPickMaxQty) {
                                                handleItemScan(actualQty);
                                                addNotification('alert', t('warehouse.shortPickRecorded').replace('{actual}', actualQty.toString()).replace('{expected}', shortPickMaxQty.toString()));
                                                setShowShortPickModal(false);
                                            } else if (actualQty >= shortPickMaxQty) {
                                                handleItemScan();
                                                setShowShortPickModal(false);
                                            } else {
                                                addNotification('alert', t('warehouse.invalidQuantity'));
                                            }
                                        }
                                    }}
                                />

                                <div className="flex gap-3">
                                    <button
                                        disabled={isProcessingScan}
                                        onClick={() => setShowShortPickModal(false)}
                                        className={`flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg transition-colors ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}`}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        disabled={isProcessingScan}
                                        onClick={async () => {
                                            if (isProcessingScan) return;

                                            // Handle Discontinue Workflow
                                            if (shortPickResolution === 'discontinue') {
                                                const currentItem = selectedJob?.lineItems.find(i => i.status === 'Pending');
                                                if (currentItem && currentItem.productId) {
                                                    try {
                                                        setIsProcessingScan(true);
                                                        // 1. Archive Product & Zero Stock
                                                        await productsService.update(currentItem.productId, {
                                                            status: 'archived',
                                                            stock: 0
                                                        } as any);

                                                        // 2. Adjust Stock Record (Log the write-off)
                                                        await adjustStock(
                                                            currentItem.productId,
                                                            0, // Set to 0? Or just leave as is since we are archiving? 
                                                            // Logic: The item count expected was X, we found Y (likely 0). 
                                                            // We should record the 0 pick.
                                                            'OUT',
                                                            `DISCONTINUING PRODUCT - Not Found during Job ${selectedJob.jobNumber}`,
                                                            user?.name || 'System'
                                                        );

                                                        // 3. Complete Item as Discontinued (Qty 0)
                                                        handleItemScan(0, 'Discontinued');

                                                        addNotification('success', t('warehouse.discontinuedArchivedNotification'));
                                                        setShowShortPickModal(false);
                                                    } catch (err) {
                                                        console.error(err);
                                                        addNotification('alert', 'Failed to discontinue product');
                                                    } finally {
                                                        setIsProcessingScan(false);
                                                    }
                                                    return;
                                                }
                                            }

                                            // Standard Workflow
                                            const actualQty = parseInt(shortPickQuantity);
                                            if (!isNaN(actualQty) && actualQty >= 0 && actualQty < shortPickMaxQty) {
                                                handleItemScan(actualQty);
                                                addNotification('alert', t('warehouse.shortPickRecorded').replace('{actual}', actualQty.toString()).replace('{expected}', shortPickMaxQty.toString()));
                                                setShowShortPickModal(false);
                                            } else if (actualQty >= shortPickMaxQty) {
                                                handleItemScan();
                                                setShowShortPickModal(false);
                                            } else {
                                                addNotification('alert', t('warehouse.invalidQuantity'));
                                            }
                                        }}
                                        className={`flex-1 py-3 bg-cyber-primary text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'}`}
                                    >
                                        {isProcessingScan && <RefreshCw size={18} className="animate-spin" />}
                                        {isProcessingScan ? t('warehouse.processing') : t('common.confirm')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Zone Lock Reason Modal */}
                {
                    showZoneLockModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[9999] p-0 md:p-4" onClick={() => setShowZoneLockModal(false)}>
                            <div className="bg-cyber-gray border-t md:border border-yellow-500/30 rounded-t-2xl md:rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(255,193,7,0.3)]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                                        <Lock className="text-yellow-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{t('warehouse.lockZone').replace('{zone}', zoneToLock)}</h3>
                                        <p className="text-sm text-gray-400">{t('warehouse.enterReasonLocking')}</p>
                                    </div>
                                </div>

                                <textarea
                                    value={zoneLockReason}
                                    onChange={(e) => setZoneLockReason(e.target.value)}
                                    placeholder={t('warehouse.describeDamage')}
                                    className="w-full bg-black/50 border-2 border-yellow-500/30 rounded-lg p-4 text-white focus:border-yellow-500 focus:outline-none mb-4 min-h-[100px]"
                                    autoFocus
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowZoneLockModal(false);
                                            setZoneLockReason('');
                                        }}
                                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLockedZones(prev => new Set(prev).add(zoneToLock));
                                            if (zoneLockReason.trim()) {
                                                setZoneMaintenanceReasons(prev => ({
                                                    ...prev,
                                                    [zoneToLock]: zoneLockReason.trim()
                                                }));
                                            }
                                            addNotification('info', t('warehouse.zoneLockedNotification').replace('{zone}', zoneToLock).replace('{reason}', zoneLockReason.trim() ? `: ${zoneLockReason.trim()}` : t('warehouse.forMaintenance')));
                                            setShowZoneLockModal(false);
                                            setZoneLockReason('');
                                        }}
                                        className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
                                    >
                                        {t('warehouse.lockZoneButton')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Labels Not Printed Confirmation Modal */}
                {
                    showLabelsNotPrintedModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
                            <div className="bg-cyber-gray border border-red-500/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.3)]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-red-500/20 rounded-lg">
                                        <AlertTriangle className="text-red-400 animate-pulse" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-red-400">{t('warehouse.stop')}</h3>
                                        <p className="text-sm text-gray-400">{t('warehouse.labelsRequired')}</p>
                                    </div>
                                </div>

                                <div className="mb-6 space-y-3">
                                    <p className="text-white font-medium">
                                        {t('warehouse.mustPrintLabels')}
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {t('warehouse.mandatoryStep')}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowLabelsNotPrintedModal(false);
                                            setPendingReceiveAction(null);
                                            addNotification('info', t('warehouse.pleasePrintLabels'));
                                        }}
                                        className="w-full py-3 bg-cyber-primary text-black font-bold rounded-lg transition-colors"
                                    >
                                        {t('warehouse.goBackPrintLabels')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Incomplete Packing Confirmation Modal */}
                {
                    showIncompletePackingModal && (
                        (() => {
                            const activeJob = jobs.find(j => j.id === selectedPackJob);
                            const packedCount = activeJob?.lineItems.filter(i => i.status === 'Picked' || i.status === 'Completed').length || 0;
                            const totalItems = activeJob?.lineItems.length || 0;
                            return (
                                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
                                    <div className="bg-cyber-gray border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(255,193,7,0.3)]" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                                <AlertTriangle className="text-yellow-400" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{t('warehouse.incompletePacking')}</h3>
                                                <p className="text-sm text-gray-400">{t('warehouse.notAllItemsPacked')}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <p className="text-white font-medium mb-2">
                                                {t('warehouse.sureCompleteOrder')}
                                            </p>
                                            <p className="text-gray-400 mb-4">
                                                {t('warehouse.onlyPackedOfTotal').replace('{packed}', packedCount.toString()).replace('{total}', totalItems.toString())}
                                            </p>
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                                <p className="text-xs text-yellow-200">
                                                    ⚠️ {t('warehouse.unpackedMarkedMissing')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowIncompletePackingModal(false);
                                                    setPendingPackAction(null);
                                                }}
                                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                            >
                                                {t('warehouse.goBack')}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setShowIncompletePackingModal(false);
                                                    if (pendingPackAction) {
                                                        await pendingPackAction();
                                                        setPendingPackAction(null);
                                                    }
                                                }}
                                                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
                                            >
                                                {t('warehouse.continue')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )
                }

                {/* Missing Ice Packs Confirmation Modal */}
                {
                    showMissingIcePacksModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
                            <div className="bg-cyber-gray border border-blue-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.3)]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg">
                                        <Snowflake className="text-blue-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{t('warehouse.missingIcePacks')}</h3>
                                        <p className="text-sm text-gray-400">{t('warehouse.coldItemsDetected')}</p>
                                    </div>
                                </div>

                                <p className="text-white mb-2">
                                    {t('warehouse.orderContainsColdItems')}
                                </p>
                                <p className="text-gray-400 text-sm mb-6">
                                    {t('warehouse.continueAnyway')}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowMissingIcePacksModal(false);
                                            setPendingPackAction(null);
                                        }}
                                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        {t('warehouse.goBack')}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShowMissingIcePacksModal(false);
                                            if (pendingPackAction) {
                                                await pendingPackAction();
                                                setPendingPackAction(null);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg transition-colors"
                                    >
                                        {t('warehouse.continue')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Missing Protective Materials Confirmation Modal */}
                {
                    showMissingProtectiveModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
                            <div className="bg-cyber-gray border border-orange-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(249,115,22,0.3)]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-orange-500/20 rounded-lg">
                                        <Package className="text-orange-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{t('warehouse.missingProtectiveMaterials')}</h3>
                                        <p className="text-sm text-gray-400">{t('warehouse.fragileItemsDetected')}</p>
                                    </div>
                                </div>

                                <p className="text-white mb-2">
                                    {t('warehouse.orderContainsFragileItems')}
                                </p>
                                <p className="text-gray-400 text-sm mb-6">
                                    {t('warehouse.continueAnyway')}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowMissingProtectiveModal(false);
                                            setPendingPackAction(null);
                                        }}
                                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShowMissingProtectiveModal(false);
                                            if (pendingPackAction) {
                                                await pendingPackAction();
                                                setPendingPackAction(null);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Bulk Distribution Modal-Wave Transfer to Multiple Stores */}
                {
                    showBulkDistributionModal && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowBulkDistributionModal(false)}>
                            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Layers className="text-blue-500" />
                                        {t('warehouse.bulkDistributionTitle')}
                                    </h3>
                                    <button onClick={() => setShowBulkDistributionModal(false)} className="text-gray-400 hover:text-white" aria-label="Close Modal">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                    {/* Info Banner */}
                                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Zap className="text-blue-500" size={20} />
                                            <div>
                                                <p className="text-white font-bold">{t('warehouse.multiStoreDistribution')}</p>
                                                <p className="text-xs text-gray-400">{t('warehouse.distributeToMultipleStores')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mode Toggle */}
                                    <div className="mb-6">
                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">{t('warehouse.distributionMode')}</label>
                                        <div className="flex bg-white/5 rounded-lg p-1 w-fit">
                                            <button
                                                onClick={() => setBulkDistributionMode('single')}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${bulkDistributionMode === 'single' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                {t('warehouse.singleProduct')}
                                            </button>
                                            <button
                                                onClick={() => setBulkDistributionMode('wave')}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${bulkDistributionMode === 'wave' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Wave (Multiple Products)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Source Warehouse */}
                                    <div className="mb-6">
                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Source Warehouse</label>
                                        <select
                                            title={t('warehouse.selectSourceWarehouse')}
                                            value={bulkDistributionSourceSite}
                                            onChange={(e) => setBulkDistributionSourceSite(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                                        >
                                            <option value="">Select warehouse...</option>
                                            {sites.filter(s => s.status === 'Active' && (s.type === 'Warehouse' || s.type === 'Distribution Center')).map(site => (
                                                <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {bulkDistributionMode === 'single' ? (
                                        // Single Product Mode
                                        <>
                                            <div className="mb-6">
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Select Product to Distribute</label>
                                                <select
                                                    title={t('warehouse.selectProduct')}
                                                    value={bulkDistributionProductId}
                                                    onChange={(e) => {
                                                        setBulkDistributionProductId(e.target.value);
                                                        setBulkDistributionAllocations([]);
                                                    }}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                                                >
                                                    <option value="">Select product...</option>
                                                    {filteredProducts.filter(p => p.stock > 0).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {bulkDistributionProductId && (() => {
                                                const selectedProduct = products.find(p => p.id === bulkDistributionProductId);
                                                const totalAllocated = bulkDistributionAllocations.reduce((sum, a) => sum + a.quantity, 0);
                                                const remaining = (selectedProduct?.stock || 0) - totalAllocated;

                                                return (
                                                    <div className="space-y-4">
                                                        {/* Product Info */}
                                                        <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                                            <div className="w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden">
                                                                {selectedProduct?.image && !selectedProduct.image.includes('placeholder.com') ? (
                                                                    <img
                                                                        src={selectedProduct.image}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Package size={24} className="text-gray-700" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-white font-bold">{selectedProduct?.name}</p>
                                                                <p className="text-sm text-gray-400">SKU: {selectedProduct?.sku}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-400">Available</p>
                                                                <p className={`text-xl font-mono font-bold ${remaining < 0 ? 'text-red-400' : 'text-blue-500'}`}>{remaining}</p>
                                                            </div>
                                                        </div>

                                                        {/* Store Allocation */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-sm font-bold text-white">Allocate to Stores</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        onClick={() => {
                                                                            // Distribute evenly across all stores
                                                                            const activeStores = sites.filter(s => s.status === 'Active' && s.type === 'Store' && s.id !== bulkDistributionSourceSite);
                                                                            const totalStock = selectedProduct?.stock || 0;
                                                                            const storeCount = activeStores.length;
                                                                            if (storeCount === 0 || totalStock === 0) return;

                                                                            const baseQty = Math.floor(totalStock / storeCount);
                                                                            const remainder = totalStock % storeCount;

                                                                            const newAllocations = activeStores.map((store, idx) => ({
                                                                                storeId: store.id,
                                                                                quantity: baseQty + (idx < remainder ? 1 : 0)
                                                                            }));
                                                                            setBulkDistributionAllocations(newAllocations);
                                                                        }}
                                                                        className="text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1"
                                                                    >
                                                                        <Zap size={12} /> Distribute Evenly
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const storeIds = sites
                                                                                .filter(s => s.status === 'Active' && s.type === 'Store' && s.id !== bulkDistributionSourceSite)
                                                                                .map(s => s.id)
                                                                                .filter(id => !bulkDistributionAllocations.find(a => a.storeId === id));

                                                                            if (storeIds.length > 0) {
                                                                                setBulkDistributionAllocations([
                                                                                    ...bulkDistributionAllocations,
                                                                                    ...storeIds.map(id => ({ storeId: id, quantity: 0 }))
                                                                                ]);
                                                                            }
                                                                        }}
                                                                        className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                                                                    >
                                                                        + Add All Stores
                                                                    </button>
                                                                </div>
                                                            </div>


                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                                                {sites
                                                                    .filter(s => s.status === 'Active' && s.type === 'Store' && s.id !== bulkDistributionSourceSite)
                                                                    .map(store => {
                                                                        const allocation = bulkDistributionAllocations.find(a => a.storeId === store.id);
                                                                        return (
                                                                            <div key={store.id} className={`p-3 rounded-lg border transition-colors ${allocation ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-white">{store.name}</p>
                                                                                        <p className="text-xs text-gray-400">{store.address}</p>
                                                                                    </div>
                                                                                    {allocation ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <input
                                                                                                title={`Allocation Quantity for ${store.name}`}
                                                                                                placeholder="Qty"
                                                                                                type="number"
                                                                                                min="0"
                                                                                                value={allocation.quantity}
                                                                                                onChange={(e) => {
                                                                                                    setBulkDistributionAllocations(
                                                                                                        bulkDistributionAllocations.map(a =>
                                                                                                            a.storeId === store.id ? { ...a, quantity: parseInt(e.target.value) || 0 } : a
                                                                                                        )
                                                                                                    );
                                                                                                }}
                                                                                                className="w-16 bg-black border border-white/20 rounded px-2 py-1 text-white text-sm text-center focus:border-blue-500 outline-none"
                                                                                            />
                                                                                            <button
                                                                                                title={t('warehouse.removeAllocation')}
                                                                                                onClick={() => setBulkDistributionAllocations(bulkDistributionAllocations.filter(a => a.storeId !== store.id))}
                                                                                                className="text-red-400 hover:text-red-300"
                                                                                            >
                                                                                                <X size={16} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => setBulkDistributionAllocations([...bulkDistributionAllocations, { storeId: store.id, quantity: 0 }])}
                                                                                            className="text-blue-500 hover:text-blue-400 text-xs font-bold"
                                                                                        >
                                                                                            + Add
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* Summary */}
                                                        {bulkDistributionAllocations.filter(a => a.quantity > 0).length > 0 && (
                                                            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                                                                <h4 className="text-xs text-gray-400 uppercase font-bold mb-3">Distribution Summary</h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-2xl font-mono font-bold text-blue-500">{bulkDistributionAllocations.filter(a => a.quantity > 0).length}</p>
                                                                        <p className="text-xs text-gray-400">Stores</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-2xl font-mono font-bold text-white">{totalAllocated}</p>
                                                                        <p className="text-xs text-gray-400">Total Units</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        // Wave Mode-Multiple Products
                                        <div className="space-y-4">
                                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Zap className="text-blue-500" size={20} />
                                                    <div>
                                                        <p className="text-white font-bold">Wave Distribution Mode</p>
                                                        <p className="text-xs text-gray-400">Add multiple products and allocate to stores. Each store will receive one consolidated transfer.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add Product to Wave */}
                                            <div className="flex gap-2">
                                                <select
                                                    title={t('warehouse.selectProductToAdd')}
                                                    value=""
                                                    onChange={(e) => {
                                                        if (e.target.value && !waveProducts.find(wp => wp.productId === e.target.value)) {
                                                            setWaveProducts([...waveProducts, { productId: e.target.value, allocations: [] }]);
                                                        }
                                                    }}
                                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                                                >
                                                    <option value="">+ Add product to wave...</option>
                                                    {filteredProducts.filter(p => p.stock > 0 && !waveProducts.find(wp => wp.productId === p.id)).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Wave Products List */}
                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {waveProducts.map((wp, wpIdx) => {
                                                    const product = products.find(p => p.id === wp.productId);
                                                    const totalAllocated = wp.allocations.reduce((sum, a) => sum + a.quantity, 0);
                                                    return (
                                                        <div key={wp.productId} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                                            <div className="p-3 bg-white/5 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded bg-black flex items-center justify-center overflow-hidden">
                                                                        {product?.image && !product.image.includes('placeholder.com') ? (
                                                                            <img
                                                                                src={product.image}
                                                                                alt=""
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Package size={16} className="text-gray-700" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-white">{product?.name}</p>
                                                                        <p className="text-xs text-gray-400">Stock: {product?.stock} | Allocated: {totalAllocated}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    title={t('warehouse.removeProduct')}
                                                                    onClick={() => setWaveProducts(waveProducts.filter((_, i) => i !== wpIdx))}
                                                                    className="text-red-400 hover:text-red-300"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                {sites
                                                                    .filter(s => s.status === 'Active' && s.type === 'Store' && s.id !== bulkDistributionSourceSite)
                                                                    .map(store => {
                                                                        const allocation = wp.allocations.find(a => a.storeId === store.id);
                                                                        return (
                                                                            <div key={store.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                                                                <span className="text-xs text-gray-400 flex-1 truncate">{store.name}</span>
                                                                                <input
                                                                                    title={t('warehouse.waveAllocationQuantity')}
                                                                                    placeholder="Qty"
                                                                                    type="number"
                                                                                    min="0"
                                                                                    value={allocation?.quantity || 0}
                                                                                    onChange={(e) => {
                                                                                        const qty = parseInt(e.target.value) || 0;
                                                                                        setWaveProducts(waveProducts.map((w, i) => {
                                                                                            if (i !== wpIdx) return w;
                                                                                            const existing = w.allocations.find(a => a.storeId === store.id);
                                                                                            if (existing) {
                                                                                                return { ...w, allocations: w.allocations.map(a => a.storeId === store.id ? { ...a, quantity: qty } : a) };
                                                                                            } else {
                                                                                                return { ...w, allocations: [...w.allocations, { storeId: store.id, quantity: qty }] };
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                    className="w-14 bg-black border border-white/20 rounded px-1 py-0.5 text-white text-xs text-center focus:border-blue-500 outline-none"
                                                                                />
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowBulkDistributionModal(false)}
                                        className="px-6 py-2 bg-white/5 text-gray-400 rounded-lg font-bold hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!bulkDistributionSourceSite || isDistributing) {
                                                if (!bulkDistributionSourceSite) addNotification('alert', 'Please select a source warehouse');
                                                return;
                                            }

                                            setIsDistributing(true);
                                            try {
                                                let createdJobs = 0;

                                                if (bulkDistributionMode === 'single') {
                                                    // Single product mode-create transfer for each store
                                                    const allocationsWithQty = bulkDistributionAllocations.filter(a => a.quantity > 0);

                                                    for (const allocation of allocationsWithQty) {
                                                        const product = products.find(p => p.id === bulkDistributionProductId);
                                                        const transferJob: WMSJob = {
                                                            id: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                                            siteId: bulkDistributionSourceSite,
                                                            site_id: bulkDistributionSourceSite,
                                                            sourceSiteId: bulkDistributionSourceSite,
                                                            source_site_id: bulkDistributionSourceSite,
                                                            destSiteId: allocation.storeId,
                                                            dest_site_id: allocation.storeId,
                                                            type: 'TRANSFER',
                                                            status: 'Pending',
                                                            priority: 'Normal',
                                                            location: 'Distribution',
                                                            assignedTo: '',
                                                            items: 1,
                                                            lineItems: [{
                                                                productId: bulkDistributionProductId,
                                                                sku: product?.sku || '',
                                                                name: product?.name || '',
                                                                image: product?.image || '',
                                                                expectedQty: allocation.quantity,
                                                                pickedQty: 0,
                                                                status: 'Pending'
                                                            }],
                                                            orderRef: `BULK-${Date.now()}`,
                                                            transferStatus: 'Requested',
                                                            requestedBy: user?.name || 'System',
                                                            jobNumber: `DIST-${sites.find(s => s.id === allocation.storeId)?.code || 'XX'}`
                                                        };

                                                        await wmsJobsService.create(transferJob);
                                                        createdJobs++;
                                                    }
                                                } else {
                                                    // Wave mode-consolidate by store and create one transfer per store
                                                    const storeAllocations: Record<string, { productId: string; quantity: number }[]> = {};

                                                    for (const wp of waveProducts) {
                                                        for (const alloc of wp.allocations) {
                                                            if (alloc.quantity > 0) {
                                                                if (!storeAllocations[alloc.storeId]) {
                                                                    storeAllocations[alloc.storeId] = [];
                                                                }
                                                                storeAllocations[alloc.storeId].push({ productId: wp.productId, quantity: alloc.quantity });
                                                            }
                                                        }
                                                    }

                                                    for (const [storeId, items] of Object.entries(storeAllocations)) {
                                                        const transferJob: WMSJob = {
                                                            id: `TRF-WAVE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                                            siteId: bulkDistributionSourceSite,
                                                            site_id: bulkDistributionSourceSite,
                                                            sourceSiteId: bulkDistributionSourceSite,
                                                            source_site_id: bulkDistributionSourceSite,
                                                            destSiteId: storeId,
                                                            dest_site_id: storeId,
                                                            type: 'TRANSFER',
                                                            status: 'Pending',
                                                            priority: 'Normal',
                                                            location: 'Wave Distribution',
                                                            assignedTo: '',
                                                            items: items.length,
                                                            lineItems: items.map(item => {
                                                                const product = products.find(p => p.id === item.productId);
                                                                return {
                                                                    productId: item.productId,
                                                                    sku: product?.sku || '',
                                                                    name: product?.name || '',
                                                                    image: product?.image || '',
                                                                    expectedQty: item.quantity,
                                                                    pickedQty: 0,
                                                                    status: 'Pending'
                                                                };
                                                            }),
                                                            orderRef: `WAVE-${Date.now()}`,
                                                            transferStatus: 'Requested',
                                                            requestedBy: user?.name || 'System',
                                                            jobNumber: `WAVE-${sites.find(s => s.id === storeId)?.code || 'XX'}`
                                                        };

                                                        await wmsJobsService.create(transferJob);
                                                        createdJobs++;
                                                    }
                                                }

                                                // Log distribution event for history/audit
                                                const sourceWarehouse = sites.find(s => s.id === bulkDistributionSourceSite);
                                                const destinationStores = bulkDistributionMode === 'single'
                                                    ? bulkDistributionAllocations.filter(a => a.quantity > 0).map(a => sites.find(s => s.id === a.storeId)?.name).join(', ')
                                                    : Array.from(new Set(waveProducts.flatMap(wp => wp.allocations.filter(a => a.quantity > 0).map(a => sites.find(s => s.id === a.storeId)?.name)))).join(', ');

                                                logSystemEvent(
                                                    'Bulk Distribution Created',
                                                    `Created ${createdJobs} distribution transfers from ${sourceWarehouse?.name || 'Unknown'} to: ${destinationStores}. Mode: ${bulkDistributionMode}`,
                                                    user?.name || 'System',
                                                    'Inventory'
                                                );

                                                addNotification('success', `Created ${createdJobs} distribution transfers! Products will be sorted to each store.`);
                                                setShowBulkDistributionModal(false);
                                                setBulkDistributionAllocations([]);
                                                setWaveProducts([]);
                                            } catch (e) {
                                                console.error(e);
                                                addNotification('alert', 'Failed to create distribution jobs');
                                            } finally {
                                                setIsDistributing(false);
                                            }
                                        }}
                                        disabled={isDistributing || (bulkDistributionMode === 'single'
                                            ? (!bulkDistributionProductId || bulkDistributionAllocations.filter(a => a.quantity > 0).length === 0)
                                            : (waveProducts.length === 0 || !waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0))))
                                        }
                                        className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${!isDistributing && ((bulkDistributionMode === 'single' && bulkDistributionProductId && bulkDistributionAllocations.filter(a => a.quantity > 0).length > 0) ||
                                            (bulkDistributionMode === 'wave' && waveProducts.length > 0 && waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0))))
                                            ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isDistributing ? <RefreshCw size={16} className="animate-spin" /> : <Truck size={16} />}
                                        Create Distribution
                                    </button>

                                    {/* Print Pick Lists Button */}
                                    <button
                                        onClick={() => {
                                            const sourceWarehouse = sites.find(s => s.id === bulkDistributionSourceSite);
                                            let pickListsHtml = `
                                                <!DOCTYPE html>
                                                <html>
                                                <head>
                                                    <title>Distribution Pick Lists - ${new Date().toLocaleDateString()}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                                        .pick-list { page-break-after: always; border: 2px solid #333; padding: 20px; margin-bottom: 20px; }
                                                        .pick-list:last-child { page-break-after: auto; }
                                                        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                                                        .header h2 { margin: 0; font-size: 18px; }
                                                        .header p { margin: 5px 0; color: #666; font-size: 12px; }
                                                        .route { display: flex; justify-content: space-between; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
                                                        .route-item { text-align: center; }
                                                        .route-label { font-size: 10px; color: #666; text-transform: uppercase; }
                                                        .route-value { font-size: 14px; font-weight: bold; }
                                                        table { width: 100%; border-collapse: collapse; }
                                                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                                                        th { background: #333; color: white; }
                                                        .qty { text-align: center; font-weight: bold; font-size: 14px; }
                                                        .checkbox { width: 20px; height: 20px; border: 2px solid #333; }
                                                        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 11px; color: #666; }
                                                    </style>
                                                </head>
                                                <body>
                                            `;

                                            if (bulkDistributionMode === 'single') {
                                                const product = products.find(p => p.id === bulkDistributionProductId);
                                                bulkDistributionAllocations.filter(a => a.quantity > 0).forEach(allocation => {
                                                    const store = sites.find(s => s.id === allocation.storeId);
                                                    pickListsHtml += `
                                                        <div class="pick-list">
                                                            <div class="header">
                                                                <h2>📦 Distribution Pick List</h2>
                                                                <p>Generated: ${new Date().toLocaleString()} | By: ${user?.name || 'System'}</p>
                                                            </div>
                                                            <div class="route">
                                                                <div class="route-item">
                                                                    <div class="route-label">From</div>
                                                                    <div class="route-value">${sourceWarehouse?.name || 'Warehouse'}</div>
                                                                </div>
                                                                <div class="route-item" style="font-size: 24px;">→</div>
                                                                <div class="route-item">
                                                                    <div class="route-label">To</div>
                                                                    <div class="route-value">${store?.name || 'Store'}</div>
                                                                </div>
                                                            </div>
                                                            <table>
                                                                <thead>
                                                                    <tr><th>☑</th><th>Product</th><th>SKU</th><th>Qty</th><th>Picked</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td><div class="checkbox"></div></td>
                                                                        <td>${product?.name || 'Unknown'}</td>
                                                                        <td>${product?.sku || 'N/A'}</td>
                                                                        <td class="qty">${allocation.quantity}</td>
                                                                        <td></td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                            <div class="footer">
                                                                <p>Picker Signature: _________________ | Date: _________________</p>
                                                            </div>
                                                        </div>
                                                    `;
                                                });
                                            } else {
                                                // Wave mode-group by store
                                                const storeAllocations: Record<string, { productId: string; quantity: number }[]> = {};
                                                waveProducts.forEach(wp => {
                                                    wp.allocations.filter(a => a.quantity > 0).forEach(alloc => {
                                                        if (!storeAllocations[alloc.storeId]) storeAllocations[alloc.storeId] = [];
                                                        storeAllocations[alloc.storeId].push({ productId: wp.productId, quantity: alloc.quantity });
                                                    });
                                                });

                                                Object.entries(storeAllocations).forEach(([storeId, items]) => {
                                                    const store = sites.find(s => s.id === storeId);
                                                    pickListsHtml += `
                                                        <div class="pick-list">
                                                            <div class="header">
                                                                <h2>📦 Wave Distribution Pick List</h2>
                                                                <p>Generated: ${new Date().toLocaleString()} | By: ${user?.name || 'System'}</p>
                                                            </div>
                                                            <div class="route">
                                                                <div class="route-item">
                                                                    <div class="route-label">From</div>
                                                                    <div class="route-value">${sourceWarehouse?.name || 'Warehouse'}</div>
                                                                </div>
                                                                <div class="route-item" style="font-size: 24px;">→</div>
                                                                <div class="route-item">
                                                                    <div class="route-label">To</div>
                                                                    <div class="route-value">${store?.name || 'Store'}</div>
                                                                </div>
                                                            </div>
                                                            <table>
                                                                <thead>
                                                                    <tr><th>☑</th><th>Product</th><th>SKU</th><th>Qty</th><th>Picked</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${items.map(item => {
                                                        const product = products.find(p => p.id === item.productId);
                                                        return `
                                                                            <tr>
                                                                                <td><div class="checkbox"></div></td>
                                                                                <td>${product?.name || 'Unknown'}</td>
                                                                                <td>${product?.sku || 'N/A'}</td>
                                                                                <td class="qty">${item.quantity}</td>
                                                                                <td></td>
                                                                            </tr>
                                                                        `;
                                                    }).join('')}
                                                                </tbody>
                                                            </table>
                                                            <div class="footer">
                                                                <p>Total Items: ${items.reduce((sum, i) => sum + i.quantity, 0)} | Picker Signature: _________________ | Date: _________________</p>
                                                            </div>
                                                        </div>
                                                    `;
                                                });
                                            }

                                            pickListsHtml += '</body></html>';
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(pickListsHtml);
                                                printWindow.document.close();
                                            }
                                        }}
                                        disabled={bulkDistributionMode === 'single'
                                            ? (!bulkDistributionProductId || bulkDistributionAllocations.filter(a => a.quantity > 0).length === 0)
                                            : (waveProducts.length === 0 || !waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0)))
                                        }
                                        className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${((bulkDistributionMode === 'single' && bulkDistributionProductId && bulkDistributionAllocations.filter(a => a.quantity > 0).length > 0) ||
                                            (bulkDistributionMode === 'wave' && waveProducts.length > 0 && waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0))))
                                            ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                            }`}
                                    >
                                        <Printer size={16} />
                                        Preview Pick Lists
                                    </button>
                                </div>

                            </div>
                        </div>
                    )
                }

                {/* Global Job Details Modal-Works from any tab (only show when NOT in scanner mode) */}
                {
                    selectedJob && isDetailsOpen && !isScannerMode && (
                        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
                            <div className="bg-cyber-gray border-t md:border border-white/10 rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyber-primary/10 flex flex-col pb-[env(safe-area-inset-bottom)] md:pb-0">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-start sticky top-0 bg-cyber-gray z-10">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-white">Job Details</h2>
                                            <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-gray-400">{formatJobId(selectedJob)}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${selectedJob.type === 'TRANSFER' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : 'border-white/10 text-gray-400'}`}>{selectedJob.type}</span>
                                            <span>•</span>
                                            <span className={`${selectedJob.transferStatus === 'Received' ? 'text-green-400' : selectedJob.transferStatus === 'In-Transit' ? 'text-purple-400' : 'text-white'}`}>
                                                {selectedJob.transferStatus || selectedJob.status}
                                            </span>
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedJob(null)} aria-label="Close" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                    {/* Route/Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Source/Dest */}
                                        {(selectedJob.sourceSiteId || selectedJob.destSiteId) && (
                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">Route</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-400">From</p>
                                                        <p className="font-bold text-white truncate">{sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId || 'N/A'}</p>
                                                    </div>
                                                    <ArrowRight className="text-cyber-primary opacity-50 flex-shrink-0" />
                                                    <div className="flex-1 text-right">
                                                        <p className="text-xs text-gray-400">To</p>
                                                        <p className="font-bold text-white truncate">{sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* People/Dates */}
                                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Priority</span>
                                                <span className={`font-bold ${selectedJob.priority === 'Critical' ? 'text-red-400' : selectedJob.priority === 'High' ? 'text-orange-400' : 'text-blue-400'}`}>{selectedJob.priority || 'Normal'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Requested By</span>
                                                <span className="text-white font-bold">{selectedJob.requestedBy || 'System'}</span>
                                            </div>
                                            {selectedJob.approvedBy && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Approved By</span>
                                                    <span className="text-green-400 font-bold">{selectedJob.approvedBy}</span>
                                                </div>
                                            )}
                                            <div className="h-px bg-white/5 my-2" />
                                            {selectedJob.shippedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Shipped</span>
                                                    <span className="text-purple-400 font-mono">{new Date(selectedJob.shippedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedJob.receivedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Received</span>
                                                    <span className="text-green-400 font-mono">{new Date(selectedJob.receivedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div>
                                        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                            <Package size={16} className="text-cyber-primary" />
                                            Items ({selectedJob.lineItems?.length || selectedJob.items || 0})
                                        </h3>
                                        <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 bg-white/5 uppercase font-bold">
                                                    <tr>
                                                        <th className="p-3">{t('warehouse.product')}</th>
                                                        <th className="p-3 text-center">{t('warehouse.expectedAbbr')}</th>
                                                        {selectedJob.type === 'TRANSFER' && <th className="p-3 text-center">{t('warehouse.receivedAbbr')}</th>}
                                                        <th className="p-3 text-center">{t('warehouse.statusAction')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => {
                                                        const isTransfer = selectedJob.type === 'TRANSFER';
                                                        const isResolved = ['Resolved', 'Completed'].includes(item.status);
                                                        const hasDiscrepancy = isTransfer && !isResolved && item.receivedQty !== undefined && item.receivedQty !== item.expectedQty;

                                                        return (
                                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                                <td className="p-3">
                                                                    <p className="text-white font-medium">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.sku}</p>
                                                                </td>
                                                                <td className="p-3 text-center font-mono text-white font-bold">{item.expectedQty}</td>
                                                                {isTransfer && (
                                                                    <td className={`p-3 text-center font-mono font-bold ${hasDiscrepancy ? 'text-red-400' : 'text-green-400'}`}>
                                                                        {item.receivedQty ?? '-'}
                                                                    </td>
                                                                )}
                                                                <td className="p-3 text-center">
                                                                    {hasDiscrepancy ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                setResolvingItem({ item, index: idx });
                                                                                setIsResolutionModalOpen(true);
                                                                            }}
                                                                            className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 flex items-center gap-1 mx-auto transition-colors font-bold uppercase tracking-wider"
                                                                        >
                                                                            <AlertTriangle size={10} /> Resolve
                                                                        </button>
                                                                    ) : (
                                                                        <span className={`text-[10px] px-2 py-1 rounded flex items-center justify-center gap-1 ${item.status === 'Discontinued' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                                            isResolved ? 'bg-green-500/20 text-green-400' :
                                                                                'bg-white/10 text-gray-300'
                                                                            }`}>
                                                                            {item.status === 'Discontinued' && <Archive size={10} />}
                                                                            {item.status === 'Discontinued' ? t('warehouse.archived') : (item.status || t('warehouse.pending'))}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }) : (
                                                        <tr><td colSpan={selectedJob.type === 'TRANSFER' ? 4 : 3} className="p-4 text-center text-gray-500">No detailed item list available</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between rounded-b-2xl">
                                    <div>
                                        {/* Show Start Picking button for PICK/PACK/PUTAWAY jobs that aren't completed */}
                                        {['PICK', 'PACK', 'PUTAWAY', 'pick', 'pack', 'putaway'].includes(selectedJob.type) && selectedJob.status !== 'Completed' ? (
                                            <Button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log('🎯 Start Picking clicked!', selectedJob);

                                                    // Normalize lineItems for the job
                                                    const jobLineItems = selectedJob.lineItems || (selectedJob as any).line_items || [];
                                                    const normalizedJob = { ...selectedJob, lineItems: jobLineItems };

                                                    // Sort items by bin location
                                                    const sortedItems = [...jobLineItems].sort((a: any, b: any) => {
                                                        const prodA = products.find(p => p.id === a.productId);
                                                        const prodB = products.find(p => p.id === b.productId);
                                                        return (prodA?.location || '').localeCompare(prodB?.location || '');
                                                    });

                                                    const optimizedJob = {
                                                        ...normalizedJob,
                                                        lineItems: sortedItems,
                                                        status: 'In-Progress' as const,
                                                        assignedTo: selectedJob.assignedTo || user?.name
                                                    };

                                                    // Update job status if pending
                                                    if (selectedJob.status === 'Pending') {
                                                        updateJobStatus(selectedJob.id, 'In-Progress');
                                                    }

                                                    // Auto-assign if not assigned
                                                    if (!selectedJob.assignedTo && user) {
                                                        await assignJob(selectedJob.id, user.id || user.name);
                                                    }

                                                    // Open scanner
                                                    setSelectedJob(optimizedJob);
                                                    setIsScannerMode(true);
                                                    setScannerStep(selectedJob.type === 'PUTAWAY' ? 'NAV' : 'SCAN');
                                                    setScannedBin('');
                                                    setScannedItem('');
                                                    setPickQty(0);
                                                }}
                                                icon={<Scan size={18} />}
                                                className="px-6 py-3 bg-gradient-to-r from-cyber-primary to-green-400 text-black rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyber-primary/30 flex items-center gap-2"
                                            >
                                                {selectedJob.type?.toUpperCase() === 'PICK' ? t('warehouse.startPicking') :
                                                    selectedJob.type?.toUpperCase() === 'PACK' ? t('warehouse.startPacking') :
                                                        t('warehouse.startPutaway')}
                                            </Button>
                                        ) : null}

                                        {/* DISPATCH Actions for Drivers */}
                                        {selectedJob.type === 'DISPATCH' && selectedJob.status !== 'Completed' && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const destSite = sites.find(s => s.id === selectedJob.destSiteId);
                                                        if (destSite?.address) {
                                                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank');
                                                        } else {
                                                            addNotification('info', 'No address found for destination');
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10"
                                                >
                                                    <Navigation size={18} />
                                                    Navigate
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await wmsJobsService.update(selectedJob.id, {
                                                                status: 'Completed',
                                                                transferStatus: 'Delivered'
                                                            });
                                                            await refreshData();
                                                            setSelectedJob(null);
                                                            addNotification('success', 'Job marked as Delivered');
                                                        } catch (err) {
                                                            addNotification('alert', 'Failed to update job status');
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-cyber-primary text-black rounded-xl font-bold transition-all hover:bg-cyber-accent flex items-center gap-2"
                                                >
                                                    <CheckCircle size={18} />
                                                    Mark as Delivered
                                                </button>
                                            </div>
                                        )}

                                        {/* TRANSFER Actions */}
                                        {selectedJob.type === 'TRANSFER' && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Approve */}
                                                {selectedJob.transferStatus === 'Requested' && ['super_admin', 'warehouse_manager', 'admin', 'manager', 'store_manager'].includes(user?.role || '') && (
                                                    <button
                                                        onClick={async () => {
                                                            setApprovingJobId(selectedJob.id);
                                                            try {
                                                                const sourceSiteId = selectedJob.sourceSiteId || selectedJob.siteId;
                                                                if (!sourceSiteId) throw new Error('Missing Source Site ID');

                                                                const transferLineItems = selectedJob.lineItems || selectedJob.line_items || [];
                                                                if (transferLineItems.length === 0) throw new Error('Transfer has no items to pick');

                                                                const pickJob: WMSJob = {
                                                                    id: `PICK-TRF-${Date.now()}`,
                                                                    siteId: sourceSiteId,
                                                                    site_id: sourceSiteId,
                                                                    sourceSiteId: sourceSiteId,
                                                                    source_site_id: sourceSiteId,
                                                                    destSiteId: selectedJob.destSiteId || selectedJob.dest_site_id,
                                                                    dest_site_id: selectedJob.destSiteId || selectedJob.dest_site_id,
                                                                    type: 'PICK',
                                                                    status: 'Pending',
                                                                    priority: selectedJob.priority || 'Normal',
                                                                    location: 'Warehouse',
                                                                    assignedTo: '',
                                                                    items: transferLineItems.length,
                                                                    lineItems: transferLineItems.map((item: any) => ({ ...item, status: 'Pending', pickedQty: 0 })),
                                                                    orderRef: selectedJob.id,
                                                                    jobNumber: `PICK-${formatTransferId(selectedJob).replace('TRF-', '')}`
                                                                };

                                                                await wmsJobsService.create(pickJob);
                                                                await wmsJobsService.update(selectedJob.id, { transferStatus: 'Picking', approvedBy: user?.name } as any);
                                                                addNotification('success', 'Transfer approved - Pick job created');
                                                                await refreshData();
                                                                setSelectedJob(null);
                                                            } catch (e) {
                                                                addNotification('alert', 'Failed: ' + (e as any).message);
                                                            } finally {
                                                                setApprovingJobId(null);
                                                            }
                                                        }}
                                                        disabled={approvingJobId === selectedJob.id}
                                                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-bold hover:bg-green-500/30 border border-green-500/30 flex items-center gap-2"
                                                    >
                                                        {approvingJobId === selectedJob.id ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                        Approve Transfer
                                                    </button>
                                                )}

                                                {/* Mark Shipped */}
                                                {selectedJob.transferStatus === 'Packed' && (
                                                    <button
                                                        onClick={async () => {
                                                            setShippingTransferId(selectedJob.id);
                                                            try {
                                                                await wmsJobsService.update(selectedJob.id, { transferStatus: 'In-Transit' } as any);
                                                                await refreshData();
                                                                addNotification('success', 'Transfer marked as shipped');
                                                                setSelectedJob(null);
                                                            } catch (e) {
                                                                addNotification('alert', 'Failed to update transfer');
                                                            } finally {
                                                                setShippingTransferId(null);
                                                            }
                                                        }}
                                                        disabled={shippingTransferId === selectedJob.id}
                                                        className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg font-bold hover:bg-purple-500/30 border border-purple-500/30 flex items-center gap-2"
                                                    >
                                                        {shippingTransferId === selectedJob.id ? <RefreshCw className="animate-spin" size={14} /> : <Truck size={14} />}
                                                        Mark Shipped
                                                    </button>
                                                )}

                                                {/* Receive */}
                                                {selectedJob.transferStatus === 'In-Transit' && selectedJob.destSiteId === activeSite?.id && (
                                                    <button
                                                        onClick={() => {
                                                            const lineItems = selectedJob.lineItems || selectedJob.line_items || [];
                                                            if (lineItems.length === 0) {
                                                                addNotification('alert', 'No items to receive');
                                                                return;
                                                            }
                                                            setActiveTransferJob(selectedJob);
                                                            setTransferReceiveItems(lineItems.map((item: any) => ({
                                                                productId: item.productId,
                                                                expectedQty: item.expectedQty,
                                                                receivedQty: 0,
                                                                condition: 'Good',
                                                                notes: ''
                                                            })));
                                                            setTransferReceiveMode(true);
                                                            setSelectedJob(null);
                                                        }}
                                                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold hover:bg-cyan-500/30 border border-cyan-500/30 flex items-center gap-2"
                                                    >
                                                        <Package size={14} />
                                                        Receive Items
                                                    </button>
                                                )}

                                                {/* Status indicators */}
                                                {(selectedJob.transferStatus === 'Picking' || selectedJob.transferStatus === 'Picked') && (
                                                    <span className="text-xs text-gray-400 italic px-3 py-2">
                                                        {selectedJob.transferStatus === 'Picking' ? '⏳ Being picked...' : '📦 Awaiting packing...'}
                                                    </span>
                                                )}

                                                {selectedJob.transferStatus === 'Received' && (
                                                    <span className="text-green-400 flex items-center gap-2 px-3 py-2">
                                                        <CheckCircle size={14} /> Completed
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedJob(null)}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Pack Job Reprint Options Modal-Global Level */}
                {
                    packReprintJob && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50">
                            <div className="bg-[#1a1a1a] border-t md:border border-white/10 rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Printer className="text-green-400" size={24} />
                                        {t('warehouse.reprintPackLabel')}
                                    </h3>
                                    <button onClick={() => setPackReprintJob(null)} className="text-gray-400 hover:text-white" title="Close">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <p className="font-bold text-white text-lg">{t('warehouse.orderColon')} {formatOrderRef(packReprintJob.orderRef)}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                                        <span>📦 {packReprintJob.itemCount || 0} items</span>
                                        {packReprintJob.destSiteName && (
                                            <span>→ {packReprintJob.destSiteName}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Job: {formatJobId(packReprintJob)}</p>
                                </div>

                                {/* Size Selection */}
                                <div className="mb-4">
                                    <label className="text-sm text-gray-400 mb-2 block">Label Size</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['TINY', 'SMALL', 'MEDIUM', 'LARGE'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setReprintSize(s)}
                                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${reprintSize === s
                                                    ? 'bg-green-500 text-black'
                                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {reprintSize === 'TINY' && '1.25" × 1"-SKU Tags'}
                                        {reprintSize === 'SMALL' && '2.25" × 1.25"-Multipurpose'}
                                        {reprintSize === 'MEDIUM' && '3" × 2"-Shelf Labels'}
                                        {reprintSize === 'LARGE' && '4" × 3"-Carton Tags'}
                                    </p>
                                </div>

                                {/* Format Selection */}
                                <div className="mb-6">
                                    <label className="text-sm text-gray-400 mb-2 block">Code Format</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['QR', 'Barcode', 'Both'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setReprintFormat(f)}
                                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${reprintFormat === f
                                                    ? 'bg-green-500 text-black'
                                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    }`}
                                            >
                                                {f === 'QR' && '📱 QR'}
                                                {f === 'Barcode' && '▮▯▮ Barcode'}
                                                {f === 'Both' && '📱+▮ Both'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPackReprintJob(null)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        disabled={isPrinting}
                                        onClick={async () => {
                                            if (!packReprintJob || isPrinting) return;
                                            setIsPrinting(true);
                                            try {
                                                // Use the rich pack label generator
                                                const html = await generatePackLabelHTML({
                                                    orderRef: packReprintJob.orderRef,
                                                    itemCount: packReprintJob.itemCount || 0,
                                                    destSiteName: packReprintJob.destSiteName,
                                                    packDate: new Date().toLocaleDateString(),
                                                    packerName: user?.name,
                                                    customerName: packReprintJob.customerName,
                                                    shippingAddress: packReprintJob.shippingAddress,
                                                    city: packReprintJob.city,
                                                    specialHandling: packReprintJob.specialHandling
                                                }, {
                                                    size: reprintSize,
                                                    format: reprintFormat
                                                });
                                                const printWindow = window.open('', '_blank');
                                                if (printWindow) {
                                                    printWindow.document.write(html);
                                                    setTimeout(() => {
                                                        printWindow.document.close();
                                                        printWindow.print();
                                                    }, 500);
                                                } else {
                                                    addNotification('alert', 'Popup blocked. Allow popups to print.');
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                addNotification('alert', 'Failed to generate label');
                                            } finally {
                                                setIsPrinting(false);
                                                setPackReprintJob(null);
                                            }
                                        }}
                                        className={`flex-1 py-3 bg-green-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 ${isPrinting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400'}`}
                                    >
                                        {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                                        {isPrinting ? t('warehouse.generating') : t('warehouse.printLabel')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

            </div >

            <DiscrepancyResolutionModal
                isOpen={isResolutionModalOpen}
                onClose={() => setIsResolutionModalOpen(false)}
                job={selectedJob!}
                item={resolvingItem}
                currentUser={user}
                adjustStock={adjustStock}
                refreshData={refreshData}
                activeSite={activeSite}
            />


            {/* --- PREMIUM DISTRIBUTION HUB MODAL --- */}
            <Modal
                isOpen={showDistHubModal}
                onClose={() => setShowDistHubModal(false)}
                title="Manual Distribution Hub"
                size="2xl"
            >
                <div className="flex flex-col h-[80vh] -m-6 bg-[#050506] relative overflow-hidden">
                    {/* Interior Header (previously in Modal title) */}
                    <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02] relative z-20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-500/30 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <Layout className="text-amber-500" size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">Mission Control</span>
                                <span className="text-[10px] text-amber-500/70 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-60" />
                                    Global Logistics & Supply Matrix
                                </span>
                            </div>
                        </div>

                        {/* New Tactical Mission Status */}
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Mission Clock</span>
                                <span className="text-xl font-mono font-black text-white tracking-widest leading-none mt-1">{formatMissionTime(distHubTimer)}</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Sector Delta</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-end gap-0.5 h-3">
                                        {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                                            <div key={i} className="w-0.5 bg-cyber-primary/40 rounded-full" style={{ height: `${h * 100}%` }} />
                                        ))}
                                    </div>
                                    <span className="text-xl font-mono font-black text-cyber-primary leading-none">{distHubSectorIntegrity.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Atmospheric Background Layers */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-amber-500/5 blur-[120px] rounded-full opacity-50" />
                        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-cyber-primary/5 blur-[120px] rounded-full opacity-30" />
                    </div>
                    {/* Top Tactical Status Bar */}
                    <div className="px-8 py-3 bg-white/[0.03] backdrop-blur-md border-b border-white/5 flex items-center justify-between relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest hidden sm:inline">Sat-Link: <span className="text-green-500">Active</span></span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <Navigation size={12} className="text-cyber-primary" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Op Node:</span>
                                <span className="text-[10px] font-black text-cyber-primary uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,255,157,0.3)]">{activeSite?.name || 'Central Command'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-2 group cursor-help" title="Encryption Level">
                                <Shield size={10} className="text-cyber-primary/50 group-hover:text-cyber-primary transition-colors" />
                                <span className="group-hover:text-white transition-colors">AES-4096</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-help" title="Signal Strength">
                                <Zap size={10} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                                <span className="group-hover:text-white transition-colors">7.2Tbps</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
                        <div className="col-span-3 flex flex-col border-r border-white/5 bg-gradient-to-b from-transparent to-white/[0.01] relative z-10 min-h-0">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Store Needs</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Critical Deployment Targets</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black border border-amber-500/20 shadow-inner">
                                        {distHubLowStockItems.length} DETECTED
                                    </div>
                                    <button
                                        onClick={fetchDistHubData}
                                        disabled={distHubLoading}
                                        className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 transition-all hover:text-white group active:scale-95 border border-transparent hover:border-white/10"
                                        title="Rescan Network Gaps"
                                    >
                                        <RefreshCw size={14} className={`${distHubLoading ? 'animate-spin text-amber-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative pb-20">
                                {/* Vertical Scanning Line Removed */}

                                {distHubLowStockItems.length === 0 && !distHubLoading && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                                        <div className="w-20 h-20 rounded-full border border-dashed border-green-500/20 flex items-center justify-center mb-6">
                                            <ShieldCheck size={40} className="text-green-500/50" />
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-center text-white/50">All sectors optimal</p>
                                        <p className="text-[8px] uppercase font-bold text-gray-600 mt-2 tracking-widest">No inventory violations detected</p>
                                    </div>
                                )}

                                {distHubLowStockItems.map(item => {
                                    const isSelected = distHubSelectedSku === item.sku && distHubSelectedDestSite === (item.siteId || item.site_id);
                                    const stockRatio = item.stock / (item.minStock || 10);
                                    const isCritical = stockRatio <= 0.3;
                                    const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || 'Local Store';

                                    return (
                                        <button
                                            key={`${item.id}-${item.sku}`}
                                            onClick={() => handleSelectLowStockProduct(item)}
                                            title={`Select ${item.name} for distribution`}
                                            className={`w-full text-left p-4 transition-all duration-500 relative group/card border rounded-2xl ${isSelected
                                                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20'
                                                : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                                }`}
                                        >
                                            {/* Tactical Lock-on Crosshairs */}
                                            {isSelected && (
                                                <div className="absolute inset-0 z-30 pointer-events-none">
                                                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500 animate-[ping_2s_infinite]" />
                                                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500" />
                                                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500" />
                                                    <div className="absolute bottom-2 right-5 w-3 h-3 border-b-2 border-r-2 border-amber-500" />
                                                </div>
                                            )}

                                            {/* Tactical Card Elements */}
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/[0.03] to-transparent pointer-events-none" />

                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                                        <span className="text-[9px] font-mono font-black text-white/40 uppercase tracking-[0.2em]">{item.sku}</span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">{siteName}</div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${isCritical ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {isCritical ? 'THREAT: CRITICAL' : 'THREAT: LOW'}
                                                </div>
                                            </div>

                                            <div className="text-sm font-black text-white mb-4 leading-tight group-hover/card:text-amber-500 transition-colors uppercase tracking-tight">{item.name}</div>

                                            <div className="space-y-2.5 relative z-10">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em]">
                                                    <span className={isCritical ? 'text-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-amber-500/60'}>
                                                        Current Utilization
                                                    </span>
                                                    <span className="text-white font-mono flex items-center gap-1.5 text-[10px]">
                                                        <span className={isCritical ? 'text-red-400' : 'text-amber-400'}>{item.stock}</span>
                                                        <span className="text-white/20 text-[8px]">/</span>
                                                        <span className="text-white/60">{item.minStock || 10}</span>
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px] relative shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 relative group-hover/card:animate-pulse ${isCritical
                                                            ? 'bg-gradient-to-r from-red-600 via-red-400 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                                            : 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (item.stock / (item.minStock || 10)) * 100)}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Source Selection (Inventory Payload) */}
                        <div className="col-span-5 flex flex-col bg-white/[0.015] backdrop-blur-sm relative z-10 border-r border-white/5 min-h-0">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-cyber-primary rounded-full shadow-[0_0_15px_rgba(0,255,157,0.5)]" />
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Payload Modules</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Supply Network Availability</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative pb-20">
                                {/* Sector Scanning Line Removed */}
                                {!distHubSelectedSku ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-6 opacity-30">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]" />
                                            <Box size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-primary" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Target Selection Required</p>
                                            <p className="text-[9px] uppercase font-bold text-white/40 leading-relaxed tracking-widest">Awaiting SKU Lock-on to identify<br />network-wide supply payload</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Selected SKU Summary Header */}
                                        <div className="p-5 bg-cyber-primary/[0.03] border border-cyber-primary/20 rounded-3xl flex items-center gap-5 relative group/header shadow-lg">
                                            <div className="absolute inset-0 bg-cyber-primary/5 blur-xl opacity-0 group-hover/header:opacity-100 transition-opacity" />
                                            <div className="w-16 h-16 bg-black/60 rounded-2xl flex items-center justify-center border border-white/10 group overflow-hidden relative z-10 shadow-2xl">
                                                {(() => {
                                                    const imgUrl = distHubLowStockItems.find(p => p.sku === distHubSelectedSku)?.image;
                                                    const isPlaceholder = imgUrl?.includes('placeholder.com') || imgUrl?.includes('via.placeholder');
                                                    if (imgUrl && !isPlaceholder) {
                                                        return (
                                                            <img
                                                                src={imgUrl}
                                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity scale-110 group-hover:scale-100 duration-700"
                                                                alt=""
                                                            />
                                                        );
                                                    }
                                                    return <Box size={24} className="text-cyber-primary/60" />;
                                                })()}
                                            </div>
                                            <div className="relative z-10 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="px-2 py-0.5 bg-cyber-primary/20 text-cyber-primary rounded text-[8px] font-black tracking-widest border border-cyber-primary/30 uppercase">Operational Target</div>
                                                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{distHubSelectedSku}</div>
                                                </div>
                                                <div className="text-lg font-black text-white uppercase tracking-tighter leading-none">
                                                    {distHubLowStockItems.find(p => p.sku === distHubSelectedSku)?.name}
                                                </div>
                                            </div>
                                        </div>

                                        {distHubAvailableSources.length === 0 && !distHubLoading && (
                                            <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl text-center space-y-4">
                                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                                    <XCircle size={24} className="text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">No Supply Detected</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">This item is stockouted across the network</p>
                                                </div>
                                            </div>
                                        )}

                                        {distHubAvailableSources.map(source => {
                                            const qtyInputId = `dist-qty-${source.id}`;
                                            const lowStockItem = distHubLowStockItems.find(p => p.sku === distHubSelectedSku);
                                            const deficit = (lowStockItem?.minStock || 10) * 1.5 - (lowStockItem?.stock || 0);
                                            const suggestedQty = Math.floor(Math.min(source.stock, Math.max(1, deficit)));

                                            return (
                                                <div
                                                    key={source.id}
                                                    className="group/item p-6 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-cyber-primary/40 transition-all duration-700 relative overflow-hidden shadow-xl rounded-2xl"
                                                >
                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-1000" />

                                                    {/* Tactical Module Indicators */}
                                                    <div className="absolute top-6 right-6 flex gap-1.5 opacity-20 group-hover/item:opacity-50 transition-opacity">
                                                        <div className="w-1 h-1 rounded-full bg-cyber-primary" />
                                                        <div className="w-1 h-1 rounded-full bg-cyber-primary" />
                                                        <div className="w-1 h-1 rounded-full bg-cyber-primary" />
                                                    </div>

                                                    <div className="flex flex-col gap-6 relative z-10">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-14 h-14 rounded-2xl bg-black/60 flex flex-col items-center justify-center border border-white/10 group-hover/item:border-cyber-primary/30 transition-all duration-500 shadow-2xl relative overflow-hidden">
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/10 to-transparent pointer-events-none" />
                                                                    <Warehouse size={20} className="text-white/30 group-hover/item:text-cyber-primary transition-all duration-500 scale-110 group-hover/item:scale-125" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Supply Module</span>
                                                                        <div className="h-[1px] w-8 bg-white/10" />
                                                                    </div>
                                                                    <div className="text-lg font-black text-white uppercase tracking-tighter group-hover/item:text-cyber-primary transition-colors leading-none">{source.site?.name}</div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-[9px] text-white/40 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                            <Map size={10} className="text-cyber-primary opacity-50" />
                                                                            Zone: {source.location || 'GLOBAL OPS'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Available Payload</div>
                                                                <div className="text-2xl font-black text-white font-mono leading-none tracking-tighter">
                                                                    {source.stock}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex-1 flex items-center gap-4">
                                                                <div className="relative group/input flex-1 max-w-[140px]">
                                                                    <label className="absolute -top-5 left-0 text-[8px] font-black text-white/30 uppercase tracking-[0.2em] group-hover/input:text-cyber-primary transition-colors">Extraction Qty</label>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="00"
                                                                        id={qtyInputId}
                                                                        className="w-full h-12 bg-black/60 border border-white/10 rounded-2xl text-xl text-center font-black text-cyber-primary focus:border-cyber-primary/50 outline-none transition-all shadow-inner ring-cyber-primary/0 focus:ring-4 focus:ring-cyber-primary/10"
                                                                        defaultValue={suggestedQty}
                                                                        title="Enter Quantity to Transfer"
                                                                    />
                                                                </div>
                                                                <div className="hidden md:flex flex-col gap-1">
                                                                    <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">Suggested</div>
                                                                    <div className="text-xs font-black text-white/40 font-mono">+{suggestedQty}</div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    const el = document.getElementById(qtyInputId) as HTMLInputElement;
                                                                    const qty = parseInt(el.value);
                                                                    if (qty > source.stock) {
                                                                        addNotification('alert', 'Payload exceeds source availability');
                                                                        return;
                                                                    }
                                                                    if (qty <= 0) return;
                                                                    addToDistDraft(source, qty);
                                                                }}
                                                                className="h-14 px-8 bg-cyber-primary text-black rounded-3xl font-black uppercase text-[11px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,255,157,0.3)] flex items-center gap-3 group/btn relative overflow-hidden"
                                                                title="Add Module to Mission"
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                                                <Plus size={18} className="group-hover/btn:rotate-90 transition-transform relative z-10" />
                                                                <span className="relative z-10">Add Module</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Launch Pad (Operations Sequence) */}
                        <div className="col-span-4 flex flex-col bg-black/40 border-l border-white/10 relative overflow-hidden backdrop-blur-sm group/queue min-h-0">
                            {/* Mission Radar Background Effect Removed */}
                            <div className="absolute inset-0 pointer-events-none opacity-0">
                                {/* Elements removed */}
                            </div>

                            <div className="p-6 border-b border-white/10 bg-black/40 relative z-30 backdrop-blur-xl shrink-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                                            <Rocket size={18} className="text-cyber-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-cyber-primary uppercase tracking-[0.4em]">Launch Pad</h3>
                                            <p className="text-sm font-black text-white uppercase tracking-tight mt-0.5">Mission Queue</p>
                                        </div>
                                    </div>
                                    {distHubTransferDrafts.length > 0 && (
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {distHubTransferDrafts.length} Modules
                                        </div>
                                    )}
                                </div>
                                <div className="h-[1px] w-full bg-gradient-to-r from-cyber-primary/50 via-white/10 to-transparent" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10 pb-20">
                                {distHubTransferDrafts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-white/5 gap-6 select-none">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-2 border-dashed border-white/5 rounded-[32px] flex items-center justify-center">
                                                <Navigation size={40} className="opacity-20 rotate-45" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-black border border-white/5 rounded-full flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-40">Ready for Modules</p>
                                            <p className="text-[8px] uppercase font-bold text-white/20 tracking-widest">Awaiting operation parameters</p>
                                        </div>
                                    </div>
                                )}

                                {distHubTransferDrafts.map((draft, idx) => (
                                    <div
                                        key={idx}
                                        className="mx-4 p-5 bg-white/[0.03] border border-white/10 hover:border-cyber-primary/30 group relative transition-all shadow-xl rounded-2xl"
                                    >
                                        {/* Draft Sequence Number */}
                                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-white/[0.03] border-b border-l border-white/10 rounded-bl-3xl text-[9px] font-black text-white/20 font-mono group-hover:text-cyber-primary group-hover:border-cyber-primary/30 transition-colors">
                                            SEQ-0{idx + 1}
                                        </div>

                                        <button
                                            onClick={() => setDistHubTransferDrafts(distHubTransferDrafts.filter((_, i) => i !== idx))}
                                            className="absolute top-4 left-4 p-2 bg-red-500/10 text-red-500 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-20 border border-red-500/20"
                                            title="Abort Module"
                                        >
                                            <X size={14} />
                                        </button>

                                        <div className="text-[9px] font-black text-cyber-primary uppercase tracking-[0.2em] mb-4 pl-10 border-b border-white/5 pb-3 truncate pr-16">
                                            {draft.productName}
                                        </div>

                                        <div className="flex items-center justify-between gap-4 mt-2">
                                            <div className="flex flex-col flex-1 min-w-0 font-black">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[8px] text-white/40 shadow-inner">SRC</div>
                                                    <span className="text-[10px] text-white/60 uppercase truncate tracking-tight">{draft.sourceSiteName}</span>
                                                </div>
                                                <div className="py-2 ml-2.5">
                                                    <div className="w-[2px] h-4 bg-gradient-to-b from-cyber-primary/40 to-white/10 rounded-full" />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 flex items-center justify-center text-[8px] text-cyber-primary shadow-inner">DST</div>
                                                    <span className="text-[10px] text-cyber-primary uppercase truncate tracking-tight">{draft.destSiteName}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center px-4 py-3 bg-black border border-white/10 rounded-3xl min-w-[70px] shadow-2xl group-hover:border-cyber-primary/30 transition-colors">
                                                <span className="text-xl font-black text-white font-mono leading-none">{draft.qty}</span>
                                                <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Payload</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Redundant inline styles merged into global context */}
                            </div>

                            <div className="p-6 bg-black/40 border-t border-white/10 z-20 shrink-0">
                                <button
                                    onClick={submitDistTransfers}
                                    disabled={distHubTransferDrafts.length === 0 || distHubLoading}
                                    className={`w-full group relative overflow-hidden py-5 rounded-[32px] font-black uppercase tracking-[0.3em] text-[11px] transition-all duration-700 shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${distHubTransferDrafts.length === 0 || distHubLoading
                                        ? 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                                        : 'bg-cyber-primary text-black shadow-cyber-primary/30 hover:shadow-cyber-primary/50 hover:scale-[1.02] active:scale-95'
                                        }`}
                                    title="Authorize and Deploy Mission"
                                >
                                    {/* Advanced Button Effects */}
                                    {!distHubLoading && distHubTransferDrafts.length > 0 && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                                        </>
                                    )}

                                    <div className="flex items-center justify-center gap-4 relative z-10">
                                        {distHubLoading ? (
                                            <>
                                                <div className="relative">
                                                    <RefreshCw className="animate-spin" size={20} />
                                                    <div className="absolute inset-0 blur-sm bg-black/20" />
                                                </div>
                                                <span className="animate-pulse">Sequencing Modules...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={20} className="group-hover:text-black group-hover:scale-110 transition-all drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                                <span>Deploy Mission ({distHubTransferDrafts.length})</span>
                                            </>
                                        )}
                                    </div>
                                </button>

                                {distHubTransferDrafts.length > 0 && !distHubLoading && (
                                    <div className="mt-5 flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyber-primary" />
                                            <span className="text-[9px] text-cyber-primary font-black uppercase tracking-[0.4em]">Authorize Command Sequence</span>
                                        </div>
                                        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>


        </Protected >
    );

}

function ExceptionsView({ currentUser, activeSite, onResolve }: { currentUser: User | null, activeSite: any, onResolve: (job: WMSJob, item: any, index: number) => void }) {
    const [loading, setLoading] = useState(true);
    const [discrepancies, setDiscrepancies] = useState<{ job: WMSJob, item: any, index: number }[]>([]);

    const loadData = async () => {
        if (!activeSite?.id) return;
        setLoading(true);
        try {
            const jobs = await wmsJobsService.getDiscrepancies(activeSite.id);
            const flatItems: any[] = [];
            jobs.forEach(job => {
                (job.lineItems || []).forEach((item: any, index: number) => {
                    if (item.status === 'Discrepancy') {
                        flatItems.push({ job, item, index });
                    }
                });
            });
            flatItems.sort((a, b) => new Date(b.job.createdAt || 0).getTime() - new Date(a.job.createdAt || 0).getTime());
            setDiscrepancies(flatItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeSite?.id]);

    return (
        <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in bg-black/80">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        Exception Management
                    </h2>
                    <p className="text-gray-400">Resolve outstanding inventory discrepancies across all operations.</p>
                </div>
                <Button onClick={loadData} variant="secondary"><RefreshCw size={16} className="mr-2" /> Refresh</Button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyber-primary" size={48} />
                </div>
            ) : discrepancies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <CheckCircle size={64} className="mb-4 text-green-500/50" />
                    <p className="text-xl font-bold">All Clear</p>
                    <p>No open discrepancies found.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto bg-black/40 border border-white/10 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Job Ref</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Variance</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discrepancies.map((d, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm text-gray-400">
                                        {new Date(d.job.createdAt || '').toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-bold text-white">{d.job.jobNumber || d.job.id.slice(0, 8)}</div>
                                        <div className="text-xs text-gray-500">{d.job.type}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-black flex items-center justify-center overflow-hidden border border-white/10">
                                                {d.item.image && !d.item.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={d.item.image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={14} className="text-gray-700" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white font-medium">{d.item.productName || d.item.name}</div>
                                                <div className="text-xs text-gray-500">{d.item.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
                                            ACTION REQ
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400">Exp: {d.item.expectedQty}</span>
                                            <span className="text-yellow-400">Rec: {d.item.receivedQty || 0}</span>
                                            <span className="text-red-500 font-bold border-t border-white/10 pt-1 mt-1">
                                                Leaf: {(d.item.receivedQty || 0) - (d.item.expectedQty || 0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => onResolve(d.job, d.item, d.index)}
                                            className="px-4 py-2 bg-cyber-primary text-black font-bold text-xs rounded hover:bg-cyber-primary/90 transition-colors uppercase tracking-wider shadow-lg shadow-cyber-primary/20"
                                        >
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function DiscrepancyResolutionModal({
    isOpen,
    onClose,
    job,
    item,
    currentUser,
    adjustStock,
    refreshData,
    activeSite
}: {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    item: { item: any, index: number } | null;
    currentUser: User | null;
    adjustStock: (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => void;
    refreshData: () => Promise<void>;
    activeSite: any;
}) {
    // --- STATE ---
    const [step, setStep] = useState<'TYPE' | 'ACTION' | 'DETAILS' | 'REVIEW'>('TYPE');
    const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType | null>(null);
    const [resolutionAction, setResolutionAction] = useState<ResolutionType | null>(null);

    // Details
    const [notes, setNotes] = useState('');
    const [resolveQty, setResolveQty] = useState('');
    const [reasonCode, setReasonCode] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setStep('TYPE');
            setDiscrepancyType(null);
            setResolutionAction(null);
            setNotes('');
            setResolveQty('');
            setReasonCode('');
            setClaimAmount('');

        }
    }, [isOpen]);

    // Auto-detect type if obvious (e.g., Shortage/Overage based on math)
    useEffect(() => {
        if (item && step === 'TYPE') {
            const diff = (item.item.receivedQty || 0) - (item.item.expectedQty || 0);
            if (diff < 0) {
                setDiscrepancyType('shortage');
                setResolveQty(Math.abs(diff).toString());
            }
            if (diff > 0) {
                setDiscrepancyType('overage');
                setResolveQty(diff.toString());
            }
            // 'damaged', 'wrong_item', 'missing' are user selected if math doesn't explain it fully
        }
    }, [item, step]);

    if (!isOpen || !job || !item) return null;

    const diff = (item.item.receivedQty || 0) - (item.item.expectedQty || 0);
    const productName = item.item.productName || item.item.name || 'Unknown Product';

    // Config
    const DISCREPANCY_TYPES: { id: DiscrepancyType, label: string, icon: any, color: string }[] = [
        { id: 'shortage', label: 'Shortage (Received Less)', icon: ArrowDown, color: 'text-orange-400' },
        { id: 'overage', label: 'Overage (Received More)', icon: ArrowLeft, color: 'text-blue-400' },
        { id: 'damaged', label: 'Damaged Items', icon: AlertTriangle, color: 'text-red-400' },
        { id: 'wrong_item', label: 'Wrong Item Sent', icon: AlertOctagon, color: 'text-purple-400' },
        { id: 'missing', label: 'Completely Missing', icon: X, color: 'text-gray-400' },
    ];

    const RESOLUTION_ACTIONS: { id: ResolutionType, label: string, desc: string, icon: any, color: string, reqAuth: boolean }[] = [
        { id: 'accept', label: 'Accept As-Is', desc: 'Update inventory to match received qty.', icon: CheckCircle, color: 'text-green-400', reqAuth: false },
        { id: 'investigate', label: 'Request Investigation', desc: 'Flag for warehouse team to check.', icon: Search, color: 'text-yellow-400', reqAuth: false },
        { id: 'replace', label: 'Resend Missing Items', desc: 'Generate a new transfer from warehouse.', icon: FileText, color: 'text-blue-400', reqAuth: true },
        { id: 'adjust', label: 'Adjust Inventory', desc: 'Accept with manual adjustment record.', icon: RefreshCw, color: 'text-cyan-400', reqAuth: false },
        { id: 'reject', label: 'Reject & Return', desc: 'Send items back to source.', icon: RotateCcw, color: 'text-red-400', reqAuth: true },
        { id: 'dispose', label: 'Dispose / Destroy', desc: 'Remove from inventory (Waste).', icon: Trash2, color: 'text-red-500', reqAuth: true },
        { id: 'recount', label: 'Request Recount', desc: 'Ask source to count again.', icon: Hash, color: 'text-indigo-400', reqAuth: false },
    ];

    // Helper to check permissions (placeholder)
    const canDoAction = (action: ResolutionType) => {
        // Example logic
        if (action === 'claim' || action === 'reject') {
            // Require manager role?
            return ['store_manager', 'warehouse_manager', 'super_admin'].includes(currentUser?.role || '');
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!discrepancyType || !resolutionAction) return;
        setIsSubmitting(true);
        try {
            const qty = resolveQty ? parseInt(resolveQty) : 0;
            let replacementJobId: string | undefined = undefined;

            // --- PHASE 1: SIDE EFFECTS & REPLACEMENTS ---
            const reasons = {
                overage: `Resolution: Reject Overage (Trf: ${job.id})`,
                damaged: `Resolution: Damaged/Defective (Trf: ${job.id})`,
                waste: `Resolution: Disposed (Trf: ${job.id})`,
                shortage: `Resolution: Found Shortage (Trf: ${job.id})`
            };

            if (qty > 0) {
                // Reject (Return) - Reduces Stock
                if (resolutionAction === 'reject') {
                    await adjustStock(item.item.productId || item.item.id, qty, 'OUT', reasons.overage, currentUser?.name || 'System');
                }
                // Dispose (Waste) - Reduces Stock
                if (resolutionAction === 'dispose') {
                    await adjustStock(item.item.productId || item.item.id, qty, 'OUT', reasons.waste, currentUser?.name || 'System');
                }
                // Adjust (Shortage Found) - Adds Stock
                if (resolutionAction === 'adjust' && discrepancyType === 'shortage') {
                    await adjustStock(item.item.productId || item.item.id, qty, 'IN', reasons.shortage, currentUser?.name || 'System');
                }
                // Resend Missing Items - Creates new replacement job
                if (resolutionAction === 'replace') {
                    const newJob = await wmsJobsService.create({
                        siteId: job.sourceSiteId || activeSite?.id,
                        type: 'TRANSFER',
                        priority: job.priority || 'Normal',
                        status: 'Pending',
                        items: 1,
                        lineItems: [{
                            productId: item.item.productId || item.item.id,
                            name: item.item.name || 'Unknown',
                            sku: item.item.sku || 'N/A',
                            image: item.item.image || '',
                            expectedQty: qty,
                            pickedQty: 0,
                            status: 'Pending',
                            receivedQty: 0
                        }],
                        sourceSiteId: job.sourceSiteId,
                        destSiteId: job.destSiteId,
                        transferStatus: 'Requested',
                        requestedBy: currentUser?.name || 'System',
                        notes: `Replacement for discrepancy in ${job.jobNumber || job.id}`,
                        deliveryMethod: job.deliveryMethod || 'Internal'
                    } as any);
                    replacementJobId = newJob.id;
                }
            }

            // --- PHASE 2: RECORD DISCREPANCY ---
            await discrepancyService.createResolution({
                transferId: job.id,
                lineItemIndex: item.index,
                productId: item.item.productId || item.item.id,
                expectedQty: item.item.expectedQty,
                receivedQty: item.item.receivedQty || 0,
                variance: diff,
                discrepancyType: discrepancyType,
                resolutionType: resolutionAction,
                resolutionStatus: resolutionAction === 'accept' ? 'closed' : 'pending',
                resolutionNotes: notes,
                reasonCode: reasonCode,
                claimAmount: claimAmount ? parseFloat(claimAmount) : undefined,
                reportedBy: currentUser?.id,
                siteId: job.destSiteId,
                resolveQty: qty,
                replacementJobId: replacementJobId
            });

            // 2. UPDATE JOB ITEM STATUS
            // If resolved (Accept, Reject, Adjust), mark item as Resolved
            if (['accept', 'reject', 'adjust', 'dispose', 'replace'].includes(resolutionAction)) {
                const updatedLineItems = (job.lineItems || []).map((li: any, i: number) =>
                    i === item.index ? { ...li, status: 'Resolved' } : li
                );
                // Check if all items are now resolved/completed
                const allDone = updatedLineItems.every((li: any) => ['Completed', 'Resolved'].includes(li.status));

                await wmsJobsService.update(job.id, {
                    lineItems: updatedLineItems,
                    transferStatus: job.transferStatus,
                    status: allDone ? 'Completed' : 'In-Progress'
                } as any);
            }

            await refreshData();
            onClose();
            alert('Discrepancy resolution submitted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to submit resolution. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resolve Discrepancy">
            <div className="space-y-6">

                {/* Header Info */}
                <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">{productName}</h4>
                        <div className="text-sm text-gray-400 font-mono">
                            Expected: <span className="text-white">{item.item.expectedQty}</span> &nbsp;|&nbsp;
                            Received: <span className="text-yellow-400">{item.item.receivedQty || 0}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-red-500 font-mono tracking-tighter">
                            {diff > 0 ? '+' : ''}{diff}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-red-400 opacity-70 font-bold">Variance</div>
                    </div>
                </div>

                {/* STEPS PREVIEW */}
                <div className="flex items-center gap-2 mb-6">
                    {['TYPE', 'ACTION', 'DETAILS', 'REVIEW'].map((s, i) => {
                        const isCurrent = step === s;
                        const isPast = ['TYPE', 'ACTION', 'DETAILS', 'REVIEW'].indexOf(step) > i;
                        return (
                            <div key={s} className="flex-1 flex flex-col items-center gap-2">
                                <div className={`w-full h-1 rounded-full ${isPast ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-white/10'}`} />
                                <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-blue-400' : 'text-gray-600'}`}>{s}</span>
                            </div>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}
                <div className="min-h-[300px]">
                    {step === 'TYPE' && (
                        <div className="grid grid-cols-1 gap-3">
                            {DISCREPANCY_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setDiscrepancyType(t.id);
                                        setStep('ACTION');
                                    }}
                                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all group text-left
                                        ${discrepancyType === t.id
                                            ? 'bg-blue-500/20 border-blue-500/50'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                >
                                    <div className={`p-3 rounded-full bg-black/40 ${t.color}`}>
                                        <t.icon size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{t.label}</div>
                                        <div className="text-gray-400 text-sm">Select if this best describes the issue.</div>
                                    </div>
                                    <ChevronRight className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${discrepancyType === t.id ? 'opacity-100 text-blue-400' : 'text-gray-500'}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'ACTION' && (
                        <div className="grid grid-cols-2 gap-3">
                            {RESOLUTION_ACTIONS.map(a => {
                                const allowed = canDoAction(a.id);
                                return (
                                    <button
                                        key={a.id}
                                        disabled={!allowed}
                                        onClick={() => {
                                            setResolutionAction(a.id);
                                            setStep('DETAILS');
                                        }}
                                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all text-left relative overflow-hidden
                                            ${!allowed ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02]'}
                                            ${resolutionAction === a.id
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`p-2 rounded-lg bg-black/40 ${a.color}`}>
                                                <a.icon size={20} />
                                            </div>
                                            {a.id === resolutionAction && <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">SELECTED</div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{a.label}</div>
                                            <div className="text-gray-400 text-xs mt-1 leading-relaxed">{a.desc}</div>
                                        </div>
                                        {!allowed && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1">
                                                <Lock size={10} /> Locked
                                            </span>
                                        </div>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {step === 'DETAILS' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Quantity to Resolve</label>
                                <input
                                    type="number"
                                    value={resolveQty}
                                    onChange={e => setResolveQty(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none font-mono"
                                    placeholder="Enter quantity..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Resolution Notes / Explanation</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Please describe why this resolution was chosen..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none h-32 resize-none"
                                />
                            </div>

                            {['claim', 'adjust', 'reject'].includes(resolutionAction || '') && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Internal Reason Code</label>
                                    <select
                                        value={reasonCode}
                                        onChange={e => setReasonCode(e.target.value)}
                                        title="Reason Code"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none"
                                    >
                                        <option value="">Select a reason code...</option>
                                        <option value="DAMAGED_TRANSIT">Damaged in Transit</option>
                                        <option value="SHRINK_TRANSIT">Shrinkage / Lost in Transit</option>
                                        <option value="PACKING_ERROR">Internal Packing Error</option>
                                        <option value="COUNT_ERROR">Counting Error</option>
                                        <option value="THEFT">Suspected Theft</option>
                                    </select>
                                </div>
                            )}

                            {resolutionAction === 'claim' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Estimated Claim Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            value={claimAmount}
                                            onChange={e => setClaimAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-8 pr-4 text-white text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button
                                    onClick={() => setStep('REVIEW')}
                                    disabled={!notes || (['claim', 'adjust', 'reject'].includes(resolutionAction || '') && !reasonCode)}
                                >
                                    Review Resolution <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'REVIEW' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl space-y-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Shield className="text-blue-400" /> Confirm Resolution
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-400 mb-1">Discrepancy Type</div>
                                        <div className="text-white font-bold capitalize">{DISCREPANCY_TYPES.find(t => t.id === discrepancyType)?.label}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 mb-1">Resolution Action</div>
                                        <div className="text-white font-bold capitalize">{RESOLUTION_ACTIONS.find(a => a.id === resolutionAction)?.label}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-gray-400 mb-1">Notes</div>
                                        <div className="text-white italic bg-black/20 p-2 rounded border border-white/5">{notes}</div>
                                    </div>
                                    {claimAmount && (
                                        <div>
                                            <div className="text-gray-400 mb-1">Claim Value</div>
                                            <div className="text-green-400 font-mono font-bold">${claimAmount}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep('DETAILS')} className="flex-1">Back</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white font-bold"
                                    loading={isSubmitting}
                                >
                                    <CheckCircle size={18} className="mr-2" /> Confirm & Submit
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Nav (Back) */}
                {step !== 'TYPE' && step !== 'REVIEW' && (
                    <div className="pt-6 border-t border-white/5 flex justify-between">
                        <button
                            onClick={() => {
                                if (step === 'ACTION') setStep('TYPE');
                                if (step === 'DETAILS') setStep('ACTION');
                            }}
                            className="text-gray-500 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

