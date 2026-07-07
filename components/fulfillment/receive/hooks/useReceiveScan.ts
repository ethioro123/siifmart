import { PurchaseOrder, Product } from '../../../../types';

interface UseReceiveScanDeps {
    user: any;
    employees: any[];
    jobs: any[];
    orders: PurchaseOrder[];
    products: Product[];
    allProducts: Product[];
    unresolvedScans: any[];
    setUnresolvedScans: React.Dispatch<React.SetStateAction<any[]>>;
    setSplitReceivingItem: (val: any) => void;
    setSplitReceivingPO: (val: any) => void;
    setSplitVariants: React.Dispatch<React.SetStateAction<any[]>>;
    setIsSplitReceiving: (val: boolean) => void;
    addNotification: (type: 'success' | 'alert' | 'info' | 'error', message: string) => void;
    setReceiveSearch: (val: string) => void;
    isSplitReceiving: boolean;
    splitReceivingItem: any | null;
    splitVariants: any[];
    splitReceivingPO: any | null;
}

export const useReceiveScan = (deps: UseReceiveScanDeps) => {
    const {
        user,
        employees,
        jobs,
        orders,
        products,
        allProducts,
        unresolvedScans,
        setUnresolvedScans,
        setSplitReceivingItem,
        setSplitReceivingPO,
        setSplitVariants,
        setIsSplitReceiving,
        addNotification,
        setReceiveSearch,
        isSplitReceiving,
        splitReceivingItem,
        splitVariants,
        splitReceivingPO
    } = deps;

    const handleGlobalScan = async (val: string) => {
        if (!val || val.trim() === '') return;
        const normalizedVal = val.toUpperCase().trim();

        const normSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();
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

        const findScannedProduct = (scannedVal: string) => {
            const normalized = scannedVal.toUpperCase().trim();
            const normalizedInput = normSku(normalized);

            const matchProduct = (p: Product) => {
                const matchSku = p.sku?.toUpperCase().trim() === normalized;
                const matchBarcode = p.barcode?.toUpperCase().trim() === normalized;
                
                const aliasList = getBarcodesArray(p.barcodes);
                const hasAliasMatch = aliasList.some(b => {
                    const cleanB = b.toUpperCase().trim();
                    return normalized === cleanB || normalizedInput === normSku(cleanB);
                });

                return matchSku || matchBarcode || hasAliasMatch ||
                    normalizedInput === normSku(p.sku || '') ||
                    normalizedInput === normSku(p.barcode || '');
            };

            let prod = products.find(matchProduct);
            if (!prod) {
                prod = allProducts.find(matchProduct);
            }
            return prod;
        };

        if (isSplitReceiving && splitReceivingItem && splitVariants.length > 0) {
            const scannedProduct = findScannedProduct(val);

            const splitItemSku = splitReceivingItem.sku?.trim().toUpperCase();
            const isSameProduct = scannedProduct?.id === splitReceivingItem.productId ||
                normalizedVal === splitItemSku ||
                splitVariants.some(v => {
                    const vSku = v.sku?.trim().toUpperCase();
                    const vBarcode = v.barcode?.trim().toUpperCase();
                    const aliases = (v.barcodes || []).map((b: string) => b.trim().toUpperCase());
                    return vSku === normalizedVal || vBarcode === normalizedVal || aliases.includes(normalizedVal) ||
                        normSku(val) === normSku(vSku || '') ||
                        normSku(val) === normSku(vBarcode || '') ||
                        aliases.some((b: string) => normSku(b) === normSku(val));
                });

            if (isSameProduct) {
                // Compute previously received quantity
                const poJobs = jobs.filter(j => j.orderRef === splitReceivingPO.id && j.type === 'PUTAWAY');
                let prevCount = 0;
                poJobs.forEach(job => {
                    job.lineItems.forEach((item: any) => {
                        if (item.productId === splitReceivingItem.productId || item.sku === splitReceivingItem.sku) {
                            prevCount += (item.expectedQty || 0);
                        }
                    });
                });

                const totalCurrentlyAllocated = splitVariants.reduce((sum, v) => sum + v.quantity, 0);
                const maxAllowed = splitReceivingItem.quantity - prevCount;

                if (totalCurrentlyAllocated < maxAllowed) {
                    const targetIdx = splitVariants.findIndex(v => {
                        const vSku = v.sku?.trim().toUpperCase();
                        const vBarcode = v.barcode?.trim().toUpperCase();
                        const aliases = (v.barcodes || []).map((b: string) => b.trim().toUpperCase());
                        return vSku === normalizedVal || vBarcode === normalizedVal || aliases.includes(normalizedVal) ||
                            normSku(val) === normSku(vSku || '') ||
                            normSku(val) === normSku(vBarcode || '') ||
                            aliases.some((b: string) => normSku(b) === normSku(val));
                    });
                    const idxToUpdate = targetIdx === -1 ? 0 : targetIdx;
                    setSplitVariants(prev => prev.map((v, idx) =>
                        idx === idxToUpdate ? { ...v, quantity: v.quantity + 1, barcode: v.barcode || val } : v
                    ));
                    addNotification('success', `Incremented ${splitReceivingItem.productName} to ${totalCurrentlyAllocated + 1} units`);
                } else {
                    addNotification('alert', `Cannot exceed remaining PO quantity (${maxAllowed})`);
                }
                setReceiveSearch('');
                return;
            } else {
                addNotification('alert', `Warning: Scanned ${scannedProduct?.name || val} but currently receiving ${splitReceivingItem.productName}.`);
                setReceiveSearch('');
                return;
            }
        }

        const employeeId = employees.find((e: any) => e.email === user?.email || e.name === user?.name || e.id === user?.id)?.id;
        const isStaffWithLimitedAccess = !['admin', 'warehouse_manager', 'super_admin', 'dispatcher', 'inventory_specialist'].includes(user?.role || '');

        let product = findScannedProduct(val);

        if (product) {
            const relevantPO = orders.find(po => {
                if (po.status !== 'Approved') return false;
                const matchesProduct = po.lineItems?.some((li: any) => li.productId === product!.id);
                if (!matchesProduct) return false;

                if (isStaffWithLimitedAccess) {
                    const hasAssignedReceiveJob = jobs.some(j => 
                        j.type === 'RECEIVE' && 
                        j.orderRef === po.id && 
                        j.assignedTo === employeeId &&
                        !['completed', 'cancelled', 'deleted'].includes(j.status?.toLowerCase() || '')
                    );
                    if (!hasAssignedReceiveJob) return false;
                }
                return true;
            });

            if (relevantPO) {
                const lineItem = relevantPO.lineItems?.find((li: any) => li.productId === product!.id);
                if (lineItem) {
                    setSplitReceivingItem(lineItem);
                    setSplitReceivingPO(relevantPO);
                    const now = new Date();
                    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const newBatch = `BN-${dateStr}-${randomStr}`;

                    setSplitVariants([{
                        id: `variant-${Date.now()}`,
                        sku: product.sku,
                        skuType: 'existing',
                        quantity: 1,
                        productId: product.id,
                        productName: product.name,
                        barcode: val,
                        batchNumber: newBatch
                    }]);
                    setIsSplitReceiving(true);
                    addNotification('success', `Opening receive for ${product.name}`);
                    setReceiveSearch('');
                    return;
                }
            } else {
                addNotification('alert', `${product.name} not expected on any active PO`);
                setReceiveSearch('');
                return;
            }
        }

        const alreadyUnresolved = unresolvedScans.some(s => s.barcode === val);
        if (!alreadyUnresolved) {
            const scannedBarcode = val.toUpperCase();
            const suggestions: string[] = [];
            const skuMatch = products.find(p => p.sku && (scannedBarcode.includes(p.sku.toUpperCase()) || p.sku.toUpperCase().includes(scannedBarcode)));
            if (skuMatch) suggestions.push(`💡 Similar to SKU: ${skuMatch.sku} (${skuMatch.name})`);
            if (/^\d{13}$/.test(scannedBarcode)) suggestions.push(`📊 EAN-13 barcode detected`);
            else if (/^\d{12}$/.test(scannedBarcode)) suggestions.push(`📊 UPC-A barcode detected`);
            else if (/^\d{8}$/.test(scannedBarcode)) suggestions.push(`📊 EAN-8 barcode detected`);
            else if (/^[A-Z0-9]{6,20}$/i.test(scannedBarcode)) suggestions.push(`📊 CODE128 format detected`);

            const activeReceivePOs = orders.filter(po => po.status === 'Approved');
            if (activeReceivePOs.length > 0) {
                const poLineMatch = activeReceivePOs.flatMap(po => po.lineItems || []).find(li => scannedBarcode.toLowerCase().includes(li.productName.toLowerCase().substring(0, 4)) || li.sku?.toLowerCase() === scannedBarcode.toLowerCase());
                if (poLineMatch) suggestions.push(`🎯 Might be: ${poLineMatch.productName}`);
            }

            setUnresolvedScans(prev => [...prev, { barcode: val, scannedAt: new Date(), qty: 1, suggestions }]);
            addNotification('alert', `Unknown barcode - click to resolve`);
        }
        setReceiveSearch('');
    };

    return { handleGlobalScan };
};
