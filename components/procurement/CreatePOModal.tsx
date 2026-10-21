import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import { PurchaseOrder, POItem, Product } from '../../types';
import { getCountryProfile, type Country } from '../../utils/localization';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { purchaseOrdersService } from '../../services/supabase.service';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { POItemForm } from './POItemForm';
import { POSupplierLogistics } from './POSupplierLogistics';
import { POItemsTable } from './POItemsTable';
import { POTotalsSummary } from './POTotalsSummary';
import { usePODraft } from './hooks/usePODraft';
import { useCreatePOData } from './hooks/useCreatePOData';
import { PODraftBanner } from './PODraftBanner';
import { buildPurchaseOrders, resolvePOVendor } from './createPOHelpers';
import { CreatePOFooter } from './CreatePOFooter';
import { logger } from '../../utils/logger';

interface CreatePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingPO?: PurchaseOrder | null;
    initialSupplierId?: string;
    initialProduct?: Product | null;
    initialDraft?: Partial<PurchaseOrder> | null;
    onSuccess: () => void;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
    isOpen, onClose, editingPO, initialSupplierId, initialProduct = null, initialDraft = null, onSuccess
}) => {
    const { user, showToast } = useStore();
    const { createPOMutation, updatePOMutation } = usePurchaseOrderMutations();
    const { allProducts, suppliers: contextSuppliers, sites, countrySites, settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || (settings?.country as Country) || 'ET');
    const countryProfile = getCountryProfile(activeCountry);
    const currencySymbol = countryProfile.currencySymbol;
    const isRegionalUser = Boolean(user?.role?.startsWith('regional_') || user?.regionCode);
    const activeRegionCode = user?.regionCode || null;

    const isPurchasingTaxEnabled = Boolean(settings?.countryConfigs?.[activeCountry]?.taxOnPurchasing ?? settings?.taxOnPurchasing);
    const defaultTaxRate = isPurchasingTaxEnabled ? (countryProfile.taxRate ?? (activeCountry === 'KE' ? 16 : 15)) : 0;
    const regionalAutonomousPoLimit = Number((settings?.countryConfigs?.[activeCountry] as any)?.regionalAutonomousPoLimit ?? (settings as any)?.regionalAutonomousPoLimit ?? 0);
    const isEditMode = Boolean(editingPO?.id);
    const enableAutoSave = (settings?.enablePoDraftAutoSave ?? true) && !initialDraft;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasUnsavedItemDraft, setHasUnsavedItemDraft] = useState(false);
    const [isManualVendor, setIsManualVendor] = useState(false);
    const [manualVendorName, setManualVendorName] = useState('');
    const [newPOSupplier, setNewPOSupplier] = useState('');
    const [destinationSiteIds, setDestinationSiteIds] = useState<string[]>([]);
    const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
    const [expectedDate, setExpectedDate] = useState('');
    const [poPriority, setPoPriority] = useState<'Normal' | 'High' | 'Urgent' | 'Low'>('Normal');
    const [quantityDistribution, setQuantityDistribution] = useState('per-store');
    const [poDelivery, setPoDelivery] = useState<{ tempReq: 'Ambient' | 'Chilled' | 'Frozen'; shelfLife: string; dockSlot: string }>({ tempReq: 'Ambient', shelfLife: '', dockSlot: '' });
    const [poNotes, setPoNotes] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [incoterms, setIncoterms] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);
    const [taxRate, setTaxRate] = useState<number>(defaultTaxRate);
    const [poRequestedBy, setPoRequestedBy] = useState('');
    const [newPOItems, setNewPOItems] = useState<POItem[]>([]);
    const [fullEditingIndex, setFullEditingIndex] = useState<number | null>(null);
    const hydratedKeyRef = useRef<string | null>(null);
    const { countryWarehouses, allSuppliers, effectiveProducts } = useCreatePOData({
        isOpen, activeCountry, allProducts: allProducts || [], contextSuppliers,
        sites, countrySites: countrySites || [], destinationSiteIds, isRegionalUser, activeRegionCode
    });

    const { draftMeta, isRestoredBannerVisible, dismissBanner, saveDraft, readStoredDraft, discardDraft } = usePODraft({
        countryCode: activeCountry, userId: user?.id, enabled: enableAutoSave, isEditMode, isOpen
    });

    // Computed Totals (accounting for multi-hub per-store multiplication)
    const hubCount = !isEditMode && destinationSiteIds.length > 1 ? destinationSiteIds.length : 1;
    const perStoreMultiplier = hubCount > 1 && quantityDistribution === 'per-store' ? hubCount : 1;
    const singleHubSubtotal = newPOItems.reduce((sum, item) => sum + item.totalCost, 0);
    const singleHubTax = Math.round(singleHubSubtotal * (taxRate / 100) * 100) / 100;
    const singleHubDiscount = Math.round(singleHubSubtotal * (discountRate / 100) * 100) / 100;
    const singleHubTotal = Math.round((singleHubSubtotal + singleHubTax + shippingCost - singleHubDiscount) * 100) / 100;

    const poSubtotal = Math.round(singleHubSubtotal * perStoreMultiplier * 100) / 100;
    const poTax = Math.round(singleHubTax * perStoreMultiplier * 100) / 100;
    const poDiscount = Math.round(singleHubDiscount * perStoreMultiplier * 100) / 100;
    const poTotal = Math.round(singleHubTotal * perStoreMultiplier * 100) / 100;
    const exceedsRegionalCap = Boolean(isRegionalUser && regionalAutonomousPoLimit > 0 && singleHubTotal > regionalAutonomousPoLimit);

    const resetPOForm = () => {
        setNewPOSupplier(''); setIsManualVendor(false); setManualVendorName('');
        setNewPOItems([]); setShippingCost(0); setPoNotes(''); setDiscountRate(0);
        setTaxRate(defaultTaxRate); setPaymentTerms(''); setIncoterms('');
        setDestinationSiteIds([]); setIsSiteDropdownOpen(false); setExpectedDate('');
        setPoDelivery({ tempReq: 'Ambient', shelfLife: '', dockSlot: '' });
        setQuantityDistribution('per-store'); setFullEditingIndex(null); setHasUnsavedItemDraft(false);
    };

    const handleDiscardDraft = () => {
        discardDraft();
        resetPOForm();
        const defaultSiteId = user?.siteId && countryWarehouses.find(w => w.id === user.siteId)
            ? user.siteId
            : (countryWarehouses[0]?.id || '');
        if (defaultSiteId) setDestinationSiteIds([defaultSiteId]);
        showToast("Saved PO draft deleted", "info");
    };

    // Hydrate Form State Once Per Open Session
    useEffect(() => {
        if (!isOpen) {
            hydratedKeyRef.current = null;
            resetPOForm();
            return;
        }

        const sessionKey = `${editingPO?.id || 'create'}-${initialSupplierId || ''}-${initialProduct?.id || ''}-${Boolean(initialDraft)}-${activeCountry}`;
        if (hydratedKeyRef.current === sessionKey) {
            if (destinationSiteIds.length === 0 && countryWarehouses.length > 0) {
                const defaultSiteId = (user?.siteId && countryWarehouses.find(w => w.id === user.siteId)?.id) || countryWarehouses[0].id;
                setDestinationSiteIds([defaultSiteId]);
            }
            return;
        }
        hydratedKeyRef.current = sessionKey;
        setPoRequestedBy(user?.name || '');

        const applyPOState = (sourcePO: Partial<PurchaseOrder>) => {
            const knownSupplier = sourcePO.supplierId ? allSuppliers.find(s => s.id === sourcePO.supplierId) : undefined;
            if (knownSupplier) {
                setIsManualVendor(false);
                setNewPOSupplier(knownSupplier.id);
                setManualVendorName('');
            } else if (sourcePO.supplierId && allSuppliers.length === 0) {
                setIsManualVendor(false);
                setNewPOSupplier(sourcePO.supplierId);
            } else if (sourcePO.supplierName && sourcePO.supplierName !== 'Preferred Supplier') {
                setIsManualVendor(true);
                setManualVendorName(sourcePO.supplierName);
            } else {
                setIsManualVendor(false);
                setNewPOSupplier('');
            }

            const items = sourcePO.lineItems || [];
            setNewPOItems(items);
            setPoNotes(sourcePO.notes || '');
            const validWh = sourcePO.siteId ? countryWarehouses.find(s => s.id === sourcePO.siteId) : undefined;
            setDestinationSiteIds(validWh ? [validWh.id] : (countryWarehouses[0] ? [countryWarehouses[0].id] : []));
            setExpectedDate(sourcePO.expectedDelivery ? String(sourcePO.expectedDelivery).split('T')[0] : '');
            setPoDelivery({ tempReq: sourcePO.tempReq || 'Ambient', shelfLife: sourcePO.shelfLife || '', dockSlot: sourcePO.dockSlot || '' });
            setPoPriority((sourcePO.priority as any) || 'Normal');
            setPaymentTerms(sourcePO.paymentTerms || '');
            setIncoterms(sourcePO.incoterms || '');
            setShippingCost(sourcePO.shippingCost || 0);

            const poItemsSubtotal = items.reduce((sum, item) => sum + (item.totalCost || item.quantity * item.unitCost), 0);
            setTaxRate(sourcePO.taxAmount !== undefined && poItemsSubtotal > 0 ? Math.round((sourcePO.taxAmount / poItemsSubtotal) * 10000) / 100 : defaultTaxRate);
            setDiscountRate(sourcePO.discount !== undefined && poItemsSubtotal > 0 ? Math.round((sourcePO.discount / poItemsSubtotal) * 10000) / 100 : 0);
        };

        if (editingPO) {
            applyPOState(editingPO);
            if (editingPO.id && (!editingPO.lineItems || editingPO.lineItems.length === 0)) {
                purchaseOrdersService.getById(editingPO.id).then(fullPO => {
                    if (fullPO) applyPOState(fullPO);
                }).catch(err => logger.error('CreatePOModal', 'Failed to load full PO details for edit', err as Error));
            }
        } else if (initialDraft) {
            applyPOState(initialDraft);
        } else {
            const storedDraft = readStoredDraft();
            if (storedDraft?.data) {
                const d = storedDraft.data;
                setIsManualVendor(Boolean(d.isManualVendor));
                setManualVendorName(d.manualVendorName || '');
                setNewPOSupplier(initialSupplierId || d.newPOSupplier || '');
                const validSites = (d.destinationSiteIds || []).filter(id => countryWarehouses.some(w => w.id === id));
                setDestinationSiteIds(validSites.length > 0 ? validSites : (countryWarehouses[0] ? [countryWarehouses[0].id] : []));
                setExpectedDate(d.expectedDate || '');
                setPoDelivery({ tempReq: d.tempReq || 'Ambient', shelfLife: d.shelfLife || '', dockSlot: d.dockSlot || '' });
                setPoPriority(d.poPriority || 'Normal');
                setQuantityDistribution(d.quantityDistribution || 'per-store');
                setNewPOItems(d.newPOItems || []);
                setPoNotes(d.poNotes || '');
                setPaymentTerms(d.paymentTerms || '');
                setIncoterms(d.incoterms || '');
                setShippingCost(d.shippingCost || 0);
                setDiscountRate(d.discountRate || 0);
                setTaxRate(d.taxRate !== undefined ? d.taxRate : defaultTaxRate);
            } else {
                const defaultSiteId = (user?.siteId && countryWarehouses.find(w => w.id === user.siteId)?.id) || countryWarehouses[0]?.id || '';
                setDestinationSiteIds(defaultSiteId ? [defaultSiteId] : []);
                setTaxRate(defaultTaxRate);
                setDiscountRate(0);
                if (initialSupplierId) setNewPOSupplier(initialSupplierId);
            }
        }
    }, [isOpen, editingPO, initialDraft, initialSupplierId, initialProduct?.id, user, countryWarehouses, activeCountry, defaultTaxRate, readStoredDraft, allSuppliers]);

    useEffect(() => {
        if (!isOpen || allSuppliers.length === 0) return;
        const targetSupplierId = editingPO?.supplierId || initialDraft?.supplierId || initialSupplierId;
        if (targetSupplierId && allSuppliers.some(s => s.id === targetSupplierId)) {
            setIsManualVendor(false);
            setNewPOSupplier(targetSupplierId);
        }
    }, [isOpen, allSuppliers, editingPO?.supplierId, initialDraft?.supplierId, initialSupplierId]);

    useEffect(() => {
        if (!isOpen || isEditMode || !enableAutoSave) return;
        const timer = setTimeout(() => {
            const selectedSupplierObj = allSuppliers.find(s => s.id === newPOSupplier);
            const supplierDisplayName = isManualVendor ? manualVendorName : selectedSupplierObj?.name;
            saveDraft({
                isManualVendor, manualVendorName, newPOSupplier, destinationSiteIds,
                expectedDate, ...poDelivery, poPriority, quantityDistribution,
                newPOItems, poNotes, paymentTerms, incoterms, shippingCost, discountRate, taxRate
            }, supplierDisplayName);
        }, 350);
        return () => clearTimeout(timer);
    }, [
        isOpen, isEditMode, enableAutoSave, isManualVendor, manualVendorName,
        newPOSupplier, destinationSiteIds, expectedDate, poDelivery, poPriority,
        quantityDistribution, newPOItems, poNotes, paymentTerms, incoterms,
        shippingCost, discountRate, taxRate, allSuppliers, saveDraft
    ]);

    const handleAddItem = (item: POItem) => {
        setNewPOItems(prev => {
            if (item.identityType === 'known' && item.productId) {
                const dupIdx = prev.findIndex(existing =>
                    existing.identityType === 'known' &&
                    (existing.productId === item.productId || (existing.sku && existing.sku === item.sku)) &&
                    (existing.packQuantity || 1) === (item.packQuantity || 1) &&
                    (existing.caseSize || 0) === (item.caseSize || 0)
                );
                if (dupIdx !== -1) {
                    const existing = prev[dupIdx];
                    const mergedQty = existing.quantity + item.quantity;
                    const mergedItem: POItem = {
                        ...existing, ...item,
                        quantity: mergedQty,
                        totalCost: Math.round(mergedQty * item.unitCost * 100) / 100
                    };
                    showToast(`Merged quantity for ${item.productName} (${mergedQty})`, 'info');
                    return prev.map((row, idx) => idx === dupIdx ? mergedItem : row);
                }
            }
            showToast(`Added: ${item.productName}`, 'success');
            return [...prev, item];
        });
    };

    const handleUpdateItem = (updatedItem: POItem) => {
        if (fullEditingIndex !== null) {
            setNewPOItems(prev => prev.map((item, idx) => idx === fullEditingIndex ? updatedItem : item));
            showToast(`Updated: ${updatedItem.productName}`, 'success');
            setFullEditingIndex(null);
        }
    };

    const handleInlineUpdate = (index: number, updatedItem: POItem) => {
        setNewPOItems(prev => prev.map((item, idx) => idx === index ? updatedItem : item));
    };

    const handleRemoveItem = (index: number) => {
        if (fullEditingIndex === index) setFullEditingIndex(null);
        setNewPOItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleFullEdit = (index: number) => {
        setFullEditingIndex(index);
        const formElement = document.getElementById('po-item-form-container');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleCreatePO = async () => {
        if (hasUnsavedItemDraft) {
            showToast('You have an un-added item in the form above. Click "Add Item to Order" or clear it before submitting.', 'warning');
            const formElement = document.getElementById('po-item-form-container');
            if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (newPOItems.length === 0) {
            showToast("Please add items to the order.", 'warning');
            return;
        }
        if (destinationSiteIds.length === 0) {
            showToast("Select a receiving Warehouse or Distribution Center.", 'warning');
            return;
        }
        const invalidSites = destinationSiteIds
            .map(id => sites.find(s => s.id === id))
            .filter(s => s && s.type !== 'Warehouse' && s.type !== 'Distribution Center');
        if (invalidSites.length > 0) {
            showToast("Procurement orders can only be sent to a Warehouse or Distribution Center.", 'error');
            return;
        }
        if (!isManualVendor && !newPOSupplier) {
            showToast("Please select a supplier.", 'warning');
            return;
        }
        if (isManualVendor && !manualVendorName.trim()) {
            showToast("Please enter the supplier name.", 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const firstSite = sites.find(s => s.id === destinationSiteIds[0]);
            const resolvedRegionCode = activeRegionCode || firstSite?.regionCode || (firstSite as any)?.region_code || null;

            const { vendorId, vendorName } = await resolvePOVendor({
                isManualVendor, manualVendorName, newPOSupplier, allSuppliers, activeCountry, regionCode: resolvedRegionCode
            });

            const generatedPOs = buildPurchaseOrders({
                destinationSiteIds, processedItems: [...newPOItems], quantityDistribution,
                shippingCost, discountRate, taxRate, editingPO, sites, currencySymbol,
                vendorId, vendorName, expectedDate, ...poDelivery, poNotes, paymentTerms,
                incoterms, poPriority, userName: user?.name, poRequestedBy,
                isRegionalUser, regionalAutonomousPoLimit
            });

            let successCount = 0;
            for (const { po: newPO, items: siteItems } of generatedPOs) {
                if (isEditMode) {
                    await updatePOMutation.mutateAsync({ id: newPO.id, updates: newPO });
                } else {
                    await createPOMutation.mutateAsync({ po: newPO, items: siteItems });
                }
                successCount++;
            }

            discardDraft();
            showToast(isEditMode ? 'PO Updated' : `Created ${successCount} PO(s)`, 'success');
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('CreatePOModal', 'caught error', error as Error);
            showToast(error instanceof Error ? error.message : 'Failed to save Purchase Order.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPendingAction = isSubmitting || createPOMutation.isPending || updatePOMutation.isPending;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "Edit Purchase Order" : "Initiate Purchase Order"}
            size="4xl"
            footer={
                <CreatePOFooter
                    currencySymbol={currencySymbol}
                    poTotal={poTotal}
                    onClose={onClose}
                    onCreatePO={handleCreatePO}
                    isPendingAction={isPendingAction}
                    isEditMode={isEditMode}
                    itemsCount={newPOItems.length}
                    hasUnsavedItemDraft={hasUnsavedItemDraft}
                />
            }
        >
            <div className="relative space-y-8 pb-4 overflow-x-hidden">
                {isRestoredBannerVisible && draftMeta && (
                    <PODraftBanner meta={draftMeta} onDismiss={dismissBanner} onDiscard={handleDiscardDraft} />
                )}

                <POSupplierLogistics
                    isManualVendor={isManualVendor}
                    setIsManualVendor={setIsManualVendor}
                    newPOSupplier={newPOSupplier}
                    setNewPOSupplier={setNewPOSupplier}
                    manualVendorName={manualVendorName}
                    setManualVendorName={setManualVendorName}
                    allSuppliers={allSuppliers}
                    destinationSiteIds={destinationSiteIds}
                    setDestinationSiteIds={setDestinationSiteIds}
                    isSiteDropdownOpen={isSiteDropdownOpen}
                    setIsSiteDropdownOpen={setIsSiteDropdownOpen}
                    sites={countryWarehouses}
                    quantityDistribution={quantityDistribution}
                    setQuantityDistribution={setQuantityDistribution}
                    expectedDate={expectedDate}
                    setExpectedDate={setExpectedDate}
                    poDelivery={poDelivery}
                    setPoDelivery={setPoDelivery}
                    poPriority={poPriority}
                    setPoPriority={setPoPriority}
                    isEditMode={isEditMode}
                />

                <div className="h-[1px] w-full bg-[var(--theme-border-subtle)]" />

                <POItemForm
                    products={effectiveProducts}
                    existingItems={newPOItems}
                    initialProduct={initialProduct}
                    country={activeCountry}
                    currencySymbol={currencySymbol}
                    onAdd={handleAddItem}
                    onUpdate={handleUpdateItem}
                    onCancelEdit={() => setFullEditingIndex(null)}
                    editingItem={fullEditingIndex !== null ? newPOItems[fullEditingIndex] : null}
                    onDirtyChange={setHasUnsavedItemDraft}
                />

                <POItemsTable
                    items={newPOItems}
                    currencySymbol={currencySymbol}
                    onUpdateItem={handleInlineUpdate}
                    onRemoveItem={handleRemoveItem}
                    onFullEdit={handleFullEdit}
                />

                <div className="h-[1px] w-full bg-[var(--theme-border-subtle)]" />

                <POTotalsSummary
                    poNotes={poNotes}
                    setPoNotes={setPoNotes}
                    paymentTerms={paymentTerms}
                    setPaymentTerms={setPaymentTerms}
                    incoterms={incoterms}
                    setIncoterms={setIncoterms}
                    shippingCost={shippingCost}
                    setShippingCost={setShippingCost}
                    discountRate={discountRate}
                    setDiscountRate={setDiscountRate}
                    taxRate={taxRate}
                    setTaxRate={setTaxRate}
                    poSubtotal={poSubtotal}
                    poTax={poTax}
                    poDiscount={poDiscount}
                    poTotal={poTotal}
                    currencySymbol={currencySymbol}
                    hubCount={hubCount}
                    quantityDistribution={quantityDistribution}
                    exceedsRegionalCap={exceedsRegionalCap}
                    regionalCapAmount={regionalAutonomousPoLimit}
                />
            </div>
        </Modal>
    );
};
