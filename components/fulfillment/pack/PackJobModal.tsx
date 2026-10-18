import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Lock } from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { resolveCountAndPackPolicy } from '../../../utils/receivingPolicy';
import { getProductForItem, getItemMeasureQty as getItemMeasureQtyShared } from './utils/packItemHelpers';
import { PackJobHeader } from './components/PackJobHeader';
import { PackStepIndicator, PackStep } from './steps/PackStepIndicator';
import { Step1PackDetails } from './steps/Step1PackDetails';
import { Step1PackItems } from './steps/Step1PackItems';
import { Step2BoxPrep, BoxSizeType, PackingMaterialsState } from './steps/Step2BoxPrep';
import { Step3WeighSeal } from './steps/Step3WeighSeal';
import { Step4PrintFinish } from './steps/Step4PrintFinish';
import { PackJobFooter } from './components/PackJobFooter';

interface PackJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    onStartPack: (job: WMSJob) => void | Promise<void>;
    onCompleteJob: (boxDetails: any) => void;
    onPrintLabel: (boxDetails: any) => void;
    isSubmitting: boolean;
    resolveOrderRef: (ref?: string) => string;
    onOpenScanner?: () => void;
    onPrintItemLabel?: (item: any, product?: any, boxSize?: string) => void;
    onFlagDiscrepancy?: () => void;
    onDeleteJob?: (jobId: string) => void;
}

