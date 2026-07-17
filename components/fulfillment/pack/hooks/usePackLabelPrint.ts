import { useState } from 'react';
import { WMSJob, Product } from '../../../../types';
import { isWeightBased, isVolumeBased } from '../../../../utils/units';
import { generatePackLabelHTML } from '../../../../utils/labels/PackLabelGenerator';
import { wmsJobsService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';
import { printHtmlContent } from '../../../../utils/printHelper';

interface UsePackLabelPrintDeps {
    products: Product[];
    sites: any[];
    user: any;
    resolveOrderRef: (ref?: string) => string;
    generateTrackingNumber: () => string;
    addNotification: (type: 'success' | 'alert' | 'info' | 'error', message: string) => void;
}

export const usePackLabelPrint = (deps: UsePackLabelPrintDeps) => {
    const {
        products,
        sites,
        user,
        resolveOrderRef,
        generateTrackingNumber,
        addNotification
    } = deps;

    const [isPrinting, setIsPrinting] = useState(false);

    const getLabelQtyAndUnit = (item: any, product?: any) => {
        if (product) {
            const unit = product.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = product.size ? parseFloat(product.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : expected;
                const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                return {
                    quantity: `${displayPickedCases} x ${sizeNum}`,
                    unit
                };
            }
        }
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return {
                quantity: (item as any).requestedMeasureQty,
                unit: product?.unit || item.unit || 'KG'
            };
        }
        return {
            quantity: item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : (item.expectedQty || 0),
            unit: product?.unit || item.unit
        };
    };

    const handlePrintLabel = async (selectedPackJob: WMSJob | null, boxDetails: any) => {
        if (!selectedPackJob) return;
        setIsPrinting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum }).catch(console.error);
            }

            const sourceSite = sites.find(s => s.id === selectedPackJob.siteId);
            const totalItems = selectedPackJob.lineItems?.length || 0;

            const packLabelData: any = {
                orderRef: selectedPackJob.orderRef || selectedPackJob.id,
                originalOrderRef: resolveOrderRef(selectedPackJob.orderRef) || (selectedPackJob as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: trackingNum,
                itemCount: totalItems,
                totalPackages: totalItems,
                customerName: (selectedPackJob as any).customerName,
                shippingAddress: (selectedPackJob as any).shippingAddress || boxDetails.destSite?.address,
                city: (selectedPackJob as any).city,
                packDate: new Date().toISOString(),
                packerName: user?.name,
                specialHandling: { coldChain: boxDetails.hasColdItems, fragile: boxDetails.packingMaterials?.bubbleWrap || boxDetails.packingMaterials?.fragileStickers, perishable: boxDetails.hasColdItems },
                destSiteName: boxDetails.destSite?.name || boxDetails.destSiteName,
                lineItems: selectedPackJob.lineItems?.map((i: any) => {
                    const product = products.find(p => p.sku === i.sku || p.id === i.productId);
                    const qtyInfo = getLabelQtyAndUnit(i, product);
                    return {
                        name: i.name || product?.name || 'Unknown Product',
                        sku: i.sku || product?.sku || 'N/A',
                        quantity: qtyInfo.quantity,
                        unit: qtyInfo.unit
                    };
                })
            };

            let labelSize = 'XL';
            if (boxDetails.boxSize === 'Small') labelSize = 'Small';
            if (boxDetails.boxSize === 'Medium') labelSize = 'Medium';
            if (boxDetails.boxSize === 'Large') labelSize = 'Large';
            if (boxDetails.boxSize === 'Extra Large') labelSize = 'XL';

            const html = await generatePackLabelHTML(packLabelData, { size: labelSize, format: 'Both' });

            printHtmlContent(html);

            addNotification('success', 'Label ready to print!');
        } catch (err) {
            logger.error('PackModalsContainer', 'caught error', err as Error);
            addNotification('alert', 'Failed to generate label');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleReprintLabel = async (job: WMSJob, labelSize: string) => {
        setIsPrinting(true);
        try {
            const sourceSite = sites.find(s => s.id === job.siteId);
            const destSite = job.destSiteId ? sites.find(s => s.id === job.destSiteId) : undefined;
            const totalItems = job.lineItems?.length || 0;

            const packLabelData: any = {
                orderRef: job.orderRef || job.id,
                originalOrderRef: resolveOrderRef(job.orderRef) || (job as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: job.trackingNumber,
                itemCount: totalItems,
                customerName: (job as any).customerName,
                shippingAddress: (job as any).shippingAddress || destSite?.address,
                city: (job as any).city,
                packDate: new Date(job.updatedAt || job.createdAt || '').toISOString(),
                packerName: (job as any).user || 'System',
                specialHandling: {
                    fragile: job.lineItems?.some((i: any) => i.name?.toLowerCase().includes('fragile')),
                    coldChain: job.lineItems?.some((i: any) => i.category === 'Frozen' || i.category === 'Dairy'),
                    perishable: job.lineItems?.some((i: any) => i.category === 'Frozen' || i.category === 'Dairy')
                },
                destSiteName: destSite?.name,
                lineItems: job.lineItems?.map((i: any) => {
                    const product = products.find(p => p.sku === i.sku || p.id === i.productId);
                    const qtyInfo = getLabelQtyAndUnit(i, product);
                    return {
                        name: i.name || product?.name || 'Unknown Product',
                        sku: i.sku || product?.sku || 'N/A',
                        quantity: qtyInfo.quantity,
                        unit: qtyInfo.unit
                    };
                })
            };

            const html = await generatePackLabelHTML(packLabelData, { size: labelSize, format: 'Both' });

            printHtmlContent(html);

            addNotification('success', 'Label ready to print!');
        } catch (err) {
            logger.error('PackModalsContainer', 'caught error', err as Error);
            addNotification('alert', 'Failed to generate label');
        } finally {
            setIsPrinting(false);
        }
    };

    const handlePrintItemLabel = async (selectedPackJob: WMSJob | null, item: any, product: any, boxSize?: string) => {
        if (!selectedPackJob) return;
        setIsPrinting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum }).catch(console.error);
            }

            const sourceSite = sites.find(s => s.id === selectedPackJob.siteId);
            const destSite = selectedPackJob.destSiteId ? sites.find(s => s.id === selectedPackJob.destSiteId) : undefined;
            const totalPkgs = selectedPackJob.lineItems?.length || 1;
            const itemIndex = selectedPackJob.lineItems?.findIndex((i: any) => i.sku === item.sku) ?? 0;

            const itemLabelData: any = {
                orderRef: selectedPackJob.orderRef || selectedPackJob.id,
                originalOrderRef: resolveOrderRef(selectedPackJob.orderRef) || (selectedPackJob as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: trackingNum,
                itemCount: 1,
                packageNumber: itemIndex + 1,
                totalPackages: totalPkgs,
                customerName: (selectedPackJob as any).customerName,
                shippingAddress: (selectedPackJob as any).shippingAddress || destSite?.address,
                city: (selectedPackJob as any).city,
                packDate: new Date().toISOString(),
                packerName: user?.name,
                destSiteName: destSite?.name,
                lineItems: [{
                    name: item.name || product?.name || 'Unknown Product',
                    sku: item.sku || product?.sku || 'N/A',
                    quantity: getLabelQtyAndUnit(item, product).quantity,
                    unit: getLabelQtyAndUnit(item, product).unit
                }]
            };

            let labelSize = boxSize || 'Large';
            if (labelSize === 'Extra Large') labelSize = 'XL';

            const html = await generatePackLabelHTML(itemLabelData, { size: labelSize, format: 'Both' });

            printHtmlContent(html);

            addNotification('success', `Label printed for ${item.name || item.sku}`);
        } catch (err) {
            logger.error('PackModalsContainer', 'caught error', err as Error);
            addNotification('alert', 'Failed to generate item label');
        } finally {
            setIsPrinting(false);
        }
    };

    return { handlePrintLabel, handleReprintLabel, handlePrintItemLabel, getLabelQtyAndUnit, isPrinting };
};
