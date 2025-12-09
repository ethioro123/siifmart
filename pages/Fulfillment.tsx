
import React, { useState, useMemo, useEffect } from 'react';
import {
    ClipboardList, Box, Search, CheckCircle, Truck, AlertTriangle, RotateCcw,
    Thermometer, Calendar, Scan, ArrowRight, Package, Layers,
    RefreshCw, Trash2, Lock, Printer, Grid, ChevronRight, ChevronDown, Play,
    StopCircle, PauseCircle, Shield, ShoppingBag, Snowflake, Sun,
    Droplet, Anchor, Map, FileText, X, Clock, ClipboardCheck,
    AlertOctagon, ArrowDown, Camera, ArrowLeft, MapPin, LayoutList, Zap, User, Plus, Minus,
    Download, Upload, Navigation, Phone, QrCode
} from 'lucide-react';
import { WMSJob, JobItem, PurchaseOrder, ReceivingItem } from '../types';
import { Protected, ProtectedButton } from '../components/Protected';
import Modal from '../components/Modal';
import { useStore } from '../contexts/CentralStore';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { QRScanner } from '../components/QRScanner';
import { useData } from '../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../constants';
import { wmsJobsService, purchaseOrdersService } from '../services/supabase.service';
import { filterBySite } from '../utils/locationAccess';
import { generateQRCodeLabelHTML, generateQRCode, generateQRCodeImage } from '../utils/qrCodeGenerator';
import { generateBarcodeSVG, generateBarcodeLabelHTML, generateBatchBarcodeLabelsHTML, generateBarcodeImage } from '../utils/barcodeGenerator';
import { generateUnifiedBatchLabelsHTML, generatePackLabelHTML, LabelSize, LabelFormat, PackLabelData } from '../utils/unifiedLabelGenerator';
import { generateCODE128FromSKU, formatForCODE128 } from '../utils/barcodeFormatter';
import { formatJobId, formatOrderRef, formatTransferId } from '../utils/jobIdFormatter';


type OpTab = 'DOCKS' | 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'PACK' | 'REPLENISH' | 'COUNT' | 'WASTE' | 'RETURNS' | 'ASSIGN' | 'TRANSFER';

// Tab-level role permissions - defines which roles can access which tabs
const TAB_PERMISSIONS: Record<OpTab, string[]> = {
    DOCKS: ['super_admin', 'warehouse_manager', 'dispatcher'],
    RECEIVE: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    PUTAWAY: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'inventory_specialist'],
    PICK: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker'],
    PACK: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker'],
    REPLENISH: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'],
    COUNT: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    WASTE: ['super_admin', 'warehouse_manager', 'inventory_specialist'],
    RETURNS: ['super_admin', 'warehouse_manager', 'dispatcher'],
    ASSIGN: ['super_admin', 'warehouse_manager', 'dispatcher'], // Job assignment center
    TRANSFER: ['super_admin', 'warehouse_manager', 'dispatcher', 'retail_manager'] // Store managers can request transfers
};

// --- SUB-COMPONENTS ---

const MetricBadge = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div className={`flex flex-col px-4 py-2 rounded-xl border ${color} bg-opacity-10`}>
        <span className="text-[10px] uppercase font-bold opacity-70">{label}</span>
        <span className="text-lg font-mono font-bold">{value}</span>
    </div>
);

// --- MAIN COMPONENT ---

