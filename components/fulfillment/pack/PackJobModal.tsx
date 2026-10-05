import React, { useState, useMemo } from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Archive, Info, Barcode, Loader2, Printer, AlertTriangle, Snowflake,
    Hash, Truck, ShieldCheck
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { resolveCountAndPackPolicy } from '../../../utils/receivingPolicy';
import { ProgressBar } from '../../shared/ProgressBar';
import { getProductForItem, getItemMeasureQty as getItemMeasureQtyShared } from './utils/packItemHelpers';
import { getSellUnit, formatProductSize, formatPackagingDescription } from '../../../utils/units';
import { PackJobMaterialsPanel } from './components/PackJobMaterialsPanel';
import { PackJobHeader } from './components/PackJobHeader';
import { PackJobItemCard } from './components/PackJobItemCard';

interface PackJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    onStartPack: (job: WMSJob) => void;
    onUpdateItemQty: (itemIndex: number, qty: number) => void;
    onCompleteJob: (boxDetails: any) => void;
    onPrintLabel: (boxDetails: any) => void;
    isSubmitting: boolean;
    resolveOrderRef: (ref?: string) => string;
    onOpenScanner?: () => void;
    onPrintItemLabel?: (item: any, product?: any, boxSize?: string) => void;
    onFlagDiscrepancy?: () => void;
}

