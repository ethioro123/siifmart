import { useState } from 'react';
import { WMSJob, Product } from '../../../../types';
import { getSellUnit, formatPackagingDescription } from '../../../../utils/units';
import { generatePackLabelHTML } from '../../../../utils/labels/PackLabelGenerator';
import { wmsJobsService } from '../../../../services/supabase.service';
import { logger } from '../../../../utils/logger';
import { printHtmlContent } from '../../../../utils/printHelper';

interface UsePackLabelPrintDeps {
    products: Product[];
    sites: any[];
    resolveOrderRef: (ref?: string) => string;
    generateTrackingNumber: () => string;
    addNotification: (type: 'success' | 'alert' | 'info' | 'error', message: string) => void;
}

export const usePackLabelPrint = (deps: UsePackLabelPrintDeps) => {
    const {
        products,
        sites,
        resolveOrderRef,
        generateTrackingNumber,
        addNotification
    } = deps;

    const [isPrinting, setIsPrinting] = useState(false);

    const getLabelQtyAndUnit = (item: any, product?: any) => {
        const packed = item.packedQty;
        if (packed !== undefined && packed !== null) {
            const packDesc = formatPackagingDescription(product, packed);
            const unitDef = getSellUnit(product?.unit || item.unit);
            const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';
            return {
                quantity: packDesc ? `${packed} ${unitLabel} (${packDesc})` : `${packed} ${unitLabel}`,
                unit: unitLabel
            };
        }
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return {
                quantity: `${(item as any).requestedMeasureQty}`,
                unit: product?.unit || item.unit || 'KG'
            };
        }
        const expected = item.expectedQty || (item as any).quantity || 0;
        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : expected;
        const packDesc = formatPackagingDescription(product, picked);
        const unitDef = getSellUnit(product?.unit || item.unit);
        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

        return {
            quantity: packDesc ? `${picked} ${unitLabel} (${packDesc})` : `${picked} ${unitLabel}`,
            unit: unitLabel
        };
    };

    const handlePrintLabel = async (selectedPackJob: WMSJob | null, boxDetails: any) => {
        if (!selectedPackJob) return;
        setIsPrinting(true);
        try {
            let trackingNum = selectedPackJob.trackingNumber;
            if (!trackingNum) {
                trackingNum = generateTrackingNumber();
                await wmsJobsService.update(selectedPackJob.id, { trackingNumber: trackingNum }).catch(err => logger.error('usePackLabelPrint', 'Failed to update trackingNumber', err));
            }

            const sourceSite = sites.find(s => s.id === selectedPackJob.siteId);
            const totalItems = selectedPackJob.lineItems?.length || 0;

            const packLabelData: any = {
                orderRef: selectedPackJob.jobNumber || selectedPackJob.orderRef || selectedPackJob.id,
                originalOrderRef: resolveOrderRef(selectedPackJob.orderRef) || (selectedPackJob as any).poNumber,
                fromName: sourceSite?.name,
                fromAddress: sourceSite?.address,
                trackingNumber: trackingNum,
                itemCount: totalItems,
                packageNumber: 1,
                totalPackages: 1,
                customerName: (selectedPackJob as any).customerName,
                shippingAddress: (selectedPackJob as any).shippingAddress || boxDetails.destSite?.address,
                specialHandling: {
                    coldChain: !!boxDetails.hasIcePack || boxDetails.boxSize === 'Thermal Cool Box',
                    fragile: !!boxDetails.packingMaterials?.fragileStickers,
                    bubbleWrap: !!boxDetails.packingMaterials?.bubbleWrap,
                    thisSideUp: !!boxDetails.packingMaterials?.thisSideUp,
                    securitySeal: !!boxDetails.packingMaterials?.securitySeal,
                    perishable: false
                },
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

            const html = await generatePackLabelHTML(packLabelData, { size: 'XL', format: 'Both' });

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
                orderRef: job.jobNumber || job.orderRef || job.id,
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

    return { handlePrintLabel, handleReprintLabel, getLabelQtyAndUnit, isPrinting };
};
