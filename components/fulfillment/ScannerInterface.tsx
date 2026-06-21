
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import {
    Scan, ArrowLeft, Search, Box, Check, X, Printer, RefreshCw, AlertTriangle, ArrowRight,
    Map as MapIcon, ChevronRight, Package, Info, CheckCircle, Loader2, Truck, Archive,
    Camera
} from 'lucide-react';
import { WMSJob, Site, Product, JobItem } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFulfillment } from './FulfillmentContext';
import { playBeep } from '../../utils/audioUtils';
import { useScanOnly } from '../../hooks/useScanOnly';
import { getExpiryStatus } from '../../utils/formatting';

// Helper component for metrics
const MetricBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className={`px-3 py-1 rounded-lg border flex flex-col items-center ${color}`}>
        <span className="text-[10px] uppercase font-bold opacity-80">{label}</span>
        <span className="text-lg font-mono font-bold">{value}</span>
    </div>
);


export const ScannerInterface: React.FC = () => {
    // --- HOOKS & CONTEXT ---
    const { t } = useLanguage();
    const {
        products,
        sites,
        settings,
        logSystemEvent,
        refreshData,
        activeSite
    } = useData();
    const { user } = useStore();

    const {
        updateJobItem,
        adjustStockMutation,
        relocateProductMutation,
        addProduct,
        addNotification,
        completeJob,
        formatJobId,
        allProducts,
        selectedJob,
        setSelectedJob,
        setIsScannerMode,
        jobs
    } = useFulfillment();

    // --- LOCAL STATE ---
    // --- LOCAL STATE ---
    const [showScannerList, setShowScannerList] = useState(true);
    const [scannerStep, setScannerStep] = useState<'NAV' | 'SCAN' | 'CONFIRM'>('NAV');

    // Scanner Inputs
    const [scannedItem, setScannedItem] = useState('');
    const [scannedBay, setScannedBay] = useState('');
    const [locationSearch, setLocationSearch] = useState('');

    // Process State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessingScan, setIsProcessingScan] = useState(false);

    // Feedback State
    const [lastCompletedItem, setLastCompletedItem] = useState<{ name: string; qty: number } | null>(null);
    const [lastCompletedStatus, setLastCompletedStatus] = useState<string | null>(null);

    // Short Pick Modal State
    const [showShortPickModal, setShowShortPickModal] = useState(false);
    const [shortPickMaxQty, setShortPickMaxQty] = useState(0);
    const [shortPickQuantity, setShortPickQuantity] = useState('');
    const [shortPickResolution, setShortPickResolution] = useState<'standard' | 'discontinue'>('standard');

    // Gamification
    const [showPointsPopup, setShowPointsPopup] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState({ points: 0, message: '', bonuses: [] as { label: string; points: number }[] });

    // QR/Camera State (Placeholder for now as logic was complex)
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [qrScannerMode, setQRScannerMode] = useState<'product' | 'location'>('product');

    // Scanner Sort
    const [scannerSortBy, setScannerSortBy] = useState<'bay' | 'name' | 'status'>('bay');

    const locationInputRef = useRef<HTMLInputElement>(null);
    const itemInputRef = useRef<HTMLInputElement>(null);

    // Scan-only enforcement
    const scanOnlyHandlers = useScanOnly(setLocationSearch);
    const scanOnlyItemHandlers = useScanOnly(setScannedItem);

    // --- DERIVED DATA ---
    const isMultiSiteRole = ['CEO', 'Super Admin', 'Admin', 'Auditor', 'super_admin'].includes(user?.role || '');

    const filteredJobs = useMemo(() => {
        let baseFiltered = jobs || [];
        if (activeSite && activeSite.type !== 'Administration') {
            baseFiltered = baseFiltered.filter((j: WMSJob) => (j.siteId || j.site_id) === activeSite.id);
        } else if (!isMultiSiteRole && user?.siteId) {
            baseFiltered = baseFiltered.filter((j: WMSJob) => (j.siteId || j.site_id) === user.siteId);
        }
        return baseFiltered;
    }, [jobs, user?.role, user?.siteId, activeSite, isMultiSiteRole]);

    const filteredProducts = useMemo(() => {
        let baseFiltered = products || [];
        if (activeSite && activeSite.type !== 'Administration') {
            baseFiltered = baseFiltered.filter((p: Product) => (p.siteId || p.site_id) === activeSite.id);
        } else if (!isMultiSiteRole && user?.siteId) {
            baseFiltered = baseFiltered.filter((p: Product) => (p.siteId || p.site_id) === user.siteId);
        }
        return baseFiltered;
    }, [products, user?.role, user?.siteId, activeSite, isMultiSiteRole]);

    // Used for the LIST view (jobs assigned to user or available)
    const myScannerJobs = useMemo(() => {
        return filteredJobs.filter((j: WMSJob) =>
            j.status === 'In-Progress' &&
            (!j.assignedTo || j.assignedTo === user?.name || j.assignedTo === user?.id)
        );
    }, [filteredJobs, user]);

    // Current item to work on in the selected job
    const currentItem = useMemo(() => {
        if (!selectedJob) return null;
        return selectedJob.lineItems.find(i => i.status === 'Pending');
    }, [selectedJob]);

    const currentProduct = useMemo(() => {
        if (!currentItem) return null;
        let prod = filteredProducts.find(p => p.id === currentItem.productId || p.sku === currentItem.sku);
        if (!prod) {
            prod = allProducts.find(p => p.id === currentItem.productId || p.sku === currentItem.sku);
        }
        return prod;
    }, [currentItem, filteredProducts, allProducts]);

    const isCrossWarehouse = useMemo(() => {
        if (!selectedJob) return false;
        return selectedJob.destSiteId && selectedJob.sourceSiteId && selectedJob.destSiteId !== selectedJob.sourceSiteId;
    }, [selectedJob]);

    const destSite = useMemo(() => {
        if (!selectedJob?.destSiteId) return null;
        return sites.find(s => s.id === selectedJob.destSiteId);
    }, [selectedJob, sites]);

    const sourceSite = useMemo(() => {
        if (!selectedJob?.sourceSiteId) return null;
        return sites.find(s => s.id === selectedJob.sourceSiteId);
    }, [selectedJob, sites]);


    // --- EFFECTS ---
    useEffect(() => {
        if (locationInputRef.current && scannerStep === 'NAV' && !showScannerList) locationInputRef.current.focus();
        if (itemInputRef.current && scannerStep === 'SCAN' && !showScannerList) itemInputRef.current.focus();
    }, [scannerStep, showScannerList]);

    // Auto-advance if job selected but list is hidden (and vice versa)
    useEffect(() => {
        if (selectedJob) {
            setShowScannerList(false);
        } else {
            setShowScannerList(true);
        }
    }, [selectedJob]);


    // --- HELPERS ---

    const generateLocation = (zone: string, aisle: string, bay: string) => {
        return `${zone} -${aisle.padStart(2, '0')} -${bay.padStart(2, '0')} `;
    };

    const isLocationOccupied = (loc: string) => {
        // Simple check against products
        return products.some(p => p.location === loc && p.stock > 0);
    };

    const handleLocationSelect = (loc: string) => {
        setScannedBay(loc);
        setLocationSearch('');
        handleLocationScan(loc);
    };

    const handleLocationScan = (val: string) => {
        if (!val || !currentItem) return;
        const normalized = val.toUpperCase().trim();
        const expected = (currentProduct?.location || '').toUpperCase().trim();

        // Allow override or exact match
        // Or if putaway, any valid location is technically okay (logic simplified here)
        if (selectedJob?.type === 'PUTAWAY') {
            // Deprecated: Putaway now uses dedicated PutawayScanner.
            // But if for some reason it routes here, just allow it or log warning.
            console.warn("Putaway should not use ScannerInterface");
            return;
        } else {
            // PICK/COUNT
            if (normalized === expected || normalized === 'OVERRIDE') {
                playBeep('success');
                setScannerStep('SCAN');
                setScannedBay(normalized);
                addNotification('success', 'Location confirmed');
            } else {
                playBeep('error');
                addNotification('alert', `Wrong location! Expected ${expected}, scanned ${normalized} `);
            }
        }
    };

    const calculatePoints = (job: WMSJob) => {
        let points = 10;
        const bonuses = [];
        if (job.priority === 'High') {
            points += 5;
            bonuses.push({ label: 'High Priority', points: 5 });
        }
        return { points, message: 'Great job!', breakdown: bonuses };
    };

    const handleItemScan = async (val?: string) => {
        // Use val if passed, otherwise state
        const inputVal = val || scannedItem;

        if (!inputVal || !selectedJob || !currentItem) return;

        const normalized = inputVal.toUpperCase().trim();
        const product = currentProduct; // from hook

        // Normalize SKU for matching: strip hyphens, slashes, and whitespace
        // Handles barcode labels that encode "GN019" matching DB SKU "GN-019"
        const normSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();
        const normalizedInput = normSku(normalized);

        const getBarcodesArray = (barcodes: any): string[] => {
            if (!barcodes) return [];
            if (Array.isArray(barcodes)) return barcodes.filter(b => typeof b === 'string');
            if (typeof barcodes === 'string') {
                let clean = barcodes.trim();
                if (clean.startsWith('{') && clean.endsWith('}')) {
                    return clean.substring(1, clean.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                }
                if (clean.startsWith('[') && clean.endsWith(']')) {
                    try {
                        return JSON.parse(clean);
                    } catch (e) {
                        return clean.substring(1, clean.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    }
                }
                return [clean];
            }
            return [];
        };

        const aliasList = getBarcodesArray(product?.barcodes);
        const hasAliasMatch = aliasList.some(b => {
            const cleanB = b.toUpperCase().trim();
            return normalized === cleanB || normalizedInput === normSku(cleanB);
        });

        const isValid =
            normalized === currentItem.sku?.toUpperCase() ||
            normalized === product?.barcode?.toUpperCase() ||
            hasAliasMatch ||
            normalizedInput === normSku(currentItem.sku || '') ||
            normalizedInput === normSku(product?.barcode || '');

        if (isValid) {
            playBeep('success');
            setIsProcessingScan(true);

            try {
                // 1. Update Job Item Status
                const itemIndex = selectedJob.lineItems.indexOf(currentItem);
                await updateJobItem(selectedJob.id, itemIndex, 'Picked', currentItem.expectedQty); // Assuming full pick

                // 2. Adjust Stock (if PICK)
                if (selectedJob.type === 'PICK' && adjustStockMutation) {
                    await adjustStockMutation.mutateAsync({
                        productId: currentItem.productId,
                        productName: currentItem.name,
                        productSku: currentItem.sku,
                        siteId: activeSite?.id,
                        quantity: -currentItem.expectedQty,
                        reason: `Picked for Job #${selectedJob.jobNumber}`,
                        type: 'OUT',
                        canApprove: true
                    });
                }

                // 3. Putaway Logic (Moved to PutawayScanner)
                // This line seems to be a malformed snippet from the instruction.
                // Assuming the intent was to remove the old PUTAWAY check and not introduce new invalid syntax.
                // The original block was:
                // if (selectedJob.type === 'PUTAWAY') {
                //     // Should not be reached
                // }

                // 4. Update Local State UI
                setLastCompletedItem({ name: currentItem.name, qty: currentItem.expectedQty });
                setLastCompletedStatus('success');
                setEarnedPoints({ points: 10, message: 'Item Picked', bonuses: [] }); // Simple points
                setShowPointsPopup(true);
                setTimeout(() => setShowPointsPopup(false), 2000);

                // 5. Check for Job Completion or Next Item
                // We use a fresh copy of items to check completion
                const nextItems = [...selectedJob.lineItems];
                nextItems[itemIndex] = { ...currentItem, status: 'Picked', pickedQty: currentItem.expectedQty };

                const nextPending = nextItems.find(i => i.status === 'Pending');

                if (nextPending) {
                    // Update the selectedJob locally to reflect the change immediately
                    setSelectedJob({
                        ...selectedJob,
                        lineItems: nextItems
                    });
                    // Reset Scanner
                    setScannerStep('NAV');
                    setScannedBay('');
                    setScannedItem('');
                } else {
                    // Job Complete!
                    const result = await completeJob(selectedJob.id, user?.id || 'driver', false, nextItems);
                    if (result && result.points) {
                        setEarnedPoints({ points: result.points, message: 'Job Finished!', bonuses: [] });
                        setShowPointsPopup(true);
                    }
                    addNotification('success', 'Job Completed!');
                    setSelectedJob(null); // Go back to list
                    setScannerStep('NAV');
                }

            } catch (err) {
                console.error(err);
                playBeep('error');
                addNotification('alert', 'Error processing scan');
            } finally {
                setIsProcessingScan(false);
            }

        } else {
            playBeep('error');
            addNotification('alert', 'Wrong item scanned!');
        }
    };

    // --- RENDER ---

    // 1. Job Selection List (if no job selected)
    if (!selectedJob || showScannerList) {
        return (
            <div className="fixed inset-0 z-50 bg-[#18201B] flex flex-col">
                <div className="p-4 bg-[#1E2822] border-b border-[#E2DCCE]/10 dark:border-emerald-950/20 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#EAE5D9] uppercase tracking-wider">{t('warehouse.selectJob')}</h2>
                    <button onClick={() => setIsScannerMode(false)} aria-label="Close Scanner" className="text-stone-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Render Filtered Jobs */}
                    {myScannerJobs.length === 0 ? (
                        <div className="text-center text-stone-500 mt-20">
                            <Package size={48} className="mx-auto mb-4 opacity-50 text-[#A9CBA2]" />
                            <p>{t('warehouse.noJobsAvailable')}</p>
                        </div>
                    ) : (
                        myScannerJobs.map((job: any) => (
                            <div
                                key={job.id}
                                onClick={() => {
                                    setSelectedJob(job);
                                    setScannerStep('NAV');
                                }}
                                className="glass-panel p-4 hover:border-[#CFC6B4] dark:hover:border-[#A9CBA2]/25 cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 font-bold text-xs uppercase">
                                                {job.type}
                                            </span>
                                            <span className="text-stone-850 dark:text-[#EAE5D9] font-mono font-bold text-lg">{formatJobId(job)}</span>
                                        </div>
                                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">To: {job.assignedTo || 'Unassigned'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${job.priority === 'High' || job.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2] border border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30'} `}>
                                            {job.priority}
                                        </span>
                                        <div className="mt-2 text-stone-550 text-xs">
                                            {job.items || job.lineItems?.length} items
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-[#E2DCCE]/30 dark:border-emerald-950/20 flex justify-between items-center">
                                    <span className="text-xs text-stone-500">{job.sourceSiteId ? `From: ${sites.find(s => s.id === job.sourceSiteId)?.name} ` : ''}</span>
                                    <ChevronRight size={16} className="text-stone-400 dark:text-stone-500 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // 2. Active Job Workflow
    const expiry = currentProduct ? getExpiryStatus(currentProduct.expiryDate) : { color: '', label: '' };

    // If no pending items, but job not null -> All Done Screen
    if (!currentItem) {
        return (
            <div className="fixed inset-0 z-50 bg-[#18201B] flex flex-col items-center justify-center text-white p-6">
                <CheckCircle size={64} className="text-[#A9CBA2] mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('warehouse.jobComplete')}</h2>
                <button onClick={() => setSelectedJob(null)} className="woody-btn-secondary px-6 py-3 mt-6">
                    {t('warehouse.backToJobs')}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#18201B] flex flex-col">
            {/* Header */}
            <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] bg-[#1E2822] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-[#E2DCCE]/10 dark:border-emerald-950/20">
                <div className="text-white w-full md:w-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="font-bold text-lg text-[#EAE5D9]">{selectedJob.type} {formatJobId(selectedJob)}</h2>
                            <p className="text-xs text-stone-400">{selectedJob.lineItems.length} {t('warehouse.items')} • {selectedJob.lineItems.filter(i => i.status === 'Pending').length} {t('warehouse.remaining')}</p>
                        </div>
                        <button onClick={() => setSelectedJob(null)} aria-label="Back to Jobs" className="md:hidden text-stone-450 p-2">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setSelectedJob(null)} className="hidden md:block text-stone-400 hover:text-white text-sm font-bold">
                        {t('warehouse.backToJobs')}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center overflow-hidden relative">

                {/* Item Completion Overlay */}
                {lastCompletedItem && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#2C5E3B] to-[#1E3F27] flex items-center justify-center animate-pulse border border-[#A9CBA2]/30">
                                <CheckCircle size={48} className="text-[#A9CBA2]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-white">Picked</h3>
                            <p className="text-[#A9CBA2] font-bold text-lg mb-1">{lastCompletedItem.qty}x {lastCompletedItem.name}</p>
                        </div>
                    </div>
                )}

                {/* --- NAV STEP (Location) --- */}
                {scannerStep === 'NAV' && (
                    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-full flex items-center justify-center mx-auto border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">
                                <MapIcon size={40} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            </div>
                            <h1 className="text-4xl font-black text-[#EAE5D9] tracking-tight uppercase italic">
                                {selectedJob.type === 'PUTAWAY' ? t('warehouse.selectStorage') : t('warehouse.locateItem')}
                            </h1>
                            <p className="text-stone-400 text-lg">
                                {t('warehouse.goToLocation')}: <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-bold text-2xl">{currentProduct?.location || 'Unknown'}</span>
                            </p>
                        </div>

                        {/* Location Input */}
                        <div className="relative group/input max-w-md mx-auto">
                            <input
                                ref={locationInputRef}
                                aria-label="Location Scanner Input"
                                type="text"
                                placeholder="Scan Location Barcode"
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    scanOnlyHandlers.onKeyDown(e);
                                    if (e.key === 'Enter') handleLocationScan(locationSearch);
                                }}
                                onPaste={scanOnlyHandlers.onPaste}
                                className="woody-input py-6 px-8 text-3xl font-mono text-center uppercase"
                                autoFocus
                            />
                            <button
                                onClick={() => handleLocationScan(locationSearch)}
                                className="mt-4 woody-btn-primary w-full py-4 text-lg font-bold"
                            >
                                {t('warehouse.confirmLocation')}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- SCAN STEP (Item) --- */}
                {scannerStep === 'SCAN' && (
                    <div className="w-full max-w-md mx-auto space-y-6 pb-24 md:pb-0 px-4 md:px-0">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative inline-block shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-3xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/10 bg-[#1C2620]/60 overflow-hidden flex items-center justify-center">
                                {currentItem.image && !currentItem.image.includes('placeholder') ? (
                                    <img src={currentItem.image} className="w-full h-full object-cover" alt={currentItem.name} />
                                ) : (
                                    <Package size={48} className="text-stone-500" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[#EAE5D9] text-center">{currentItem.name}</h2>
                                <p className="text-center text-stone-400 font-mono mt-1">{currentItem.sku}</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <MetricBadge label="Qty" value={currentItem.expectedQty} color="border-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10" />
                            <MetricBadge label="Stock" value={currentProduct?.stock || 0} color="border-stone-500 text-stone-450 bg-stone-100/10 dark:bg-white/5" />
                        </div>

                        {/* Scanner Input */}
                        <div className="glass-panel p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Scan className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                                <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold">{t('warehouse.scanProductBarcode')}</p>
                            </div>
                            <input
                                ref={itemInputRef}
                                aria-label="Item Scanner Input"
                                type="text"
                                value={scannedItem}
                                onChange={(e) => setScannedItem(e.target.value)}
                                onKeyDown={(e) => {
                                    scanOnlyItemHandlers.onKeyDown(e);
                                    if (e.key === 'Enter') handleItemScan();
                                }}
                                onPaste={scanOnlyItemHandlers.onPaste}
                                className="woody-input font-mono text-lg text-center"
                                autoFocus
                            />
                            <button
                                disabled={isProcessingScan}
                                onClick={() => handleItemScan()}
                                className="w-full mt-4 woody-btn-primary py-4 text-xl flex items-center justify-center gap-2"
                            >
                                {isProcessingScan ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
                                {t('warehouse.confirm')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