export const PackJobModal: React.FC<PackJobModalProps> = ({
    isOpen,
    onClose,
    job,
    user,
    sites,
    products,
    onStartPack,
    onUpdateItemQty,
    onCompleteJob,
    onPrintLabel,
    isSubmitting,
    resolveOrderRef,
    onOpenScanner,
    onPrintItemLabel,
    onFlagDiscrepancy,
}) => {
    const { t } = useLanguage();
    const { settings, effectiveCountry } = useData();
    const packPolicy = resolveCountAndPackPolicy(settings, effectiveCountry);

    const [boxSize, setBoxSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Poly Mailer' | 'Thermal Cool Box'>('Medium');
    const [packingMaterials, setPackingMaterials] = useState({
        bubbleWrap: false,
        fragileStickers: false,
        thisSideUp: false,
        securitySeal: packPolicy.requirePackSecuritySeal || false
    });
    const [sealSerialNumber, setSealSerialNumber] = useState('');
    const [scaleWeight, setScaleWeight] = useState('');
    const [hasIcePack, setHasIcePack] = useState(false);

    // Item-level Scanning State (must be before early return to satisfy React hooks rules)
    const [scanInput, setScanInput] = useState('');
    const [scannedItemIndex, setScannedItemIndex] = useState<number | null>(null);
    const [confirmQty, setConfirmQty] = useState('');
    const [scanError, setScanError] = useState('');
    const scanInputRef = React.useRef<HTMLInputElement>(null);
    const lastKeyTime = React.useRef<number>(Date.now());

    React.useEffect(() => {
        if (isOpen && !scannedItemIndex) {
            setTimeout(() => scanInputRef.current?.focus(), 100);
        }
    }, [isOpen, scannedItemIndex]);

    if (!isOpen) return null;

    const getProduct = (item: any) => getProductForItem(item, job, products);
    const getItemMeasureQty = (item: any, product?: any) => getItemMeasureQtyShared(item, job, products, product);

    const destSite = job.destSiteId ? sites.find(s => s.id === job.destSiteId) : undefined;
    const totalItems = job.lineItems?.length || 0;
    const completedItems = job.lineItems?.filter(i => {
        // In Pack context: Picked = verified, packed = confirmed via scanner
        if (i.status === 'Completed' || i.status === 'Picked' || (i as any).packed === true) return true;
        const measureQty = getItemMeasureQty(i);
        const requiredAmount = measureQty || i.expectedQty || 1;
        return (i.pickedQty || 0) >= requiredAmount - 0.001;
    }).length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isFullyPacked = completedItems === totalItems && totalItems > 0;

    const hasColdItems = job.lineItems?.some(item => ['Frozen', 'Dairy'].includes(getProduct(item)?.category || ''));
    const hasFragileItems = job.lineItems?.some(item => {
        const cat = getProduct(item)?.category || '';
        return ['Electronics', 'Glass', 'Beverages'].some(f => cat.includes(f));
    });

    const handleScanItem = (e: React.FormEvent) => {
        e.preventDefault();
        const barcode = scanInput.trim().toUpperCase();
        if (!barcode) return;

        let foundIndex = -1;

        job.lineItems?.forEach((item, index) => {
            const measureQty = getItemMeasureQty(item);
            const requiredAmount = measureQty || item.expectedQty || 1;
            if (item.status === 'Completed' || (item.pickedQty || 0) >= requiredAmount) return;
            const product = getProduct(item);
            if (
                item.sku?.toUpperCase() === barcode ||
                product?.sku?.toUpperCase() === barcode ||
                product?.barcode?.toUpperCase() === barcode
            ) {
                foundIndex = index;
            }
        });

        if (foundIndex > -1) {
            setScannedItemIndex(foundIndex);
            // Default confirm input to expected quantity (or measure if applicable)
            const item = job.lineItems![foundIndex];
            const expected = item.expectedQty || 1;
            const measureQty = getItemMeasureQty(item);
            if (measureQty) {
                setConfirmQty(measureQty.toString());
            } else {
                setConfirmQty(expected.toString());
            }
            setScanError('');
        } else {
            setScanError(t('warehouse.packing.itemNotFoundInPackMission'));
            setTimeout(() => setScanError(''), 2000);
        }
        setScanInput('');
    };

    const submitQtyConfirm = () => {
        if (scannedItemIndex === null) return;
        const qtyRaw = parseFloat(confirmQty) || 0;

        if (qtyRaw > 0) {
            onUpdateItemQty(scannedItemIndex, qtyRaw);
        }
        setScannedItemIndex(null);
        setConfirmQty('');
        setTimeout(() => scanInputRef.current?.focus(), 100);
    };

    const expectedWeightKg = useMemo(() => {
        const tare = boxSize === 'Small' ? 0.2 : boxSize === 'Medium' ? 0.4 : boxSize === 'Large' ? 0.8 : 1.2;
        const itemsMass = (job.lineItems || []).reduce((sum, item) => {
            const prod = getProduct(item);
            const w = (prod as any)?.weight || 0.5;
            const q = item.pickedQty || item.expectedQty || 1;
            return sum + (w * q);
        }, 0);
        return parseFloat((tare + itemsMass).toFixed(2));
    }, [job.lineItems, boxSize, products]);

    const boxDetails = {
        boxSize,
        packingMaterials,
        sealSerialNumber: sealSerialNumber.trim() || undefined,
        scaleWeight: parseFloat(scaleWeight) || undefined,
        expectedWeightKg,
        hasIcePack,
        hasColdItems,
        hasFragileItems,
        destSiteName: destSite?.name,
        destSite
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 bg-black/80 overflow-x-hidden">
            <div className="bg-[#FAF8F5] dark:bg-[#1C2620] w-full max-w-5xl min-h-[70dvh] max-h-[95dvh] md:min-h-0 md:max-h-[90vh] rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Visual Flair */}
                <div className="hidden md:block absolute -top-32 -right-32 w-96 h-96 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-32 -left-32 w-96 h-96 bg-[#A9CBA2]/10 dark:bg-[#A9CBA2]/25 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <PackJobHeader
                    isFullyPacked={isFullyPacked}
                    job={job}
                    destSite={destSite}
                    onClose={onClose}
                    t={t}
                />

                {/* Content */}
                <div className="flex-1 min-h-0 flex flex-col dark:bg-[radial-gradient(circle_at_50%_0%,rgba(44,94,59,0.03),transparent)] bg-stone-50 dark:bg-black/10">
                    
                    {/* Top Row / Stats */}
                    <div className="p-3 md:p-4 shrink-0 border-b border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/40">
                        <div className="flex items-center justify-between gap-3 shrink-0">
                            {/* Job Progress Pill */}
                            <div className="flex items-center gap-3 shrink-0 bg-white dark:bg-white/[0.02] border border-[#E2DCCE]/65 dark:border-white/5 px-3 py-1.5 rounded-xl">
                                <span className="text-xs font-mono font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                    <span className="text-gray-900 dark:text-white">{completedItems}</span> / {totalItems} {t('warehouse.packed') || 'Packed'}
                                </span>
                                <div className="w-20 md:w-24 h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden shrink-0">
                                    <ProgressBar
                                        progress={progressPercent}
                                        containerClassName="h-full bg-transparent"
                                        fillClassName={`h-full transition-all duration-300 ${isFullyPacked ? 'bg-green-500' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2]'}`}
                                    />
                                </div>
                            </div>
                            
                            {/* Tracking Number (Compact) */}
                            {job.trackingNumber && (
                                <div className="flex items-center gap-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-3 py-1.5 rounded-xl shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    <Hash size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                    <span className="text-xs font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{job.trackingNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columns Wrapper */}
                    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar bg-stone-50 dark:bg-black/10">
                        
                        {/* Left Col: Items List */}
                        <div className="flex-1 p-3 md:p-5 lg:border-r border-[#E2DCCE]/60 dark:border-white/10 lg:overflow-y-auto lg:custom-scrollbar">
                            <div className="space-y-2">
                                {job.lineItems?.map((item, idx) => (
                                    <PackJobItemCard
                                        key={idx}
                                        item={item}
                                        idx={idx}
                                        job={job}
                                        products={products}
                                        boxSize={boxSize}
                                        scannedItemIndex={scannedItemIndex}
                                        confirmQty={confirmQty}
                                        setConfirmQty={setConfirmQty}
                                        setScannedItemIndex={setScannedItemIndex}
                                        submitQtyConfirm={submitQtyConfirm}
                                        onPrintItemLabel={onPrintItemLabel}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right Col: Details & Action */}
                        <PackJobMaterialsPanel
                            progressPercent={progressPercent}
                            isFullyPacked={isFullyPacked}
                            destSite={destSite}
                            job={job}
                            boxSize={boxSize}
                            setBoxSize={setBoxSize}
                            hasFragileItems={hasFragileItems}
                            packingMaterials={packingMaterials}
                            setPackingMaterials={setPackingMaterials}
                            hasColdItems={hasColdItems}
                            hasIcePack={hasIcePack}
                            setHasIcePack={setHasIcePack}
                            t={t}
                            sealSerialNumber={sealSerialNumber}
                            setSealSerialNumber={setSealSerialNumber}
                            scaleWeight={scaleWeight}
                            setScaleWeight={setScaleWeight}
                            requireSeal={packPolicy.requirePackSecuritySeal}
                            requireWeight={packPolicy.requirePackCartonWeight}
                            expectedWeightKg={expectedWeightKg}
                            weightTolerancePct={packPolicy.packWeightTolerancePct}
                        />
                    </div>
                </div>

                <div className="p-3 sm:p-4 md:p-6 border-t border-[#E2DCCE]/60 dark:border-emerald-950/20 bg-[#FAF8F5]/50 dark:bg-zinc-950/40 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 relative z-20">
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button
                            onClick={() => onPrintLabel(boxDetails)}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none min-h-[44px] px-3.5 md:px-6 py-2.5 md:py-3.5 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-[#EAE5D9]/25 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white active:scale-95 transition-colors rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Printer size={16} className="md:w-4 md:h-4" /> <span>{t('warehouse.printLabel')}</span>
                        </button>
                        {/* Flag Discrepancy — packer count doesn't match manifest */}
                        {onFlagDiscrepancy && job.status !== 'Completed' && (
                            <button
                                onClick={onFlagDiscrepancy}
                                className="flex-1 sm:flex-none min-h-[44px] px-3.5 md:px-6 py-2.5 md:py-3.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 active:scale-95 transition-colors rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={16} className="md:w-4 md:h-4" /> <span>{t('warehouse.packing.flagCountIssue')}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 sm:flex-1 justify-end">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 md:px-7 md:py-3.5 rounded-xl md:rounded-2xl bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-gray-700 dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white font-black text-xs uppercase tracking-widest transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                            {t('warehouse.dismiss')}
                        </button>

                        {job.status !== 'Completed' && (
                            !isFullyPacked ? (
                                <button
                                    onClick={() => {
                                        if (onOpenScanner) onOpenScanner();
                                        else onStartPack(job);
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 md:px-8 md:py-3.5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95 bg-[#2C5E3B] hover:bg-[#1B3520] text-white border border-[#2C5E3B]/20 shadow-[#2C5E3B]/20 cursor-pointer"
                                >
                                    <span>Start Packing</span>
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (hasColdItems && !hasIcePack) {
                                            alert(t('warehouse.packing.icePacksRequired'));
                                            return;
                                        }
                                        if (packPolicy.requirePackSecuritySeal && packingMaterials.securitySeal && !sealSerialNumber.trim()) {
                                            alert('Security Tamper Seal serial number is required before completing packing.');
                                            return;
                                        }
                                        if (packPolicy.requirePackCartonWeight) {
                                            const weightNum = parseFloat(scaleWeight);
                                            if (!weightNum || weightNum <= 0) {
                                                alert('Carton scale weight is required before completing packing.');
                                                return;
                                            }
                                            const variancePct = Math.abs(weightNum - expectedWeightKg) / (expectedWeightKg || 1) * 100;
                                            if (variancePct > packPolicy.packWeightTolerancePct) {
                                                if (!confirm(`Warning: Scale weight (${weightNum}kg) varies by ${variancePct.toFixed(1)}% from expected (${expectedWeightKg}kg). Tolerance is ±${packPolicy.packWeightTolerancePct}%. Proceed anyway?`)) {
                                                    return;
                                                }
                                            }
                                        }
                                        onCompleteJob(boxDetails);
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 md:px-8 md:py-3.5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95 bg-green-600 hover:bg-green-500 border border-green-400/50 text-white shadow-green-500/25 cursor-pointer"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> : (
                                        <>
                                            <CheckCircle size={16} />
                                            <span>Complete Packing</span>
                                        </>
                                    )}
                                </button>
                            )
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PackJobModal;