export default function WarehouseOperations() {
    const { user } = useStore();
    const { t } = useLanguage();
    const {
        jobs, orders, products, allProducts, settings, sales, processReturn, employees, jobAssignments, activeSite, sites, movements,
        receivePO, assignJob, updateJobItem, completeJob, resetJob, adjustStock, relocateProduct, addNotification, updateJobStatus, addProduct, refreshData
    } = useData();


    // 🔒 LOCATION-BASED ACCESS CONTROL
    // Super Admins MUST select a specific warehouse/store to view operations
    // If at HQ or no site selected, show empty results
    const isMultiSiteRole = ['Super Admin', 'Admin', 'Auditor', 'super_admin'].includes(user?.role || '');

    const isHQ = activeSite ? ['Administration', 'Administrative', 'Central Operations'].includes(activeSite.type) : 'N/A';
    const needsSiteSelection = isMultiSiteRole && (!activeSite || ['Administration', 'Administrative', 'Central Operations'].includes(activeSite.type));

    console.log('🔍 DEBUG ACCESS:', {
        role: user?.role,
        isMultiSiteRole,
        activeSite: activeSite,
        activeSiteType: activeSite?.type,
        isHQ: isHQ,
        needsSiteSelection: needsSiteSelection
    });

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
        const allTabs: OpTab[] = ['DOCKS', 'RECEIVE', 'PUTAWAY', 'REPLENISH', 'PICK', 'PACK', 'ASSIGN', 'TRANSFER', 'COUNT', 'WASTE', 'RETURNS'];
        return allTabs.filter(tab => canAccessTab(tab));
    }, [user?.role]);

    // Set default tab to first visible tab
    const [activeTab, setActiveTab] = useState<OpTab>(() => {
        return visibleTabs[0] || 'PICK';
    });
    const [selectedJob, setSelectedJob] = useState<WMSJob | null>(null);

    // --- SCANNER STATE ---
    const [isScannerMode, setIsScannerMode] = useState(false);
    const [scannerStep, setScannerStep] = useState<'NAV' | 'SCAN' | 'CONFIRM'>('NAV');
    const [scannedBin, setScannedBin] = useState('');
    const [scannedItem, setScannedItem] = useState('');
    const [pickQty, setPickQty] = useState(0);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [qrScannerMode, setQRScannerMode] = useState<'location' | 'product'>('product');
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [showScannerList, setShowScannerList] = useState(false); // Scanner list view toggle
    const [lastCompletedItem, setLastCompletedItem] = useState<{ name: string; qty: number } | null>(null); // For completion animation

    // --- LOCATION PICKER STATE ---
    const [selectedZone, setSelectedZone] = useState('A');
    const [selectedAisle, setSelectedAisle] = useState('01');
    const [selectedBin, setSelectedBin] = useState('01');
    const [locationSearch, setLocationSearch] = useState('');
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // --- RECEIVING STATE ---
    const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
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

    // Track total received quantities per product from jobs
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
                    setScannedSkus(prev => ({ ...prev, [focusedItem.productId]: newSku }));
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
            const received = receivedQuantities[item.productId] || 0;
            return received >= item.quantity;
        });
    }, [receivingPO, receivedQuantities]);

    // --- RETURNS STATE ---
    const [returnSearch, setReturnSearch] = useState('');
    const [foundSale, setFoundSale] = useState<any | null>(null); // Using any to avoid type complexity for now, or import SaleRecord
    const [returnItems, setReturnItems] = useState<any[]>([]); // Using any for ReturnItem[] compatibility
    const [returnStep, setReturnStep] = useState<'Search' | 'Select' | 'Review' | 'Complete'>('Search');

    // --- REVIEW & PRINT STATE ---
    const [reviewPO, setReviewPO] = useState<PurchaseOrder | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // --- REPRINT OPTIONS STATE ---
    const [reprintItem, setReprintItem] = useState<{ sku: string; name: string; qty: number } | null>(null);
    const [reprintSize, setReprintSize] = useState<'Tiny' | 'Small' | 'Medium' | 'Large'>('Medium');
    const [reprintFormat, setReprintFormat] = useState<'QR' | 'Barcode' | 'Both'>('Barcode');

    // Pack Job Reprint State (uses same size/format as above) - Rich data for detailed labels
    const [packReprintJob, setPackReprintJob] = useState<PackLabelData & { id: string } | null>(null);

    // --- LOADING STATES (prevent double-clicking) ---
    const [isReceiving, setIsReceiving] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isDistributing, setIsDistributing] = useState(false);
    const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
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
            const receivedQty = receivedQuantities[item.productId] || 0;

            if (receivedQty > 0) {
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
        }
    };

    // --- PACKING STATE ---
    const [bagCount, setBagCount] = useState(0);
    const [hasIcePack, setHasIcePack] = useState(false);

    // --- DOCK STATE ---
    const [dockStatus, setDockStatus] = useState<Record<string, 'Empty' | 'Occupied' | 'Maintenance'>>({
        'D1': 'Occupied', 'D2': 'Empty', 'D3': 'Empty', 'D4': 'Maintenance'
    });

    // --- WAVE STATE ---
    const [waveView, setWaveView] = useState<'LIST' | 'KANBAN'>('KANBAN');

    // --- ADMIN STATE ---
    const [labelMode, setLabelMode] = useState<'BIN' | 'PRODUCT'>('PRODUCT');

    // Zone Management State
    const [lockedZones, setLockedZones] = useState<Set<string>>(new Set());
    const [zoneMaintenanceReasons, setZoneMaintenanceReasons] = useState<Record<string, string>>({});

    // --- PACK STATE ---
    const [packJobFilter, setPackJobFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
    const [selectedPackJob, setSelectedPackJob] = useState<string | null>(null);
    const [boxSize, setBoxSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');
    const [fragileItems, setFragileItems] = useState<Set<string>>(new Set());
    const [packScanMode, setPackScanMode] = useState(false); // Toggle between checkbox and scanner mode
    const [packScanInput, setPackScanInput] = useState(''); // Scanner input for pack mode
    const [packingMaterials, setPackingMaterials] = useState({
        bubbleWrap: false,
        airPillows: false,
        fragileStickers: false
    });

    // --- DOCK STATE ---
    const [dockTab, setDockTab] = useState<'INBOUND' | 'OUTBOUND' | 'DRIVER'>('INBOUND');

    // --- ASSIGN STATE ---
    const [assignJobFilter, setAssignJobFilter] = useState<'ALL' | 'PICK' | 'PACK' | 'PUTAWAY'>('ALL');
    const [dispatchPriorityFilter, setDispatchPriorityFilter] = useState<'ALL' | 'Critical' | 'High' | 'Normal'>('ALL');
    const [dispatchEmployeeFilter, setDispatchEmployeeFilter] = useState<'ALL' | 'picker' | 'packer' | 'dispatcher' | 'warehouse_manager'>('ALL');
    const [dispatchSearch, setDispatchSearch] = useState('');
    const [shippingTransferId, setShippingTransferId] = useState<string | null>(null); // Loading state for shipping buttons
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({}); // Generic loading state for any action by ID

    // --- REPLENISH STATE ---
    const [selectedReplenishItems, setSelectedReplenishItems] = useState<Set<string>>(new Set());

    // --- PUTAWAY STATE ---
    const [putawayStatusFilter, setPutawayStatusFilter] = useState<'All' | 'Pending' | 'In-Progress'>('All');
    const [putawaySortBy, setPutawaySortBy] = useState<'priority' | 'date' | 'items'>('priority');
    const [putawaySearch, setPutawaySearch] = useState('');

    // --- TRANSFER STATE ---
    const [transferSourceSite, setTransferSourceSite] = useState<string>('');
    const [transferDestSite, setTransferDestSite] = useState<string>('');
    const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [transferPriority, setTransferPriority] = useState<'Normal' | 'High' | 'Critical'>('Normal');
    const [transferNote, setTransferNote] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferStatusFilter, setTransferStatusFilter] = useState<'ALL' | 'Requested' | 'Approved' | 'In-Transit' | 'Received'>('ALL');
    const [transferReceiveMode, setTransferReceiveMode] = useState(false);
    const [transferReceiveItems, setTransferReceiveItems] = useState<{ productId: string; expectedQty: number; receivedQty: number; condition: string; notes?: string }[]>([]);
    const [activeTransferJob, setActiveTransferJob] = useState<any | null>(null);

    // --- BULK DISTRIBUTION STATE (Wave Transfer to Multiple Stores) ---
    const [showBulkDistributionModal, setShowBulkDistributionModal] = useState(false);
    const [bulkDistributionSourceSite, setBulkDistributionSourceSite] = useState<string>('');
    const [bulkDistributionProductId, setBulkDistributionProductId] = useState<string>('');
    const [bulkDistributionAllocations, setBulkDistributionAllocations] = useState<{ storeId: string; quantity: number }[]>([]);
    const [bulkDistributionMode, setBulkDistributionMode] = useState<'single' | 'wave'>('single');
    const [waveProducts, setWaveProducts] = useState<{ productId: string; allocations: { storeId: string; quantity: number }[] }[]>([]);

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
        for (const lockedZone of lockedZones) {
            // Extract zone letter from locked zone (e.g., "A-01" -> "A")
            const zoneLetter = lockedZone.split('-')[0];
            // Check if location contains the zone letter
            if (locationUpper.includes(zoneLetter) || locationUpper.includes(`ZONE ${zoneLetter}`)) {
                return true;
            }
        }
        return false;
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
                    suggestions.push(`${zone}-${newAisle}-${newBin}`);
                }
            }
        } else {
            // Suggest locations in recommended zone
            for (let i = 1; i <= 3; i++) {
                suggestions.push(`${recommendedZone}-01-${String(i).padStart(2, '0')}`);
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

        return [...new Set(suggestions)].slice(0, 5);
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
                    receivedQty: item.quantity
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

        // OPTIMIZATION: Sort items by bin location to create efficient pick path
        const sortedItems = [...jobLineItems].sort((a, b) => {
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

        // Just set the job - user will click "Start Picking" button in modal to open scanner
        setSelectedJob(optimizedJob);
        // Don't set scanner mode here - let user preview job details first
        setIsScannerMode(false);
    };

    const handleBinScan = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock validation: accepts any bin starting with 'A', 'B', 'C'
        if (scannedBin.length > 2) {
            setScannerStep('SCAN');
        } else {
            addNotification('alert', t('warehouse.invalidBinLabel'));
        }
    };

    // Generate location from zone/aisle/bin selection
    const generateLocation = (zone: string, aisle: string, bin: string) => {
        return `${zone}-${aisle}-${bin}`;
    };

    // Get occupied locations from products
    const getOccupiedLocations = () => {
        return new Set(filteredProducts.filter(p => p.location).map(p => p.location!));
    };

    // Check if location is available (for PUTAWAY, locations can always be used even if occupied)
    // This is informational only - shows if other items exist at this location
    const isLocationAvailable = (location: string) => {
        // For PUTAWAY operations, always allow - multiple items can share a bin
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
    };

    const handleItemScan = async (actualQty?: number) => {
        if (!selectedJob || isProcessingScan) return;
        setIsProcessingScan(true);
        try {
            // Find item in job
            const itemIndex = selectedJob.lineItems.findIndex(i => i.status === 'Pending');
            if (itemIndex === -1) return;

            const item = selectedJob.lineItems[itemIndex];

            if (item) {
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
                            console.log(`🆕 Product ID is null. Auto-creating product: ${item.name}`);

                            // Determine product category (fallback to 'General' if not available)
                            const productCategory = 'General'; // Can be enhanced to extract from context if available

                            // Generate a proper SKU or use existing from item
                            const { generateSKU } = await import('../utils/skuGenerator');
                            const generatedSKU = item.sku && item.sku.trim() !== '' && item.sku !== 'MISC'
                                ? item.sku
                                : generateSKU(productCategory, allProducts);

                            const newProduct = await addProduct({
                                name: item.name,
                                sku: generatedSKU,
                                category: productCategory,
                                price: 0,
                                cost: 0,
                                stock: 0, // Will be updated by adjustStock
                                minStock: 0,
                                siteId: selectedJob.siteId || selectedJob.site_id,
                                site_id: selectedJob.siteId || selectedJob.site_id,
                                location: scannedBin,
                                image: item.image || '/placeholder.png',
                                barcode: '',
                                unit: 'pcs',
                                status: 'active'
                            });

                            if (newProduct) {
                                productId = newProduct.id;
                                console.log(`✅ Created product with SKU: ${generatedSKU}, ID: ${productId}`);
                            } else {
                                throw new Error('Failed to create product');
                            }
                        } else {
                            // Update the product's location
                            await relocateProduct(productId, scannedBin, user?.name || 'WMS Worker');
                        }

                        // Add stock to inventory (increases the stock count)
                        console.log(`📦 PUTAWAY: Adding ${qtyToAdd} units of ${item.name} to inventory at ${scannedBin}`);
                        await adjustStock(
                            productId,
                            qtyToAdd,
                            'IN',
                            `PUTAWAY from PO - stored at ${scannedBin}`,
                            user?.name || 'WMS Worker'
                        );

                        addNotification('success', `✅ Added ${qtyToAdd}x ${item.name} to inventory at ${scannedBin}`);
                    } catch (error) {
                        console.error('Putaway Error:', error);
                        addNotification('alert', 'Failed to complete putaway operation. Please try again.');
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

                        addNotification('success', `✅ Picked ${qtyToDeduct}x ${item.name}`);
                    } catch (error) {
                        console.error('Pick Error:', error);
                        addNotification('alert', 'Failed to deduct stock. Please try again.');
                        return; // Stop execution if pick fails
                    }
                }

                const qtyToRecord = actualQty !== undefined ? actualQty : item.expectedQty;
                const statusToRecord = (actualQty !== undefined && actualQty < item.expectedQty) ? 'Short' : 'Picked';

                await updateJobItem(selectedJob.id, itemIndex, statusToRecord, qtyToRecord);

                // Show completion feedback for this item
                setLastCompletedItem({ name: item.name, qty: qtyToRecord });

                // Update local state to reflect change immediately
                const updatedJob = { ...selectedJob };
                updatedJob.lineItems = [...selectedJob.lineItems]; // Shallow copy array
                updatedJob.lineItems[itemIndex] = { ...item, status: statusToRecord, pickedQty: qtyToRecord };
                setSelectedJob(updatedJob);

                // Check if job is truly complete - ALL items must be processed
                const allItemsProcessed = updatedJob.lineItems.every(i =>
                    i.status === 'Picked' || i.status === 'Short'
                );

                if (allItemsProcessed) {
                    console.log(`✅ Job ${selectedJob.jobNumber || selectedJob.id} - All items processed, completing job`);
                    await completeJob(selectedJob.id, user?.name || 'Worker', true); // skipValidation=true since we already verified

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
                            <h3 className="font-bold text-blue-400 text-lg">Shipping Required</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">From:</span>
                                <span className="font-bold text-white">{sourceSite?.name || 'This Warehouse'}</span>
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
                <div className="p-4 bg-gray-900 flex justify-between items-center border-b border-gray-800">
                    <div className="text-white">
                        <h2 className="font-bold text-lg">{selectedJob.type} {formatJobId(selectedJob)}</h2>
                        <p className="text-xs text-gray-400">{selectedJob.lineItems.length} {t('warehouse.items')} • {selectedJob.lineItems.filter(i => i.status === 'Pending').length} {t('warehouse.remaining')}</p>
                        {/* Store Information */}
                        {(selectedJob.sourceSiteId || selectedJob.destSiteId) && (
                            <div className="flex items-center gap-3 mt-1 text-[10px]">
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
                    <div className="flex gap-4">
                        <button onClick={() => setShowList(!showList)} className="text-blue-400 font-bold text-sm">
                            {showList ? t('warehouse.scanView') : t('warehouse.viewList')}
                        </button>
                        <button onClick={() => setIsScannerMode(false)} className="text-red-400 font-bold text-sm">{t('warehouse.exit')}</button>
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
                <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-hidden relative">

                    {/* Item Completion Overlay */}
                    {lastCompletedItem && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="text-center animate-in zoom-in-95 duration-300">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse">
                                    <CheckCircle size={48} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Item Picked!</h3>
                                <p className="text-green-400 font-bold text-lg mb-1">{lastCompletedItem.qty}x {lastCompletedItem.name}</p>
                                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
                                    <span className="text-sm">
                                        {selectedJob.lineItems.filter(i => i.status === 'Picked' || i.status === 'Short').length} / {selectedJob.lineItems.length} items
                                    </span>
                                </div>
                                <div className="mt-2 w-48 mx-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${(selectedJob.lineItems.filter(i => i.status === 'Picked' || i.status === 'Short').length / selectedJob.lineItems.length) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-3 animate-pulse">Loading next item...</p>
                            </div>
                        </div>
                    )}

                    {showList ? (
                        <div className="w-full h-full max-w-md overflow-y-auto space-y-3">
                            {['admin', 'manager', 'super_admin'].includes(user?.role || '') && selectedJob.type === 'PICK' && (
                                <div className="flex justify-end">
                                    <button
                                        disabled={isProcessingScan}
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
                                                const updatedItems = selectedJob.lineItems.map(item => ({
                                                    ...item,
                                                    status: 'Picked',
                                                    pickedQty: item.expectedQty
                                                }));

                                                const updatedJob = { ...selectedJob, lineItems: updatedItems };
                                                setSelectedJob(updatedJob);

                                                addNotification('success', 'All items picked and stock deducted!');

                                                // Complete the job
                                                await completeJob(selectedJob.id, user?.name || 'Worker');

                                                // Close list to show completion screen
                                                setShowList(false);
                                            } finally {
                                                setIsProcessingScan(false);
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-cyber-primary transition-colors mb-2 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
                                    >
                                        {isProcessingScan ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                        {isProcessingScan ? t('warehouse.processing') : t('warehouse.pickAllAdmin')}
                                    </button>
                                </div>
                            )}
                            {selectedJob.lineItems.map((item, idx) => {
                                const itemProduct = filteredProducts.find(p => p.id === item.productId);
                                return (
                                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${item.status === 'Pending' ? 'bg-white/5 border-white/10' :
                                        item.status === 'Short' ? 'bg-red-900/20 border-red-500/50' :
                                            'bg-green-900/20 border-green-500/50'
                                        }`}>
                                        <div className="flex-1">
                                            <p className="text-white font-bold">{item.name}</p>
                                            <p className="text-xs text-gray-400">{t('warehouse.sku')}: {item.sku || t('warehouse.nA')}</p>
                                            {/* Show location for PICK jobs */}
                                            {selectedJob.type === 'PICK' && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">📍</span>
                                                    <span className={`text-xs font-mono font-bold ${itemProduct?.location ? 'text-blue-400' : 'text-yellow-500'}`}>
                                                        {itemProduct?.location || 'No Location'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                item.status === 'Short' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-green-500/10 text-green-400'
                                                }`}>
                                                {item.status === 'Pending' ? t('warehouse.pending') : item.status === 'Short' ? t('warehouse.short') : t('warehouse.picked')}
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
                            {/* Step 1: Location Picker */}
                            {scannerStep === 'NAV' && currentItem && (
                                <div className="w-full max-w-4xl mx-auto space-y-6">
                                    <div className="text-center">
                                        <Map size={48} className="text-blue-500 mx-auto mb-4" />
                                        <h1 className="text-3xl font-bold text-white mb-2">
                                            {selectedJob.type === 'PUTAWAY' ? t('warehouse.selectStorageLocation') : t('warehouse.selectPickLocation')}
                                        </h1>
                                        <p className="text-gray-400">{selectedJob.type === 'PUTAWAY' ? t('warehouse.chooseWhereToStore') : t('warehouse.chooseWhereToPick')}</p>
                                    </div>

                                    {/* Location Selector */}
                                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            {/* Zone Selector */}
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">{t('warehouse.zone')}</label>
                                                <select
                                                    aria-label={t('warehouse.zone')}
                                                    value={selectedZone}
                                                    onChange={(e) => {
                                                        setSelectedZone(e.target.value);
                                                        setSelectedAisle('01');
                                                        setSelectedBin('01');
                                                    }}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-lg focus:border-blue-500 outline-none"
                                                >
                                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(zone => (
                                                        <option key={zone} value={zone}>{t('warehouse.zone')} {zone}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Aisle Selector */}
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">{t('warehouse.aisle')}</label>
                                                <select
                                                    aria-label={t('warehouse.aisle')}
                                                    value={selectedAisle}
                                                    onChange={(e) => {
                                                        setSelectedAisle(e.target.value);
                                                        setSelectedBin('01');
                                                    }}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-lg focus:border-blue-500 outline-none"
                                                >
                                                    {Array.from({ length: 20 }, (_, i) => {
                                                        const num = String(i + 1).padStart(2, '0');
                                                        return <option key={num} value={num}>{num}</option>;
                                                    })}
                                                </select>
                                            </div>

                                            {/* Bin Selector */}
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">{t('warehouse.bin')}</label>
                                                <select
                                                    aria-label={t('warehouse.bin')}
                                                    value={selectedBin}
                                                    onChange={(e) => setSelectedBin(e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-lg focus:border-blue-500 outline-none"
                                                >
                                                    {Array.from({ length: 20 }, (_, i) => {
                                                        const num = String(i + 1).padStart(2, '0');
                                                        return <option key={num} value={num}>{num}</option>;
                                                    })}
                                                </select>
                                            </div>

                                            {/* Quick Select Button */}
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => {
                                                        const location = generateLocation(selectedZone, selectedAisle, selectedBin);
                                                        handleLocationSelect(location);
                                                    }}
                                                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                                                >
                                                    {t('warehouse.selectLocation')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Selected Location Preview */}
                                        <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">{t('warehouse.selectedLocation')}</p>
                                                    <p className="text-2xl font-mono text-white font-bold">
                                                        {generateLocation(selectedZone, selectedAisle, selectedBin)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {isLocationOccupied(generateLocation(selectedZone, selectedAisle, selectedBin)) ? (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs font-bold">
                                                            📦 Has Items
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/50 text-xs font-bold">
                                                            ✓ Empty
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Manual Entry / Barcode Scan Option */}
                                        <div className="border-t border-gray-800 pt-4">
                                            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block flex items-center gap-2">
                                                <Scan size={14} className="text-cyber-primary" />
                                                {t('warehouse.enterManually')} {t('warehouse.scanLocationBarcode')}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={t('warehouse.scanOrEnterLocation')}
                                                    value={locationSearch}
                                                    onChange={(e) => {
                                                        const value = e.target.value.toUpperCase();
                                                        setLocationSearch(value);

                                                        // Auto-detect barcode scanner input (rapid entry)
                                                        // If format matches location pattern, auto-select after brief delay
                                                        if (/^[A-Z]-\d{2}-\d{2}$/.test(value)) {
                                                            setTimeout(() => {
                                                                if (locationSearch === value) {
                                                                    handleLocationSelect(value);
                                                                    setLocationSearch('');
                                                                }
                                                            }, 150);
                                                        }
                                                    }}
                                                    className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white font-mono text-lg focus:border-cyber-primary focus:outline-none focus:ring-2 focus:ring-cyber-primary/50"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && locationSearch) {
                                                            e.preventDefault();
                                                            // Validate format (e.g., A-01-01)
                                                            if (/^[A-Z]-\d{2}-\d{2}$/.test(locationSearch)) {
                                                                handleLocationSelect(locationSearch);
                                                                setLocationSearch('');
                                                            } else {
                                                                addNotification('alert', t('warehouse.invalidFormat'));
                                                                setLocationSearch('');
                                                            }
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => {
                                                        setQRScannerMode('location');
                                                        setIsQRScannerOpen(true);
                                                    }}
                                                    className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                                                    title={t('warehouse.scanLocationWithCamera')}
                                                >
                                                    <Camera size={20} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (locationSearch && /^[A-Z]-\d{2}-\d{2}$/.test(locationSearch)) {
                                                            handleLocationSelect(locationSearch);
                                                            setLocationSearch('');
                                                        } else {
                                                            addNotification('alert', t('warehouse.invalidFormat'));
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg transition-colors"
                                                >
                                                    {t('warehouse.use')}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2">
                                                {t('warehouse.tipScanLocation')} <span className="font-mono font-bold">A-01-01</span>
                                                <span className="text-blue-400 ml-2">• {t('warehouse.orUseCamera')}</span>
                                            </p>
                                        </div>

                                        {/* Smart Location Suggestions */}
                                        {currentItem && (() => {
                                            const product = filteredProducts.find(p => p.id === currentItem.productId);
                                            if (!product) return null;

                                            const smartSuggestions = getSmartLocationSuggestions(currentItem.productId);
                                            const tempReq = getTemperatureRequirement(product.category);
                                            const similarProducts = filteredProducts.filter(p =>
                                                p.category === product.category &&
                                                p.location &&
                                                p.id !== product.id
                                            );
                                            const similarLocations = [...new Set(similarProducts.map(p => p.location).filter((loc): loc is string => typeof loc === 'string' && !!loc))].slice(0, 5) as string[];

                                            return (
                                                <div className="border-t border-gray-800 pt-4 mt-4 space-y-4">
                                                    {tempReq && (
                                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                                            <div className="flex items-center gap-2">
                                                                <Snowflake className="text-blue-400" size={16} />
                                                                <div>
                                                                    <p className="text-xs font-bold text-blue-400 uppercase">{t('warehouse.temperatureRequirement')}</p>
                                                                    <p className="text-sm text-white">{tempReq}</p>
                                                                    <p className="text-[10px] text-gray-400 mt-1">{t('warehouse.useZoneForStorage').replace('{zone}', product.category === 'Frozen' ? 'Zone F' : 'Zone C')}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {smartSuggestions.length > 0 && (
                                                        <div>
                                                            <label className="text-xs text-gray-400 uppercase font-bold mb-3 block flex items-center gap-2">
                                                                <span>{t('warehouse.smartSuggestions')}</span>
                                                                {product.location && (
                                                                    <span className="text-[10px] text-gray-500 normal-case font-normal">
                                                                        (Current: {product.location})
                                                                    </span>
                                                                )}
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {smartSuggestions.map(loc => (
                                                                    <button
                                                                        key={loc}
                                                                        onClick={() => {
                                                                            const parts = String(loc).match(/^([A-Z])-(\d{2})-(\d{2})$/);
                                                                            if (parts) {
                                                                                setSelectedZone(parts[1]);
                                                                                setSelectedAisle(parts[2]);
                                                                                setSelectedBin(parts[3]);
                                                                            }
                                                                            handleLocationSelect(String(loc));
                                                                        }}
                                                                        className={`px-4 py-2 rounded-lg border font-mono text-sm font-bold transition-colors ${!isLocationOccupied(loc)
                                                                            ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                                                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
                                                                            }`}
                                                                        title={!isLocationOccupied(loc) ? `Use ${loc} (Empty)` : `Use ${loc} (Has items)`}
                                                                    >
                                                                        {loc} {!isLocationOccupied(loc) && '⭐'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {similarLocations.length > 0 && (
                                                        <div>
                                                            <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">
                                                                📍 Similar Products ({product.category})
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {similarLocations.filter((loc): loc is string => !smartSuggestions.includes(loc)).map(loc => (
                                                                    <button
                                                                        key={loc}
                                                                        onClick={() => {
                                                                            const parts = String(loc).match(/^([A-Z])-(\d{2})-(\d{2})$/);
                                                                            if (parts) {
                                                                                setSelectedZone(parts[1]);
                                                                                setSelectedAisle(parts[2]);
                                                                                setSelectedBin(parts[3]);
                                                                            }
                                                                            handleLocationSelect(String(loc));
                                                                        }}
                                                                        className={`px-4 py-2 rounded-lg border font-mono text-sm font-bold transition-colors ${!isLocationOccupied(String(loc))
                                                                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                                                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
                                                                            }`}
                                                                        title={!isLocationOccupied(String(loc)) ? `Use ${loc} (Empty)` : `Use ${loc} (Has items)`}
                                                                    >
                                                                        {loc}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Location Grid Preview */}
                                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Quick View - Zone {selectedZone}, Aisle {selectedAisle}</h3>
                                        <div className="grid grid-cols-10 gap-2">
                                            {Array.from({ length: 20 }, (_, i) => {
                                                const binNum = String(i + 1).padStart(2, '0');
                                                const location = generateLocation(selectedZone, selectedAisle, binNum);
                                                const occupied = isLocationOccupied(location);
                                                const isSelected = binNum === selectedBin;

                                                return (
                                                    <button
                                                        key={binNum}
                                                        onClick={() => {
                                                            setSelectedBin(binNum);
                                                            handleLocationSelect(location);
                                                        }}
                                                        className={`p-3 rounded-lg border-2 font-mono text-xs font-bold transition-all ${isSelected
                                                            ? 'bg-blue-500 border-blue-400 text-white'
                                                            : occupied
                                                                ? 'bg-gray-800 border-gray-700 text-blue-400 hover:border-blue-500 hover:bg-gray-750'
                                                                : 'bg-gray-800 border-gray-700 text-green-400 hover:border-green-500 hover:bg-gray-750'
                                                            }`}
                                                        title={occupied ? `Has items: ${location}` : `Empty: ${location}`}
                                                    >
                                                        {binNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-4 mt-4 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50"></div>
                                                <span className="text-gray-400">Empty</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/50"></div>
                                                <span className="text-gray-400">Has Items</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-blue-500 border border-blue-400"></div>
                                                <span className="text-gray-400">Selected</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Item Scan */}
                            {scannerStep === 'SCAN' && currentItem && (
                                <div className="text-center space-y-6 w-full max-w-md overflow-y-auto">
                                    <div className="relative inline-block">
                                        <img src={currentItem.image} className="w-48 h-48 rounded-xl border-4 border-gray-800 object-cover" alt="" />
                                        {settings.fefoRotation && selectedJob.type === 'PICK' && (
                                            <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full animate-pulse shadow-lg border-2 border-white">
                                                FEFO: PICK OLD
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{currentItem.name}</h2>
                                        <div className="flex justify-center gap-4 mt-4">
                                            <MetricBadge label={t('warehouse.qty')} value={currentItem.expectedQty} color="border-blue-500 text-blue-400 bg-blue-500" />
                                            <MetricBadge label={t('warehouse.stock')} value={product?.stock || 0} color="border-gray-500 text-gray-400 bg-gray-500" />
                                        </div>
                                    </div>

                                    {settings.fefoRotation && product?.expiryDate && selectedJob.type === 'PICK' && (
                                        <div className={`p-4 rounded-xl border flex items-center justify-center gap-3 ${expiry.color === 'text-red-500' ? 'bg-red-900/20 border-red-500' : 'bg-gray-800 border-gray-700'}`}>
                                            <AlertTriangle size={24} className={expiry.color} />
                                            <div className="text-left">
                                                <p className="text-xs text-gray-400 uppercase">{t('warehouse.checkExpiry')}</p>
                                                <p className={`font-bold ${expiry.color}`}>{product.expiryDate} ({expiry.label})</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* PICK Job - Show item location */}
                                    {selectedJob.type === 'PICK' && product?.location && (
                                        <div className="p-4 rounded-xl bg-blue-900/30 border-2 border-blue-500 flex flex-col items-center animate-pulse">
                                            <p className="text-xs text-blue-400 uppercase font-bold mb-2">{t('warehouse.goToLocation')}</p>
                                            <p className="text-3xl text-white font-mono font-bold tracking-wider">{product.location}</p>
                                            <p className="text-xs text-gray-400 mt-2">{t('warehouse.pickItem').replace('{qty}', currentItem.expectedQty.toString()).replace('{name}', currentItem.name)}</p>
                                        </div>
                                    )}

                                    {/* PICK Job - No location assigned */}
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

                                    {/* Barcode Scanner Input - Critical for Operations */}
                                    <div className="w-full space-y-3">
                                        <div className="bg-gray-900 rounded-xl border-2 border-cyber-primary/50 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Scan className="text-cyber-primary" size={20} />
                                                <p className="text-xs text-cyber-primary uppercase font-bold">{t('warehouse.scanProductBarcode')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={scannedItem}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setScannedItem(value);

                                                        // Auto-detect barcode scanner input (rapid entry, ends with Enter)
                                                        // Barcode scanners typically send data very quickly followed by Enter
                                                        if (value.length > 3) {
                                                            // Check if this matches the expected product SKU or ID
                                                            const matchedProduct = filteredProducts.find(p =>
                                                                p.sku?.toUpperCase() === value.toUpperCase() ||
                                                                p.id.toUpperCase() === value.toUpperCase() ||
                                                                p.id.replace(/[^A-Z0-9]/gi, '').toUpperCase() === value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
                                                            );

                                                            if (matchedProduct && matchedProduct.id === currentItem?.productId) {
                                                                // Correct product scanned - auto-confirm after brief delay
                                                                setTimeout(() => {
                                                                    if (scannedItem === value) { // Ensure value hasn't changed
                                                                        handleItemScan();
                                                                        setScannedItem('');
                                                                    }
                                                                }, 100);
                                                            }
                                                        }
                                                    }}
                                                    onKeyPress={(e) => {
                                                        // Handle Enter key (barcode scanner typically sends Enter after scan)
                                                        if (e.key === 'Enter' && scannedItem.trim()) {
                                                            e.preventDefault();
                                                            const scannedValue = scannedItem.trim().toUpperCase();

                                                            // Validate scanned barcode matches expected product
                                                            const expectedProduct = filteredProducts.find(p => p.id === currentItem?.productId);
                                                            let scannedProduct;

                                                            if (selectedJob?.type === 'PUTAWAY') {
                                                                // Strict SKU validation for Putaway
                                                                scannedProduct = filteredProducts.find(p => p.sku?.toUpperCase() === scannedValue);
                                                                // Fallback: Check if job item SKU matches directly
                                                                if (!scannedProduct && currentItem?.sku?.toUpperCase() === scannedValue) {
                                                                    scannedProduct = expectedProduct;
                                                                }
                                                            } else {
                                                                // Standard loose validation for other job types
                                                                scannedProduct = filteredProducts.find(p =>
                                                                    p.sku?.toUpperCase() === scannedValue ||
                                                                    p.id.toUpperCase() === scannedValue ||
                                                                    p.id.replace(/[^A-Z0-9]/gi, '').toUpperCase() === scannedValue.replace(/[^A-Z0-9]/gi, '')
                                                                );
                                                            }

                                                            if (scannedProduct && expectedProduct && scannedProduct.id === expectedProduct.id) {
                                                                // Correct product - proceed with scan
                                                                handleItemScan();
                                                                setScannedItem('');
                                                                addNotification('success', t('warehouse.productVerified'));
                                                            } else {
                                                                // Wrong product scanned
                                                                addNotification('alert', t('warehouse.wrongProduct').replace('{expected}', expectedProduct?.sku || expectedProduct?.id || '').replace('{scanned}', scannedValue));
                                                                setScannedItem('');
                                                            }
                                                        }
                                                    }}
                                                    placeholder={isProcessingScan ? t('warehouse.processing') : t('warehouse.scanBarcodeOrEnterSKU')}
                                                    className={`flex-1 bg-black/50 border-2 border-cyber-primary/30 rounded-lg p-4 text-white font-mono text-lg text-center focus:border-cyber-primary focus:outline-none focus:ring-2 focus:ring-cyber-primary/50 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    autoFocus
                                                    disabled={isProcessingScan}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setQRScannerMode('product');
                                                        setIsQRScannerOpen(true);
                                                    }}
                                                    className={`px-4 py-4 bg-blue-500/20 border-2 border-blue-500/30 text-blue-400 font-bold rounded-lg flex items-center gap-2 transition-colors ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/30'}`}
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

                                    <button
                                        disabled={isProcessingScan}
                                        onClick={() => {
                                            if (isProcessingScan) return;
                                            if (selectedJob?.type === 'PUTAWAY') {
                                                const normalize = (s: string) => s?.trim().toUpperCase() || '';
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
                                                    addNotification('alert', `Incorrect SKU. Expected: ${expectedSku || expectedProductSku}`);
                                                    setScannedItem('');
                                                    return;
                                                }
                                            }
                                            handleItemScan();
                                        }}
                                        className={`w-full py-6 bg-green-500 text-black font-bold text-xl rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400'}`}
                                    >
                                        {isProcessingScan ? <RefreshCw size={28} className="animate-spin" /> : <Scan size={28} />}
                                        {isProcessingScan ? t('warehouse.processing') : `${t('warehouse.confirm')} ${selectedJob.type}`}
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
                                            className={`py-4 bg-gray-800 text-white font-bold rounded-xl border border-gray-600 flex flex-col items-center justify-center gap-1 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                                        >
                                            <ArrowRight size={20} className="text-yellow-400" />
                                            <span className="text-sm">{t('warehouse.skipItem')}</span>
                                        </button>

                                        <button
                                            disabled={isProcessingScan}
                                            onClick={() => {
                                                // SHORT PICK LOGIC - Open custom modal
                                                setShortPickMaxQty(currentItem.expectedQty);
                                                setShortPickQuantity('');
                                                setShowShortPickModal(true);
                                            }}
                                            className={`py-4 bg-red-900/30 text-red-400 font-bold rounded-xl border border-red-500/30 flex flex-col items-center justify-center gap-1 ${isProcessingScan ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-900/50'}`}
                                        >
                                            <AlertTriangle size={20} />
                                            <span className="text-sm">{t('warehouse.shortPick')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    // 🚚 DRIVER INTERFACE - Phase 5
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
                                    }`} />

                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <span className="font-mono text-lg font-bold text-white">{formatJobId(job)}</span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                        job.status === 'In-Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>{job.status}</span>
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
            <div className="h-full flex flex-col gap-6">
                {isScannerMode && <ScannerInterface />}

                {/* Header Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 bg-cyber-gray p-2 rounded-xl border border-white/5 shrink-0 no-scrollbar">
                    <div className="flex-1 flex gap-2">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as OpTab)}
                                className={`px-4 py-3 md:py-2 rounded-lg text-sm md:text-xs font-bold transition-all whitespace-nowrap min-h-[44px] md:min-h-0 ${activeTab === tab
                                    ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                                    : 'text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                {t(`warehouse.tabs.${tab.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                    <LanguageSwitcher />
                </div>

                {/* --- DOCKS TAB --- */}
                {activeTab === 'DOCKS' && (
                    <div className="flex flex-col h-full gap-4">
                        {/* Sub-tabs */}
                        <div className="flex bg-black/40 p-1 rounded-xl w-fit border border-white/5 mx-4 md:mx-0">
                            {['INBOUND', 'OUTBOUND', 'DRIVER'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setDockTab(tab as any)}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${dockTab === tab
                                        ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab === 'INBOUND' && (
                                        <div className="flex items-center gap-2">
                                            <Download size={16} />
                                            <span>Incoming (Inbound)</span>
                                        </div>
                                    )}
                                    {tab === 'OUTBOUND' && (
                                        <div className="flex items-center gap-2">
                                            <Upload size={16} />
                                            <span>Outgoing (Outbound)</span>
                                        </div>
                                    )}
                                    {tab === 'DRIVER' && (
                                        <div className="flex items-center gap-2">
                                            <Truck size={16} />
                                            <span>Driver Portal</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {dockTab === 'INBOUND' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 overflow-y-auto md:overflow-hidden">
                                <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-4 md:p-6">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Download className="text-cyber-primary" /> Inbound Docks (Receiving)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                        {Object.entries(dockStatus).filter(([k]) => ['D1', 'D2'].includes(k)).map(([dock, status]) => (
                                            <div key={dock} className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 relative group cursor-pointer transition-all active:scale-95 ${status === 'Empty' ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' :
                                                status === 'Occupied' ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' :
                                                    'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
                                                }`}>
                                                <span className="absolute top-2 left-3 font-bold text-white opacity-50">{dock}</span>
                                                {status === 'Occupied' && <Truck size={40} className="text-red-400 md:w-10 md:h-10 w-12 h-12" />}
                                                {status === 'Empty' && <div className="w-12 h-12 md:w-10 md:h-10 rounded-full border-2 border-green-500/30 border-dashed" />}
                                                {status === 'Maintenance' && <AlertTriangle size={40} className="text-yellow-400 md:w-10 md:h-10 w-12 h-12" />}
                                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${status === 'Empty' ? 'text-green-400 bg-green-500/10' :
                                                    status === 'Occupied' ? 'text-red-400 bg-red-500/10' :
                                                        'text-yellow-400 bg-yellow-500/10'
                                                    }`}>{status === 'Empty' ? t('warehouse.empty') : status === 'Occupied' ? t('warehouse.occupied') : t('warehouse.maintenance')}</span>
                                            </div>
                                        ))}
                                        {/* Placeholder Docks */}
                                        <div className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                                            <Plus size={24} className="text-gray-600" />
                                            <span className="text-xs text-gray-500 font-bold">ADD DOCK</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">Inbound Queue</h3>
                                        <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded">3 Trucks</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-4 md:p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center min-h-[60px] md:min-h-0">
                                                <div>
                                                    <p className="text-base md:text-sm font-bold text-white">Incoming #{100 + i}</p>
                                                    <p className="text-sm md:text-xs text-gray-500">Supplier: Neo-Tokyo</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm md:text-xs text-orange-400 font-mono">00:{15 + i * 5}m</span>
                                                    <button className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded mt-1 hover:bg-green-500/30 transition-colors uppercase font-bold">Assign Dock</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {dockTab === 'OUTBOUND' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 overflow-y-auto md:overflow-hidden">
                                <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-4 md:p-6">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Upload className="text-cyber-primary" /> Outbound Docks (Shipping/Dispatch)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                        {Object.entries(dockStatus).filter(([k]) => ['D3', 'D4'].includes(k)).map(([dock, status]) => (
                                            <div key={dock} className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 relative group cursor-pointer transition-all active:scale-95 ${status === 'Empty' ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' :
                                                status === 'Occupied' ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' :
                                                    'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
                                                }`}>
                                                <span className="absolute top-2 left-3 font-bold text-white opacity-50">{dock}</span>
                                                {status === 'Occupied' && <Truck size={40} className="text-red-400 md:w-10 md:h-10 w-12 h-12" />}
                                                {status === 'Empty' && <div className="w-12 h-12 md:w-10 md:h-10 rounded-full border-2 border-green-500/30 border-dashed" />}
                                                {status === 'Maintenance' && <AlertTriangle size={40} className="text-yellow-400 md:w-10 md:h-10 w-12 h-12" />}
                                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${status === 'Empty' ? 'text-green-400 bg-green-500/10' :
                                                    status === 'Occupied' ? 'text-red-400 bg-red-500/10' :
                                                        'text-yellow-400 bg-yellow-500/10'
                                                    }`}>{status === 'Empty' ? t('warehouse.empty') : status === 'Occupied' ? 'Loading' : t('warehouse.maintenance')}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8">
                                        <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Package className="text-orange-400" /> Staging Area (Ready to Load)</h4>
                                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white">Store Order #202{i}</p>
                                                                <p className="text-xs text-gray-500">Dest: Downtown Store</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400">24 Items</p>
                                                            <p className="text-xs text-green-400 font-bold">READY</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">Outbound Schedule</h3>
                                        <button className="bg-cyber-primary text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                            <Plus size={12} /> New Shipment
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 min-h-[60px]">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">14:00 PM</span>
                                                <span className="text-xs text-gray-500">Pending</span>
                                            </div>
                                            <p className="text-sm font-bold text-white">Weekly Restock - North</p>
                                            <p className="text-xs text-gray-500 mt-1">Driver: John Doe (T-1000)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {dockTab === 'DRIVER' && (
                            <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-4 md:p-6 border-b border-white/10 bg-black/20 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="p-2 bg-cyber-primary text-black rounded-lg">
                                                <Truck size={24} />
                                            </div>
                                            Driver Dashboard
                                        </h2>
                                        <p className="text-sm text-gray-400 mt-1">Welcome, {user?.name || 'Driver'}</p>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <p className="text-2xl font-mono font-bold text-cyber-primary">08:42 AM</p>
                                        <p className="text-xs text-gray-500">Shift Started: 06:00 AM</p>
                                    </div>
                                </div>

                                <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
                                    {/* Left Column: Current Route */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Current Active Delivery */}
                                        <div className="bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                                <MapPin size={100} className="text-blue-500/20" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="animate-pulse w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                                    <span className="text-green-400 font-bold text-sm tracking-wider">EN ROUTE TO DESTINATION</span>
                                                </div>
                                                <h3 className="text-3xl font-bold text-white mb-2">Downtown Store #104</h3>
                                                <p className="text-xl text-gray-300 mb-6">123 Cyber Avenue, Neo-Tokyo</p>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                                                        <p className="text-xs text-gray-500 uppercase">Distance</p>
                                                        <p className="text-lg font-mono font-bold text-white">4.2 km</p>
                                                    </div>
                                                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                                                        <p className="text-xs text-gray-500 uppercase">ETA</p>
                                                        <p className="text-lg font-mono font-bold text-white">14 mins</p>
                                                    </div>
                                                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                                                        <p className="text-xs text-gray-500 uppercase">Items</p>
                                                        <p className="text-lg font-mono font-bold text-white">124 Pcs</p>
                                                    </div>
                                                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                                                        <p className="text-xs text-gray-500 uppercase">Order Ref</p>
                                                        <p className="text-lg font-mono font-bold text-white">#TR-8821</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <button className="flex-1 py-4 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyber-primary/20">
                                                        <Navigation size={20} />
                                                        Start Navigation
                                                    </button>
                                                    <button className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10">
                                                        <Phone size={20} />
                                                        Call Store
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upcoming Stops */}
                                        <div>
                                            <h4 className="font-bold text-white mb-4 text-lg">Upcoming Stops</h4>
                                            <div className="space-y-3">
                                                {[1, 2].map((stop, idx) => (
                                                    <div key={stop} className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-gray-400">
                                                            {idx + 2}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-white">Northside Branch</p>
                                                            <p className="text-sm text-gray-500">Expected: 11:30 AM</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded">2 Orders</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Tools */}
                                    <div className="space-y-6">
                                        {/* Actions */}
                                        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                            <h4 className="font-bold text-white mb-4">Quick Actions</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button className="aspect-square bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors group">
                                                    <QrCode size={32} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-blue-100">Scan Delivery</span>
                                                </button>
                                                <button className="aspect-square bg-orange-500/10 border border-orange-500/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-orange-500/20 transition-colors group">
                                                    <AlertTriangle size={32} className="text-orange-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-orange-100">Report Issue</span>
                                                </button>
                                                <button className="aspect-square bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-purple-500/20 transition-colors group">
                                                    <FileText size={32} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-purple-100">Documents</span>
                                                </button>
                                                <button className="aspect-square bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-green-500/20 transition-colors group">
                                                    <CheckCircle size={32} className="text-green-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-green-100">Complete Shift</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Delivery Stats */}
                                        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                            <h4 className="font-bold text-white mb-4">Today's Performance</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-400">On-Time Rate</span>
                                                        <span className="text-green-400 font-bold">98%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="w-[98%] h-full bg-green-500 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-400">Deliveries Completed</span>
                                                        <span className="text-white font-bold">12 / 18</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="w-[66%] h-full bg-blue-500 rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- RECEIVE TAB --- */}
                {activeTab === 'RECEIVE' && (
                    <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Receiving</h2>
                                    <p className="text-xs text-gray-400">Receive products one at a time from approved POs</p>
                                </div>
                            </div>

                            {/* Approved POs - Each product is a separate receiving task */}
                            {orders.filter(o => o.status === 'Approved').length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                                    <Package size={48} className="text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold">No approved POs to receive</p>
                                    <p className="text-gray-600 text-sm mt-2">Approved purchase orders will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.filter(o => o.status === 'Approved').map(po => {
                                        // Calculate received quantities for this PO from existing jobs
                                        const poJobs = jobs.filter(j => j.orderRef === po.id);
                                        const receivedMap: Record<string, number> = {};
                                        const jobSkuMap: Record<string, string> = {}; // Map productId to SKU from jobs
                                        const jobTimestampMap: Record<string, string> = {}; // Map productId to job created_at

                                        poJobs.forEach(job => {
                                            job.lineItems.forEach(item => {
                                                receivedMap[item.productId] = (receivedMap[item.productId] || 0) + item.expectedQty;
                                                // Store the SKU from the job (this is the finalized SKU)
                                                if (item.sku) {
                                                    jobSkuMap[item.productId] = item.sku;
                                                }
                                                // Store the job timestamp for sorting
                                                if (job.created_at) {
                                                    jobTimestampMap[item.productId] = job.created_at;
                                                }
                                            });
                                        });

                                        // Check if PO is fully received
                                        const allItemsReceived = po.lineItems?.every(item => {
                                            const received = receivedMap[item.productId] || 0;
                                            return received >= item.quantity;
                                        }) || false;

                                        return (
                                            <div key={po.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                                {/* PO Header - Always visible */}
                                                <div className="p-4 flex justify-between items-center border-b border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-cyber-primary/10 rounded-lg">
                                                            <Truck size={20} className="text-cyber-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white">{po.supplierName}</h3>
                                                            <p className="text-xs text-gray-400">{po.po_number || po.id} • {po.lineItems?.length || 0} products</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${allItemsReceived
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                                        {allItemsReceived ? 'FULLY RECEIVED' : 'IN PROGRESS'}
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-6">
                                                    {/* Pending Items */}
                                                    <div className="space-y-3">
                                                        {po.lineItems?.filter(item => (receivedMap[item.productId] || 0) < item.quantity).length === 0 && (
                                                            <div className="text-center py-4 text-gray-500 italic text-sm">No pending items</div>
                                                        )}
                                                        {po.lineItems?.filter(item => (receivedMap[item.productId] || 0) < item.quantity).map((item, idx) => {
                                                            const receivedQty = receivedMap[item.productId] || 0;
                                                            const remainingQty = Math.max(0, item.quantity - receivedQty);
                                                            const product = products.find(p => p.id === item.productId);

                                                            return (
                                                                <div
                                                                    key={item.productId || idx}
                                                                    className="flex items-center justify-between p-4 rounded-xl border bg-black/20 border-white/5 hover:border-cyber-primary/30 transition-colors"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-bold text-white">{item.productName}</p>
                                                                        </div>
                                                                        <p className="text-xs text-gray-400 font-mono mt-1">
                                                                            SKU: {product?.sku || item.sku || 'Will be assigned'}
                                                                        </p>
                                                                        <div className="flex items-center gap-4 mt-2">
                                                                            <span className="text-xs text-gray-500">Expected: {item.quantity}</span>
                                                                            <span className="text-xs text-yellow-400">
                                                                                Remaining: {remainingQty}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <Protected permission="RECEIVE_PO">
                                                                        <button
                                                                            onClick={() => {
                                                                                setFocusedItem({
                                                                                    id: item.id, // Pass ID for robust matching
                                                                                    productId: item.productId,
                                                                                    productName: item.productName || '',
                                                                                    expectedQty: item.quantity,
                                                                                    receivedQty: remainingQty
                                                                                });
                                                                                setReceivingPO(po);
                                                                                setShowPrintSuccess(false);
                                                                            }}
                                                                            className="px-4 py-2 bg-cyber-primary text-black font-bold rounded-lg text-sm hover:bg-cyber-accent transition-colors flex items-center gap-2"
                                                                        >
                                                                            <Box size={16} />
                                                                            Receive {remainingQty}
                                                                        </button>
                                                                    </Protected>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Complete Items */}
                                                    {po.lineItems?.filter(item => (receivedMap[item.productId] || 0) >= item.quantity).length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3 mt-2">
                                                                <div className="h-px flex-1 bg-white/10"></div>
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                                                    <CheckCircle size={10} /> Recently Completed
                                                                </span>
                                                                <div className="h-px flex-1 bg-white/10"></div>
                                                            </div>
                                                            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                                                                {po.lineItems
                                                                    ?.filter(item => (receivedMap[item.productId] || 0) >= item.quantity)
                                                                    .sort((a, b) => {
                                                                        // Sort by job timestamp (newest first)
                                                                        const timeA = jobTimestampMap[a.productId || ''] || '';
                                                                        const timeB = jobTimestampMap[b.productId || ''] || '';
                                                                        return timeB.localeCompare(timeA);
                                                                    })
                                                                    .slice(0, 50) // Limit to 50 most recent items
                                                                    .map((item, idx) => {
                                                                        const receivedQty = receivedMap[item.productId] || 0;
                                                                        const product = products.find(p => p.id === item.productId);

                                                                        return (
                                                                            <div
                                                                                key={item.productId || idx}
                                                                                className="flex items-center justify-between p-4 rounded-xl border bg-green-500/5 border-green-500/10"
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-bold text-gray-300 line-through decoration-green-500/50">{item.productName}</p>
                                                                                        <CheckCircle size={16} className="text-green-400" />
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-500 font-mono mt-1">
                                                                                        SKU: {jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'N/A'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            // Use jobSkuMap first (matches Putaway job), then fallbacks
                                                                                            const sku = jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'UNKNOWN';
                                                                                            setReprintItem({ sku, name: item.productName, qty: receivedQty });
                                                                                        }}
                                                                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold border border-white/10 flex items-center gap-1"
                                                                                        title="Reprint labels for this item"
                                                                                    >
                                                                                        <Printer size={12} /> Reprint
                                                                                    </button>
                                                                                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20">
                                                                                        Completed ({receivedQty})
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* PO Completion Action */}
                                                {
                                                    allItemsReceived && (
                                                        <div className="p-4 bg-green-500/5 border-t border-green-500/20">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-green-400">
                                                                    <CheckCircle size={20} />
                                                                    <span className="font-bold">All products received!</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setReviewPO(po);
                                                                        setShowReviewModal(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-sm hover:bg-green-600 transition-colors"
                                                                >
                                                                    Review & Complete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Recently Received POs */}
                            {orders.filter(o => o.status === 'Received').length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold text-gray-400 mb-3">Recently Completed</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {orders.filter(o => o.status === 'Received').slice(0, 6).map(po => (
                                            <div key={po.id} className="bg-white/5 border border-green-500/20 rounded-xl p-4">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle size={16} className="text-green-400" />
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{po.supplierName}</p>
                                                        <p className="text-xs text-gray-400">{po.po_number || po.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Receiving Modal - Opens when clicking Receive on a product */}
                        {focusedItem && receivingPO && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                                    {!showPrintSuccess ? (
                                        <>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Receive Product</h3>
                                                    <p className="text-gray-400 text-sm mt-1">{focusedItem.productName}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setFocusedItem(null); setReceivingPO(null); }}
                                                    className="text-gray-400 hover:text-white"
                                                    aria-label="Close"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Quantity */}
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-2">Quantity to Receive</label>
                                                    <input
                                                        type="number"
                                                        value={focusedItem.receivedQty}
                                                        onChange={(e) => setFocusedItem({
                                                            ...focusedItem,
                                                            receivedQty: parseInt(e.target.value) || 0
                                                        })}
                                                        className="w-full bg-black border border-white/20 rounded-xl p-4 text-3xl text-center text-white font-bold focus:border-cyber-primary focus:outline-none"
                                                        aria-label="Quantity to receive"
                                                    />
                                                </div>

                                                {/* SKU Assignments */}
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="text-sm font-bold text-gray-300">
                                                            SKU Assignment
                                                        </label>
                                                        {(() => {
                                                            const product = products.find(p => p.id === focusedItem.productId);
                                                            const isExisting = product?.sku === scannedSkus[focusedItem.productId] && product?.sku !== 'MISC';
                                                            return isExisting ? (
                                                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                                                                    <CheckCircle size={10} /> EXISTING
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
                                                                    <RefreshCw size={10} /> NEW / GENERATED
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>

                                                    {/* Option 1: Scan/Enter Supplier SKU */}
                                                    <div className="mb-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Scan size={14} className="text-gray-400" />
                                                            <span className="text-xs text-gray-400">Option 1: Use Supplier SKU</span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={scannedSkus[focusedItem.productId] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.trim().toUpperCase();
                                                                    setScannedSkus(prev => ({
                                                                        ...prev,
                                                                        [focusedItem.productId]: val
                                                                    }));
                                                                    // Mark as "keep" when manually entering
                                                                    setSkuDecisions(prev => ({
                                                                        ...prev,
                                                                        [focusedItem.productId]: 'keep'
                                                                    }));
                                                                }}
                                                                className={`w-full bg-black border rounded-xl p-3 pr-10 text-white font-mono font-bold focus:outline-none ${scannedSkus[focusedItem.productId] ? 'border-cyber-primary' : 'border-white/20'
                                                                    }`}
                                                                placeholder="Scan or enter supplier barcode..."
                                                            />
                                                            {scannedSkus[focusedItem.productId] && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                                                                    <CheckCircle size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="flex items-center gap-2 my-3">
                                                        <div className="h-px flex-1 bg-white/10"></div>
                                                        <span className="text-[10px] text-gray-500 uppercase">or</span>
                                                        <div className="h-px flex-1 bg-white/10"></div>
                                                    </div>

                                                    {/* Option 2: Generate Our Own */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <RefreshCw size={14} className="text-gray-400" />
                                                            <span className="text-xs text-gray-400">Option 2: Generate Our Own</span>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const product = products.find(p => p.id === focusedItem.productId);
                                                                const { generateSKU } = await import('../utils/skuGenerator');
                                                                const newSku = generateSKU(product?.category || 'General', allProducts);
                                                                setScannedSkus(prev => ({
                                                                    ...prev,
                                                                    [focusedItem.productId]: newSku
                                                                }));
                                                                setSkuDecisions(prev => ({
                                                                    ...prev,
                                                                    [focusedItem.productId]: 'generate'
                                                                }));
                                                            }}
                                                            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold"
                                                            title="Generate New SKU"
                                                        >
                                                            <RefreshCw size={16} />
                                                            Auto-Generate SKU
                                                        </button>
                                                    </div>

                                                    <p className="text-[10px] text-gray-500 mt-3">
                                                        The SKU will be assigned to this product and printed on labels.
                                                    </p>
                                                </div>

                                                {/* Label Settings for Immediate Print */}
                                                <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Label Size</label>
                                                        <select
                                                            title="Select Label Size"
                                                            value={labelSize}
                                                            onChange={(e) => setLabelSize(e.target.value as any)}
                                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                                        >
                                                            <option value="Tiny">Tiny (1.25" x 1")</option>
                                                            <option value="Small">Small (2.25" x 1.25")</option>
                                                            <option value="Medium">Medium (3" x 2")</option>
                                                            <option value="Large">Large (4" x 3")</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Format</label>
                                                        <select
                                                            title="Select Label Format"
                                                            value={labelFormat}
                                                            onChange={(e) => setLabelFormat(e.target.value as any)}
                                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                                        >
                                                            <option value="QR">QR Code</option>
                                                            <option value="Barcode">Barcode</option>
                                                            {(labelSize === 'Medium' || labelSize === 'Large') && <option value="Both">Both</option>}
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
                                                                }
                                                            } finally {
                                                                setIsReceiving(false);
                                                            }
                                                        }}
                                                        className={`flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl transition-colors flex flex-col items-center justify-center leading-none ${isReceiving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'}`}
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
                                            </div>
                                        </>
                                    ) : (
                                        /* Success Screen */
                                        <div className="text-center py-4">
                                            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                                            <h3 className="text-xl font-bold text-white mb-2">Received Successfully!</h3>
                                            <p className="text-gray-400 text-sm mb-6">{focusedItem.receivedQty} x {focusedItem.productName}</p>

                                            <div className="flex gap-3">
                                                <button
                                                    disabled={isPrinting}
                                                    onClick={async () => {
                                                        if (isPrinting) return;
                                                        setIsPrinting(true);
                                                        try {
                                                            const labelsToPrint: Array<{ value: string; label: string; quantity: number }> = [];
                                                            const product = products.find(p => p.id === focusedItem.productId);
                                                            const finalSku = finalizedSkus[focusedItem.productId] || scannedSkus[focusedItem.productId] || product?.sku || 'UNKNOWN';

                                                            // Use quantity for proper "1 of 50" numbering
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
                                                    className={`flex-1 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2 ${isPrinting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`}
                                                >
                                                    {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                                                    {isPrinting ? 'Generating...' : 'Print Labels'}
                                                </button>

                                                <button
                                                    onClick={async () => {
                                                        // Check if this completes the PO
                                                        if (receivingPO && focusedItem) {
                                                            // Calculate new total including this transaction (use local calculation as state might lag)
                                                            const currentReceived = receivedQuantities[focusedItem.productId] || 0;
                                                            const newTotal = currentReceived + focusedItem.receivedQty;

                                                            // Simulate new state
                                                            const updatedReceivedMap = { ...receivedQuantities, [focusedItem.productId]: newTotal };

                                                            // Check if ALL items are now received
                                                            const isComplete = receivingPO.lineItems.every(item => {
                                                                const rec = updatedReceivedMap[item.productId] || 0;
                                                                return rec >= item.quantity;
                                                            });

                                                            if (isComplete) {
                                                                // Open Review Modal instead of completing immediately
                                                                setReviewPO(receivingPO);
                                                                setShowReviewModal(true);
                                                            }
                                                        }

                                                        setFocusedItem(null);
                                                        setReceivingPO(null);
                                                        setShowPrintSuccess(false);
                                                    }}
                                                    className="flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reprint Options Modal */}
                        {reprintItem && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
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
                                            {(['Tiny', 'Small', 'Medium', 'Large'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setReprintSize(s)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${reprintSize === s
                                                        ? 'bg-cyber-primary text-black'
                                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {reprintSize === 'Tiny' && '1.25" × 1" - SKU Tags'}
                                            {reprintSize === 'Small' && '2.25" × 1.25" - Multipurpose'}
                                            {reprintSize === 'Medium' && '3" × 2" - Shelf Labels'}
                                            {reprintSize === 'Large' && '4" × 3" - Carton Tags'}
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
                                            onClick={() => setReprintItem(null)}
                                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isPrinting}
                                            onClick={handleReprintLabels}
                                            className={`flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 ${isPrinting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'}`}
                                        >
                                            {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                                            {isPrinting ? 'Generating...' : `Print ${reprintItem.qty} Labels`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Review & Complete Modal */}
                        {showReviewModal && reviewPO && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
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
                                                {(labelSize === 'Medium' || labelSize === 'Large') && (
                                                    <option value="Both">Both</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                                        {reviewPO.lineItems?.map((item, idx) => {
                                            const receivedQty = receivedQuantities[item.productId] || 0;
                                            if (receivedQty === 0) return null;

                                            const product = products.find(p => p.id === item.productId);
                                            const sku = finalizedSkus[item.productId] || product?.sku || 'PENDING';

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
                                            className={`px-6 py-3 bg-green-600/20 text-green-400 border border-green-500/30 font-bold rounded-xl transition-colors flex items-center gap-2 ${isCompleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600/30'}`}
                                        >
                                            {isCompleting ? <RefreshCw size={18} className="animate-spin" /> : null}
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
                                            className={`flex-1 px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isCompleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent'}`}
                                        >
                                            {isCompleting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                                            {isCompleting ? t('warehouse.processing') : t('warehouse.completeAndPrintLabels')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- PICK TAB --- */}
                {activeTab === 'PICK' && (
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
                                <p className="text-gray-500 text-sm mt-1">Select a job to start picking items</p>
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

                        {/* Job Cards Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredJobs.filter(j =>
                                j.type === 'PICK' &&
                                j.status !== 'Completed' &&
                                (!j.assignedTo || j.assignedTo === user?.name || ['admin', 'manager', 'super_admin'].includes(user?.role || ''))
                            ).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredJobs.filter(j =>
                                        j.type === 'PICK' &&
                                        j.status !== 'Completed' &&
                                        (!j.assignedTo || j.assignedTo === user?.name || ['admin', 'manager', 'super_admin'].includes(user?.role || ''))
                                    ).map(job => {
                                        const lineItems = job.lineItems || (job as any).line_items || [];
                                        const totalItems = lineItems.length;
                                        const pickedItems = lineItems.filter((i: any) => i.status === 'Picked').length;
                                        const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;

                                        return (
                                            <div
                                                key={job.id}
                                                onClick={() => handleStartJob(job)}
                                                className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-cyber-primary/10 ${job.status === 'In-Progress'
                                                    ? 'border-blue-500/50 shadow-lg shadow-blue-500/20'
                                                    : 'border-white/10 hover:border-cyber-primary/50'
                                                    }`}
                                            >
                                                {/* Priority Ribbon */}
                                                {job.priority === 'Critical' && (
                                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">
                                                        URGENT
                                                    </div>
                                                )}

                                                <div className="p-5">
                                                    {/* Job Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <p className="text-cyber-primary font-mono font-bold text-sm">
                                                                {formatJobId(job)}
                                                            </p>
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                {job.orderRef?.startsWith('TRF') ? 'Transfer Pick' : 'Order Pick'}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${job.status === 'In-Progress'
                                                            ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                                                            : job.priority === 'High'
                                                                ? 'bg-orange-500/20 text-orange-400'
                                                                : 'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {job.status === 'In-Progress' ? '● ACTIVE' : job.priority}
                                                        </span>
                                                    </div>

                                                    {/* Items Preview */}
                                                    <div className="flex gap-2 mb-4">
                                                        {lineItems.slice(0, 4).map((item: any, idx: number) => (
                                                            <div key={idx} className="w-10 h-10 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                {item.image ? (
                                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
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
                                                                className="h-full bg-gradient-to-r from-cyber-primary to-blue-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between">
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
                                                        <button className="px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary text-cyber-primary hover:text-black text-xs font-bold rounded-lg transition-all duration-300 group-hover:px-5">
                                                            {job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="flex-1 flex flex-col items-center justify-center py-20">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6 border border-white/5">
                                        <Package size={32} className="text-gray-600" />
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-2">No Pick Jobs Available</h4>
                                    <p className="text-gray-500 text-sm text-center max-w-sm">
                                        Pick jobs are created automatically when orders are placed or transfers are approved.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Completed Jobs Section (Collapsed) */}
                        {filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Completed').length > 0 && (
                            <div className="border-t border-white/5 pt-4">
                                <details className="group">
                                    <summary className="flex items-center justify-between cursor-pointer text-gray-400 hover:text-white transition-colors">
                                        <span className="text-sm font-medium">
                                            {t('warehouse.completedToday')} ({filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Completed').length})
                                        </span>
                                        <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                                    </summary>
                                    <div className="mt-3 space-y-2">
                                        {filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Completed').slice(0, 5).map(job => (
                                            <div key={job.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-3 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    <span className="text-sm text-gray-400 font-mono">{formatJobId(job)}</span>
                                                </div>
                                                <span className="text-xs text-gray-600">{job.items} items</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )}
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
                                            <h2 className="text-xl font-bold text-white">Packing Station</h2>
                                            <p className="text-sm text-gray-400">Pack orders for delivery</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div
                                            onClick={() => setPackJobFilter(packJobFilter === 'pending' ? 'all' : 'pending')}
                                            className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${packJobFilter === 'pending'
                                                ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                                                : 'bg-black/20 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <p className={`text-xs font-bold uppercase ${packJobFilter === 'pending' ? 'text-yellow-400' : 'text-gray-500'}`}>Pending</p>
                                            <p className={`text-xl font-mono font-bold ${packJobFilter === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
                                                {filteredJobs.filter(j => j.type === 'PACK' && j.status === 'Pending').length}
                                            </p>
                                        </div>
                                        <div
                                            onClick={() => setPackJobFilter(packJobFilter === 'in-progress' ? 'all' : 'in-progress')}
                                            className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${packJobFilter === 'in-progress'
                                                ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                : 'bg-black/20 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <p className={`text-xs font-bold uppercase ${packJobFilter === 'in-progress' ? 'text-blue-400' : 'text-gray-500'}`}>In Progress</p>
                                            <p className={`text-xl font-mono font-bold ${packJobFilter === 'in-progress' ? 'text-blue-400' : 'text-blue-400'}`}>
                                                {filteredJobs.filter(j => j.type === 'PACK' && j.status === 'In-Progress').length}
                                            </p>
                                        </div>
                                        <div
                                            onClick={() => setPackJobFilter(packJobFilter === 'completed' ? 'all' : 'completed')}
                                            className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${packJobFilter === 'completed'
                                                ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                                : 'bg-black/20 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <p className={`text-xs font-bold uppercase ${packJobFilter === 'completed' ? 'text-green-400' : 'text-gray-500'}`}>Done Today</p>
                                            <p className="text-xl font-mono font-bold text-green-400">
                                                {filteredJobs.filter(j => j.type === 'PACK' && j.status === 'Completed').length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                {(() => {
                                    const packJobs = filteredJobs.filter(j => {
                                        if (j.type !== 'PACK') return false;
                                        if (packJobFilter === 'all') return true;
                                        if (packJobFilter === 'pending') return j.status === 'Pending';
                                        if (packJobFilter === 'in-progress') return j.status === 'In-Progress';
                                        if (packJobFilter === 'completed') return j.status === 'Completed';
                                        return true;
                                    })
                                        .sort((a, b) => {
                                            const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                                            return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
                                        });

                                    // If a job is selected, show the Active Packing Station View
                                    if (selectedPackJob) {
                                        const currentPackJob = packJobs.find(j => j.id === selectedPackJob);

                                        if (!currentPackJob) {
                                            setSelectedPackJob(null); // Reset if invalid
                                            return null;
                                        }

                                        // Calculate estimated weight
                                        const estimatedWeight = currentPackJob.lineItems.reduce((sum, item) => {
                                            // Rough estimate: 0.5kg per item
                                            return sum + (item.expectedQty * 0.5);
                                        }, 0);

                                        // Validation Helpers
                                        const hasColdItems = currentPackJob.lineItems.some(item => {
                                            const product = filteredProducts.find(p => p.id === item.productId);
                                            return product?.category === 'Frozen' || product?.category === 'Dairy';
                                        });
                                        const hasFragileItems = currentPackJob.lineItems.some(item => {
                                            const product = filteredProducts.find(p => p.id === item.productId);
                                            return product && ['Electronics', 'Glass', 'Beverages'].some(cat => product.category.includes(cat));
                                        });
                                        const hasChemicals = currentPackJob.lineItems.some(item => {
                                            const product = filteredProducts.find(p => p.id === item.productId);
                                            return product?.category === 'Cleaning' || product?.category === 'Household';
                                        });

                                        const packedCount = currentPackJob.lineItems.filter(i => i.status === 'Picked' || i.status === 'Completed').length;
                                        const totalItems = currentPackJob.lineItems.length;
                                        const progress = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

                                        return (
                                            <div className="h-full flex flex-col lg:flex-row gap-6">
                                                {/* Left Column: Job Details & Items */}
                                                <div className="flex-1 flex flex-col bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                                                    {/* Header Toolbar */}
                                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setSelectedPackJob(null)}
                                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                            >
                                                                <ArrowLeft size={20} />
                                                            </button>
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">{formatJobId(currentPackJob)}</h3>
                                                                <p className="text-xs text-gray-400">Order Ref: {formatOrderRef(currentPackJob.orderRef, currentPackJob.id)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 font-bold uppercase mr-2">Pack Mode:</span>
                                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                                <button
                                                                    onClick={() => setPackScanMode(false)}
                                                                    className={`px-3 py-1 text-xs rounded font-bold transition-colors ${!packScanMode ? 'bg-white/20 text-white' : 'text-gray-500'}`}
                                                                >
                                                                    Manual
                                                                </button>
                                                                <button
                                                                    onClick={() => setPackScanMode(true)}
                                                                    className={`px-3 py-1 text-xs rounded font-bold transition-colors ${packScanMode ? 'bg-cyber-primary text-black' : 'text-gray-500'}`}
                                                                >
                                                                    Scanner
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Scanner Input */}
                                                    {packScanMode && (
                                                        <div className="p-4 border-b border-white/5 bg-black/10">
                                                            <form
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    if (!packScanInput.trim()) return;

                                                                    // Scan logic
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
                                                                }}
                                                                className="relative"
                                                            >
                                                                <Scan size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                                <input
                                                                    type="text"
                                                                    value={packScanInput}
                                                                    onChange={(e) => setPackScanInput(e.target.value)}
                                                                    placeholder="Scan item SKU or barcode..."
                                                                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyber-primary transition-colors"
                                                                    autoFocus
                                                                />
                                                            </form>
                                                        </div>
                                                    )}

                                                    {/* Items List */}
                                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                                        {hasColdItems && (
                                                            <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl flex gap-3 mb-4">
                                                                <Snowflake size={18} className="text-blue-400 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-sm font-bold text-blue-400">Cold Chain Required</p>
                                                                    <p className="text-xs text-blue-200/70">Use insulated bags and include ice packs.</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {currentPackJob.lineItems.map((item, i) => {
                                                            const product = filteredProducts.find(p => p.id === item.productId);
                                                            const isPacked = item.status === 'Picked' || item.status === 'Completed';

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => {
                                                                        if (!packScanMode) { // Only allow click toggle in manual mode
                                                                            // Toggle status
                                                                            const newStatus = isPacked ? 'Pending' : 'Picked';
                                                                            updateJobItem(currentPackJob.id, i, newStatus, item.expectedQty);
                                                                        }
                                                                    }}
                                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isPacked ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                                        }`}
                                                                >
                                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isPacked ? 'bg-green-500 border-green-500' : 'border-gray-600'
                                                                        }`}>
                                                                        {isPacked && <CheckCircle size={14} className="text-black" />}
                                                                    </div>

                                                                    {product?.image ? (
                                                                        <img src={product.image} alt="" className="w-12 h-12 rounded bg-black object-cover" />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded bg-black flex items-center justify-center">
                                                                            <Package size={20} className="text-gray-600" />
                                                                        </div>
                                                                    )}

                                                                    <div className="flex-1">
                                                                        <p className={`font-medium ${isPacked ? 'text-gray-400 line-through' : 'text-white'}`}>{item.name}</p>
                                                                        <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                                                                            <span>Qty: {item.expectedQty}</span>
                                                                            <span>•</span>
                                                                            <span>SKU: {product?.sku || 'N/A'}</span>
                                                                        </div>
                                                                    </div>

                                                                    {(product?.category === 'Frozen' || product?.category === 'Dairy') && (
                                                                        <Snowflake size={16} className="text-blue-400" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Right Column: Packing Checklist & Actions */}
                                                <div className="w-full lg:w-80 flex flex-col gap-6">
                                                    {/* Progress Card */}
                                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5">
                                                        <div className="flex justify-between items-end mb-2">
                                                            <span className="text-sm text-gray-400">Progress</span>
                                                            <span className="text-xl font-mono font-bold text-white">{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyber-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2 text-center">{packedCount} of {totalItems} items packed</p>
                                                    </div>

                                                    {/* Packaging Settings */}
                                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 space-y-4">
                                                        <div>
                                                            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Box Configuration</label>
                                                            <select
                                                                value={boxSize}
                                                                onChange={(e) => setBoxSize(e.target.value as any)}
                                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-cyber-primary"
                                                            >
                                                                <option value="Small">Small (10x10x10)</option>
                                                                <option value="Medium">Medium (20x20x20)</option>
                                                                <option value="Large">Large (30x30x30)</option>
                                                                <option value="Extra Large">XL (40x40x40)</option>
                                                            </select>
                                                        </div>

                                                        {/* Packing Materials Checklist */}
                                                        {hasFragileItems && (
                                                            <div className="pt-2 border-t border-white/5">
                                                                <p className="text-xs text-red-400 font-bold uppercase mb-2 flex items-center gap-1">
                                                                    <AlertTriangle size={10} /> Fragile Items
                                                                </p>
                                                                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                                    <input type="checkbox" checked={packingMaterials.bubbleWrap} onChange={e => setPackingMaterials({ ...packingMaterials, bubbleWrap: e.target.checked })} className="accent-cyber-primary" />
                                                                    <span className="text-sm text-gray-300">Bubble Wrap</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={packingMaterials.fragileStickers} onChange={e => setPackingMaterials({ ...packingMaterials, fragileStickers: e.target.checked })} className="accent-cyber-primary" />
                                                                    <span className="text-sm text-gray-300">"Fragile" Stickers</span>
                                                                </label>
                                                            </div>
                                                        )}

                                                        {hasColdItems && (
                                                            <div className="pt-2 border-t border-white/5">
                                                                <p className="text-xs text-blue-400 font-bold uppercase mb-2 flex items-center gap-1">
                                                                    <Snowflake size={10} /> Cold Items
                                                                </p>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={hasIcePack} onChange={e => setHasIcePack(e.target.checked)} className="accent-cyber-primary" />
                                                                    <span className="text-sm text-gray-300">Ice Packs Added</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Completion Actions */}
                                                    <div className="mt-auto">
                                                        <div className="mb-4">
                                                            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Label Format</label>
                                                            <div className="flex bg-black/30 rounded-lg p-1">
                                                                <button onClick={() => setLabelFormat('BARCODE')} className={`flex-1 py-1.5 text-xs rounded font-bold ${labelFormat === 'BARCODE' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Barcode</button>
                                                                <button onClick={() => setLabelFormat('QR')} className={`flex-1 py-1.5 text-xs rounded font-bold ${labelFormat === 'QR' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>QR Code</button>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={async () => {
                                                                if (loadingActions[currentPackJob.id]) return;

                                                                if (packedCount < totalItems) {
                                                                    addNotification('alert', 'Please pack all items before completing.');
                                                                    return;
                                                                }
                                                                if (hasColdItems && !hasIcePack) {
                                                                    addNotification('alert', 'Cold items require ice packs!');
                                                                    return;
                                                                }

                                                                setLoadingActions(prev => ({ ...prev, [currentPackJob.id]: true }));
                                                                try {
                                                                    console.log('Generating pack label for job:', currentPackJob.id);

                                                                    // Determine if any items need cold chain
                                                                    const needsColdChain = hasColdItems;

                                                                    // Build rich pack label data
                                                                    const packLabelData: PackLabelData = {
                                                                        orderRef: currentPackJob.orderRef || currentPackJob.id,
                                                                        itemCount: totalItems,
                                                                        packDate: new Date().toLocaleDateString(),
                                                                        packerName: user?.name,
                                                                        specialHandling: {
                                                                            coldChain: needsColdChain,
                                                                            fragile: packingMaterials.bubbleWrap || packingMaterials.fragileStickers,
                                                                            perishable: hasColdItems
                                                                        },
                                                                        // If we have destination site info
                                                                        destSiteName: currentPackJob.destSiteId
                                                                            ? sites.find(s => s.id === currentPackJob.destSiteId)?.name
                                                                            : undefined
                                                                    };

                                                                    const html = await generatePackLabelHTML(packLabelData, {
                                                                        size: reprintSize, // Use the reprint size setting
                                                                        format: reprintFormat // Use the reprint format setting
                                                                    });

                                                                    // Print Label
                                                                    const printWindow = window.open('', '_blank');
                                                                    if (printWindow) {
                                                                        printWindow.document.write(html);
                                                                        setTimeout(() => {
                                                                            printWindow.document.close();
                                                                            printWindow.print();
                                                                        }, 500);
                                                                    } else {
                                                                        addNotification('alert', 'Popup blocked. Allow popups to print label.');
                                                                    }

                                                                    // Call Complete Job with validation skip (we already validated locally)
                                                                    console.log('Completing job:', currentPackJob.id);
                                                                    await completeJob(currentPackJob.id, user?.name || 'Packer', true);
                                                                    addNotification('success', 'Order Packed & Label Generated!');
                                                                    setSelectedPackJob(null);
                                                                    // packedItems set removed, no need to clear
                                                                } catch (err: any) {
                                                                    console.error('Pack completion failed:', err);
                                                                    addNotification('alert', `Failed to complete packing: ${err?.message || 'Unknown error'}`);
                                                                } finally {
                                                                    setLoadingActions(prev => ({ ...prev, [currentPackJob.id]: false }));
                                                                }
                                                            }}
                                                            disabled={packedCount < totalItems || loadingActions[currentPackJob.id]}
                                                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${packedCount === totalItems && !loadingActions[currentPackJob.id]
                                                                ? 'bg-cyber-primary text-black hover:bg-cyber-accent shadow-cyber-primary/20'
                                                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {loadingActions[currentPackJob.id] ? (
                                                                <>
                                                                    <RefreshCw size={18} className="animate-spin" />
                                                                    Completing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Printer size={18} />
                                                                    Print & Complete
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Default View: JOB GRID (Flat Matte)
                                    if (packJobs.length === 0) {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center text-center">
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <CheckCircle size={40} className="text-gray-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">All Caught Up</h3>
                                                <p className="text-gray-400">No active packing jobs found.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                                            {packJobs.map(job => {
                                                const totalItems = job.lineItems?.length || 0;
                                                const destSite = sites.find(s => s.id === job.destSiteId);

                                                return (
                                                    <div
                                                        key={job.id}
                                                        className="bg-cyber-gray border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all flex flex-col"
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <span className="text-white font-mono font-bold text-lg">{formatJobId(job)}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                                        job.priority === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                                        }`}>
                                                                        {job.priority}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Route */}
                                                        {destSite && (
                                                            <div className="mb-4 p-3 bg-black/20 rounded-lg">
                                                                <p className="text-xs text-gray-400 mb-1">Destination</p>
                                                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                                    <MapPin size={14} className="text-cyber-primary" />
                                                                    {destSite.name}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="mt-auto">
                                                            <div className="flex justify-between text-xs text-gray-400 mb-3 border-t border-white/5 pt-3">
                                                                <span>Items: {totalItems}</span>
                                                                <span>Ref: {formatOrderRef(job.orderRef, job.id)}</span>
                                                            </div>
                                                            {job.status === 'Completed' ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Build rich pack label data
                                                                        setPackReprintJob({
                                                                            id: job.id,
                                                                            orderRef: job.orderRef || job.id,
                                                                            itemCount: totalItems,
                                                                            destSiteName: destSite?.name
                                                                        });
                                                                    }}
                                                                    className="w-full py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-green-500/20"
                                                                >
                                                                    <Printer size={16} /> Reprint Label
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPackJob(job.id);
                                                                    }}
                                                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5"
                                                                >
                                                                    Start Packing <ArrowRight size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )
                }

                {/* --- ASSIGN TAB (Job Assignment Center) --- */}
                {
                    activeTab === 'ASSIGN' && canAccessTab('ASSIGN') && (
                        <div className="flex-1 overflow-y-auto space-y-6">
                            {/* JOB ASSIGNMENT CENTER */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <ClipboardList className="text-cyber-primary" /> Job Assignments
                                </h3>

                                {/* Filters */}
                                <div className="mb-4 space-y-3">
                                    <div className="flex flex-wrap gap-3">
                                        {/* Job Type Filter */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-bold">Type:</span>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                {['ALL', 'PICK', 'PACK', 'PUTAWAY'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setAssignJobFilter(type as any)}
                                                        className={`px-3 py-1 text-xs rounded font-bold transition-colors ${assignJobFilter === type
                                                            ? 'bg-cyber-primary text-black'
                                                            : 'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Priority Filter */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-bold">Priority:</span>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                {['ALL', 'Critical', 'High', 'Normal'].map(priority => (
                                                    <button
                                                        key={priority}
                                                        onClick={() => setDispatchPriorityFilter(priority as any)}
                                                        className={`px-3 py-1 text-xs rounded font-bold transition-colors ${dispatchPriorityFilter === priority
                                                            ? 'bg-cyber-primary text-black'
                                                            : priority === 'Critical' ? 'text-red-400' :
                                                                priority === 'High' ? 'text-orange-400' :
                                                                    'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {priority}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Search */}
                                        <div className="flex-1 min-w-[200px]">
                                            <input
                                                type="text"
                                                                placeholder={t('warehouse.searchJobsByID')}
                                                value={dispatchSearch}
                                                onChange={(e) => setDispatchSearch(e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-cyber-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                                    {/* Pending Jobs */}
                                    <div className="bg-black/20 rounded-xl border border-white/5 flex flex-col overflow-hidden">
                                        <div className="p-3 border-b border-white/5 bg-white/5 font-bold text-xs text-gray-400 uppercase flex justify-between items-center">
                                            <span>{t('warehouse.pendingJobs')} ({(() => {
                                                let filtered = filteredJobs.filter(j => j.status === 'Pending');
                                                if (assignJobFilter !== 'ALL') filtered = filtered.filter(j => j.type === assignJobFilter);
                                                if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority === dispatchPriorityFilter);
                                                if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));
                                                return filtered.length;
                                            })()})</span>
                                            {!selectedJob && filteredJobs.filter(j => j.status === 'Pending').length > 0 && (
                                                <span className="text-[10px] text-blue-400 normal-case font-normal">← {t('warehouse.selectJobToAssign')}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                            {(() => {
                                                let filtered = filteredJobs.filter(j => j.status === 'Pending');
                                                if (assignJobFilter !== 'ALL') filtered = filtered.filter(j => j.type === assignJobFilter);
                                                if (dispatchPriorityFilter !== 'ALL') filtered = filtered.filter(j => j.priority === dispatchPriorityFilter);
                                                if (dispatchSearch) filtered = filtered.filter(j => j.id.toLowerCase().includes(dispatchSearch.toLowerCase()));

                                                // Sort by priority: Critical > High > Normal
                                                filtered.sort((a, b) => {
                                                    const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                                                    return priorityOrder[a.priority] - priorityOrder[b.priority];
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
                                                            if (!['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role)) return false;
                                                            if (e.status !== 'Active') return false;
                                                            // Role match
                                                            if (job.type === 'PICK' && e.role !== 'picker' && e.role !== 'dispatcher' && e.role !== 'warehouse_manager') return false;
                                                            if (job.type === 'PACK' && e.role !== 'packer' && e.role !== 'dispatcher' && e.role !== 'warehouse_manager') return false;
                                                            if (job.type === 'PUTAWAY' && e.role !== 'dispatcher' && e.role !== 'warehouse_manager') return false;
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
                                                            onClick={() => setSelectedJob(job)}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedJob?.id === job.id
                                                                ? 'bg-cyber-primary/20 border-cyber-primary'
                                                                : jobZoneLocked
                                                                    ? 'bg-red-500/10 border-red-500/30'
                                                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${job.type === 'PICK' ? 'bg-blue-500/20 text-blue-400' : job.type === 'PACK' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                                            {job.type}
                                                                        </span>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${job.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                                            job.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                                                'bg-blue-500/20 text-blue-400'
                                                                            }`}>
                                                                            {job.priority}
                                                                        </span>
                                                                        {jobZoneLocked && (
                                                                            <span className="text-[10px] text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30" title={t('warehouse.zoneLocked')}>
                                                                                {t('warehouse.zoneLockedLabel')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 font-mono">{formatJobId(job)}</span>
                                                                </div>
                                                                {bestMatchEmployee && bestMatchEmployee.workload < 3 && !jobZoneLocked && (
                                                                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30" title={`${t('warehouse.suggested')}: ${bestMatchEmployee.employee.name}`}>
                                                                        💡 {t('warehouse.match')}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="space-y-1 text-xs">
                                                                <div className="flex justify-between text-gray-300">
                                                                    <span>{job.items} {t('warehouse.itemsLabel')}</span>
                                                                    <span className="text-gray-500">~{estimatedDuration} {t('warehouse.minutes')}</span>
                                                                </div>

                                                                {/* Store Information */}
                                                                {(job.sourceSiteId || job.destSiteId) && (
                                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-1 border-t border-white/5">
                                                                        {job.sourceSiteId && (
                                                                            <span>
                                                                                <span className="text-gray-500">{t('warehouse.from')}:</span> <span className="text-blue-400">{sites.find(s => s.id === job.sourceSiteId)?.name || job.sourceSiteId}</span>
                                                                            </span>
                                                                        )}
                                                                        {job.destSiteId && (
                                                                            <span>
                                                                                <span className="text-gray-500">{t('warehouse.to')}:</span> <span className="text-green-400">{sites.find(s => s.id === job.destSiteId)?.name || job.destSiteId}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
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
                                    <div className="bg-black/20 rounded-xl border border-white/5 flex flex-col overflow-hidden">
                                        <div className="p-3 border-b border-white/5 bg-white/5 font-bold text-xs text-gray-400 uppercase flex justify-between items-center">
                                            <span>{t('warehouse.availableStaff')} ({(() => {
                                                let filtered = filteredEmployees.filter(e =>
                                                    ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) &&
                                                    e.status === 'Active'
                                                );
                                                if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role === dispatchEmployeeFilter);
                                                return filtered.length;
                                            })()})</span>
                                            <div className="flex bg-white/5 rounded p-0.5">
                                                {['ALL', 'picker', 'packer', 'dispatcher'].map(role => (
                                                    <button
                                                        key={role}
                                                        onClick={() => setDispatchEmployeeFilter(role as any)}
                                                        className={`px-2 py-0.5 text-[10px] rounded font-bold transition-colors ${dispatchEmployeeFilter === role
                                                            ? 'bg-cyber-primary text-black'
                                                            : 'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {role === 'ALL' ? 'ALL' : role.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                            {(() => {
                                                let filtered = filteredEmployees.filter(e =>
                                                    ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) &&
                                                    e.status === 'Active'
                                                );
                                                if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role === dispatchEmployeeFilter);

                                                // Check if selected job matches employee role
                                                const getRoleMatch = (employee: any, job: WMSJob | null) => {
                                                    if (!job) return false;
                                                    if (job.type === 'PICK' && (employee.role === 'picker' || employee.role === 'dispatcher' || employee.role === 'warehouse_manager')) return true;
                                                    if (job.type === 'PACK' && (employee.role === 'packer' || employee.role === 'dispatcher' || employee.role === 'warehouse_manager')) return true;
                                                    if (job.type === 'PUTAWAY' && (employee.role === 'dispatcher' || employee.role === 'warehouse_manager')) return true;
                                                    return false;
                                                };

                                                // Sort by: role match first, then by workload
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

                                                return filtered.map((employee) => {
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
                                                        <div key={employee.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${roleMatch && selectedJob
                                                            ? 'bg-blue-500/10 border-blue-500/50'
                                                            : 'bg-white/5 border-white/5'
                                                            }`}>
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-primary to-cyber-accent flex items-center justify-center text-xs font-bold text-black">
                                                                    {employee.name.charAt(0)}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm text-gray-300 font-medium">{employee.name}</div>
                                                                        {roleMatch && selectedJob && (
                                                                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                                                                                ✓ {t('warehouse.match')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[10px] text-gray-500 uppercase">{employee.role}</span>
                                                                        {workloadCount > 0 && (
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isOverloaded
                                                                                ? 'bg-red-500/20 text-red-400'
                                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                                                }`}>
                                                                                {workloadCount} {t('warehouse.active')}
                                                                            </span>
                                                                        )}
                                                                        {totalEstimatedTime > 0 && (
                                                                            <span className="text-[10px] text-gray-500">
                                                                                ~{totalEstimatedTime}min
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Protected permission="ASSIGN_TASKS">
                                                                <button
                                                                    disabled={!selectedJob || isOverloaded || (selectedJob && isZoneLocked(selectedJob.location || '')) || (selectedJob && loadingActions[`assign_${selectedJob.id}_${employee.id}`])}
                                                                    onClick={async () => {
                                                                        if (selectedJob) {
                                                                            const actionKey = `assign_${selectedJob.id}_${employee.id}`;
                                                                            if (loadingActions[actionKey]) return;

                                                                            // Check if zone is locked before assigning
                                                                            if (isZoneLocked(selectedJob.location || '')) {
                                                                                addNotification('alert', `Cannot assign job: Zone is locked for maintenance.`);
                                                                                return;
                                                                            }

                                                                            setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
                                                                            try {
                                                                                await assignJob(selectedJob.id, employee.id);
                                                                                addNotification('success', `Job assigned to ${employee.name}`);
                                                                                setSelectedJob(null);
                                                                            } catch (e) {
                                                                                console.error('Assign error:', e);
                                                                            } finally {
                                                                                setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${selectedJob && !isOverloaded && !(selectedJob && isZoneLocked(selectedJob.location || ''))
                                                                        ? roleMatch
                                                                            ? 'bg-cyber-primary text-black hover:bg-cyber-accent'
                                                                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50'
                                                                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                                        }`}
                                                                    title={
                                                                        isOverloaded
                                                                            ? 'Employee has max workload (3 jobs)'
                                                                            : !selectedJob
                                                                                ? t('warehouse.selectJobFirst')
                                                                                : selectedJob && isZoneLocked(selectedJob.location || '')
                                                                                    ? '⚠️ Cannot assign: Zone is locked for maintenance'
                                                                                    : !roleMatch
                                                                                        ? `⚠️ Role mismatch: ${selectedJob.type} jobs typically go to ${selectedJob.type === 'PICK' ? 'picker' : selectedJob.type === 'PACK' ? 'packer' : 'dispatcher'}. Click to assign anyway.`
                                                                                        : 'Assign job to this employee (role match)'
                                                                    }
                                                                >
                                                                    {selectedJob && loadingActions[`assign_${selectedJob.id}_${employee.id}`] ? (
                                                                        <>
                                                                            <RefreshCw className="animate-spin" size={10} />
                                                                            Assigning...
                                                                        </>
                                                                    ) : (
                                                                        isOverloaded ? 'Full' : roleMatch ? 'Assign' : 'Assign ⚠️'
                                                                    )}
                                                                </button>
                                                            </Protected>
                                                        </div>
                                                    );
                                                });
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
                                {selectedJob && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                        <div className="bg-cyber-gray border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyber-primary/10 flex flex-col">
                                            {/* Header */}
                                            <div className="p-6 border-b border-white/10 flex justify-between items-start sticky top-0 bg-cyber-gray z-10">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-xl font-bold text-white">Job Details</h2>
                                                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-gray-400">{selectedJob.id}</span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${selectedJob.type === 'TRANSFER' ? 'border-cyber-primary/30 text-cyber-primary bg-cyber-primary/10' : 'border-white/10 text-gray-400'}`}>{selectedJob.type}</span>
                                                        <span>•</span>
                                                        <span className="text-white">{selectedJob.status}</span>
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
                                                            <span className="text-gray-400">Requested By</span>
                                                            <span className="text-white font-bold">{selectedJob.requestedBy || 'System'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Approved By</span>
                                                            <span className="text-white font-bold">{selectedJob.approvedBy || '-'}</span>
                                                        </div>
                                                        <div className="h-px bg-white/5 my-2" />
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Created</span>
                                                            <span className="text-white font-mono">{new Date(selectedJob.orderRef && !selectedJob.orderRef.startsWith('TRF') ? selectedJob.orderRef : (selectedJob.id.startsWith('TRF-') ? parseInt(selectedJob.id.split('-')[1]) : Date.now())).toLocaleDateString()}</span>
                                                        </div>
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
                                                                    <th className="p-3">Product</th>
                                                                    <th className="p-3 text-center">Qty</th>
                                                                    <th className="p-3 text-center">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                                        <td className="p-3">
                                                                            <p className="text-white font-medium">{item.name}</p>
                                                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                                                        </td>
                                                                        <td className="p-3 text-center font-mono text-white font-bold">{item.expectedQty}</td>
                                                                        <td className="p-3 text-center">
                                                                            <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-gray-300">
                                                                                {item.status || 'Pending'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )) : (
                                                                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">No detailed item list available</td></tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Rules */}
                                            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                                                <button
                                                    onClick={() => setSelectedJob(null)}
                                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-colors"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Assigned Jobs Overview */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <ClipboardCheck className="text-green-400" size={20} /> Active Assignments
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                <div key={employee.id} className="bg-black/20 rounded-xl border border-white/5 p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-primary to-cyber-accent flex items-center justify-center text-xs font-bold text-black">
                                                            {employee.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{employee.name}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase">{employee.role}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {employeeJobs.map(job => (
                                                            <div key={job.id} className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${job.type === 'PICK' ? 'bg-blue-500/20 text-blue-400' :
                                                                        job.type === 'PACK' ? 'bg-green-500/20 text-green-400' :
                                                                            'bg-purple-500/20 text-purple-400'
                                                                        }`}>
                                                                        {job.type}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 font-mono">{formatJobId(job)}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-300">{job.items} items</p>
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
                                        <button onClick={() => setLabelMode('PRODUCT')} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${labelMode === 'PRODUCT' ? 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary' : 'border-white/10 text-gray-400'}`}>Product Labels</button>
                                        <button onClick={() => setLabelMode('BIN')} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${labelMode === 'BIN' ? 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary' : 'border-white/10 text-gray-400'}`}>Rack Labels</button>
                                    </div>

                                    {/* Format Selection - Secondary Option */}
                                    <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/5">
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Label Format</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setLabelFormat('BARCODE')}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${labelFormat === 'BARCODE' ? 'bg-white/10 text-white border-white/20' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}
                                            >
                                                📊 Barcode (Default)
                                            </button>
                                            <button
                                                onClick={() => setLabelFormat('QR')}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${labelFormat === 'QR' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}
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
                                                            }`}
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
                                                        binLocations.push(`${zone}-${aisle}-${binStr}`);
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
                                                                            ? '<div style="page-break-after: always;"></div>'
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
                                                            label: `Warehouse Location ${loc}`
                                                        }));

                                                        const barcodeLabelHTML = generateBatchBarcodeLabelsHTML(labels, {
                                                            paperSize: `${sizeConfig.width} ${sizeConfig.height}`,
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
                                                            }`}
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
                                                                `SKU: ${sku}`,
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
                                                            <div class="label-container">
                                                                <div class="product-name" style="font-size: ${parseInt(sizeConfig.fontSize) + 2}px; font-weight: bold; margin-bottom: 5px;">${product?.name || 'Product'}</div>
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
                                                                <!DOCTYPE html>
                                                                <html>
                                                                <head>
                                                                    <title>Product Labels</title>
                                                                    <style>
                                                                        @page { size: auto; margin: 10mm; }
                                                                        body { margin: 0; padding: 10px; font-family: Arial; display: flex; flex-wrap: wrap; gap: 10px; }
                                                                        .label-container {
                                                                            width: ${sizeConfig.width};
                                                                            height: ${sizeConfig.cssHeight};
                                                                            border: 2px solid black;
                                                                            padding: ${sizeConfig.padding};
                                                                            box-sizing: border-box;
                                                                            display: flex;
                                                                            flex-direction: column;
                                                                            justify-content: center;
                                                                            align-items: center;
                                                                            page-break-inside: avoid;
                                                                            background: white;
                                                                            text-align: center;
                                                                        }
                                                                        .no-print { display: block; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
                                        svg { max-width: 100%; height: auto; }
                                        @media print { .no-print { display: none !important; } body { padding: 0; } }
                                    </style>
                                                                </head>
                                                                <body>
                                                                    <div class="no-print">
                                                                        <button onclick="window.print()" style="padding: 12px 40px; background: #00ff9d; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px;">🖨️ Print All Labels (${qty})</button>
                                                                        <button onclick="window.close()" style="padding: 12px 40px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px;">✕ Close</button>
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
                                                    }`}>
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
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* --- PUTAWAY TAB --- */}
                {
                    activeTab === 'PUTAWAY' && (
                        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                            {/* Header with Stats */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Putaway Operations</h3>
                                        <p className="text-xs text-gray-400 mt-1">Store received goods in warehouse locations</p>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{t('warehouse.totalJobs')}</p>
                                        <p className="text-xl font-mono font-bold text-white mt-1">
                                            {filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status !== 'Completed').length}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{t('warehouse.totalItems')}</p>
                                        <p className="text-xl font-mono font-bold text-blue-400 mt-1">
                                            {filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status !== 'Completed').reduce((sum, j) => sum + j.items, 0)}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{t('warehouse.inProgress')}</p>
                                        <p className="text-xl font-mono font-bold text-yellow-400 mt-1">
                                            {filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status === 'In-Progress').length}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{t('warehouse.workersActive')}</p>
                                        <p className="text-xl font-mono font-bold text-green-400 mt-1">
                                            {new Set(filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status === 'In-Progress' && j.assignedTo).map(j => j.assignedTo)).size}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & Controls */}
                            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                        {/* Status Filter */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-gray-400 font-bold hidden md:inline">{t('warehouse.status')}:</span>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                {[{label: t('warehouse.allStatus'), value: 'All'}, {label: t('warehouse.pending'), value: 'Pending'}, {label: t('warehouse.inProgress'), value: 'In-Progress'}].map(status => (
                                                    <button
                                                        key={status.value}
                                                        onClick={() => setPutawayStatusFilter(status.value as any)}
                                                        className={`px-4 py-2 md:px-3 md:py-1 text-sm md:text-xs rounded font-bold transition-colors min-h-[36px] md:min-h-0 ${putawayStatusFilter === status.value
                                                            ? 'bg-cyber-primary text-black'
                                                            : 'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {status.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sort By */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-gray-400 font-bold hidden md:inline">{t('warehouse.sortBy')}</span>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                {[
                                                    { label: t('warehouse.priority'), value: 'priority' },
                                                    { label: t('common.date'), value: 'date' },
                                                    { label: t('warehouse.itemsLabel'), value: 'items' }
                                                ].map(sort => (
                                                    <button
                                                        key={sort.value}
                                                        onClick={() => setPutawaySortBy(sort.value as any)}
                                                        className={`px-4 py-2 md:px-3 md:py-1 text-sm md:text-xs rounded font-bold transition-colors min-h-[36px] md:min-h-0 ${putawaySortBy === sort.value
                                                            ? 'bg-cyber-primary text-black'
                                                            : 'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {sort.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="flex-1 min-w-[200px]">
                                        <input
                                            type="text"
                                            placeholder={t('warehouse.searchByJobID')}
                                            value={putawaySearch}
                                            onChange={(e) => setPutawaySearch(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 md:px-3 md:py-1.5 text-white text-base md:text-xs focus:border-cyber-primary outline-none min-h-[44px] md:min-h-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Jobs Grid */}
                            <div className="flex-1 overflow-y-auto bg-cyber-gray border border-white/5 rounded-2xl p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(() => {
                                        let filtered = filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status !== 'Completed');

                                        // Apply status filter
                                        if (putawayStatusFilter !== 'All') {
                                            filtered = filtered.filter(j => j.status === putawayStatusFilter);
                                        }

                                        // Apply search
                                        if (putawaySearch) {
                                            filtered = filtered.filter(j =>
                                                j.id.toLowerCase().includes(putawaySearch.toLowerCase()) ||
                                                (j.orderRef && orders.find(o => o.id === j.orderRef)?.po_number?.toLowerCase().includes(putawaySearch.toLowerCase()))
                                            );
                                        }

                                        // Apply sorting
                                        filtered.sort((a, b) => {
                                            if (putawaySortBy === 'priority') {
                                                const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                                                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
                                            } else if (putawaySortBy === 'items') {
                                                return b.items - a.items;
                                            } else {
                                                return new Date(b.id).getTime() - new Date(a.id).getTime();
                                            }
                                        });

                                        return filtered.map(job => {
                                            const estimatedDuration = Math.max(20, job.items * 4);
                                            const completedItems = job.lineItems?.filter(item => item.status === 'Completed').length || 0;
                                            const progress = job.lineItems ? (completedItems / job.lineItems.length) * 100 : 0;

                                            return (
                                                <div
                                                    key={job.id}
                                                    className="group relative bg-black/20 hover:bg-black/40 border border-white/5 hover:border-cyber-primary/50 rounded-xl p-4 transition-all duration-300 flex flex-col gap-3"
                                                >
                                                    {/* Header */}
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-bold text-base tracking-wide">{formatJobId(job)}</span>
                                                                {job.priority === 'Critical' && <AlertOctagon size={14} className="text-red-500 animate-pulse" />}
                                                            </div>
                                                            {job.orderRef && (
                                                                <span className="text-[10px] text-gray-500 font-mono mt-0.5">PO: {orders.find(o => o.id === job.orderRef)?.po_number || formatOrderRef(job.orderRef, job.id)}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${job.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                                job.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                                }`}>
                                                                {job.priority}
                                                            </span>
                                                            <span className={`text-[10px] text-gray-400`}>
                                                                {new Date(job.id.split('-')[1] ? parseInt(job.id.split('-')[1]) : Date.now()).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar (if In-Progress) */}
                                                    {job.status === 'In-Progress' && progress > 0 && (
                                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyber-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                                                        </div>
                                                    )}

                                                    {/* Items Preview */}
                                                    <div className="bg-white/5 rounded-lg p-2 space-y-2">
                                                        {job.lineItems?.slice(0, 3).map((item, i) => {
                                                            const product = filteredProducts.find(p => p.id === item.productId);
                                                            const displaySku = item.sku || product?.sku || 'PENDING';

                                                            return (
                                                                <div key={i} className="flex justify-between items-start text-xs">
                                                                    <div className="flex flex-col overflow-hidden mr-2">
                                                                        <span className="text-gray-300 truncate font-medium">{item.name}</span>
                                                                        <span className="text-[10px] text-gray-500 font-mono tracking-wider">{displaySku}</span>
                                                                    </div>
                                                                    <span className="text-cyber-primary font-mono whitespace-nowrap bg-cyber-primary/10 px-1.5 py-0.5 rounded">x{item.expectedQty}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        {(job.lineItems?.length || 0) > 3 && (
                                                            <p className="text-[10px] text-gray-500 text-center pt-1 border-t border-white/5">+{(job.lineItems?.length || 0) - 3} {t('warehouse.moreItems')}</p>
                                                        )}
                                                    </div>

                                                    {/* Footer Info */}
                                                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin size={12} />
                                                                <span>{job.location || 'Receiving'}</span>
                                                            </div>
                                                            {(() => {
                                                                const firstProduct = filteredProducts.find(p => p.id === job.lineItems?.[0]?.productId);
                                                                const tempReq = firstProduct ? getTemperatureRequirement(firstProduct.category) : null;
                                                                if (tempReq) {
                                                                    return (
                                                                        <div className="flex items-center gap-1 text-blue-400">
                                                                            <Snowflake size={12} />
                                                                            <span>{tempReq}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            <span>~{Math.max(20, job.items * 4)}m</span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="mt-auto pt-2">
                                                        {job.assignedTo && job.assignedTo !== user?.name ? (
                                                            <div className="w-full py-2 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center gap-2 text-gray-400 cursor-not-allowed">
                                                                <User size={14} />
                                                                <span className="text-xs">Assigned to {job.assignedTo}</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStartJob(job);
                                                                }}
                                                                className="w-full py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyber-primary/20"
                                                            >
                                                                {job.assignedTo ? <Play size={14} /> : <Plus size={14} />}
                                                                {job.assignedTo ? 'Continue' : 'Start'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}

                                    {/* Empty State */}
                                    {(() => {
                                        let filtered = filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status !== 'Completed');
                                        if (putawayStatusFilter !== 'All') filtered = filtered.filter(j => j.status === putawayStatusFilter);
                                        if (putawaySearch) filtered = filtered.filter(j =>
                                            j.id.toLowerCase().includes(putawaySearch.toLowerCase()) ||
                                            (j.orderRef && orders.find(o => o.id === j.orderRef)?.po_number?.toLowerCase().includes(putawaySearch.toLowerCase()))
                                        );
                                        return filtered.length === 0;
                                    })() && (
                                            <div className="col-span-full text-center py-12">
                                                <Package size={48} className="text-gray-600 mx-auto mb-4" />
                                                <p className="text-gray-500 font-bold">
                                                    {putawaySearch || putawayStatusFilter !== 'All'
                                                        ? t('warehouse.noJobsMatchFilters')
                                                        : t('warehouse.noPendingJobs')}
                                                </p>
                                                <p className="text-gray-600 text-sm mt-2">
                                                    {putawaySearch || putawayStatusFilter !== 'All'
                                                        ? t('warehouse.tryAdjustingFilters')
                                                        : t('warehouse.jobsAppearAfterReceive')}
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* --- REPLENISH TAB --- */}
                {
                    activeTab === 'REPLENISH' && (
                        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 flex-1 overflow-hidden flex flex-col">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <RefreshCw className="text-cyber-primary" size={20} />
                                        {t('warehouse.forwardPickReplenishment')}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">{t('warehouse.restockPickFaces')}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => {
                                            // Select all items that need replenishment
                                            const needsReplenish = filteredProducts.filter(p => {
                                                const minStock = p.minStock || 10;
                                                return p.stock < minStock;
                                            });
                                            const newSelected = new Set(needsReplenish.map(p => p.id));
                                            setSelectedReplenishItems(newSelected);
                                            addNotification('info', `Selected ${newSelected.size} items for replenishment`);
                                        }}
                                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        {t('warehouse.selectAllLowStock')}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (selectedReplenishItems.size === 0) {
                                                addNotification('alert', t('warehouse.noItemsSelected'));
                                                return;
                                            }

                                            // Create PUTAWAY jobs for all selected items
                                            let created = 0;
                                            for (const productId of selectedReplenishItems) {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) continue;

                                                const minStock = product.minStock || 10;
                                                const maxStock = product.maxStock || 100;
                                                const restockQty = Math.min(maxStock - product.stock, 50);

                                                if (restockQty <= 0) continue;

                                                try {
                                                    const replenishJob: WMSJob = {
                                                        id: `REP-${Date.now()}-${created}`,
                                                        siteId: activeSite?.id || '',
                                                        site_id: activeSite?.id,
                                                        sourceSiteId: activeSite?.id || '',
                                                        source_site_id: activeSite?.id,
                                                        destSiteId: activeSite?.id || '',
                                                        dest_site_id: activeSite?.id,
                                                        type: 'PUTAWAY',
                                                        status: 'Pending',
                                                        priority: product.stock === 0 ? 'Critical' : product.stock < minStock / 2 ? 'High' : 'Normal',
                                                        location: product.location || 'Bulk Storage',
                                                        assignedTo: '',
                                                        items: 1,
                                                        lineItems: [{
                                                            productId: product.id,
                                                            sku: product.sku,
                                                            name: product.name,
                                                            image: product.image,
                                                            expectedQty: restockQty,
                                                            pickedQty: 0,
                                                            status: 'Pending'
                                                        }],
                                                        orderRef: `REPLENISH-${product.sku}`
                                                    };
                                                    await wmsJobsService.create(replenishJob);
                                                    created++;
                                                } catch (e) {
                                                    console.error('Failed to create replenish job:', e);
                                                }
                                            }

                                            if (created > 0) {
                                                addNotification('success', `Created ${created} replenishment jobs`);
                                                setSelectedReplenishItems(new Set());
                                            }
                                        }}
                                        className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors ${selectedReplenishItems.size > 0
                                            ? 'bg-cyber-primary text-black hover:bg-cyber-accent'
                                            : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                            }`}
                                        disabled={selectedReplenishItems.size === 0}
                                    >
                                        Generate {selectedReplenishItems.size > 0 ? `${selectedReplenishItems.size} ` : ''}Tasks
                                    </button>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <p className="text-[10px] text-red-400 uppercase font-bold">Critical (Out of Stock)</p>
                                    <p className="text-xl font-mono font-bold text-red-400">
                                        {filteredProducts.filter(p => p.stock === 0).length}
                                    </p>
                                </div>
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                    <p className="text-[10px] text-orange-400 uppercase font-bold">Low Stock</p>
                                    <p className="text-xl font-mono font-bold text-orange-400">
                                        {filteredProducts.filter(p => p.stock > 0 && p.stock < (p.minStock || 10)).length}
                                    </p>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                    <p className="text-[10px] text-yellow-400 uppercase font-bold">Below Optimal</p>
                                    <p className="text-xl font-mono font-bold text-yellow-400">
                                        {filteredProducts.filter(p => p.stock >= (p.minStock || 10) && p.stock < (p.minStock || 10) * 2).length}
                                    </p>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                    <p className="text-[10px] text-green-400 uppercase font-bold">Well Stocked</p>
                                    <p className="text-xl font-mono font-bold text-green-400">
                                        {filteredProducts.filter(p => p.stock >= (p.minStock || 10) * 2).length}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500 font-bold border-b border-white/5 sticky top-0 bg-cyber-gray">
                                        <tr>
                                            <th className="p-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select all items"
                                                    className="w-4 h-4 rounded bg-black border-white/20"
                                                    checked={selectedReplenishItems.size > 0 && selectedReplenishItems.size === filteredProducts.filter(p => p.stock < (p.minStock || 10) * 2).length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const all = filteredProducts.filter(p => p.stock < (p.minStock || 10) * 2).map(p => p.id);
                                                            setSelectedReplenishItems(new Set(all));
                                                        } else {
                                                            setSelectedReplenishItems(new Set());
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-3">Priority</th>
                                            <th className="p-3">Product</th>
                                            <th className="p-3">Pick Face</th>
                                            <th className="p-3">Bulk Location</th>
                                            <th className="p-3 text-center">Current</th>
                                            <th className="p-3 text-center">Min</th>
                                            <th className="p-3 text-center">Restock Qty</th>
                                            <th className="p-3">Urgency</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredProducts
                                            .filter(p => p.stock < (p.minStock || 10) * 2)
                                            .sort((a, b) => {
                                                // Sort by urgency: out of stock first, then low stock
                                                if (a.stock === 0 && b.stock !== 0) return -1;
                                                if (b.stock === 0 && a.stock !== 0) return 1;
                                                const aMinStock = a.minStock || 10;
                                                const bMinStock = b.minStock || 10;
                                                return (a.stock / aMinStock) - (b.stock / bMinStock);
                                            })
                                            .map(p => {
                                                const minStock = p.minStock || 10;
                                                const maxStock = p.maxStock || 100;
                                                const restockQty = Math.min(maxStock - p.stock, 50);
                                                const isChecked = selectedReplenishItems.has(p.id);

                                                // Check for pending orders containing this product
                                                const pendingOrders = sales.filter(s =>
                                                    s.status !== 'Completed' &&
                                                    s.items?.some(item => item.productId === p.id)
                                                ).length;

                                                // Determine priority
                                                let priority = 'Normal';
                                                let priorityColor = 'bg-blue-500/20 text-blue-400';
                                                if (p.stock === 0) {
                                                    priority = 'Critical';
                                                    priorityColor = 'bg-red-500/20 text-red-400';
                                                } else if (p.stock < minStock / 2) {
                                                    priority = 'High';
                                                    priorityColor = 'bg-orange-500/20 text-orange-400';
                                                } else if (p.stock < minStock) {
                                                    priority = 'Medium';
                                                    priorityColor = 'bg-yellow-500/20 text-yellow-400';
                                                }

                                                // Determine bulk storage location (simulated - based on category)
                                                const bulkLocation = p.category ? `BULK-${p.category.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10) + 1}` : 'BULK-GEN-1';

                                                return (
                                                    <tr key={p.id} className={`hover:bg-white/5 ${isChecked ? 'bg-cyber-primary/5' : ''}`}>
                                                        <td className="p-3">
                                                            <input
                                                                type="checkbox"
                                                                aria-label={`Select ${p.name}`}
                                                                className="w-4 h-4 rounded bg-black border-white/20"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    const newSelected = new Set(selectedReplenishItems);
                                                                    if (e.target.checked) {
                                                                        newSelected.add(p.id);
                                                                    } else {
                                                                        newSelected.delete(p.id);
                                                                    }
                                                                    setSelectedReplenishItems(newSelected);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${priorityColor}`}>
                                                                {priority}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <img src={p.image} alt="" className="w-8 h-8 rounded object-cover bg-black" />
                                                                <div>
                                                                    <p className="text-white font-medium text-sm">{p.name}</p>
                                                                    <p className="text-[10px] text-gray-500">{p.sku}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="text-gray-400 font-mono text-xs">{p.location || 'Unassigned'}</span>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="text-purple-400 font-mono text-xs">{bulkLocation}</span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`font-bold font-mono ${p.stock === 0 ? 'text-red-400' :
                                                                p.stock < minStock ? 'text-orange-400' :
                                                                    'text-yellow-400'
                                                                }`}>
                                                                {p.stock}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="text-gray-500 font-mono text-xs">{minStock}</span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="text-green-400 font-bold font-mono">+{restockQty}</span>
                                                        </td>
                                                        <td className="p-3">
                                                            {pendingOrders > 0 ? (
                                                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 animate-pulse">
                                                                    ⚠️ {pendingOrders} order{pendingOrders > 1 ? 's' : ''} waiting
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const replenishJob: WMSJob = {
                                                                            id: `REP-${Date.now()}`,
                                                                            siteId: activeSite?.id || '',
                                                                            site_id: activeSite?.id,
                                                                            sourceSiteId: activeSite?.id || '',
                                                                            source_site_id: activeSite?.id,
                                                                            destSiteId: activeSite?.id || '',
                                                                            dest_site_id: activeSite?.id,
                                                                            type: 'PUTAWAY',
                                                                            status: 'Pending',
                                                                            priority: priority === 'Critical' ? 'Critical' : priority === 'High' ? 'High' : 'Normal',
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
                                                                        await wmsJobsService.create(replenishJob);
                                                                        addNotification('success', `Replenishment job created for ${p.name}`);
                                                                    } catch (e) {
                                                                        console.error('Failed to create replenish job:', e);
                                                                        addNotification('alert', 'Failed to create replenishment job');
                                                                    }
                                                                }}
                                                                className="px-3 py-1.5 bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary border border-cyber-primary/50 rounded text-xs font-bold transition-colors"
                                                            >
                                                                Create Task
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>

                                {filteredProducts.filter(p => p.stock < (p.minStock || 10) * 2).length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                                        <p className="text-lg font-medium text-green-400">All Pick Faces Stocked!</p>
                                        <p className="text-sm text-gray-500">No replenishment needed at this time</p>
                                    </div>
                                )}
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
                                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${countViewMode === 'Operations' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Operations
                                            </button>
                                            <button
                                                onClick={() => setCountViewMode('Reports')}
                                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${countViewMode === 'Reports' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
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
                                                                    <img src={product?.image} alt="" className="w-12 h-12 rounded bg-black object-cover" />
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
                                                                    <img src={product?.image} alt="" className="w-10 h-10 rounded bg-black object-cover" />
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
                                                                            onClick={async () => {
                                                                                // Approve Variance
                                                                                await adjustStock(
                                                                                    item.productId,
                                                                                    Math.abs(item.variance || 0),
                                                                                    (item.variance || 0) > 0 ? 'IN' : 'OUT',
                                                                                    `Cycle Count Adjustment`,
                                                                                    user?.name || 'Manager'
                                                                                );

                                                                                const newItems = [...countSessionItems];
                                                                                newItems[idx].status = 'Approved';
                                                                                setCountSessionItems(newItems);
                                                                                addNotification('success', 'Variance approved & stock updated.');
                                                                            }}
                                                                            className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 border border-red-500/30"
                                                                        >
                                                                            Approve Variance
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
                                                    {CURRENCY_SYMBOL}{movements
                                                        .filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment'))
                                                        .reduce((sum, m) => {
                                                            const product = products.find(p => p.id === m.productId);
                                                            const value = m.quantity * (product?.price || 0);
                                                            return sum + (m.type === 'IN' ? value : -value);
                                                        }, 0).toFixed(2)}
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

                                        {/* Recent Adjustments Table */}
                                        <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                                            <div className="p-4 border-b border-white/10">
                                                <h4 className="font-bold text-white">Recent Variance Adjustments</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="text-xs text-gray-400 border-b border-white/10">
                                                            <th className="p-4 font-medium">Date</th>
                                                            <th className="p-4 font-medium">Product</th>
                                                            <th className="p-4 font-medium">Type</th>
                                                            <th className="p-4 font-medium">Qty</th>
                                                            <th className="p-4 font-medium">Value</th>
                                                            <th className="p-4 font-medium">User</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {movements
                                                            .filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment'))
                                                            .slice(0, 10)
                                                            .map(m => {
                                                                const product = products.find(p => p.id === m.productId);
                                                                return (
                                                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                                                                        <td className="p-4 text-gray-300">{new Date(m.date).toLocaleDateString()}</td>
                                                                        <td className="p-4 font-bold text-white">{product?.name || 'Unknown'}</td>
                                                                        <td className="p-4">
                                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${m.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                                {m.type}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-4 text-white">{m.quantity}</td>
                                                                        <td className="p-4 text-gray-300">
                                                                            {CURRENCY_SYMBOL}{((product?.price || 0) * m.quantity).toFixed(2)}
                                                                        </td>
                                                                        <td className="p-4 text-gray-400">{m.user || 'System'}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        {movements.filter(m => m.reason.includes('Cycle Count') || m.reason.includes('Adjustment')).length === 0 && (
                                                            <tr>
                                                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                                                    No variance adjustments recorded yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
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
                                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${wasteViewMode === 'Log' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Log Waste
                                        </button>
                                        <button
                                            onClick={() => setWasteViewMode('History')}
                                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${wasteViewMode === 'History' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'}`}
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
                                                                        <img src={product?.image} alt={product?.name || 'Product'} className="w-10 h-10 rounded bg-black object-cover" />
                                                                        <div>
                                                                            <p className="font-bold text-white text-sm">{product?.name}</p>
                                                                            <p className="text-xs text-gray-400">{item.reason} • {item.quantity} units</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <p className="font-mono text-white text-sm">{CURRENCY_SYMBOL}{cost.toFixed(2)}</p>
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
                                                            {CURRENCY_SYMBOL}{wasteBasket.reduce((sum, item) => {
                                                                const product = products.find(p => p.id === item.productId);
                                                                return sum + ((product?.price || 0) * item.quantity);
                                                            }, 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (wasteBasket.length === 0) return;

                                                            const totalValue = wasteBasket.reduce((sum, item) => {
                                                                const product = products.find(p => p.id === item.productId);
                                                                return sum + ((product?.price || 0) * item.quantity);
                                                            }, 0);

                                                            if (totalValue > 100) {
                                                                if (!confirm(`High value waste (${CURRENCY_SYMBOL}${totalValue.toFixed(2)}). Are you sure? This will be flagged for review.`)) return;
                                                            } else {
                                                                if (!confirm('Confirm disposal of these items?')) return;
                                                            }

                                                            // Process all items
                                                            for (const item of wasteBasket) {
                                                                await adjustStock(
                                                                    item.productId,
                                                                    item.quantity,
                                                                    'OUT',
                                                                    `Waste: ${item.reason} ${item.notes ? `(${item.notes})` : ''}`,
                                                                    user?.name || 'WMS'
                                                                );
                                                            }

                                                            setWasteBasket([]);
                                                            addNotification('success', 'Waste log submitted successfully');
                                                        }}
                                                        disabled={wasteBasket.length === 0}
                                                        className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${wasteBasket.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        <AlertTriangle size={18} /> Confirm Disposal
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wasteViewMode === 'History' && (
                                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                        <div className="p-4 border-b border-white/10">
                                            <h4 className="font-bold text-white">Recent Waste Logs</h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-xs text-gray-400 border-b border-white/10">
                                                        <th className="p-4 font-medium">Date</th>
                                                        <th className="p-4 font-medium">Product</th>
                                                        <th className="p-4 font-medium">Reason</th>
                                                        <th className="p-4 font-medium">Qty</th>
                                                        <th className="p-4 font-medium">Value</th>
                                                        <th className="p-4 font-medium">User</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {movements
                                                        .filter(m => m.type === 'OUT' && m.reason.toLowerCase().includes('waste'))
                                                        .slice(0, 20)
                                                        .map(m => {
                                                            const product = products.find(p => p.id === m.productId);
                                                            return (
                                                                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                                                                    <td className="p-4 text-gray-300">{new Date(m.date).toLocaleDateString()}</td>
                                                                    <td className="p-4 font-bold text-white">{product?.name || 'Unknown'}</td>
                                                                    <td className="p-4 text-gray-300">{m.reason.replace('Waste: ', '')}</td>
                                                                    <td className="p-4 text-white">{m.quantity}</td>
                                                                    <td className="p-4 text-red-400">
                                                                        {CURRENCY_SYMBOL}{((product?.price || 0) * m.quantity).toFixed(2)}
                                                                    </td>
                                                                    <td className="p-4 text-gray-400">{m.user || 'System'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    {movements.filter(m => m.type === 'OUT' && m.reason.toLowerCase().includes('waste')).length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                                No waste records found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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
                                        <p className="text-sm text-gray-400 mt-1">Process customer returns, refunds, and exchanges</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {['Search', 'Select', 'Review', 'Complete'].map((step, i) => {
                                            const steps = ['Search', 'Select', 'Review', 'Complete'];
                                            const currentIndex = steps.indexOf(returnStep);
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
                                </div>

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
                                                <p className="text-sm text-gray-400">{new Date(foundSale.date).toLocaleDateString()} • {foundSale.customer_id || 'Walk-in Customer'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Total Paid</p>
                                                <p className="font-bold text-cyber-primary text-xl">{CURRENCY_SYMBOL}{foundSale.total.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-white mb-4">Select Items to Return</h4>
                                        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                                            {foundSale.items.map((item: any, idx: number) => {
                                                const isSelected = returnItems.some(ri => ri.productId === item.id);
                                                const returnItem = returnItems.find(ri => ri.productId === item.id);

                                                return (
                                                    <div key={idx} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5'}`}>
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
                                                                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm"
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
                                                                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm"
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
                                                                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm"
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
                                                                                className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm"
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
                                                                            {CURRENCY_SYMBOL}{refundAmount.toFixed(2)}
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
                                                                    <span>{CURRENCY_SYMBOL}{subtotal.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-gray-400">
                                                                    <span>Tax (10%)</span>
                                                                    <span>{CURRENCY_SYMBOL}{tax.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-white font-bold text-lg pt-4 border-t border-white/10">
                                                                    <span>Total Refund</span>
                                                                    <span className="text-cyber-primary">{CURRENCY_SYMBOL}{total.toFixed(2)}</span>
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

                                                                // Stock Adjustments
                                                                for (const item of returnItems) {
                                                                    if (item.action === 'Restock') {
                                                                        await adjustStock(item.productId, item.quantity, 'IN', `RMA Restock: ${foundSale.id}`, user?.name || 'WMS');
                                                                    } else if (item.action === 'Discard') {
                                                                        // Log waste automatically? Or just don't add back.
                                                                        // For now, we just don't add it back.
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
                                            <p className="text-gray-400">{t('warehouse.rmaGenerated').replace('{rma}', `RMA-${Date.now().toString().slice(-6)}`)}</p>
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
                                                        setTransferSourceSite(isRestricted ? user.siteId : (activeSite?.id || ''));
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

                                        {/* Transfer Stats - Complete Workflow */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                            {[
                                                { label: t('warehouse.requested'), value: filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Requested').length, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                                                { label: t('warehouse.picking'), value: filteredJobs.filter(j => j.type === 'TRANSFER' && (j.transferStatus === 'Picking' || j.transferStatus === 'Picked')).length, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                                                { label: t('warehouse.packed'), value: filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Packed').length, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
                                                { label: t('warehouse.inTransit'), value: filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'In-Transit').length, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                                                { label: t('warehouse.delivered'), value: filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Delivered').length, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
                                                { label: t('warehouse.received'), value: filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Received').length, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                                            ].map(stat => (
                                                <div key={stat.label} className={`rounded-lg p-3 border ${stat.color}`}>
                                                    <p className="text-[10px] uppercase font-bold opacity-70">{stat.label}</p>
                                                    <p className="text-xl font-mono font-bold">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Filter Tabs */}
                                    <div className="flex gap-2 flex-wrap">
                                        {(['ALL', 'Requested', 'Picking', 'Packed', 'In-Transit', 'Delivered', 'Received'] as const).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setTransferStatusFilter(status as any)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${transferStatusFilter === status
                                                    ? 'bg-cyber-primary text-black'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {status === 'Picking' ? '📦 Picking' :
                                                    status === 'Packed' ? '📤 Packed' :
                                                        status === 'In-Transit' ? '🚚 In Transit' :
                                                            status === 'Delivered' ? '📍 Delivered' :
                                                                status === 'Received' ? '✅ Received' : status}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Transfer List */}
                                    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                                        <div className="space-y-4">
                                            {filteredJobs
                                                .filter(j => j.type === 'TRANSFER')
                                                .filter(j => {
                                                    if (transferStatusFilter === 'ALL') return true;
                                                    if (transferStatusFilter === 'Picking') return j.transferStatus === 'Picking' || j.transferStatus === 'Picked';
                                                    return j.transferStatus === transferStatusFilter;
                                                })
                                                .sort((a, b) => new Date(b.orderRef).getTime() - new Date(a.orderRef).getTime())
                                                .map(transfer => {
                                                    const sourceSite = sites.find(s => s.id === transfer.sourceSiteId);
                                                    const destSite = sites.find(s => s.id === transfer.destSiteId);

                                                    const statusColors: Record<string, string> = {
                                                        'Requested': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                                        'Approved': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                                        'Picking': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                                        'Picked': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                                        'Packed': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                                                        'In-Transit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                                                        'Delivered': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                                                        'Received': 'bg-green-500/20 text-green-400 border-green-500/30',
                                                    };

                                                    return (
                                                        <div key={transfer.id} className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
                                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                                {/* Left: Transfer Info (Simple Row) */}
                                                                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                                                                    <div className="flex items-center gap-3 min-w-[150px]">
                                                                        <span className="text-sm font-mono font-bold text-white">{formatTransferId(transfer)}</span>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${statusColors[transfer.transferStatus || 'Requested']}`}>
                                                                            {transfer.transferStatus || 'Requested'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-sm text-gray-400 flex-1">
                                                                        <span className="truncate max-w-[100px]" title={sourceSite?.name}>{sourceSite?.name || 'Unknown'}</span>
                                                                        <ArrowRight size={12} />
                                                                        <span className="truncate max-w-[100px]" title={destSite?.name}>{destSite?.name || 'Unknown'}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                        <span>{transfer.items} items</span>
                                                                        <span className="hidden md:inline">•</span>
                                                                        <span className="hidden md:inline">{transfer.requestedBy || 'System'}</span>
                                                                        <span className="hidden md:inline">•</span>
                                                                        <span className="font-mono">{new Date(transfer.id.startsWith('TRF-') ? parseInt(transfer.id.split('-')[1]) : transfer.orderRef).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Right: Actions */}
                                                                <div className="flex items-center gap-2">
                                                                    {/* Show different actions based on status */}
                                                                    {transfer.transferStatus === 'Requested' && ['super_admin', 'warehouse_manager', 'admin', 'manager', 'store_manager'].includes(user?.role || '') && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                setApprovingJobId(transfer.id);
                                                                                try {
                                                                                    // 1. Create PICK JOB
                                                                                    // Ensure we have a valid site ID for the pick job (Source Warehouse)
                                                                                    const sourceSite = transfer.sourceSiteId || transfer.siteId || transfer.source_site_id;

                                                                                    if (!sourceSite) {
                                                                                        throw new Error('Missing Source Site ID on Transfer');
                                                                                    }

                                                                                    const pickJobId = `PICK-TRF-${Date.now()}`;

                                                                                    // Get lineItems from either camelCase or snake_case
                                                                                    const transferLineItems = transfer.lineItems || transfer.line_items || [];
                                                                                    console.log('📦 Transfer lineItems:', transferLineItems);
                                                                                    console.log('📦 Full transfer object:', transfer);

                                                                                    if (transferLineItems.length === 0) {
                                                                                        throw new Error('Transfer has no items to pick. Please add products to the transfer first.');
                                                                                    }

                                                                                    const pickJob: WMSJob = {
                                                                                        id: pickJobId,
                                                                                        siteId: sourceSite,
                                                                                        site_id: sourceSite,
                                                                                        sourceSiteId: sourceSite,
                                                                                        source_site_id: sourceSite,
                                                                                        destSiteId: transfer.destSiteId || transfer.dest_site_id,
                                                                                        dest_site_id: transfer.destSiteId || transfer.dest_site_id,
                                                                                        type: 'PICK',
                                                                                        status: 'Pending',
                                                                                        priority: transfer.priority || 'Normal',
                                                                                        location: 'Warehouse',
                                                                                        assignedTo: '',
                                                                                        items: transfer.items || transfer.items_count || transferLineItems.length,
                                                                                        lineItems: transferLineItems.map((item: any) => ({
                                                                                            ...item,
                                                                                            status: 'Pending',
                                                                                            pickedQty: 0
                                                                                        })),
                                                                                        orderRef: transfer.id,
                                                                                        jobNumber: `PICK-${formatTransferId(transfer).replace('TRF-', '')}`
                                                                                    };

                                                                                    await wmsJobsService.create(pickJob);

                                                                                    // 2. Update transfer status to 'Picking' directly (skip intermediate Approved state if we go straight to picking)
                                                                                    await wmsJobsService.update(transfer.id, {
                                                                                        transferStatus: 'Picking', // Sent as camelCase, service will map to snake_case
                                                                                        approvedBy: user?.name,
                                                                                        // Only send fields that changed
                                                                                    } as any);

                                                                                    addNotification('success', t('warehouse.transferApproved'));
                                                                                    // Refresh data without reloading page
                                                                                    await refreshData();
                                                                                    setApprovingJobId(null);
                                                                                } catch (e) {
                                                                                    console.error('Failed to approve transfer:', e);
                                                                                    addNotification('alert', 'Failed to approve: ' + (e as any).message);
                                                                                    setApprovingJobId(null);
                                                                                }
                                                                            }}
                                                                            disabled={approvingJobId === transfer.id}
                                                                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 border border-green-500/30 flex items-center gap-2"
                                                                        >
                                                                            {approvingJobId === transfer.id ? (
                                                                                <RefreshCw className="animate-spin" size={12} />
                                                                            ) : (
                                                                                t('warehouse.approve')
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {/* Show "Mark Shipped" only after items are packed */}
                                                                    {transfer.transferStatus === 'Packed' && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (shippingTransferId) return; // Prevent double-click
                                                                                setShippingTransferId(transfer.id);
                                                                                try {
                                                                                    await wmsJobsService.update(transfer.id, {
                                                                                        transferStatus: 'In-Transit'
                                                                                    } as any);
                                                                                    await refreshData();
                                                                                    addNotification('success', t('warehouse.transferMarkedShipped'));
                                                                                } catch (e) {
                                                                                    console.error('Failed to mark shipped:', e);
                                                                                    addNotification('alert', 'Failed to update transfer');
                                                                                } finally {
                                                                                    setShippingTransferId(null);
                                                                                }
                                                                            }}
                                                                            disabled={shippingTransferId === transfer.id}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${shippingTransferId === transfer.id
                                                                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 cursor-wait'
                                                                                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30'
                                                                                }`}
                                                                        >
                                                                            {shippingTransferId === transfer.id ? (
                                                                                <>
                                                                                    <RefreshCw className="animate-spin" size={12} />
                                                                                    Shipping...
                                                                                </>
                                                                            ) : (
                                                                                <>🚚 Mark Shipped</>
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {/* Show status indicators for Picking/Picked */}
                                                                    {(transfer.transferStatus === 'Picking' || transfer.transferStatus === 'Picked') && (
                                                                        <span className="text-xs text-gray-400 italic">
                                                                            {transfer.transferStatus === 'Picking' ? '⏳ Being picked...' : '📦 Awaiting packing...'}
                                                                        </span>
                                                                    )}

                                                                    {transfer.transferStatus === 'In-Transit' && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (loadingActions[transfer.id]) return;
                                                                                setLoadingActions(prev => ({ ...prev, [transfer.id]: true }));
                                                                                try {
                                                                                    await wmsJobsService.update(transfer.id, {
                                                                                        transferStatus: 'Delivered'
                                                                                    } as any);
                                                                                    await refreshData();
                                                                                    addNotification('success', 'Transfer marked as delivered! 📍');
                                                                                } catch (e) {
                                                                                    console.error('Failed to mark delivered:', e);
                                                                                    addNotification('alert', 'Failed to update transfer');
                                                                                } finally {
                                                                                    setLoadingActions(prev => ({ ...prev, [transfer.id]: false }));
                                                                                }
                                                                            }}
                                                                            disabled={loadingActions[transfer.id]}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${loadingActions[transfer.id]
                                                                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 cursor-wait'
                                                                                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/30'
                                                                                }`}
                                                                        >
                                                                            {loadingActions[transfer.id] ? (
                                                                                <>
                                                                                    <RefreshCw className="animate-spin" size={12} />
                                                                                    Updating...
                                                                                </>
                                                                            ) : (
                                                                                <>📍 Mark Delivered</>
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {transfer.transferStatus === 'Delivered' && transfer.destSiteId === activeSite?.id && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setActiveTransferJob(transfer);
                                                                                setTransferReceiveItems(transfer.lineItems.map((item: any) => ({
                                                                                    productId: item.productId,
                                                                                    expectedQty: item.expectedQty,
                                                                                    receivedQty: item.expectedQty, // Default to expected
                                                                                    condition: 'Good',
                                                                                    notes: ''
                                                                                })));
                                                                                setTransferReceiveMode(true);
                                                                            }}
                                                                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 border border-green-500/30"
                                                                        >
                                                                            Receive
                                                                        </button>
                                                                    )}

                                                                    {transfer.transferStatus === 'Received' && (
                                                                        <span className="text-xs text-green-400 flex items-center gap-1">
                                                                            <CheckCircle size={14} /> Completed
                                                                        </span>
                                                                    )}

                                                                    <button
                                                                        onClick={() => {
                                                                            // View transfer details - could expand or open modal
                                                                            setSelectedJob(transfer);
                                                                        }}
                                                                        className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-xs font-bold hover:bg-white/10"
                                                                    >
                                                                        Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
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
                                                <div key={idx} className={`p-4 rounded-xl border transition-all ${isDiscrepancy ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
                                                    <div className="flex flex-col md:flex-row gap-4 items-center">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-white">{product?.name || 'Unknown Product'}</h4>
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
                                                                        className={`w-16 bg-black border rounded-lg p-2 text-center font-mono font-bold ${isDiscrepancy ? 'text-yellow-400 border-yellow-500/50' : 'text-green-400 border-green-500/50'}`}
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
                                                    // 1. Update Job Status
                                                    await wmsJobsService.update(activeTransferJob.id, {
                                                        ...activeTransferJob,
                                                        transferStatus: 'Received',
                                                        receivedAt: new Date().toISOString(),
                                                        status: 'Completed',
                                                        discrepancies: transferReceiveItems.filter(i => i.receivedQty !== i.expectedQty)
                                                    });

                                                    // 2. Update Inventory for RECEIVED items - find or create products at destination site
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
                                                                // Product exists at destination - update its stock
                                                                await adjustStock(
                                                                    destProduct.id,
                                                                    item.receivedQty,
                                                                    'IN',
                                                                    `Transfer Received: ${formatJobId(activeTransferJob)} (${item.condition})`,
                                                                    user?.name || 'System'
                                                                );
                                                                console.log(`📥 Added ${item.receivedQty} of ${destProduct.name} to ${destProduct.id}`);
                                                            } else {
                                                                // Product doesn't exist at destination - create it
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
                                        </button>
                                    </div>
                                </div>
                            )}
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

                                    {/* Progress Steps */}
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
                                                                            <img src={product?.image || ''} alt="" className="w-10 h-10 rounded-lg object-cover bg-black/30" />
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
                                                                                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                                                                                    >+</button>
                                                                                </div>
                                                                                {/* Stock indicator */}
                                                                                <div className="w-full mt-1">
                                                                                    <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full transition-all ${stockPercent > 80 ? 'bg-red-500' : stockPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                                            style={{ width: `${Math.min(stockPercent, 100)}%` }}
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

                                                {/* Add Product - Show products from SOURCE site, or all if none found */}
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
                                                                        ? '⚠️ No products assigned to this warehouse - showing all available products'
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
                                                console.log('📦 Creating Transfer Job:', transferJob);
                                                console.log('📦 Transfer Items:', transferItems);
                                                console.log('📦 Line Items:', transferJob.lineItems);

                                                const createdJob = await wmsJobsService.create(transferJob);
                                                console.log('✅ Transfer Job Created:', createdJob);

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

            </div >

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
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4" onClick={() => setShowShortPickModal(false)}>
                        <div className="bg-cyber-gray border border-cyber-primary/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(0,255,157,0.3)]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="text-red-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{t('warehouse.shortPickTitle')}</h3>
                                    <p className="text-sm text-gray-400">{t('warehouse.enterActualQuantityPicked')}</p>
                                </div>
                            </div>

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
                                    onClick={() => {
                                        if (isProcessingScan) return;
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
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4" onClick={() => setShowZoneLockModal(false)}>
                        <div className="bg-cyber-gray border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(255,193,7,0.3)]" onClick={(e) => e.stopPropagation()}>
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
                                        addNotification('warning', t('warehouse.zoneLockedNotification').replace('{zone}', zoneToLock).replace('{reason}', zoneLockReason.trim() ? `: ${zoneLockReason.trim()}` : t('warehouse.forMaintenance')));
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

            {/* Bulk Distribution Modal - Wave Transfer to Multiple Stores */}
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
                                                        <img src={selectedProduct?.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
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
                                    // Wave Mode - Multiple Products
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
                                                                <img src={product?.image} alt="" className="w-10 h-10 rounded object-cover" />
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
                                                // Single product mode - create transfer for each store
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
                                                // Wave mode - consolidate by store and create one transfer per store
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

                                            addNotification('success', `Created ${createdJobs} distribution transfers! Products will be sorted to each store.`);
                                            setShowBulkDistributionModal(false);
                                            setBulkDistributionAllocations([]);
                                            setWaveProducts([]);
                                        } catch (e) {
                                            console.error(e);
                                            addNotification('error', 'Failed to create distribution jobs');
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
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Global Job Details Modal - Works from any tab (only show when NOT in scanner mode) */}
            {
                selectedJob && !isScannerMode && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-cyber-gray border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyber-primary/10 flex flex-col">
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
                                                    <th className="p-3">Product</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3">
                                                            <p className="text-white font-medium">{item.name}</p>
                                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-white font-bold">{item.expectedQty}</td>
                                                        <td className="p-3 text-center">
                                                            <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-gray-300">
                                                                {item.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">No detailed item list available</td></tr>
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
                                        <button
                                            type="button"
                                            onClick={(e) => {
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
                                                    assignJob(selectedJob.id, user.id || user.name);
                                                }

                                                // Open scanner
                                                setSelectedJob(optimizedJob);
                                                setIsScannerMode(true);
                                                setScannerStep(selectedJob.type === 'PUTAWAY' ? 'NAV' : 'SCAN');
                                                setScannedBin('');
                                                setScannedItem('');
                                                setPickQty(0);
                                            }}
                                            className="px-6 py-3 bg-gradient-to-r from-cyber-primary to-green-400 text-black rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyber-primary/30 flex items-center gap-2"
                                        >
                                            <Scan size={18} />
                                            {selectedJob.type?.toUpperCase() === 'PICK' ? t('warehouse.startPicking') :
                                                selectedJob.type?.toUpperCase() === 'PACK' ? t('warehouse.startPacking') :
                                                    t('warehouse.startPutaway')}
                                        </button>
                                    ) : null}
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
            {/* Pack Job Reprint Options Modal - Global Level */}
            {packReprintJob && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
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
                                {(['Tiny', 'Small', 'Medium', 'Large'] as const).map(s => (
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
                                {reprintSize === 'Tiny' && '1.25" × 1" - SKU Tags'}
                                {reprintSize === 'Small' && '2.25" × 1.25" - Multipurpose'}
                                {reprintSize === 'Medium' && '3" × 2" - Shelf Labels'}
                                {reprintSize === 'Large' && '4" × 3" - Carton Tags'}
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
            )}
        </Protected >
    );
}
