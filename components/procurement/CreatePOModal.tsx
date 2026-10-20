import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal';
import { PurchaseOrder, POItem, Supplier, Product } from '../../types';
import { getCountryProfile, type Country } from '../../utils/localization';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { suppliersService, productsService } from '../../services/supabase.service';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { POItemForm } from './POItemForm';
import { POSupplierLogistics } from './POSupplierLogistics';
import { POItemsTable } from './POItemsTable';
import { POTotalsSummary } from './POTotalsSummary';
import { usePODraft } from './hooks/usePODraft';
import { PODraftBanner } from './PODraftBanner';
import { buildPurchaseOrders, resolvePOVendor } from './createPOHelpers';
import { CreatePOFooter } from './CreatePOFooter';
import { logger } from '../../utils/logger';


interface CreatePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingPO?: PurchaseOrder | null;
    initialSupplierId?: string;
    onSuccess: () => void;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
    isOpen, onClose, editingPO, initialSupplierId, onSuccess
}) => {
    const { user, showToast } = useStore();
    const { createPOMutation, updatePOMutation } = usePurchaseOrderMutations();
    const {
        allProducts,
        suppliers: contextSuppliers,
        sites,
        addProduct,
        settings,
        effectiveCountry
    } = useData();

    const activeCountry: Country = (effectiveCountry || (settings?.country as Country) || 'ET');
    const countryProfile = getCountryProfile(activeCountry);
    const currencySymbol = countryProfile.currencySymbol;

    // Direct supplier fetch fallback — if DataContext suppliers are empty, fetch directly
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
    useEffect(() => {
        if (isOpen && contextSuppliers.length === 0 && localSuppliers.length === 0) {
            logger.debug('CreatePOModal', 'Suppliers empty from context, fetching directly...');
            suppliersService.getAll(50, 0, activeCountry, false).then(res => {
                logger.debug('CreatePOModal', 'Direct supplier fetch returned:');
                setLocalSuppliers(res.data);
            }).catch(err => logger.error('CreatePOModal', 'Direct supplier fetch failed', err as Error));
        }
    }, [isOpen, contextSuppliers.length, activeCountry]);

    const [localProducts, setLocalProducts] = useState<Product[]>([]);
    useEffect(() => {
        if (isOpen && (!allProducts || allProducts.length === 0) && localProducts.length === 0) {
            productsService.getAll(undefined, 50, 0, undefined, undefined, false).then(res => {
                setLocalProducts((res.data || []) as Product[]);
            }).catch(err => logger.error('CreatePOModal', 'Direct products fetch failed', err as Error));
        }
    }, [isOpen, allProducts?.length, localProducts.length]);

    const allSuppliers = contextSuppliers.length > 0 ? contextSuppliers : localSuppliers;
    const effectiveProducts = (allProducts && allProducts.length > 0) ? allProducts : localProducts;

    const countryWarehouses = useMemo(() => {
        return sites.filter(s =>
            (s.country || 'ET') === activeCountry &&
            (!user?.regionCode || s.regionCode === user.regionCode) &&
            (s.type === 'Warehouse' || s.type === 'Distribution Center') &&
            s.status !== 'Closed'
        );
    }, [sites, activeCountry, user?.regionCode]);

    const isPurchasingTaxEnabled = Boolean(settings?.countryConfigs?.[activeCountry]?.taxOnPurchasing ?? settings?.taxOnPurchasing);
    const defaultTaxRate = isPurchasingTaxEnabled ? (countryProfile.taxRate ?? (activeCountry === 'KE' ? 16 : 15)) : 0;
    const isEditMode = Boolean(editingPO?.id);
    const enableAutoSave = (settings?.enablePoDraftAutoSave ?? true);

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Vendor & Logistics
    const [isManualVendor, setIsManualVendor] = useState(false);
    const [manualVendorName, setManualVendorName] = useState('');
    const [newPOSupplier, setNewPOSupplier] = useState('');
    const [destinationSiteIds, setDestinationSiteIds] = useState<string[]>([]);
    const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
    const [expectedDate, setExpectedDate] = useState('');
    const [poPriority, setPoPriority] = useState<'Normal' | 'High' | 'Urgent' | 'Low'>('Normal');
    const [quantityDistribution, setQuantityDistribution] = useState('per-store');
    const [poDelivery, setPoDelivery] = useState<{ tempReq: 'Ambient' | 'Chilled' | 'Frozen'; shelfLife: string; dockSlot: string }>({ tempReq: 'Ambient', shelfLife: '', dockSlot: '' });

    // Totals & Notes
    const [poNotes, setPoNotes] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [incoterms, setIncoterms] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);
    const [taxRate, setTaxRate] = useState<number>(defaultTaxRate);
    const [poRequestedBy, setPoRequestedBy] = useState('');

    // Items
    const [newPOItems, setNewPOItems] = useState<POItem[]>([]);
    const [fullEditingIndex, setFullEditingIndex] = useState<number | null>(null);

    // Draft Management Hook
    const {
        hasDraft,
        draftMeta,
        isRestoredBannerVisible,
        dismissBanner,
        saveDraft,
        readStoredDraft,
        discardDraft
    } = usePODraft({
        countryCode: activeCountry,
        userId: user?.id,
        enabled: enableAutoSave,
        isEditMode,
        isOpen
    });

    // Computed Totals
    const poSubtotal = newPOItems.reduce((sum, item) => sum + item.totalCost, 0);
    const poTax = poSubtotal * (taxRate / 100);
    const poDiscount = poSubtotal * (discountRate / 100);
    const poTotal = poSubtotal + poTax + shippingCost - poDiscount;

    const resetPOForm = () => {
        setNewPOSupplier('');
        setIsManualVendor(false);
        setManualVendorName('');
        setNewPOItems([]);
        setShippingCost(0);
        setPoNotes('');
        setDiscountRate(0);
        setTaxRate(defaultTaxRate);
        setPaymentTerms('');
        setIncoterms('');
        setDestinationSiteIds([]);
        setIsSiteDropdownOpen(false);
        setExpectedDate('');
        setPoDelivery({ tempReq: 'Ambient', shelfLife: '', dockSlot: '' });
        setQuantityDistribution('per-store');
        setFullEditingIndex(null);
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

    // Initialize & Hydrate Form State
    useEffect(() => {
        if (isOpen) {
            setPoRequestedBy(user?.name || '');

            if (editingPO) {
                // Populate from existing PO
                const knownSupplier = allSuppliers.find(s => s.id === editingPO.supplierId);
                if (!knownSupplier) {
                    setIsManualVendor(true);
                    setManualVendorName(editingPO.supplierName);
                } else {
                    setIsManualVendor(false);
                    setNewPOSupplier(editingPO.supplierId);
                }

                setNewPOItems(editingPO.lineItems || []);
                setPoNotes(editingPO.notes || '');
                const validWh = countryWarehouses.find(s => s.id === editingPO.siteId);
                setDestinationSiteIds(validWh ? [editingPO.siteId] : (countryWarehouses[0] ? [countryWarehouses[0].id] : []));
                setExpectedDate(editingPO.expectedDelivery || '');
                setPoDelivery({ tempReq: editingPO.tempReq || 'Ambient', shelfLife: editingPO.shelfLife || '', dockSlot: editingPO.dockSlot || '' });
                setPoPriority(editingPO.priority as any || 'Normal');
                setPaymentTerms(editingPO.paymentTerms || '');
                setShippingCost(editingPO.shippingCost || 0);

                const poItemsSubtotal = (editingPO.lineItems || []).reduce((sum, item) => sum + (item.totalCost || item.quantity * item.unitCost), 0);
                if (editingPO.taxAmount !== undefined && poItemsSubtotal > 0) {
                    setTaxRate(Math.round((editingPO.taxAmount / poItemsSubtotal) * 100));
                } else {
                    setTaxRate(defaultTaxRate);
                }
                if (editingPO.discount !== undefined && poItemsSubtotal > 0) {
                    setDiscountRate(Math.round((editingPO.discount / poItemsSubtotal) * 100));
                } else {
                    setDiscountRate(0);
                }
            } else {
                // Check if a saved draft exists for this country and user
                const storedDraft = readStoredDraft();
                if (storedDraft?.data) {
                    const d = storedDraft.data;
                    setIsManualVendor(Boolean(d.isManualVendor));
                    setManualVendorName(d.manualVendorName || '');
                    setNewPOSupplier(d.newPOSupplier || initialSupplierId || '');
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
                    let defaultSiteId = '';
                    if (user?.siteId && countryWarehouses.find(w => w.id === user.siteId)) {
                        defaultSiteId = user.siteId;
                    } else {
                        defaultSiteId = countryWarehouses.length > 0 ? countryWarehouses[0].id : '';
                    }

                    setDestinationSiteIds(defaultSiteId ? [defaultSiteId] : []);
                    setTaxRate(defaultTaxRate);
                    setDiscountRate(0);
                    if (initialSupplierId) {
                        setNewPOSupplier(initialSupplierId);
                    }
                }
            }
        } else {
            resetPOForm();
        }
    }, [isOpen, editingPO, user, countryWarehouses, activeCountry, defaultTaxRate, readStoredDraft, initialSupplierId]);

    // Debounced auto-save draft whenever user makes edits
    useEffect(() => {
        if (!isOpen || isEditMode || !enableAutoSave) return;

        const timer = setTimeout(() => {
            const selectedSupplierObj = allSuppliers.find(s => s.id === newPOSupplier);
            const supplierDisplayName = isManualVendor ? manualVendorName : selectedSupplierObj?.name;

            saveDraft({
                isManualVendor,
                manualVendorName,
                newPOSupplier,
                destinationSiteIds,
                expectedDate,
                ...poDelivery,
                poPriority,
                quantityDistribution,
                newPOItems,
                poNotes,
                paymentTerms,
                incoterms,
                shippingCost,
                discountRate,
                taxRate
            }, supplierDisplayName);
        }, 350);

        return () => clearTimeout(timer);
    }, [
        isOpen, isEditMode, enableAutoSave, isManualVendor, manualVendorName,
        newPOSupplier, destinationSiteIds, expectedDate, poDelivery, poPriority,
        quantityDistribution, newPOItems, poNotes, paymentTerms, incoterms,
        shippingCost, discountRate, taxRate, allSuppliers, saveDraft
    ]);

    // --- Actions ---

    const handleAddItem = (item: POItem) => {
        setNewPOItems(prev => [...prev, item]);
        showToast(`Added: ${item.productName}`, 'success');
    };

    const handleUpdateItem = (updatedItem: POItem) => {
        if (fullEditingIndex !== null) {
            // Full update from form
            setNewPOItems(prev => prev.map((item, idx) => idx === fullEditingIndex ? updatedItem : item));
            showToast(`Updated: ${updatedItem.productName}`, 'success');
            setFullEditingIndex(null);
        }
    };

    const handleInlineUpdate = (index: number, updatedItem: POItem) => {
        setNewPOItems(prev => prev.map((item, idx) => idx === index ? updatedItem : item));
    }

    const handleRemoveItem = (index: number) => {
        if (fullEditingIndex === index) setFullEditingIndex(null);
        setNewPOItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleFullEdit = (index: number) => {
        setFullEditingIndex(index);
        // POItemForm will read 'editingItem' (newPOItems[index]) and hydrate itself

        // Scroll form into view
        const formElement = document.getElementById('po-item-form-container');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };


    const handleCreatePO = async () => {
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
            const { vendorId, vendorName } = await resolvePOVendor({
                isManualVendor,
                manualVendorName,
                newPOSupplier,
                allSuppliers,
                activeCountry
            });

            const processedItems = [...newPOItems];
            const generatedPOs = buildPurchaseOrders({
                destinationSiteIds,
                processedItems,
                quantityDistribution,
                shippingCost,
                discountRate,
                taxRate,
                editingPO,
                sites,
                currencySymbol,
                vendorId,
                vendorName,
                expectedDate,
                ...poDelivery,
                poNotes,
                paymentTerms,
                incoterms,
                poPriority,
                userName: user?.name,
                poRequestedBy
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
            showToast("Failed to save Purchase Order.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPendingAction = isSubmitting || createPOMutation.isPending || updatePOMutation.isPending;

    const createPOFooter = (
        <CreatePOFooter
            currencySymbol={currencySymbol}
            poTotal={poTotal}
            onClose={onClose}
            onCreatePO={handleCreatePO}
            isPendingAction={isPendingAction}
            isEditMode={isEditMode}
            itemsCount={newPOItems.length}
        />
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "Edit Purchase Order" : "Initiate Purchase Order"}
            size="4xl"
            footer={createPOFooter}
        >
            <div className="relative space-y-8 pb-4 overflow-x-hidden">
                {/* Draft Restoration Banner */}
                {isRestoredBannerVisible && draftMeta && (
                    <PODraftBanner
                        meta={draftMeta}
                        onDismiss={dismissBanner}
                        onDiscard={handleDiscardDraft}
                    />
                )}

                {/* 1. Supplier & Logistics */}
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
                />

                <div className="h-[1px] w-full bg-[var(--theme-border-subtle)]" />

                {/* 2. Add Item Form */}
                <POItemForm
                    products={effectiveProducts}
                    country={activeCountry}
                    currencySymbol={currencySymbol}
                    onAdd={handleAddItem}
                    onUpdate={handleUpdateItem}
                    onCancelEdit={() => setFullEditingIndex(null)}
                    editingItem={fullEditingIndex !== null ? newPOItems[fullEditingIndex] : null}
                />

                {/* 3. Items Table */}
                <POItemsTable
                    items={newPOItems}
                    currencySymbol={currencySymbol}
                    onUpdateItem={handleInlineUpdate}
                    onRemoveItem={handleRemoveItem}
                    onFullEdit={handleFullEdit}
                />

                <div className="h-[1px] w-full bg-[var(--theme-border-subtle)]" />

                {/* 4. Totals & Notes */}
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
                />
            </div>
        </Modal>
    );
};
