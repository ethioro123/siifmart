import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal';
import { PurchaseOrder, POItem, Supplier } from '../../types';
import { Loader2 } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';
import { getCountryProfile, getEffectiveCountry, type Country } from '../../utils/localization';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { suppliersService } from '../../services/supabase.service';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { generateSequentialSKU } from '../../utils/skuGenerator';

import { POItemForm } from './POItemForm';
import { POSupplierLogistics } from './POSupplierLogistics';
import { POItemsTable } from './POItemsTable';
import { POTotalsSummary } from './POTotalsSummary';
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
            suppliersService.getAll(1000).then(res => {
                logger.debug('CreatePOModal', 'Direct supplier fetch returned:');
                setLocalSuppliers(res.data);
            }).catch(err => logger.error('CreatePOModal', 'Direct supplier fetch failed', err as Error));
        }
    }, [isOpen, contextSuppliers.length]);

    const allSuppliers = contextSuppliers.length > 0 ? contextSuppliers : localSuppliers;

    const countryWarehouses = useMemo(() => {
        return sites.filter(s =>
            (s.country || 'ET') === activeCountry &&
            (s.type === 'Warehouse' || s.type === 'Distribution Center') &&
            s.status !== 'Closed'
        );
    }, [sites, activeCountry]);

    const isPurchasingTaxEnabled = (settings?.countryConfigs?.[activeCountry]?.taxOnPurchasing ?? settings?.taxOnPurchasing) !== false;
    const defaultTaxRate = isPurchasingTaxEnabled ? (countryProfile.taxRate ?? (activeCountry === 'KE' ? 16 : 15)) : 0;

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

    // Computed Totals
    const poSubtotal = newPOItems.reduce((sum, item) => sum + item.totalCost, 0);
    const poTax = poSubtotal * (taxRate / 100);
    const poDiscount = poSubtotal * (discountRate / 100);
    const poTotal = poSubtotal + poTax + shippingCost - poDiscount;

    // Initialize
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
                // Enforce destination must be a Warehouse or Distribution Center
                const validWh = countryWarehouses.find(s => s.id === editingPO.siteId);
                setDestinationSiteIds(validWh ? [editingPO.siteId] : (countryWarehouses[0] ? [countryWarehouses[0].id] : []));
                setExpectedDate(editingPO.expectedDelivery || '');
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
                let defaultSiteId = '';
                if (user?.siteId && countryWarehouses.find(w => w.id === user.siteId)) {
                    defaultSiteId = user.siteId;
                } else {
                    defaultSiteId = countryWarehouses.length > 0 ? countryWarehouses[0].id : '';
                }

                setDestinationSiteIds(defaultSiteId ? [defaultSiteId] : []);
                setTaxRate(defaultTaxRate);
                setDiscountRate(0);
            }
        } else {
            // Reset when closed
            resetPOForm();
        }
    }, [isOpen, editingPO, user, countryWarehouses, activeCountry, defaultTaxRate]);

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
        setQuantityDistribution('per-store');
        setFullEditingIndex(null);
    };

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
            // Determine Supplier
            let vendorName = 'Unspecified';
            let vendorId: string = crypto.randomUUID(); // Fallback for edge cases, ideally replaced below

            if (isManualVendor) {
                vendorName = manualVendorName || 'Unspecified';
                // First create the manual vendor in the suppliers table to satisfy FK constraint
                try {
                    const newSupplier = await suppliersService.create({
                        name: vendorName,
                        type: 'One-Time',
                        contact: 'Manual Entry',
                        email: '',
                        phone: '',
                        category: 'Other',
                        status: 'Active',
                        rating: 3,
                        location: 'Manual Entry',
                        leadTime: 0,
                        taxId: '',
                        nationalId: ''
                    });
                    vendorId = newSupplier.id;
                } catch (err) {
                    logger.error('CreatePOModal', "Failed to create manual supplier:", err);
                    showToast("Failed to create manual supplier record.", 'error');
                    setIsSubmitting(false);
                    return;
                }
            } else if (newPOSupplier) {
                const s = allSuppliers.find(sup => sup.id === newPOSupplier);
                vendorName = s?.name || 'Unknown';
                vendorId = newPOSupplier;
            }

            const processedItems = [...newPOItems];

            // NOTE: We do NOT create products at PO creation time.
            // A PO is just an order — the product record should only be created
            // when goods are physically received. The PO line items already store
            // all product details (name, SKU, category, cost, retail, brand, size,
            // unit, customAttributes) needed for the receiving flow to create
            // the product at that time. This prevents empty stock=0 shell products
            // and avoids duplicates.

            // Create POs (Single or Multi-site)
            let successCount = 0;
            const siteCount = destinationSiteIds.length;

            for (const siteId of destinationSiteIds) {
                // Clone items to avoid reference issues
                const siteItems = processedItems.map(item => {
                    let qty = item.quantity;
                    let total = item.totalCost;

                    // Apply split logic if enabled
                    if (quantityDistribution === 'split' && siteCount > 1) {
                        qty = Math.floor(item.quantity / siteCount);

                        // Handle remainder on first site
                        if (item.quantity % siteCount !== 0 && siteId === destinationSiteIds[0]) {
                            qty += item.quantity % siteCount;
                        }

                        // Recalculate total cost
                        total = Math.round(qty * item.unitCost * 100) / 100;
                    }

                    return {
                        ...item,
                        quantity: qty,
                        totalCost: total
                    };
                }).filter(item => item.quantity > 0);

                if (siteItems.length === 0) continue;

                const siteSubtotal = siteItems.reduce((sum, item) => sum + item.totalCost, 0);
                const siteTotalAmount = siteSubtotal + shippingCost - (siteSubtotal * discountRate / 100) + (siteSubtotal * taxRate / 100); // Updated total with new tax

                const isEditMode = Boolean(editingPO?.id);
                const destSite = sites.find(s => s.id === siteId);
                const poCurrency = destSite?.currency || (destSite?.country === 'KE' ? 'KSh' : currencySymbol);

                const newPO: PurchaseOrder = {
                    id: (isEditMode && editingPO?.id) ? editingPO.id : crypto.randomUUID(),
                    siteId: siteId,
                    supplierId: vendorId,
                    supplierName: vendorName,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Draft',
                    totalAmount: siteTotalAmount,
                    itemsCount: siteItems.reduce((acc, item) => acc + item.quantity, 0),
                    expectedDelivery: expectedDate || null,
                    lineItems: siteItems,
                    shippingCost: shippingCost,
                    taxAmount: siteSubtotal * (taxRate / 100),
                    discount: siteSubtotal * (discountRate / 100),
                    notes: poNotes,
                    paymentTerms: paymentTerms,
                    priority: poPriority,
                    createdBy: user?.name,
                    requestedBy: poRequestedBy,
                    currency: poCurrency,
                    countryCode: destSite?.country || getEffectiveCountry({ country: destSite?.country, currency: poCurrency }),
                    country_code: destSite?.country || getEffectiveCountry({ country: destSite?.country, currency: poCurrency }),
                };

                if (isEditMode) {
                    await updatePOMutation.mutateAsync({ id: newPO.id, updates: newPO });
                    successCount++;
                } else {
                    await createPOMutation.mutateAsync({ po: newPO, items: siteItems });
                    successCount++;
                }
            }

            const isEditMode = Boolean(editingPO && editingPO.id);
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

    const isEditMode = Boolean(editingPO && editingPO.id);
    const isPendingAction = isSubmitting || createPOMutation.isPending || updatePOMutation.isPending;

    const createPOFooter = (
        <div className="flex justify-between items-center w-full px-2">
            <div className="flex items-center gap-4">
                <div className="h-8 w-[1px] bg-[var(--theme-border-subtle)] hidden md:block"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider leading-none">Total Value</span>
                    <span className="text-lg font-mono text-[var(--theme-text-primary)] tracking-tight font-black tabular-nums">
                        {currencySymbol} {formatCompactNumber(poTotal)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold transition-colors text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] cursor-pointer active:scale-[0.98]"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreatePO}
                    disabled={isPendingAction || newPOItems.length === 0}
                    className="px-7 py-2.5 rounded-full text-xs font-semibold bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                    {isPendingAction && <Loader2 size={14} className="animate-spin" />}
                    {isEditMode ? 'Save Changes' : 'Create Purchase Order'}
                </button>
            </div>
        </div>
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
                    poPriority={poPriority}
                    setPoPriority={setPoPriority}
                />

                <div className="h-[1px] w-full bg-[var(--theme-border-subtle)]" />

                {/* 2. Add Item Form */}
                <POItemForm
                    products={allProducts}
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