export const PackJobModal: React.FC<PackJobModalProps> = ({
    isOpen,
    onClose,
    job,
    user,
    sites,
    products,
    onStartPack,
    onCompleteJob,
    onPrintLabel,
    isSubmitting,
    resolveOrderRef,
    onOpenScanner,
    onPrintItemLabel,
    onFlagDiscrepancy,
    onDeleteJob,
}) => {
    const { t } = useLanguage();
    const { settings, effectiveCountry } = useData();
    const packPolicy = resolveCountAndPackPolicy(settings, effectiveCountry);
    const canDelete = ['super_admin', 'warehouse_manager', 'operations_manager', 'regional_manager'].includes(user?.role || '');

    // Active wizard step - starts on Job Details overview
    const [step, setStep] = useState<PackStep>('DETAILS');

    useEffect(() => {
        setStep('DETAILS');
    }, [job?.id]);

    const handleStartScanning = async () => {
        try {
            if (job.status === 'Pending') await onStartPack(job);
            setStep('ITEMS');
            if (onOpenScanner) onOpenScanner();
        } catch {
            // Keep the worker on job details when the status update fails.
        }
    };

    // Box and Materials State
    const [boxSize, setBoxSize] = useState<BoxSizeType>('Medium');
    const [packingMaterials, setPackingMaterials] = useState<PackingMaterialsState>({
        bubbleWrap: false,
        fragileStickers: false,
        thisSideUp: false,
        securitySeal: packPolicy.requirePackSecuritySeal || false,
    });
    const [sealSerialNumber, setSealSerialNumber] = useState('');
    const [scaleWeight, setScaleWeight] = useState('');
    const [hasIcePack, setHasIcePack] = useState(false);

    const getProduct = (item: any) => getProductForItem(item, job, products);
    const getItemMeasureQty = (item: any, product?: any) => getItemMeasureQtyShared(item, job, products, product);

    const destSite = job?.destSiteId ? sites.find(s => s.id === job.destSiteId) : undefined;
    const totalItems = job?.lineItems?.length || 0;
    const completedItems = job?.lineItems?.filter(i => {
        if (job?.status === 'Completed') return true;
        if ((i as any).packed === true) return true;
        const measureQty = getItemMeasureQty(i);
        const requiredAmount = measureQty || i.expectedQty || 1;
        const packedQty = (i as any).packedQty ?? 0;
        return packedQty >= requiredAmount - 0.001;
    }).length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isFullyPacked = completedItems === totalItems && totalItems > 0;
    const totalUnits = useMemo(() => {
        return (job?.lineItems || []).reduce((sum, item) => {
            const prod = getProduct(item);
            const measureQty = getItemMeasureQty(item, prod);
            return sum + (measureQty || item.expectedQty || 1);
        }, 0);
    }, [job?.lineItems, products]);

    const hasColdItems = job?.lineItems?.some(item => ['Frozen', 'Dairy'].includes(getProduct(item)?.category || ''));
    const hasFragileItems = job?.lineItems?.some(item => {
        const cat = getProduct(item)?.category || '';
        return ['Electronics', 'Glass', 'Beverages'].some(f => cat.includes(f));
    });

    // Calculate items mass and expected weight
    const expectedWeightKg = useMemo(() => {
        const tare = boxSize === 'Small' ? 0.2 : boxSize === 'Medium' ? 0.4 : boxSize === 'Large' ? 0.8 : 1.2;
        const itemsMass = (job?.lineItems || []).reduce((sum, item) => {
            const prod = getProduct(item);
            const w = (prod as any)?.weight || 0.5;
            const q = item.pickedQty || item.expectedQty || 1;
            return sum + (w * q);
        }, 0);
        return parseFloat((tare + itemsMass).toFixed(2));
    }, [job?.lineItems, boxSize, products]);

    // Smart box recommendation
    const recommendedBoxSize: BoxSizeType = useMemo(() => {
        if (hasColdItems) return 'Thermal Cool Box';
        if (expectedWeightKg <= 2.2) return 'Small';
        if (expectedWeightKg <= 8.5) return 'Medium';
        if (expectedWeightKg <= 20) return 'Large';
        return 'Extra Large';
    }, [hasColdItems, expectedWeightKg]);

    // Apply recommended packing presets when the modal opens; preserve wizard step on scanner return.
    const prevOpenRef = useRef(false);
    useEffect(() => {
        if (isOpen && !prevOpenRef.current) {
            if (recommendedBoxSize) {
                setBoxSize(recommendedBoxSize);
                if (hasColdItems) setHasIcePack(true);
                if (hasFragileItems) {
                    setPackingMaterials(prev => ({ ...prev, bubbleWrap: true, fragileStickers: true }));
                }
            }
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, isFullyPacked, recommendedBoxSize, hasColdItems, hasFragileItems]);

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
        destSite,
    };

    // Validation helper before completing order
    const handleFinalComplete = () => {
        if (hasColdItems && !hasIcePack && boxSize !== 'Thermal Cool Box') {
            alert(t('warehouse.packing.icePacksRequired') || 'Ice Packs / Cool Box required for cold-chain goods.');
            setStep('BOX');
            return;
        }
        if (packPolicy.requirePackSecuritySeal && packingMaterials.securitySeal && !sealSerialNumber.trim()) {
            alert('Security Tamper Seal serial number is required before completing packing.');
            setStep('WEIGH');
            return;
        }
        if (packPolicy.requirePackCartonWeight) {
            const weightNum = parseFloat(scaleWeight);
            if (!weightNum || weightNum <= 0) {
                alert('Carton scale weight is required before completing packing.');
                setStep('WEIGH');
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
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 bg-black/80 overflow-x-hidden">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-5xl h-[92dvh] md:h-[88vh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <PackJobHeader
                    isFullyPacked={isFullyPacked}
                    job={job}
                    destSite={destSite}
                    onClose={onClose}
                    t={t}
                />

                {/* Step Indicator */}
                <PackStepIndicator
                    currentStep={step}
                    setStep={setStep}
                    isFullyPacked={isFullyPacked}
                    hasBoxSelected={Boolean(boxSize)}
                    hasWeightEntered={Boolean(parseFloat(scaleWeight) > 0)}
                    t={t}
                />

                {/* Step Content Panels */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {step === 'DETAILS' && (
                        <Step1PackDetails
                            job={job}
                            destSite={destSite}
                            totalItems={totalItems}
                            totalUnits={totalUnits}
                            hasColdItems={hasColdItems}
                            hasFragileItems={hasFragileItems}
                            expectedWeightKg={expectedWeightKg}
                            getProduct={getProduct}
                            getItemMeasureQty={getItemMeasureQty}
                            resolveOrderRef={resolveOrderRef}
                            t={t}
                        />
                    )}

                    {step === 'ITEMS' && (
                        <Step1PackItems
                            job={job}
                            products={products}
                            boxSize={boxSize}
                            totalItems={totalItems}
                            completedItems={completedItems}
                            progressPercent={progressPercent}
                            isFullyPacked={isFullyPacked}
                            onPrintItemLabel={onPrintItemLabel}
                        />
                    )}

                    {step === 'BOX' && (
                        <Step2BoxPrep
                            job={job}
                            boxSize={boxSize}
                            setBoxSize={setBoxSize}
                            recommendedBoxSize={recommendedBoxSize}
                            hasColdItems={hasColdItems}
                            hasFragileItems={hasFragileItems}
                            packingMaterials={packingMaterials}
                            setPackingMaterials={setPackingMaterials}
                            hasIcePack={hasIcePack}
                            setHasIcePack={setHasIcePack}
                            expectedWeightKg={expectedWeightKg}
                            t={t}
                        />
                    )}

                    {step === 'WEIGH' && (
                        <Step3WeighSeal
                            scaleWeight={scaleWeight}
                            setScaleWeight={setScaleWeight}
                            expectedWeightKg={expectedWeightKg}
                            weightTolerancePct={packPolicy.packWeightTolerancePct}
                            requireWeight={packPolicy.requirePackCartonWeight}
                            requireSeal={packPolicy.requirePackSecuritySeal}
                            packingMaterials={packingMaterials}
                            sealSerialNumber={sealSerialNumber}
                            setSealSerialNumber={setSealSerialNumber}
                            boxSize={boxSize}
                            t={t}
                        />
                    )}

                    {step === 'FINISH' && (
                        <Step4PrintFinish
                            job={job}
                            destSite={destSite}
                            boxSize={boxSize}
                            scaleWeight={scaleWeight}
                            expectedWeightKg={expectedWeightKg}
                            packingMaterials={packingMaterials}
                            sealSerialNumber={sealSerialNumber}
                            hasIcePack={hasIcePack}
                            hasColdItems={hasColdItems}
                            hasFragileItems={hasFragileItems}
                            isSubmitting={isSubmitting}
                            onPrintLabel={() => onPrintLabel(boxDetails)}
                            onFlagDiscrepancy={onFlagDiscrepancy}
                            t={t}
                        />
                    )}
                </div>

                {/* Bottom Navigation Toolbar */}
                <PackJobFooter
                    step={step}
                    setStep={setStep}
                    onClose={onClose}
                    job={job}
                    onAdvanceToScanning={handleStartScanning}
                    isFullyPacked={isFullyPacked}
                    handleFinalComplete={handleFinalComplete}
                    isSubmitting={isSubmitting}
                    canDelete={canDelete}
                    onDeleteJob={onDeleteJob}
                    t={t}
                />
            </div>
        </div>
    );
};

export default PackJobModal;
