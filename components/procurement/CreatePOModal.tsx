import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { PurchaseOrder, POItem, Supplier } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { Loader2 } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { purchaseOrdersService, productsService, suppliersService } from '../../services/supabase.service';
import { generateSequentialSKU } from '../../utils/sequentialSkuGenerator';

import { POItemForm } from './POItemForm';
import { POSupplierLogistics } from './POSupplierLogistics';
import { POItemsTable } from './POItemsTable';
import { POTotalsSummary } from './POTotalsSummary';


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
    const { user } = useStore();
    const { showToast } = useStore();
    const {
        allProducts,
        suppliers: contextSuppliers,
        sites,
        addProduct
    } = useData();

    // Direct supplier fetch fallback — if DataContext suppliers are empty, fetch directly
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
    useEffect(() => {
        if (isOpen && contextSuppliers.length === 0 && localSuppliers.length === 0) {
            console.log('⚡ Suppliers empty from context, fetching directly...');
            suppliersService.getAll(1000).then(res => {
                console.log('⚡ Direct supplier fetch returned:', res.data.length, 'suppliers');
                setLocalSuppliers(res.data);
            }).catch(err => console.error('⚡ Direct supplier fetch failed:', err));
        }
    }, [isOpen, contextSuppliers.length]);

    const allSuppliers = contextSuppliers.length > 0 ? contextSuppliers : localSuppliers;

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
    const [taxRate, setTaxRate] = useState(0);
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
                setDestinationSiteIds([editingPO.siteId]); // Editing usually single site
                setExpectedDate(editingPO.expectedDelivery || '');
                setPoPriority(editingPO.priority as any || 'Normal');
                setPaymentTerms(editingPO.paymentTerms || '');
                setShippingCost(editingPO.shippingCost || 0);

                // We don't have tax/discount fields in the PO object currently, assuming 0 or add backend support later
                setDiscountRate(0);
                setTaxRate(0);

            } else {
                // Defaults for new PO
                const warehouses = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');

                // [FIX] Default to User's Current Site if applicable
                let defaultSiteId = '';
                if (user?.siteId && warehouses.find(w => w.id === user.siteId)) {
                    defaultSiteId = user.siteId;
                } else {
                    defaultSiteId = warehouses.length > 0 ? warehouses[0].id : '';
                }

                setDestinationSiteIds(defaultSiteId ? [defaultSiteId] : []);
            }
        } else {
            // Reset when closed
            resetPOForm();
        }
    }, [isOpen, editingPO, user, sites]);


    const resetPOForm = () => {
        setNewPOSupplier('');
        setIsManualVendor(false);
        setManualVendorName('');
        setNewPOItems([]);
        setShippingCost(0);
        setPoNotes('');
        setDiscountRate(0);
        setTaxRate(0);
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
            showToast("Select a destination site.", 'warning');
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
                    console.error("Failed to create manual supplier:", err);
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

                const newPO: PurchaseOrder = {
                    id: editingPO ? editingPO.id : crypto.randomUUID(),
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
                    notes: poNotes,
                    paymentTerms: paymentTerms,
                    priority: poPriority,
                    createdBy: user?.name,
                    requestedBy: poRequestedBy,
                };

                if (editingPO) {
                    await purchaseOrdersService.update(newPO.id, newPO);
                    successCount++;
                } else {
                    await purchaseOrdersService.create(newPO, siteItems);
                    successCount++;
                }
            }

            showToast(editingPO ? 'PO Updated' : `Created ${successCount} PO(s)`, 'success');
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            showToast("Failed to save Purchase Order.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const createPOFooter = (
        <div className="flex justify-between items-center w-full px-2">
            <div className="flex items-center gap-4">
                <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">Total Value</span>
                    <span className="text-lg font-mono text-cyber-primary tracking-tight font-bold">
                        {CURRENCY_SYMBOL} {formatCompactNumber(poTotal)}
                    </span>
                </div>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 uppercase tracking-widest"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreatePO}
                    disabled={isSubmitting || newPOItems.length === 0}
                    className="relative group px-10 py-2.5 bg-cyber-primary hover:bg-cyber-primary/90 text-black font-black rounded-xl text-xs transition-all shadow-[0_0_25px_rgba(0,255,157,0.3)] hover:shadow-[0_0_40px_rgba(0,255,157,0.5)] transform hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-3 uppercase tracking-widest overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_5px_rgba(0,0,0,0.5)]"></div>
                    )}
                    {editingPO ? 'Sync Directive' : 'Authorize Order'}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingPO ? "Edit Procurement Directive" : "Initiate Procurement Request"}
            size="4xl"
            footer={createPOFooter}
        >
            <div className="relative space-y-8 pb-4">
                {/* Decorative background accent */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purpose-aurora/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyber-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

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
                    sites={sites}
                    quantityDistribution={quantityDistribution}
                    setQuantityDistribution={setQuantityDistribution}
                    expectedDate={expectedDate}
                    setExpectedDate={setExpectedDate}
                    poPriority={poPriority}
                    setPoPriority={setPoPriority}
                />

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                {/* 2. Add Item Form */}
                <POItemForm
                    products={allProducts}
                    onAdd={handleAddItem}
                    onUpdate={handleUpdateItem}
                    onCancelEdit={() => setFullEditingIndex(null)}
                    editingItem={fullEditingIndex !== null ? newPOItems[fullEditingIndex] : null}
                />

                {/* 3. Items Table */}
                <POItemsTable
                    items={newPOItems}
                    onUpdateItem={handleInlineUpdate}
                    onRemoveItem={handleRemoveItem}
                    onFullEdit={handleFullEdit}
                />

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

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
                />

            </div>
        </Modal>
    );
};
